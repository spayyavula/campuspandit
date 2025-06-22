export interface Course {
  id: string;
  title: string;
  description: string;
  subject: 'physics' | 'math' | 'chemistry';
  board: 'cambridge' | 'ib' | 'cbse' | 'isc';
  grade: string;
  syllabus?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  totalLessons: number;
  completedLessons: number;
  topics: Topic[];
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  isCompleted: boolean;
  boardSpecific?: {
    cambridge?: { paperType?: string; assessmentObjectives?: string[] };
    ib?: { assessmentCriteria?: string[]; internalAssessment?: boolean };
    cbse?: { chapterCode?: string; ncertReference?: string };
    isc?: { unitCode?: string; practicalComponent?: boolean };
  };
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  duration: number;
  isCompleted: boolean;
  exercises?: Exercise[];
  boardAlignment?: {
    cambridge?: { learningObjectives?: string[]; paperRelevance?: string[] };
    ib?: { conceptualUnderstanding?: string[]; skillsDeveloped?: string[] };
    cbse?: { learningOutcomes?: string[]; competencyBased?: boolean };
    isc?: { skillsAssessed?: string[]; applicationFocus?: string[] };
  };
}

export interface Exercise {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  questionType?: 'mcq' | 'structured' | 'essay' | 'practical' | 'data-analysis';
  boardStyle?: 'cambridge' | 'ib' | 'cbse' | 'isc';
  markingScheme?: {
    totalMarks: number;
    partialMarks?: { [key: string]: number };
    markingCriteria?: string[];
  };
}

export interface UserProgress {
  userId: string;
  courseProgress: { [courseId: string]: number };
  completedLessons: string[];
  totalTimeSpent: number;
}

// Gaming System Types
export interface Team {
  id: string;
  name: string;
  description: string;
  members: TeamMember[];
  totalPoints: number;
  rank: number;
  badge: string;
  color: string;
  createdAt: Date;
}

export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  points: number;
  role: 'leader' | 'member';
  isBot: boolean;
  botType?: 'einstein' | 'newton' | 'curie' | 'tesla';
}

export interface Tournament {
  id: string;
  title: string;
  description: string;
  subject: 'physics' | 'math' | 'chemistry' | 'mixed';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  startTime: Date;
  endTime: Date;
  status: 'upcoming' | 'active' | 'completed';
  participants: TournamentParticipant[];
  questions: TournamentQuestion[];
  rewards: Reward[];
  maxParticipants: number;
  entryFee: number;
}

export interface TournamentParticipant {
  id: string;
  name: string;
  avatar: string;
  teamId?: string;
  score: number;
  rank: number;
  isBot: boolean;
  botType?: string;
  answers: { [questionId: string]: number };
  timeSpent: number;
}

export interface TournamentQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  points: number;
  timeLimit: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Reward {
  id: string;
  type: 'points' | 'badge' | 'title' | 'avatar' | 'coins';
  value: number | string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earned: boolean;
  earnedAt?: Date;
  progress?: number;
  maxProgress?: number;
}

export interface QuizBattle {
  id: string;
  title: string;
  subject: string;
  participants: BattleParticipant[];
  questions: TournamentQuestion[];
  status: 'waiting' | 'active' | 'completed';
  winner?: string;
  startTime: Date;
  duration: number;
}

export interface BattleParticipant {
  id: string;
  name: string;
  avatar: string;
  score: number;
  isBot: boolean;
  botType?: string;
  currentAnswer?: number;
  timeRemaining: number;
}