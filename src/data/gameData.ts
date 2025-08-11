import { Team, Tournament, Achievement, QuizBattle, TeamMember, TournamentParticipant, TournamentQuestion, Reward } from '../types';

// Bot configurations
export const bots: TeamMember[] = [
  {
    id: 'bot-einstein',
    name: 'Einstein Bot',
    avatar: '🧠',
    points: 2850,
    role: 'member',
    isBot: true,
    botType: 'einstein'
  },
  {
    id: 'bot-newton',
    name: 'Newton Bot',
    avatar: '🍎',
    points: 2650,
    role: 'member',
    isBot: true,
    botType: 'newton'
  },
  {
    id: 'bot-curie',
    name: 'Curie Bot',
    avatar: '⚛️',
    points: 2750,
    role: 'member',
    isBot: true,
    botType: 'curie'
  },
  {
    id: 'bot-tesla',
    name: 'Tesla Bot',
    avatar: '⚡',
    points: 2550,
    role: 'member',
    isBot: true,
    botType: 'tesla'
  }
];

export const teams: Team[] = [
  {
    id: 'quantum-warriors',
    name: 'Quantum Warriors',
    description: 'Masters of Physics and Mathematics',
    members: [
      {
        id: 'user-1',
        name: 'Alex Chen',
        avatar: '👨‍🎓',
        points: 1850,
        role: 'leader',
        isBot: false
      },
      {
        id: 'user-2',
        name: 'Sarah Johnson',
        avatar: '👩‍🔬',
        points: 1650,
        role: 'member',
        isBot: false
      },
      bots[0], // Einstein Bot
      bots[1]  // Newton Bot
    ],
    totalPoints: 8000,
    rank: 1,
    badge: '🏆',
    color: 'from-blue-500 to-purple-600',
    createdAt: new Date('2024-01-15')
  },
  {
    id: 'atomic-legends',
    name: 'Atomic Legends',
    description: 'Chemistry and Physics enthusiasts',
    members: [
      {
        id: 'user-3',
        name: 'Mike Rodriguez',
        avatar: '👨‍💻',
        points: 1750,
        role: 'leader',
        isBot: false
      },
      {
        id: 'user-4',
        name: 'Emma Wilson',
        avatar: '👩‍🎓',
        points: 1550,
        role: 'member',
        isBot: false
      },
      bots[2], // Curie Bot
      bots[3]  // Tesla Bot
    ],
    totalPoints: 7600,
    rank: 2,
    badge: '🥈',
    color: 'from-green-500 to-teal-600',
    createdAt: new Date('2024-01-20')
  },
  {
    id: 'math-masters',
    name: 'Math Masters',
    description: 'Algebraic problem solvers',
    members: [
      {
        id: 'user-5',
        name: 'David Kim',
        avatar: '👨‍🏫',
        points: 1450,
        role: 'leader',
        isBot: false
      },
      {
        id: 'user-6',
        name: 'Lisa Zhang',
        avatar: '👩‍💼',
        points: 1350,
        role: 'member',
        isBot: false
      }
    ],
    totalPoints: 2800,
    rank: 3,
    badge: '🥉',
    color: 'from-orange-500 to-red-600',
    createdAt: new Date('2024-01-25')
  }
];

export const tournaments: Tournament[] = [
  {
    id: 'physics-championship',
    title: 'Physics Championship 2024',
    description: 'Test your knowledge of mechanics, thermodynamics, and quantum physics',
    subject: 'physics',
    difficulty: 'advanced',
    startTime: new Date('2024-02-15T18:00:00'),
    endTime: new Date('2024-02-15T19:30:00'),
    status: 'upcoming',
    participants: [],
    questions: [
      {
        id: 'q1',
        question: 'What is the speed of light in vacuum?',
        options: ['3 × 10⁸ m/s', '3 × 10⁶ m/s', '3 × 10¹⁰ m/s', '3 × 10⁴ m/s'],
        correctAnswer: 0,
        points: 100,
        timeLimit: 30,
        difficulty: 'medium'
      },
      {
        id: 'q2',
        question: 'Which principle explains the operation of a rocket?',
        options: ['Bernoulli\'s principle', 'Newton\'s third law', 'Conservation of energy', 'Archimedes\' principle'],
        correctAnswer: 1,
        points: 150,
        timeLimit: 45,
        difficulty: 'hard'
      }
    ],
    rewards: [
      {
        id: 'r1',
        type: 'points',
        value: 1000,
        description: '1000 bonus points',
        icon: '⭐',
        rarity: 'epic'
      },
      {
        id: 'r2',
        type: 'badge',
        value: 'Physics Master',
        description: 'Physics Master badge',
        icon: '🏆',
        rarity: 'legendary'
      }
    ],
    maxParticipants: 50,
    entryFee: 100
  },
  {
    id: 'math-showdown',
    title: 'Mathematics Showdown',
    description: 'Algebra, calculus, and geometry challenges',
    subject: 'math',
    difficulty: 'intermediate',
    startTime: new Date('2024-02-10T16:00:00'),
    endTime: new Date('2024-02-10T17:00:00'),
    status: 'active',
    participants: [
      {
        id: 'p1',
        name: 'Alex Chen',
        avatar: '👨‍🎓',
        score: 850,
        rank: 1,
        isBot: false,
        answers: {},
        timeSpent: 1200
      },
      {
        id: 'p2',
        name: 'Einstein Bot',
        avatar: '🧠',
        score: 820,
        rank: 2,
        isBot: true,
        botType: 'einstein',
        answers: {},
        timeSpent: 900
      }
    ],
    questions: [],
    rewards: [],
    maxParticipants: 30,
    entryFee: 50
  }
];

export const achievements: Achievement[] = [
  {
    id: 'first-win',
    title: 'First Victory',
    description: 'Win your first quiz battle',
    icon: '🏆',
    points: 100,
    rarity: 'common',
    earned: true,
    earnedAt: new Date('2024-01-20')
  },
  {
    id: 'speed-demon',
    title: 'Speed Demon',
    description: 'Answer 10 questions in under 5 seconds each',
    icon: '⚡',
    points: 250,
    rarity: 'rare',
    earned: false,
    progress: 7,
    maxProgress: 10
  },
  {
    id: 'physics-master',
    title: 'Physics Master',
    description: 'Score 90% or higher in 5 physics tournaments',
    icon: '🔬',
    points: 500,
    rarity: 'epic',
    earned: false,
    progress: 3,
    maxProgress: 5
  },
  {
    id: 'bot-slayer',
    title: 'Bot Slayer',
    description: 'Defeat Einstein Bot in a head-to-head battle',
    icon: '🤖',
    points: 1000,
    rarity: 'legendary',
    earned: false
  }
];

export const activeBattles: QuizBattle[] = [
  {
    id: 'battle-1',
    title: 'Physics Lightning Round',
    subject: 'physics',
    participants: [
      {
        id: 'user-1',
        name: 'You',
        avatar: '👨‍🎓',
        score: 150,
        isBot: false,
        timeRemaining: 25
      },
      {
        id: 'bot-einstein',
        name: 'Einstein Bot',
        avatar: '🧠',
        score: 140,
        isBot: true,
        botType: 'einstein',
        timeRemaining: 28
      }
    ],
    questions: [
      {
        id: 'q1',
        question: 'What is the unit of force?',
        options: ['Newton', 'Joule', 'Watt', 'Pascal'],
        correctAnswer: 0,
        points: 50,
        timeLimit: 30,
        difficulty: 'easy'
      }
    ],
    status: 'active',
    startTime: new Date(),
    duration: 300
  }
];