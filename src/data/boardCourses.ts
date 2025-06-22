import { Course } from '../types';

export const boardCourses: Course[] = [
  // Cambridge Board Courses
  {
    id: 'cambridge-physics-igcse',
    title: 'Cambridge IGCSE Physics',
    description: 'Complete Cambridge IGCSE Physics curriculum covering all assessment objectives',
    subject: 'physics',
    board: 'cambridge',
    grade: 'IGCSE (9-10)',
    syllabus: '0625',
    difficulty: 'intermediate',
    totalLessons: 24,
    completedLessons: 0,
    topics: [
      {
        id: 'motion-forces-energy',
        title: 'Motion, Forces and Energy',
        description: 'Fundamental concepts of mechanics and energy',
        isCompleted: false,
        boardSpecific: {
          cambridge: {
            paperType: 'Paper 1, 2, 3',
            assessmentObjectives: ['Knowledge', 'Application', 'Analysis']
          }
        },
        lessons: [
          {
            id: 'motion-graphs',
            title: 'Motion and Speed-Time Graphs',
            content: 'Understanding motion through graphical analysis as per Cambridge IGCSE requirements. Learn to interpret and draw speed-time and distance-time graphs.',
            duration: 20,
            isCompleted: false,
            boardAlignment: {
              cambridge: {
                learningObjectives: ['Interpret motion graphs', 'Calculate acceleration from graphs'],
                paperRelevance: ['Paper 1 MCQ', 'Paper 2 Structured']
              }
            },
            exercises: [
              {
                id: 'cambridge-motion-1',
                question: 'A car accelerates uniformly from rest to 20 m/s in 10 seconds. What is the acceleration?',
                options: ['1 m/s²', '2 m/s²', '10 m/s²', '20 m/s²'],
                correctAnswer: 1,
                explanation: 'Using a = (v - u)/t = (20 - 0)/10 = 2 m/s²',
                questionType: 'mcq',
                boardStyle: 'cambridge',
                markingScheme: {
                  totalMarks: 2,
                  markingCriteria: ['Correct formula', 'Correct calculation', 'Correct unit']
                }
              }
            ]
          }
        ]
      }
    ]
  },
  
  // IB Courses
  {
    id: 'ib-physics-sl',
    title: 'IB Physics Standard Level',
    description: 'International Baccalaureate Physics SL with emphasis on conceptual understanding',
    subject: 'physics',
    board: 'ib',
    grade: 'DP1-DP2',
    syllabus: 'Physics SL',
    difficulty: 'advanced',
    totalLessons: 32,
    completedLessons: 0,
    topics: [
      {
        id: 'measurements-uncertainties',
        title: 'Measurements and Uncertainties',
        description: 'Fundamental measurement concepts and error analysis',
        isCompleted: false,
        boardSpecific: {
          ib: {
            assessmentCriteria: ['Knowledge and Understanding', 'Application and Analysis'],
            internalAssessment: true
          }
        },
        lessons: [
          {
            id: 'uncertainty-analysis',
            title: 'Uncertainty and Error Analysis',
            content: 'Master uncertainty calculations and error propagation essential for IB Physics investigations.',
            duration: 25,
            isCompleted: false,
            boardAlignment: {
              ib: {
                conceptualUnderstanding: ['Systematic vs random errors', 'Uncertainty propagation'],
                skillsDeveloped: ['Data analysis', 'Critical thinking', 'Mathematical skills']
              }
            }
          }
        ]
      }
    ]
  },

  // CBSE Courses
  {
    id: 'cbse-physics-12',
    title: 'CBSE Physics Class 12',
    description: 'Complete CBSE Class 12 Physics curriculum aligned with NEP 2020',
    subject: 'physics',
    board: 'cbse',
    grade: 'Class 12',
    syllabus: 'CBSE 2024-25',
    difficulty: 'advanced',
    totalLessons: 28,
    completedLessons: 0,
    topics: [
      {
        id: 'electric-charges-fields',
        title: 'Electric Charges and Fields',
        description: 'Electrostatics and electric field concepts',
        isCompleted: false,
        boardSpecific: {
          cbse: {
            chapterCode: 'Chapter 1',
            ncertReference: 'NCERT Class 12 Physics Part 1'
          }
        },
        lessons: [
          {
            id: 'coulombs-law',
            title: "Coulomb's Law and Electric Field",
            content: 'Understanding electrostatic forces and field concepts as per CBSE curriculum with NCERT examples.',
            duration: 22,
            isCompleted: false,
            boardAlignment: {
              cbse: {
                learningOutcomes: ['Apply Coulomb\'s law', 'Calculate electric field'],
                competencyBased: true
              }
            }
          }
        ]
      }
    ]
  },

  // ISC Courses
  {
    id: 'isc-physics-12',
    title: 'ISC Physics Class 12',
    description: 'ISC Physics curriculum with emphasis on practical applications',
    subject: 'physics',
    board: 'isc',
    grade: 'Class 12',
    syllabus: 'ISC 2024',
    difficulty: 'advanced',
    totalLessons: 30,
    completedLessons: 0,
    topics: [
      {
        id: 'electromagnetic-induction',
        title: 'Electromagnetic Induction',
        description: 'Faraday\'s laws and applications in technology',
        isCompleted: false,
        boardSpecific: {
          isc: {
            unitCode: 'Unit 6',
            practicalComponent: true
          }
        },
        lessons: [
          {
            id: 'faradays-law',
            title: "Faraday's Law of Electromagnetic Induction",
            content: 'Comprehensive study of electromagnetic induction with practical applications as required by ISC.',
            duration: 24,
            isCompleted: false,
            boardAlignment: {
              isc: {
                skillsAssessed: ['Problem solving', 'Practical application'],
                applicationFocus: ['Generators', 'Transformers', 'Induction motors']
              }
            }
          }
        ]
      }
    ]
  }
];

// Mathematics Courses for different boards
export const mathCourses: Course[] = [
  {
    id: 'cambridge-math-igcse',
    title: 'Cambridge IGCSE Mathematics',
    description: 'Extended Mathematics curriculum for Cambridge IGCSE',
    subject: 'math',
    board: 'cambridge',
    grade: 'IGCSE (9-10)',
    syllabus: '0580',
    difficulty: 'intermediate',
    totalLessons: 26,
    completedLessons: 0,
    topics: [
      {
        id: 'algebra-functions',
        title: 'Algebra and Functions',
        description: 'Advanced algebraic manipulation and function analysis',
        isCompleted: false,
        lessons: [
          {
            id: 'quadratic-functions',
            title: 'Quadratic Functions and Graphs',
            content: 'Master quadratic functions, completing the square, and graphical transformations.',
            duration: 18,
            isCompleted: false
          }
        ]
      }
    ]
  },

  {
    id: 'ib-math-aa-sl',
    title: 'IB Mathematics: Analysis and Approaches SL',
    description: 'IB Math AA SL focusing on analytical thinking and mathematical reasoning',
    subject: 'math',
    board: 'ib',
    grade: 'DP1-DP2',
    syllabus: 'Math AA SL',
    difficulty: 'advanced',
    totalLessons: 35,
    completedLessons: 0,
    topics: [
      {
        id: 'calculus',
        title: 'Calculus',
        description: 'Differential and integral calculus with applications',
        isCompleted: false,
        lessons: [
          {
            id: 'derivatives',
            title: 'Derivatives and Applications',
            content: 'Understanding derivatives and their real-world applications in optimization problems.',
            duration: 30,
            isCompleted: false
          }
        ]
      }
    ]
  }
];

// Chemistry Courses
export const chemistryCourses: Course[] = [
  {
    id: 'cbse-chemistry-12',
    title: 'CBSE Chemistry Class 12',
    description: 'Comprehensive organic, inorganic, and physical chemistry',
    subject: 'chemistry',
    board: 'cbse',
    grade: 'Class 12',
    syllabus: 'CBSE 2024-25',
    difficulty: 'advanced',
    totalLessons: 32,
    completedLessons: 0,
    topics: [
      {
        id: 'organic-chemistry',
        title: 'Organic Chemistry',
        description: 'Reaction mechanisms and organic synthesis',
        isCompleted: false,
        lessons: [
          {
            id: 'aldehydes-ketones',
            title: 'Aldehydes and Ketones',
            content: 'Study the properties, preparation, and reactions of carbonyl compounds.',
            duration: 26,
            isCompleted: false
          }
        ]
      }
    ]
  }
];

export const allBoardCourses = [...boardCourses, ...mathCourses, ...chemistryCourses];