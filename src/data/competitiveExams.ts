import { Course } from '../types';

export const competitiveExamCourses: Course[] = [
  // JEE Main & Advanced (IIT) Courses
  {
    id: 'jee-physics-11',
    title: 'JEE Physics Class 11',
    description: 'Complete Physics preparation for JEE Main & Advanced with concept building and problem solving',
    subject: 'physics',
    board: 'cbse',
    grade: 'Class 11 (JEE)',
    syllabus: 'JEE Main & Advanced',
    difficulty: 'advanced',
    totalLessons: 45,
    completedLessons: 0,
    topics: [
      {
        id: 'mechanics-kinematics',
        title: 'Mechanics - Kinematics',
        description: 'Motion in one and two dimensions, projectile motion, relative motion',
        isCompleted: false,
        boardSpecific: {
          cbse: {
            chapterCode: 'JEE-PHY-11-01',
            ncertReference: 'NCERT Class 11 Physics Chapter 3-4'
          }
        },
        lessons: [
          {
            id: 'motion-1d-2d',
            title: 'Motion in One and Two Dimensions',
            content: 'Master the fundamentals of kinematics essential for JEE. Learn displacement, velocity, acceleration in 1D and 2D with graphical analysis and problem-solving techniques used in JEE Main and Advanced.',
            duration: 35,
            isCompleted: false,
            boardAlignment: {
              cbse: {
                learningOutcomes: ['Analyze motion graphs', 'Solve projectile motion problems', 'Apply relative motion concepts'],
                competencyBased: true
              }
            },
            exercises: [
              {
                id: 'jee-kinematics-1',
                question: 'A particle is thrown horizontally from a height of 20m with initial velocity 10 m/s. Find the time of flight and horizontal range. (g = 10 m/s²)',
                options: ['t = 2s, R = 20m', 't = 2s, R = 15m', 't = 1.5s, R = 20m', 't = 2.5s, R = 25m'],
                correctAnswer: 0,
                explanation: 'For projectile motion: t = √(2h/g) = √(2×20/10) = 2s, R = u×t = 10×2 = 20m',
                questionType: 'mcq',
                boardStyle: 'cbse',
                markingScheme: {
                  totalMarks: 4,
                  partialMarks: { 'correct_formula': 1, 'substitution': 1, 'calculation': 2 },
                  markingCriteria: ['Identify projectile motion', 'Apply correct formulas', 'Calculate accurately']
                }
              },
              {
                id: 'jee-kinematics-2',
                question: 'A car accelerates from rest at 2 m/s² for 5 seconds, then moves at constant velocity for 10 seconds, then decelerates at 1 m/s² until it stops. Draw the v-t graph and find total distance.',
                options: ['125 m', '150 m', '175 m', '200 m'],
                correctAnswer: 2,
                explanation: 'Phase 1: v = 10 m/s, s₁ = ½×2×25 = 25m. Phase 2: s₂ = 10×10 = 100m. Phase 3: s₃ = 10²/(2×1) = 50m. Total = 175m',
                questionType: 'structured',
                boardStyle: 'cbse',
                markingScheme: {
                  totalMarks: 6,
                  partialMarks: { 'graph': 2, 'phase1': 1, 'phase2': 1, 'phase3': 1, 'total': 1 },
                  markingCriteria: ['Draw accurate v-t graph', 'Calculate each phase correctly', 'Sum up total distance']
                }
              }
            ]
          },
          {
            id: 'laws-of-motion',
            title: 'Newton\'s Laws and Applications',
            content: 'Deep dive into Newton\'s laws with JEE-level problem solving. Master force analysis, friction, circular motion, and connected systems.',
            duration: 40,
            isCompleted: false,
            exercises: [
              {
                id: 'jee-newton-1',
                question: 'Two blocks of masses 2 kg and 3 kg are connected by a string over a pulley. If the coefficient of friction between 2 kg block and surface is 0.3, find acceleration of system. (g = 10 m/s²)',
                options: ['2 m/s²', '2.8 m/s²', '3.2 m/s²', '4 m/s²'],
                correctAnswer: 1,
                explanation: 'For 3kg: 30-T = 3a. For 2kg: T-6 = 2a (friction = 0.3×20 = 6N). Solving: a = 2.8 m/s²',
                questionType: 'mcq',
                boardStyle: 'cbse',
                markingScheme: {
                  totalMarks: 4,
                  markingCriteria: ['Free body diagrams', 'Apply Newton\'s laws', 'Solve simultaneous equations']
                }
              }
            ]
          }
        ]
      },
      {
        id: 'thermodynamics',
        title: 'Thermodynamics',
        description: 'Laws of thermodynamics, heat engines, refrigerators, and entropy',
        isCompleted: false,
        lessons: [
          {
            id: 'first-law-thermodynamics',
            title: 'First Law of Thermodynamics',
            content: 'Understand energy conservation in thermodynamic processes. Master PV diagrams, work calculation, and heat transfer for JEE problems.',
            duration: 38,
            isCompleted: false
          }
        ]
      }
    ]
  },

  {
    id: 'jee-mathematics-11',
    title: 'JEE Mathematics Class 11',
    description: 'Comprehensive mathematics preparation for JEE with focus on problem-solving techniques',
    subject: 'math',
    board: 'cbse',
    grade: 'Class 11 (JEE)',
    syllabus: 'JEE Main & Advanced',
    difficulty: 'advanced',
    totalLessons: 50,
    completedLessons: 0,
    topics: [
      {
        id: 'coordinate-geometry',
        title: 'Coordinate Geometry',
        description: 'Straight lines, circles, parabola, ellipse, and hyperbola',
        isCompleted: false,
        lessons: [
          {
            id: 'straight-lines',
            title: 'Straight Lines and Their Properties',
            content: 'Master equations of lines, angle between lines, distance formulas, and locus problems essential for JEE.',
            duration: 32,
            isCompleted: false,
            exercises: [
              {
                id: 'jee-coord-1',
                question: 'Find the equation of line passing through (2,3) and perpendicular to line 3x + 4y - 5 = 0',
                options: ['4x - 3y + 1 = 0', '4x - 3y - 1 = 0', '3x - 4y + 6 = 0', '4x + 3y - 17 = 0'],
                correctAnswer: 0,
                explanation: 'Slope of given line = -3/4. Perpendicular slope = 4/3. Using point-slope form: y-3 = (4/3)(x-2) → 4x - 3y + 1 = 0',
                questionType: 'mcq',
                boardStyle: 'cbse'
              }
            ]
          }
        ]
      }
    ]
  },

  // NEET Courses
  {
    id: 'neet-physics-11',
    title: 'NEET Physics Class 11',
    description: 'Physics preparation for NEET with emphasis on conceptual understanding and medical applications',
    subject: 'physics',
    board: 'cbse',
    grade: 'Class 11 (NEET)',
    syllabus: 'NEET UG',
    difficulty: 'intermediate',
    totalLessons: 35,
    completedLessons: 0,
    topics: [
      {
        id: 'mechanics-neet',
        title: 'Mechanics for NEET',
        description: 'Fundamental mechanics concepts with medical applications',
        isCompleted: false,
        lessons: [
          {
            id: 'motion-neet',
            title: 'Motion and Its Applications in Biology',
            content: 'Study motion concepts with biological applications. Learn how physics principles apply to human movement, blood flow, and medical diagnostics.',
            duration: 28,
            isCompleted: false,
            exercises: [
              {
                id: 'neet-motion-1',
                question: 'The speed of blood flow in aorta is approximately 30 cm/s. If the cross-sectional area is 3 cm², what is the volume flow rate?',
                options: ['90 cm³/s', '10 cm³/s', '30 cm³/s', '60 cm³/s'],
                correctAnswer: 0,
                explanation: 'Volume flow rate = Area × velocity = 3 cm² × 30 cm/s = 90 cm³/s',
                questionType: 'mcq',
                boardStyle: 'cbse'
              }
            ]
          }
        ]
      }
    ]
  },

  {
    id: 'neet-chemistry-11',
    title: 'NEET Chemistry Class 11',
    description: 'Comprehensive chemistry for NEET with focus on organic and biochemistry applications',
    subject: 'chemistry',
    board: 'cbse',
    grade: 'Class 11 (NEET)',
    syllabus: 'NEET UG',
    difficulty: 'intermediate',
    totalLessons: 40,
    completedLessons: 0,
    topics: [
      {
        id: 'atomic-structure-neet',
        title: 'Atomic Structure',
        description: 'Electronic configuration and periodic properties',
        isCompleted: false,
        lessons: [
          {
            id: 'electronic-config',
            title: 'Electronic Configuration and Periodicity',
            content: 'Master electron configurations and periodic trends crucial for understanding chemical bonding in biological molecules.',
            duration: 30,
            isCompleted: false,
            exercises: [
              {
                id: 'neet-atomic-1',
                question: 'Which element has the electronic configuration [Ar] 3d¹⁰ 4s² 4p³?',
                options: ['Phosphorus', 'Arsenic', 'Antimony', 'Bismuth'],
                correctAnswer: 1,
                explanation: '[Ar] represents 18 electrons. Adding 3d¹⁰ 4s² 4p³ gives total 33 electrons, which is Arsenic (As)',
                questionType: 'mcq',
                boardStyle: 'cbse'
              }
            ]
          }
        ]
      },
      {
        id: 'organic-basics-neet',
        title: 'Basic Organic Chemistry',
        description: 'Fundamental organic concepts for biological applications',
        isCompleted: false,
        lessons: [
          {
            id: 'hydrocarbons-biomolecules',
            title: 'Hydrocarbons and Biomolecules',
            content: 'Study organic compounds that form the basis of biological molecules like carbohydrates, proteins, and lipids.',
            duration: 35,
            isCompleted: false
          }
        ]
      }
    ]
  },

  {
    id: 'neet-biology-11',
    title: 'NEET Biology Class 11',
    description: 'Complete biology preparation for NEET covering botany and zoology',
    subject: 'chemistry', // Using chemistry as closest match since biology isn't in our enum
    board: 'cbse',
    grade: 'Class 11 (NEET)',
    syllabus: 'NEET UG Biology',
    difficulty: 'intermediate',
    totalLessons: 45,
    completedLessons: 0,
    topics: [
      {
        id: 'cell-biology',
        title: 'Cell Biology and Biomolecules',
        description: 'Cell structure, function, and biomolecules',
        isCompleted: false,
        lessons: [
          {
            id: 'cell-structure',
            title: 'Cell Structure and Organelles',
            content: 'Detailed study of prokaryotic and eukaryotic cells, organelles, and their functions essential for NEET.',
            duration: 40,
            isCompleted: false,
            exercises: [
              {
                id: 'neet-cell-1',
                question: 'Which organelle is known as the "powerhouse of the cell"?',
                options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Endoplasmic Reticulum'],
                correctAnswer: 1,
                explanation: 'Mitochondria are called the powerhouse of the cell because they produce ATP through cellular respiration',
                questionType: 'mcq',
                boardStyle: 'cbse'
              }
            ]
          }
        ]
      },
      {
        id: 'plant-physiology',
        title: 'Plant Physiology',
        description: 'Photosynthesis, respiration, and plant hormones',
        isCompleted: false,
        lessons: [
          {
            id: 'photosynthesis',
            title: 'Photosynthesis and Light Reactions',
            content: 'Comprehensive study of photosynthesis mechanism, light and dark reactions, and factors affecting photosynthesis.',
            duration: 38,
            isCompleted: false
          }
        ]
      }
    ]
  },

  // JEE Advanced specific courses
  {
    id: 'jee-advanced-physics',
    title: 'JEE Advanced Physics',
    description: 'Advanced physics concepts and problem-solving for IIT entrance',
    subject: 'physics',
    board: 'cbse',
    grade: 'Class 12 (JEE Advanced)',
    syllabus: 'JEE Advanced',
    difficulty: 'advanced',
    totalLessons: 55,
    completedLessons: 0,
    topics: [
      {
        id: 'electromagnetic-induction-advanced',
        title: 'Electromagnetic Induction (Advanced)',
        description: 'Complex problems on EMI, self and mutual inductance',
        isCompleted: false,
        lessons: [
          {
            id: 'complex-emi-problems',
            title: 'Complex EMI Problem Solving',
            content: 'Master advanced electromagnetic induction problems involving moving conductors, changing magnetic fields, and coupled circuits.',
            duration: 45,
            isCompleted: false,
            exercises: [
              {
                id: 'jee-adv-emi-1',
                question: 'A conducting rod of length l moves with velocity v perpendicular to a magnetic field B. If the rod rotates about one end, find the EMF between the ends.',
                options: ['Bl²v/2', 'Blv', 'Bl²v', 'Blv/2'],
                correctAnswer: 0,
                explanation: 'For a rotating rod, EMF = ∫(v×B)·dl. Since v = ωr and ω = v/l, integrating gives EMF = Bl²v/2',
                questionType: 'mcq',
                boardStyle: 'cbse',
                markingScheme: {
                  totalMarks: 4,
                  markingCriteria: ['Set up integral correctly', 'Express velocity in terms of position', 'Integrate properly']
                }
              }
            ]
          }
        ]
      }
    ]
  }
];

// Exam-specific study plans and strategies
export const examStrategies = {
  jee: {
    name: 'JEE Main & Advanced',
    description: 'Joint Entrance Examination for IIT, NIT, and other engineering colleges',
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    examPattern: {
      jeeMain: {
        duration: '3 hours',
        questions: '90 questions (30 each subject)',
        marking: '+4 for correct, -1 for incorrect',
        mode: 'Computer Based Test'
      },
      jeeAdvanced: {
        duration: '6 hours (2 papers of 3 hours each)',
        questions: 'Variable (typically 54 questions total)',
        marking: 'Variable marking scheme',
        mode: 'Computer Based Test'
      }
    },
    preparation: {
      timeRequired: '2 years intensive preparation',
      dailyStudy: '8-10 hours',
      practiceTests: 'Weekly mock tests essential',
      books: ['NCERT', 'HC Verma (Physics)', 'RD Sharma (Math)', 'OP Tandon (Chemistry)']
    }
  },
  neet: {
    name: 'NEET UG',
    description: 'National Eligibility cum Entrance Test for medical colleges',
    subjects: ['Physics', 'Chemistry', 'Biology'],
    examPattern: {
      duration: '3 hours 20 minutes',
      questions: '200 questions (50 Physics, 50 Chemistry, 100 Biology)',
      marking: '+4 for correct, -1 for incorrect',
      mode: 'Pen and Paper Test'
    },
    preparation: {
      timeRequired: '2 years focused preparation',
      dailyStudy: '6-8 hours',
      practiceTests: 'Daily practice and weekly tests',
      books: ['NCERT (Primary)', 'Trueman Biology', 'Morrison & Boyd (Chemistry)']
    }
  }
};