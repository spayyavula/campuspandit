import { supabase } from './supabase';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface Flashcard {
  id?: string;
  user_id?: string;
  deck_id?: string;
  front: string;
  back: string;
  subject?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  mastery_level?: number; // 0-100
  times_reviewed?: number;
  times_correct?: number;
  last_reviewed_at?: string;
  next_review_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FlashcardDeck {
  id?: string;
  user_id?: string;
  name: string;
  description?: string;
  subject?: string;
  color?: string;
  card_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FlashcardReviewSession {
  id?: string;
  user_id?: string;
  deck_id?: string;
  cards_reviewed: number;
  cards_correct: number;
  duration_minutes: number;
  session_date?: string;
  created_at?: string;
}

export interface FlashcardStats {
  totalCards: number;
  totalDecks: number;
  cardsReviewedToday: number;
  cardsReviewedThisWeek: number;
  averageAccuracy: number;
  totalReviewSessions: number;
  studyStreak: number;
  masteryDistribution: {
    beginner: number;
    intermediate: number;
    advanced: number;
    mastered: number;
  };
}

// =====================================================
// SAMPLE DATA (for testing without database)
// =====================================================

let sampleDecks: FlashcardDeck[] = [
  {
    id: 'deck-1',
    name: 'Physics - Mechanics',
    description: 'Newton\'s Laws, Motion, Forces',
    subject: 'Physics',
    color: '#3B82F6',
    card_count: 15
  },
  {
    id: 'deck-2',
    name: 'Chemistry - Organic',
    description: 'Reactions, Mechanisms, Nomenclature',
    subject: 'Chemistry',
    color: '#10B981',
    card_count: 20
  },
  {
    id: 'deck-3',
    name: 'Mathematics - Calculus',
    description: 'Derivatives, Integrals, Limits',
    subject: 'Mathematics',
    color: '#8B5CF6',
    card_count: 12
  }
];

let sampleCards: Flashcard[] = [
  {
    id: 'card-1',
    deck_id: 'deck-1',
    front: 'What is Newton\'s First Law?',
    back: 'An object at rest stays at rest and an object in motion stays in motion with the same speed and direction unless acted upon by an unbalanced force (Law of Inertia).',
    subject: 'Physics',
    difficulty: 'easy',
    mastery_level: 75,
    times_reviewed: 8,
    times_correct: 6
  },
  {
    id: 'card-2',
    deck_id: 'deck-1',
    front: 'What is the formula for Force?',
    back: 'F = ma (Force equals mass times acceleration)',
    subject: 'Physics',
    difficulty: 'easy',
    mastery_level: 90,
    times_reviewed: 10,
    times_correct: 9
  },
  {
    id: 'card-3',
    deck_id: 'deck-1',
    front: 'Define Momentum',
    back: 'Momentum (p) is the product of mass and velocity: p = mv. It is a vector quantity measured in kg⋅m/s.',
    subject: 'Physics',
    difficulty: 'medium',
    mastery_level: 60,
    times_reviewed: 5,
    times_correct: 3
  },
  {
    id: 'card-4',
    deck_id: 'deck-2',
    front: 'What is a nucleophile?',
    back: 'A nucleophile is a chemical species that donates an electron pair to form a chemical bond. It is attracted to positively charged or electron-deficient centers.',
    subject: 'Chemistry',
    difficulty: 'medium',
    mastery_level: 55,
    times_reviewed: 4,
    times_correct: 2
  },
  {
    id: 'card-5',
    deck_id: 'deck-2',
    front: 'What is an electrophile?',
    back: 'An electrophile is a chemical species that accepts an electron pair to form a chemical bond. It is attracted to negatively charged or electron-rich centers.',
    subject: 'Chemistry',
    difficulty: 'medium',
    mastery_level: 50,
    times_reviewed: 4,
    times_correct: 2
  },
  {
    id: 'card-6',
    deck_id: 'deck-3',
    front: 'What is the derivative of sin(x)?',
    back: 'The derivative of sin(x) is cos(x)',
    subject: 'Mathematics',
    difficulty: 'easy',
    mastery_level: 85,
    times_reviewed: 7,
    times_correct: 6
  },
  {
    id: 'card-7',
    deck_id: 'deck-3',
    front: 'What is the integral of 1/x?',
    back: 'The integral of 1/x is ln|x| + C',
    subject: 'Mathematics',
    difficulty: 'medium',
    mastery_level: 70,
    times_reviewed: 6,
    times_correct: 4
  }
];

// =====================================================
// DECK MANAGEMENT
// =====================================================

export const flashcardDeckAPI = {
  async getDecks(userId: string): Promise<FlashcardDeck[]> {
    try {
      const { data, error } = await supabase
        .from('flashcard_decks')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || sampleDecks;
    } catch (error) {
      console.log('Using sample decks (database not available)');
      return sampleDecks;
    }
  },

  async getDeck(deckId: string): Promise<FlashcardDeck | null> {
    try {
      const { data, error } = await supabase
        .from('flashcard_decks')
        .select('*')
        .eq('id', deckId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      return sampleDecks.find(d => d.id === deckId) || null;
    }
  },

  async createDeck(deck: Omit<FlashcardDeck, 'id' | 'created_at' | 'updated_at'>): Promise<FlashcardDeck> {
    try {
      const { data, error } = await supabase
        .from('flashcard_decks')
        .insert(deck)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      // Create sample deck
      const newDeck: FlashcardDeck = {
        id: `deck-${Date.now()}`,
        ...deck,
        card_count: 0,
        created_at: new Date().toISOString()
      };
      sampleDecks.push(newDeck);
      return newDeck;
    }
  },

  async updateDeck(deckId: string, updates: Partial<FlashcardDeck>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('flashcard_decks')
        .update(updates)
        .eq('id', deckId);

      if (error) throw error;
      return true;
    } catch (error) {
      const index = sampleDecks.findIndex(d => d.id === deckId);
      if (index >= 0) {
        sampleDecks[index] = { ...sampleDecks[index], ...updates };
        return true;
      }
      return false;
    }
  },

  async deleteDeck(deckId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('flashcard_decks')
        .delete()
        .eq('id', deckId);

      if (error) throw error;
      return true;
    } catch (error) {
      sampleDecks = sampleDecks.filter(d => d.id !== deckId);
      sampleCards = sampleCards.filter(c => c.deck_id !== deckId);
      return true;
    }
  }
};

// =====================================================
// CARD MANAGEMENT
// =====================================================

export const flashcardAPI = {
  async getCards(deckId?: string): Promise<Flashcard[]> {
    try {
      let query = supabase
        .from('flashcards')
        .select('*')
        .order('created_at', { ascending: false });

      if (deckId) {
        query = query.eq('deck_id', deckId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || (deckId ? sampleCards.filter(c => c.deck_id === deckId) : sampleCards);
    } catch (error) {
      return deckId ? sampleCards.filter(c => c.deck_id === deckId) : sampleCards;
    }
  },

  async getCard(cardId: string): Promise<Flashcard | null> {
    try {
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('id', cardId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      return sampleCards.find(c => c.id === cardId) || null;
    }
  },

  async createCard(card: Omit<Flashcard, 'id' | 'created_at' | 'updated_at'>): Promise<Flashcard> {
    try {
      const { data, error } = await supabase
        .from('flashcards')
        .insert({
          ...card,
          mastery_level: 0,
          times_reviewed: 0,
          times_correct: 0
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      const newCard: Flashcard = {
        id: `card-${Date.now()}`,
        ...card,
        mastery_level: 0,
        times_reviewed: 0,
        times_correct: 0,
        created_at: new Date().toISOString()
      };
      sampleCards.push(newCard);
      return newCard;
    }
  },

  async updateCard(cardId: string, updates: Partial<Flashcard>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('flashcards')
        .update(updates)
        .eq('id', cardId);

      if (error) throw error;
      return true;
    } catch (error) {
      const index = sampleCards.findIndex(c => c.id === cardId);
      if (index >= 0) {
        sampleCards[index] = { ...sampleCards[index], ...updates };
        return true;
      }
      return false;
    }
  },

  async deleteCard(cardId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;
      return true;
    } catch (error) {
      sampleCards = sampleCards.filter(c => c.id !== cardId);
      return true;
    }
  },

  async reviewCard(cardId: string, correct: boolean): Promise<boolean> {
    try {
      const card = await this.getCard(cardId);
      if (!card) return false;

      const timesReviewed = (card.times_reviewed || 0) + 1;
      const timesCorrect = (card.times_correct || 0) + (correct ? 1 : 0);
      const accuracy = (timesCorrect / timesReviewed) * 100;

      // Calculate new mastery level (0-100)
      let masteryLevel = card.mastery_level || 0;
      if (correct) {
        masteryLevel = Math.min(100, masteryLevel + 10);
      } else {
        masteryLevel = Math.max(0, masteryLevel - 5);
      }

      await this.updateCard(cardId, {
        times_reviewed: timesReviewed,
        times_correct: timesCorrect,
        mastery_level: masteryLevel,
        last_reviewed_at: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error reviewing card:', error);
      return false;
    }
  }
};

// =====================================================
// STATISTICS
// =====================================================

export const flashcardStatsAPI = {
  async getStats(userId: string): Promise<FlashcardStats> {
    try {
      // Try to get from database first
      const decks = await flashcardDeckAPI.getDecks(userId);
      const cards = await flashcardAPI.getCards();

      const totalCards = cards.length;
      const totalDecks = decks.length;

      // Calculate mastery distribution
      const masteryDistribution = {
        beginner: cards.filter(c => (c.mastery_level || 0) < 25).length,
        intermediate: cards.filter(c => (c.mastery_level || 0) >= 25 && (c.mastery_level || 0) < 50).length,
        advanced: cards.filter(c => (c.mastery_level || 0) >= 50 && (c.mastery_level || 0) < 75).length,
        mastered: cards.filter(c => (c.mastery_level || 0) >= 75).length
      };

      // Calculate average accuracy
      const cardsWithReviews = cards.filter(c => (c.times_reviewed || 0) > 0);
      const averageAccuracy = cardsWithReviews.length > 0
        ? cardsWithReviews.reduce((sum, card) => {
            const accuracy = ((card.times_correct || 0) / (card.times_reviewed || 1)) * 100;
            return sum + accuracy;
          }, 0) / cardsWithReviews.length
        : 0;

      return {
        totalCards,
        totalDecks,
        cardsReviewedToday: 0,
        cardsReviewedThisWeek: cards.filter(c => c.times_reviewed && c.times_reviewed > 0).length,
        averageAccuracy,
        totalReviewSessions: 0,
        studyStreak: 0,
        masteryDistribution
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        totalCards: sampleCards.length,
        totalDecks: sampleDecks.length,
        cardsReviewedToday: 3,
        cardsReviewedThisWeek: 12,
        averageAccuracy: 72.5,
        totalReviewSessions: 5,
        studyStreak: 3,
        masteryDistribution: {
          beginner: 2,
          intermediate: 2,
          advanced: 1,
          mastered: 2
        }
      };
    }
  }
};

export default {
  flashcardDeckAPI,
  flashcardAPI,
  flashcardStatsAPI
};
