interface OfflineData {
  timestamp: number;
  type: string;
  data: any;
}

class OfflineManager {
  private dbName = 'CampusPandidOffline';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create stores for different types of offline data
        if (!db.objectStoreNames.contains('progress')) {
          const progressStore = db.createObjectStore('progress', { keyPath: 'id', autoIncrement: true });
          progressStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('lessons')) {
          const lessonsStore = db.createObjectStore('lessons', { keyPath: 'id' });
          lessonsStore.createIndex('courseId', 'courseId', { unique: false });
        }

        if (!db.objectStoreNames.contains('quiz_results')) {
          const quizStore = db.createObjectStore('quiz_results', { keyPath: 'id', autoIncrement: true });
          quizStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async saveProgress(courseId: string, lessonId: string, progress: any): Promise<void> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(['progress'], 'readwrite');
    const store = transaction.objectStore('progress');

    const data: OfflineData = {
      timestamp: Date.now(),
      type: 'lesson_progress',
      data: {
        courseId,
        lessonId,
        progress,
        completed: progress.completed || false
      }
    };

    return new Promise((resolve, reject) => {
      const request = store.add(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveQuizResult(quizId: string, score: number, answers: any): Promise<void> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(['quiz_results'], 'readwrite');
    const store = transaction.objectStore('quiz_results');

    const data: OfflineData = {
      timestamp: Date.now(),
      type: 'quiz_result',
      data: {
        quizId,
        score,
        answers,
        completedAt: new Date().toISOString()
      }
    };

    return new Promise((resolve, reject) => {
      const request = store.add(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async cacheLessonContent(lessonId: string, content: any): Promise<void> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(['lessons'], 'readwrite');
    const store = transaction.objectStore('lessons');

    const data = {
      id: lessonId,
      content,
      cachedAt: Date.now()
    };

    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCachedLesson(lessonId: string): Promise<any | null> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(['lessons'], 'readonly');
    const store = transaction.objectStore('lessons');

    return new Promise((resolve, reject) => {
      const request = store.get(lessonId);
      request.onsuccess = () => resolve(request.result?.content || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingSync(): Promise<OfflineData[]> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(['progress', 'quiz_results'], 'readonly');
    const progressStore = transaction.objectStore('progress');
    const quizStore = transaction.objectStore('quiz_results');

    const pendingData: OfflineData[] = [];

    return new Promise((resolve, reject) => {
      const progressRequest = progressStore.getAll();
      const quizRequest = quizStore.getAll();

      let completed = 0;
      const checkComplete = () => {
        completed++;
        if (completed === 2) {
          resolve(pendingData);
        }
      };

      progressRequest.onsuccess = () => {
        pendingData.push(...progressRequest.result);
        checkComplete();
      };

      quizRequest.onsuccess = () => {
        pendingData.push(...quizRequest.result);
        checkComplete();
      };

      progressRequest.onerror = quizRequest.onerror = () => reject('Error fetching pending data');
    });
  }

  async clearSyncedData(): Promise<void> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(['progress', 'quiz_results'], 'readwrite');
    const progressStore = transaction.objectStore('progress');
    const quizStore = transaction.objectStore('quiz_results');

    return new Promise((resolve, reject) => {
      const clearProgress = progressStore.clear();
      const clearQuiz = quizStore.clear();

      let completed = 0;
      const checkComplete = () => {
        completed++;
        if (completed === 2) {
          resolve();
        }
      };

      clearProgress.onsuccess = checkComplete;
      clearQuiz.onsuccess = checkComplete;
      clearProgress.onerror = clearQuiz.onerror = () => reject('Error clearing data');
    });
  }

  async syncWhenOnline(): Promise<void> {
    if (!navigator.onLine) return;

    try {
      const pendingData = await this.getPendingSync();
      
      if (pendingData.length === 0) return;

      // Group data by type for batch sync
      const progressData = pendingData.filter(item => item.type === 'lesson_progress');
      const quizData = pendingData.filter(item => item.type === 'quiz_result');

      // Sync progress data
      if (progressData.length > 0) {
        await fetch('/api/sync/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: progressData })
        });
      }

      // Sync quiz results
      if (quizData.length > 0) {
        await fetch('/api/sync/quiz-results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: quizData })
        });
      }

      // Clear synced data
      await this.clearSyncedData();
      
      console.log('Offline data synced successfully');
    } catch (error) {
      console.error('Error syncing offline data:', error);
    }
  }
}

export const offlineManager = new OfflineManager();

// Auto-sync when coming back online
window.addEventListener('online', () => {
  offlineManager.syncWhenOnline();
});

// Initialize offline manager
offlineManager.init().catch(console.error);