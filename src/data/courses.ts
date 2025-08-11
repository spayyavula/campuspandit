import { Course } from '../types';

export const courses: Course[] = [
  {
    id: 'physics-basics',
    title: 'Physics Fundamentals',
    description: 'Master the fundamental concepts of physics from motion to energy',
    subject: 'physics',
    difficulty: 'beginner',
    totalLessons: 12,
    completedLessons: 3,
    topics: [
      {
        id: 'motion',
        title: 'Motion and Forces',
        description: 'Understanding velocity, acceleration, and Newton\'s laws',
        isCompleted: false,
        lessons: [
          {
            id: 'velocity-acceleration',
            title: 'Velocity and Acceleration',
            content: 'Learn about the relationship between velocity and acceleration in physics. Velocity is the rate of change of position, while acceleration is the rate of change of velocity.',
            duration: 15,
            isCompleted: true,
            exercises: [
              {
                id: 'q1',
                question: 'What is acceleration?',
                options: ['Rate of change of position', 'Rate of change of velocity', 'Force applied', 'Energy transfer'],
                correctAnswer: 1,
                explanation: 'Acceleration is defined as the rate of change of velocity with respect to time.'
              }
            ]
          },
          {
            id: 'newtons-laws',
            title: 'Newton\'s Laws of Motion',
            content: 'Explore the three fundamental laws that govern motion in our universe.',
            duration: 20,
            isCompleted: false
          }
        ]
      },
      {
        id: 'energy',
        title: 'Energy and Work',
        description: 'Kinetic energy, potential energy, and conservation laws',
        isCompleted: false,
        lessons: [
          {
            id: 'kinetic-potential',
            title: 'Kinetic and Potential Energy',
            content: 'Understanding the two main forms of mechanical energy.',
            duration: 18,
            isCompleted: false
          }
        ]
      }
    ]
  },
  {
    id: 'math-algebra',
    title: 'Algebra Essentials',
    description: 'Build strong algebraic foundations from linear equations to quadratics',
    subject: 'math',
    difficulty: 'beginner',
    totalLessons: 15,
    completedLessons: 5,
    topics: [
      {
        id: 'linear-equations',
        title: 'Linear Equations',
        description: 'Solving and graphing linear equations',
        isCompleted: true,
        lessons: [
          {
            id: 'solving-linear',
            title: 'Solving Linear Equations',
            content: 'Learn systematic approaches to solve linear equations step by step.',
            duration: 12,
            isCompleted: true
          }
        ]
      },
      {
        id: 'quadratics',
        title: 'Quadratic Functions',
        description: 'Understanding parabolas and quadratic equations',
        isCompleted: false,
        lessons: [
          {
            id: 'quadratic-formula',
            title: 'The Quadratic Formula',
            content: 'Master the quadratic formula and its applications.',
            duration: 16,
            isCompleted: false
          }
        ]
      }
    ]
  },
  {
    id: 'chemistry-atoms',
    title: 'Atomic Structure',
    description: 'Discover the building blocks of matter and chemical bonding',
    subject: 'chemistry',
    difficulty: 'beginner',
    totalLessons: 10,
    completedLessons: 2,
    topics: [
      {
        id: 'atomic-theory',
        title: 'Atomic Theory',
        description: 'Historical development and modern understanding of atoms',
        isCompleted: false,
        lessons: [
          {
            id: 'electron-structure',
            title: 'Electron Configuration',
            content: 'Learn how electrons are arranged in atoms.',
            duration: 14,
            isCompleted: false
          }
        ]
      }
    ]
  }
];