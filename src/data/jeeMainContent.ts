import { Course } from '../types';

export const jeeMainCourses: Course[] = [
  // JEE Main Physics - Class 11
  {
    id: 'jee-main-physics-11',
    title: 'JEE Main Physics - Class 11',
    description: 'Complete Physics preparation for JEE Main with 400+ solved examples and 1000+ practice questions',
    subject: 'physics',
    board: 'jee',
    grade: 'Class 11',
    syllabus: 'JEE Main 2025',
    difficulty: 'advanced',
    totalLessons: 48,
    completedLessons: 0,
    topics: [
      {
        id: 'units-measurements',
        title: 'Units and Measurements',
        description: 'Fundamental and derived units, dimensional analysis, significant figures, and error analysis',
        isCompleted: false,
        lessons: [
          {
            id: 'dimensional-analysis',
            title: 'Dimensional Analysis and Error Calculation',
            content: `Master dimensional analysis - the cornerstone of physics problem solving in JEE Main.

**Key Concepts:**
• Fundamental quantities: Length [L], Mass [M], Time [T], Current [A], Temperature [K], Amount [mol], Luminous intensity [cd]
• Derived quantities and their dimensions
• Principle of homogeneity of dimensions
• Applications in deriving formulas and checking equations

**Dimensional Analysis Applications:**
1. **Checking correctness of equations**
2. **Deriving relationships between physical quantities**
3. **Converting units from one system to another**

**Error Analysis:**
• Absolute error = |True value - Measured value|
• Relative error = Absolute error / True value
• Percentage error = Relative error × 100%

**Significant Figures Rules:**
1. All non-zero digits are significant
2. Zeros between non-zero digits are significant
3. Leading zeros are not significant
4. Trailing zeros in decimal numbers are significant

**JEE Main Strategy:**
- 2-3 questions expected from this chapter
- Focus on dimensional analysis applications
- Practice error propagation in calculations
- Master significant figure rules for accurate answers`,
            duration: 25,
            isCompleted: false,
            exercises: [
              {
                id: 'jee-units-1',
                question: 'The dimensional formula for coefficient of viscosity is:',
                options: ['[ML⁻¹T⁻¹]', '[MLT⁻¹]', '[ML⁻¹T⁻²]', '[ML⁻²T⁻¹]'],
                correctAnswer: 0,
                explanation: 'Viscosity η = F/(A × dv/dx) = [MLT⁻²]/[L² × T⁻¹L⁻¹] = [ML⁻¹T⁻¹]',
                questionType: 'mcq',
                boardStyle: 'cbse',
                markingScheme: {
                  totalMarks: 4,
                  markingCriteria: ['Identify viscosity formula', 'Apply dimensional analysis', 'Simplify correctly']
                }
              },
              {
                id: 'jee-units-2',
                question: 'If the percentage error in measuring length is 2% and in measuring time is 3%, what is the percentage error in measuring velocity?',
                options: ['1%', '5%', '6%', '√13%'],
                correctAnswer: 1,
                explanation: 'For v = l/t, percentage error in v = √[(error in l)² + (error in t)²] = √[2² + 3²] = √13% ≈ 5%',
                questionType: 'mcq',
                boardStyle: 'cbse',
                markingScheme: {
                  totalMarks: 4,
                  markingCriteria: ['Identify error propagation formula', 'Apply for division', 'Calculate correctly']
                }
              }
            ]
          }
        ]
      },
      {
        id: 'kinematics',
        title: 'Kinematics',
        description: 'Motion in one and two dimensions, projectile motion, relative motion',
        isCompleted: false,
        lessons: [
          {
            id: 'motion-1d',
            title: 'Motion in One Dimension',
            content: `Master one-dimensional motion - fundamental to all JEE Main mechanics problems.

**Key Equations:**
• v = u + at
• s = ut + ½at²
• v² = u² + 2as
• s = (u + v)t/2

**Important Concepts:**
1. **Displacement vs Distance**: Vector vs scalar quantities
2. **Velocity vs Speed**: Average and instantaneous values
3. **Acceleration**: Rate of change of velocity

**Graphical Analysis:**
• Position-time graphs: Slope gives velocity
• Velocity-time graphs: Slope gives acceleration, area gives displacement
• Acceleration-time graphs: Area gives change in velocity

**Free Fall Motion:**
• g = 9.8 m/s² (downward)
• At maximum height: v = 0
• Time of flight = 2u/g
• Maximum height = u²/2g

**JEE Main Tips:**
- 4-5 questions from kinematics
- Focus on graphical problems
- Master relative motion concepts
- Practice sign conventions carefully`,
            duration: 30,
            isCompleted: false,
            exercises: [
              {
                id: 'jee-kinematics-1d-1',
                question: 'A ball is thrown vertically upward with velocity 20 m/s. After how much time will it return to the point of projection? (g = 10 m/s²)',
                options: ['2 s', '4 s', '6 s', '8 s'],
                correctAnswer: 1,
                explanation: 'Time of flight = 2u/g = 2×20/10 = 4 seconds',
                questionType: 'mcq',
                boardStyle: 'cbse'
              },
              {
                id: 'jee-kinematics-1d-2',
                question: 'A particle moves with constant acceleration. If it covers 40 m in first 4 s and 60 m in next 4 s, find its initial velocity.',
                options: ['2.5 m/s', '5 m/s', '7.5 m/s', '10 m/s'],
                correctAnswer: 0,
                explanation: 'Using s = ut + ½at²: 40 = 4u + 8a and 100 = 8u + 32a. Solving: u = 2.5 m/s',
                questionType: 'mcq',
                boardStyle: 'cbse'
              }
            ]
          },
          {
            id: 'projectile-motion',
            title: 'Projectile Motion',
            content: `Master projectile motion - a favorite topic in JEE Main with guaranteed questions.

**Key Concepts:**
• Horizontal motion: vₓ = u cos θ (constant)
• Vertical motion: vᵧ = u sin θ - gt

**Important Formulas:**
• Time of flight: T = 2u sin θ/g
• Maximum height: H = u² sin² θ/2g
• Range: R = u² sin 2θ/g
• Maximum range: Rₘₐₓ = u²/g (at θ = 45°)

**Trajectory Equation:**
y = x tan θ - gx²/(2u² cos² θ)

**Special Cases:**
1. **Horizontal projection**: θ = 0°, T = √(2h/g), R = u√(2h/g)
2. **Maximum range**: θ = 45°
3. **Equal ranges**: θ and (90° - θ) give same range

**Problem-Solving Strategy:**
1. Resolve initial velocity into components
2. Apply kinematic equations separately for x and y
3. Use appropriate conditions (max height, range, etc.)

**JEE Main Focus:**
- 2-3 questions guaranteed
- Emphasis on trajectory and range problems
- Practice projectile from inclined planes`,
            duration: 35,
            isCompleted: false,
            exercises: [
              {
                id: 'jee-projectile-1',
                question: 'A projectile is fired at 30° with horizontal with speed 40 m/s. Find the maximum height reached. (g = 10 m/s²)',
                options: ['10 m', '20 m', '30 m', '40 m'],
                correctAnswer: 1,
                explanation: 'H = u² sin² θ/2g = 40² × sin² 30°/20 = 1600 × 0.25/20 = 20 m',
                questionType: 'mcq',
                boardStyle: 'cbse'
              },
              {
                id: 'jee-projectile-2',
                question: 'Two projectiles are fired simultaneously from the same point with the same speed but at angles 30° and 60° with horizontal. The ratio of their ranges is:',
                options: ['1:1', '1:√3', '√3:1', '1:2'],
                correctAnswer: 0,
                explanation: 'R₁/R₂ = sin(2×30°)/sin(2×60°) = sin 60°/sin 120° = sin 60°/sin 60° = 1:1',
                questionType: 'mcq',
                boardStyle: 'cbse'
              }
            ]
          }
        ]
      },
      {
        id: 'laws-of-motion',
        title: 'Laws of Motion',
        description: 'Newton\'s laws, friction, circular motion, and applications',
        isCompleted: false,
        lessons: [
          {
            id: 'newtons-laws',
            title: 'Newton\'s Laws and Applications',
            content: `Master Newton's laws - the foundation of classical mechanics in JEE Main.

**Newton's First Law (Law of Inertia):**
• A body continues in its state of rest or uniform motion unless acted upon by external force
• Defines inertial frames of reference

**Newton's Second Law:**
• F = ma (when mass is constant)
• F = dp/dt (general form)
• Net force determines acceleration

**Newton's Third Law:**
• For every action, there is an equal and opposite reaction
• Forces always occur in pairs
• Action-reaction pairs act on different bodies

**Applications:**
1. **Atwood Machine**: Two masses connected by string over pulley
2. **Inclined Plane**: Components of weight and normal force
3. **Connected Bodies**: Multiple objects with constraints

**Problem-Solving Steps:**
1. Draw free body diagram
2. Choose coordinate system
3. Apply Newton's second law
4. Solve simultaneous equations

**JEE Main Strategy:**
- 3-4 questions from this chapter
- Focus on connected systems
- Master free body diagrams
- Practice constraint equations`,
            duration: 40,
            isCompleted: false,
            exercises: [
              {
                id: 'jee-newton-1',
                question: 'Two blocks of masses 2 kg and 3 kg are connected by a string over a frictionless pulley. Find the acceleration of the system. (g = 10 m/s²)',
                options: ['2 m/s²', '4 m/s²', '6 m/s²', '8 m/s²'],
                correctAnswer: 0,
                explanation: 'For 3 kg: 30 - T = 3a; For 2 kg: T - 20 = 2a; Solving: a = 2 m/s²',
                questionType: 'mcq',
                boardStyle: 'cbse'
              }
            ]
          },
          {
            id: 'friction',
            title: 'Friction and Its Applications',
            content: `Master friction - crucial for solving complex mechanics problems in JEE Main.

**Types of Friction:**
1. **Static Friction**: fs ≤ μsN (prevents motion)
2. **Kinetic Friction**: fk = μkN (opposes motion)
3. **Rolling Friction**: fr = μrN (for rolling objects)

**Key Points:**
• μs > μk > μr (coefficient hierarchy)
• Friction is self-adjusting up to maximum value
• Direction always opposes relative motion

**Applications:**
1. **Motion on Inclined Plane**:
   - Without friction: a = g sin θ
   - With friction: a = g(sin θ - μ cos θ)

2. **Circular Motion with Friction**:
   - Banking of roads
   - Maximum speed on curves

**Problem-Solving Strategy:**
1. Identify type of friction
2. Check if motion occurs (compare applied force with maximum static friction)
3. Apply appropriate friction formula
4. Solve using Newton's laws

**JEE Main Focus:**
- 2-3 questions expected
- Emphasis on inclined plane problems
- Practice banking of roads
- Master limiting friction concepts`,
            duration: 35,
            isCompleted: false,
            exercises: [
              {
                id: 'jee-friction-1',
                question: 'A block of mass 5 kg is placed on a rough inclined plane of angle 30°. If μs = 0.6, will the block slide down? (g = 10 m/s²)',
                options: ['Yes, it will slide', 'No, it will not slide', 'Cannot be determined', 'Depends on initial velocity'],
                correctAnswer: 1,
                explanation: 'tan 30° = 0.577 < μs = 0.6, so block will not slide down',
                questionType: 'mcq',
                boardStyle: 'cbse'
              }
            ]
          }
        ]
      }
    ]
  },

  // JEE Main Physics - Class 12
  {
    id: 'jee-main-physics-12',
    title: 'JEE Main Physics - Class 12',
    description: 'Advanced Physics topics for JEE Main including electromagnetism, optics, and modern physics',
    subject: 'physics',
    board: 'jee',
    grade: 'Class 12',
    syllabus: 'JEE Main 2025',
    difficulty: 'advanced',
    totalLessons: 52,
    completedLessons: 0,
    topics: [
      {
        id: 'electrostatics',
        title: 'Electrostatics',
        description: 'Electric charges, fields, potential, capacitance, and energy',
        isCompleted: false,
        lessons: [
          {
            id: 'coulombs-law',
            title: 'Coulomb\'s Law and Electric Field',
            content: `Master electrostatics fundamentals - high-weightage topic in JEE Main.

**Coulomb's Law:**
F = kq₁q₂/r² = q₁q₂/(4πε₀r²)

**Electric Field:**
• E = F/q = kQ/r² (point charge)
• E = σ/(2ε₀) (infinite sheet)
• E = λ/(2πε₀r) (infinite line)

**Superposition Principle:**
• Net field = vector sum of individual fields
• E⃗ = E⃗₁ + E⃗₂ + E⃗₃ + ...

**Electric Field Lines:**
• Start from positive, end at negative charges
• Never intersect
• Density indicates field strength

**Important Configurations:**
1. **Electric Dipole**: p⃗ = q × 2a⃗
   - Field on axis: E = 2kp/r³
   - Field on equator: E = kp/r³

2. **Ring of Charge**: E = kQx/(x² + R²)^(3/2)

3. **Disc of Charge**: E = σ/2ε₀[1 - x/√(x² + R²)]

**JEE Main Strategy:**
- 4-5 questions from electrostatics
- Focus on field calculations
- Master dipole problems
- Practice superposition principle`,
            duration: 45,
            isCompleted: false,
            exercises: [
              {
                id: 'jee-electrostatics-1',
                question: 'Two point charges +q and -q are placed at distance 2a apart. Find the electric field at a point on the perpendicular bisector at distance r from the center.',
                options: ['0', 'kq/r²', '2kqa/(r² + a²)^(3/2)', 'kq/(r² + a²)'],
                correctAnswer: 2,
                explanation: 'Due to symmetry, only components along the bisector add up. E = 2 × (kq/√(r² + a²)) × (a/√(r² + a²)) = 2kqa/(r² + a²)^(3/2)',
                questionType: 'mcq',
                boardStyle: 'cbse'
              }
            ]
          }
        ]
      }
    ]
  },

  // JEE Main Mathematics - Class 11
  {
    id: 'jee-main-math-11',
    title: 'JEE Main Mathematics - Class 11',
    description: 'Complete Mathematics preparation covering algebra, trigonometry, and coordinate geometry',
    subject: 'math',
    board: 'jee',
    grade: 'Class 11',
    syllabus: 'JEE Main 2025',
    difficulty: 'advanced',
    totalLessons: 55,
    completedLessons: 0,
    topics: [
      {
        id: 'sets-relations-functions',
        title: 'Sets, Relations and Functions',
        description: 'Fundamental concepts of sets, types of relations and functions',
        isCompleted: false,
        lessons: [
          {
            id: 'sets-operations',
            title: 'Sets and Set Operations',
            content: `Master sets theory - foundation for all mathematical concepts in JEE Main.

**Set Notation:**
• Roster form: A = {1, 2, 3, 4}
• Set-builder form: A = {x : x ∈ N, x ≤ 4}

**Types of Sets:**
1. **Empty Set**: ∅ or { }
2. **Universal Set**: U (contains all elements under consideration)
3. **Subset**: A ⊆ B if every element of A is in B
4. **Proper Subset**: A ⊂ B if A ⊆ B and A ≠ B

**Set Operations:**
• Union: A ∪ B = {x : x ∈ A or x ∈ B}
• Intersection: A ∩ B = {x : x ∈ A and x ∈ B}
• Difference: A - B = {x : x ∈ A and x ∉ B}
• Complement: A' = U - A

**Important Laws:**
1. **Commutative**: A ∪ B = B ∪ A, A ∩ B = B ∩ A
2. **Associative**: (A ∪ B) ∪ C = A ∪ (B ∪ C)
3. **Distributive**: A ∪ (B ∩ C) = (A ∪ B) ∩ (A ∪ C)
4. **De Morgan's**: (A ∪ B)' = A' ∩ B', (A ∩ B)' = A' ∪ B'

**Venn Diagrams:**
• Visual representation of set relationships
• Useful for solving word problems
• n(A ∪ B) = n(A) + n(B) - n(A ∩ B)

**JEE Main Strategy:**
- 1-2 questions from sets
- Focus on Venn diagram problems
- Master De Morgan's laws
- Practice cardinality problems`,
            duration: 25,
            isCompleted: false,
            exercises: [
              {
                id: 'jee-sets-1',
                question: 'If A = {1, 2, 3, 4} and B = {3, 4, 5, 6}, then A ∆ B (symmetric difference) is:',
                options: ['{1, 2, 5, 6}', '{3, 4}', '{1, 2, 3, 4, 5, 6}', '∅'],
                correctAnswer: 0,
                explanation: 'A ∆ B = (A - B) ∪ (B - A) = {1, 2} ∪ {5, 6} = {1, 2, 5, 6}',
                questionType: 'mcq',
                boardStyle: 'cbse'
              }
            ]
          }
        ]
      },
      {
        id: 'complex-numbers',
        title: 'Complex Numbers',
        description: 'Algebra of complex numbers, polar form, and De Moivre\'s theorem',
        isCompleted: false,
        lessons: [
          {
            id: 'complex-algebra',
            title: 'Algebra of Complex Numbers',
            content: `Master complex numbers - powerful tool for solving algebraic and geometric problems.

**Definition:**
z = a + bi, where i² = -1
• a = Real part (Re z)
• b = Imaginary part (Im z)

**Operations:**
1. **Addition**: (a + bi) + (c + di) = (a + c) + (b + d)i
2. **Multiplication**: (a + bi)(c + di) = (ac - bd) + (ad + bc)i
3. **Division**: (a + bi)/(c + di) = [(a + bi)(c - di)]/[c² + d²]

**Important Properties:**
• Conjugate: z̄ = a - bi
• Modulus: |z| = √(a² + b²)
• z × z̄ = |z|²
• |z₁z₂| = |z₁||z₂|
• |z₁/z₂| = |z₁|/|z₂|

**Polar Form:**
z = r(cos θ + i sin θ) = re^(iθ)
• r = |z| = √(a² + b²)
• θ = arg(z) = tan⁻¹(b/a)

**De Moivre's Theorem:**
(cos θ + i sin θ)ⁿ = cos nθ + i sin nθ

**Roots of Unity:**
• nth roots of unity: e^(2πik/n), k = 0, 1, 2, ..., n-1
• Sum of nth roots of unity = 0 (for n > 1)

**JEE Main Focus:**
- 2-3 questions guaranteed
- Emphasis on modulus and argument
- Practice De Moivre's theorem
- Master roots of unity`,
            duration: 35,
            isCompleted: false,
            exercises: [
              {
                id: 'jee-complex-1',
                question: 'If z = 1 + i, then z⁴ equals:',
                options: ['-4', '4', '-4i', '4i'],
                correctAnswer: 0,
                explanation: 'z² = (1 + i)² = 1 + 2i - 1 = 2i, z⁴ = (z²)² = (2i)² = 4i² = -4',
                questionType: 'mcq',
                boardStyle: 'cbse'
              }
            ]
          }
        ]
      }
    ]
  },

  // JEE Main Chemistry - Class 11
  {
    id: 'jee-main-chemistry-11',
    title: 'JEE Main Chemistry - Class 11',
    description: 'Comprehensive chemistry covering atomic structure, bonding, and organic basics',
    subject: 'chemistry',
    board: 'jee',
    grade: 'Class 11',
    syllabus: 'JEE Main 2025',
    difficulty: 'advanced',
    totalLessons: 45,
    completedLessons: 0,
    topics: [
      {
        id: 'atomic-structure',
        title: 'Atomic Structure',
        description: 'Bohr model, quantum numbers, electronic configuration, and periodic trends',
        isCompleted: false,
        lessons: [
          {
            id: 'quantum-numbers',
            title: 'Quantum Numbers and Electronic Configuration',
            content: `Master atomic structure - fundamental to understanding all chemical phenomena.

**Quantum Numbers:**
1. **Principal (n)**: Energy level, n = 1, 2, 3, ...
2. **Azimuthal (l)**: Subshell, l = 0 to (n-1)
   - s(l=0), p(l=1), d(l=2), f(l=3)
3. **Magnetic (m)**: Orbital orientation, m = -l to +l
4. **Spin (s)**: Electron spin, s = ±1/2

**Electronic Configuration Rules:**
1. **Aufbau Principle**: Fill lower energy orbitals first
2. **Pauli Exclusion**: No two electrons with same four quantum numbers
3. **Hund's Rule**: Maximum unpaired electrons in degenerate orbitals

**Energy Order:**
1s < 2s < 2p < 3s < 3p < 4s < 3d < 4p < 5s < 4d < 5p < 6s < 4f < 5d < 6p

**Exceptions:**
• Cr: [Ar] 3d⁵ 4s¹ (half-filled d orbital stability)
• Cu: [Ar] 3d¹⁰ 4s¹ (fully-filled d orbital stability)

**Periodic Trends:**
1. **Atomic Radius**: Decreases across period, increases down group
2. **Ionization Energy**: Increases across period, decreases down group
3. **Electron Affinity**: Generally increases across period
4. **Electronegativity**: Increases across period, decreases down group

**JEE Main Strategy:**
- 3-4 questions from atomic structure
- Focus on electronic configurations
- Master periodic trends
- Practice quantum number problems`,
            duration: 40,
            isCompleted: false,
            exercises: [
              {
                id: 'jee-atomic-1',
                question: 'The electronic configuration of Cr³⁺ (Z = 24) is:',
                options: ['[Ar] 3d³', '[Ar] 3d⁵', '[Ar] 3d¹ 4s²', '[Ar] 3d⁴ 4s¹'],
                correctAnswer: 0,
                explanation: 'Cr: [Ar] 3d⁵ 4s¹, Cr³⁺ loses 3 electrons (1 from 4s, 2 from 3d): [Ar] 3d³',
                questionType: 'mcq',
                boardStyle: 'cbse'
              }
            ]
          }
        ]
      }
    ]
  }
];

// JEE Main Exam Pattern and Strategy
export const jeeMainExamInfo = {
  pattern: {
    duration: '3 hours',
    totalQuestions: 90,
    subjects: {
      physics: { questions: 30, marks: 120 },
      chemistry: { questions: 30, marks: 120 },
      mathematics: { questions: 30, marks: 120 }
    },
    totalMarks: 360,
    markingScheme: {
      correct: '+4 marks',
      incorrect: '-1 mark',
      unattempted: '0 marks'
    }
  },
  strategy: {
    timeManagement: {
      physics: '60 minutes',
      chemistry: '55 minutes',
      mathematics: '65 minutes',
      revision: '20 minutes'
    },
    questionSelection: {
      easy: 'Attempt first (60-70% questions)',
      medium: 'Attempt after easy (20-25% questions)',
      difficult: 'Attempt if time permits (10-15% questions)'
    },
    subjectWiseStrategy: {
      physics: {
        focus: 'Numerical problems and conceptual clarity',
        tips: ['Start with mechanics', 'Focus on formula-based questions', 'Avoid lengthy derivations']
      },
      chemistry: {
        focus: 'Factual knowledge and quick recall',
        tips: ['Start with inorganic', 'Memorize important reactions', 'Practice organic mechanisms']
      },
      mathematics: {
        focus: 'Problem-solving and accuracy',
        tips: ['Start with algebra', 'Focus on coordinate geometry', 'Practice calculus applications']
      }
    }
  },
  preparation: {
    timeline: {
      '2 years': 'Complete syllabus coverage with strong foundation',
      '1 year': 'Intensive practice and revision',
      '6 months': 'Mock tests and weak area improvement',
      '3 months': 'Final revision and test series',
      '1 month': 'Light revision and confidence building'
    },
    dailySchedule: {
      physics: '3 hours',
      chemistry: '2.5 hours',
      mathematics: '3.5 hours',
      revision: '1 hour',
      mockTests: '3 hours (alternate days)'
    },
    resources: {
      books: [
        'NCERT (All subjects - Primary)',
        'HC Verma (Physics)',
        'Concepts of Physics - DC Pandey',
        'OP Tandon (Chemistry)',
        'RD Sharma (Mathematics)',
        'Cengage Learning Series'
      ],
      onlinePlatforms: [
        'CampusPandit JEE Main Course',
        'Previous Year Question Papers',
        'Mock Test Series',
        'Video Lectures'
      ]
    }
  }
};

// Chapter-wise weightage for JEE Main
export const jeeMainWeightage = {
  physics: {
    'Mechanics': { marks: 32, questions: 8, difficulty: 'Medium' },
    'Heat and Thermodynamics': { marks: 12, questions: 3, difficulty: 'Easy' },
    'Waves and Sound': { marks: 8, questions: 2, difficulty: 'Medium' },
    'Electricity and Magnetism': { marks: 32, questions: 8, difficulty: 'Hard' },
    'Optics': { marks: 12, questions: 3, difficulty: 'Medium' },
    'Modern Physics': { marks: 16, questions: 4, difficulty: 'Easy' },
    'Units and Measurements': { marks: 8, questions: 2, difficulty: 'Easy' }
  },
  chemistry: {
    'Physical Chemistry': { marks: 44, questions: 11, difficulty: 'Medium' },
    'Inorganic Chemistry': { marks: 40, questions: 10, difficulty: 'Easy' },
    'Organic Chemistry': { marks: 36, questions: 9, difficulty: 'Hard' }
  },
  mathematics: {
    'Algebra': { marks: 36, questions: 9, difficulty: 'Medium' },
    'Coordinate Geometry': { marks: 28, questions: 7, difficulty: 'Hard' },
    'Calculus': { marks: 32, questions: 8, difficulty: 'Hard' },
    'Trigonometry': { marks: 12, questions: 3, difficulty: 'Easy' },
    'Statistics and Probability': { marks: 12, questions: 3, difficulty: 'Medium' }
  }
};

// Important formulas and concepts
export const jeeMainFormulas = {
  physics: {
    mechanics: [
      'v = u + at',
      's = ut + ½at²',
      'v² = u² + 2as',
      'F = ma',
      'Work = F·s cos θ',
      'KE = ½mv²',
      'PE = mgh'
    ],
    electromagnetism: [
      'F = kq₁q₂/r²',
      'E = F/q',
      'V = kq/r',
      'C = Q/V',
      'F = BIL sin θ',
      'ε = -dΦ/dt'
    ]
  },
  chemistry: {
    atomicStructure: [
      'E = hν = hc/λ',
      'λ = h/mv (de Broglie)',
      'ΔE = 13.6(1/n₁² - 1/n₂²) eV',
      'Zeff = Z - σ'
    ],
    thermodynamics: [
      'ΔU = q + w',
      'ΔH = ΔU + ΔnRT',
      'ΔG = ΔH - TΔS',
      'K = e^(-ΔG°/RT)'
    ]
  },
  mathematics: {
    algebra: [
      '(a + b)ⁿ = Σ ⁿCᵣ aⁿ⁻ʳ bʳ',
      'aⁿ - bⁿ = (a - b)(aⁿ⁻¹ + aⁿ⁻²b + ... + bⁿ⁻¹)',
      'log(ab) = log a + log b',
      'aˣ = e^(x ln a)'
    ],
    calculus: [
      'd/dx(xⁿ) = nxⁿ⁻¹',
      'd/dx(eˣ) = eˣ',
      'd/dx(sin x) = cos x',
      '∫ xⁿ dx = xⁿ⁺¹/(n+1) + C'
    ]
  }
};

export default jeeMainCourses;