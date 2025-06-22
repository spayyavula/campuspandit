import { Course } from '../types';

// IB to JEE Bridge Program - Comprehensive transition courses
export const ibToJeeBridgeCourses: Course[] = [
  // Physics Bridge Course
  {
    id: 'ib-jee-physics-bridge',
    title: 'IB to JEE Physics Bridge',
    description: 'Comprehensive bridge course helping IB Physics students transition to JEE Main/Advanced preparation',
    subject: 'physics',
    board: 'jee',
    grade: 'IB DP to JEE Transition',
    syllabus: 'IB-JEE Bridge 2025',
    difficulty: 'advanced',
    totalLessons: 65,
    completedLessons: 0,
    topics: [
      {
        id: 'ib-jee-gap-analysis',
        title: 'IB vs JEE: Gap Analysis & Strategy',
        description: 'Understanding the fundamental differences between IB and JEE physics approaches',
        isCompleted: false,
        lessons: [
          {
            id: 'curriculum-comparison',
            title: 'IB Physics vs JEE Physics: Complete Comparison',
            content: `Understanding the key differences between IB and JEE Physics to plan your transition strategy.

**IB Physics Approach:**
• Conceptual understanding and real-world applications
• Internal Assessment (IA) and Extended Essay focus
• Emphasis on experimental design and data analysis
• Qualitative reasoning and scientific communication
• Calculator-based problem solving

**JEE Physics Approach:**
• Mathematical rigor and formula-based problem solving
• High-speed calculation and pattern recognition
• Multiple choice questions with negative marking
• Extensive numerical problem solving
• Memory-based formula recall

**Key Gaps to Bridge:**

1. **Mathematical Intensity**
   - IB: Moderate math, focus on understanding
   - JEE: Heavy calculus, complex algebraic manipulation
   - **Action**: Strengthen mathematical problem-solving skills

2. **Problem-Solving Speed**
   - IB: Thoughtful analysis, extended time
   - JEE: Rapid-fire questions, 2 minutes per question
   - **Action**: Practice time-bound problem solving

3. **Formula Memorization**
   - IB: Formula sheet provided, focus on application
   - JEE: Complete memorization required
   - **Action**: Create comprehensive formula bank

4. **Question Types**
   - IB: Extended response, explanation-based
   - JEE: Multiple choice, numerical answers
   - **Action**: Master MCQ techniques and shortcuts

**Transition Timeline:**
• **Months 1-2**: Gap analysis and foundation strengthening
• **Months 3-6**: Intensive JEE-style problem solving
• **Months 7-12**: Advanced topics and mock tests
• **Months 13-18**: Final preparation and strategy refinement

**Study Strategy for IB Students:**
1. Leverage your strong conceptual foundation
2. Focus heavily on mathematical problem solving
3. Practice speed and accuracy simultaneously
4. Memorize formulas while understanding derivations
5. Adapt to MCQ format and negative marking`,
            duration: 45,
            isCompleted: false,
            exercises: [
              {
                id: 'gap-analysis-1',
                question: 'An IB student typically spends 30 minutes on a physics problem. For JEE Main, the same problem should be solved in:',
                options: ['10 minutes', '6 minutes', '2 minutes', '30 seconds'],
                correctAnswer: 2,
                explanation: 'JEE Main has 30 physics questions in 60 minutes, allowing approximately 2 minutes per question including reading time.',
                questionType: 'mcq',
                boardStyle: 'cbse'
              }
            ]
          },
          {
            id: 'mathematical-preparation',
            title: 'Mathematical Foundation for JEE Physics',
            content: `Strengthening mathematical skills essential for JEE Physics success.

**Essential Mathematical Skills:**

1. **Calculus Applications**
   - Differentiation for velocity, acceleration
   - Integration for displacement, work, impulse
   - Partial derivatives in thermodynamics
   - Vector calculus in electromagnetism

2. **Trigonometry Mastery**
   - All trigonometric identities
   - Inverse trigonometric functions
   - Complex number applications
   - Harmonic motion analysis

3. **Algebra & Coordinate Geometry**
   - Quadratic equations and inequalities
   - Logarithmic and exponential functions
   - Coordinate geometry for projectile motion
   - Vector algebra and operations

**IB to JEE Mathematical Transition:**

**Example 1: Kinematics**
*IB Approach:* "Describe the motion using graphs and explain the physical meaning"
*JEE Approach:* "A particle moves with velocity v = 3t² - 2t + 1. Find displacement in first 3 seconds"

**Solution Strategy:**
- IB students: Focus on the mathematical calculation
- Use integration: s = ∫v dt = ∫(3t² - 2t + 1)dt = t³ - t² + t + C
- Apply limits: s(3) - s(0) = 27 - 9 + 3 = 21 m

**Example 2: Circular Motion**
*IB Approach:* "Explain centripetal force conceptually"
*JEE Approach:* "A 2kg mass moves in a circle of radius 5m with speed 10 m/s. Find centripetal force"

**Solution Strategy:**
- Direct formula application: F = mv²/r = 2×100/5 = 40 N
- No lengthy explanation needed, just accurate calculation

**Practice Routine:**
1. **Daily Math Practice**: 1 hour of pure mathematical problem solving
2. **Formula Drills**: 15 minutes daily formula memorization
3. **Speed Calculations**: Timed mathematical exercises
4. **Integration Practice**: Physics problems requiring calculus`,
            duration: 40,
            isCompleted: false,
            exercises: [
              {
                id: 'math-foundation-1',
                question: 'If velocity v = 4t³ - 6t² + 2t, find acceleration at t = 2 seconds:',
                options: ['26 m/s²', '32 m/s²', '36 m/s²', '42 m/s²'],
                correctAnswer: 2,
                explanation: 'a = dv/dt = 12t² - 12t + 2. At t = 2: a = 12(4) - 12(2) + 2 = 48 - 24 + 2 = 26 m/s²',
                questionType: 'mcq',
                boardStyle: 'cbse'
              }
            ]
          }
        ]
      },
      {
        id: 'mechanics-bridge',
        title: 'Mechanics: IB to JEE Transition',
        description: 'Bridging mechanics concepts from IB conceptual approach to JEE problem-solving format',
        isCompleted: false,
        lessons: [
          {
            id: 'kinematics-intensive',
            title: 'Kinematics: From IB Graphs to JEE Calculations',
            content: `Transforming your IB kinematics understanding into JEE problem-solving prowess.

**IB Kinematics Strengths:**
✓ Strong conceptual understanding of motion
✓ Excellent graph interpretation skills
✓ Good grasp of real-world applications
✓ Understanding of experimental uncertainties

**JEE Kinematics Requirements:**
• Rapid formula application and manipulation
• Complex multi-step problem solving
• Relative motion in multiple dimensions
• Projectile motion with varying conditions

**Key Transition Areas:**

1. **From Conceptual to Computational**

*IB Style Problem:*
"Explain how the velocity-time graph shows the object's motion"

*JEE Style Problem:*
"A particle starts from rest and accelerates at 2 m/s² for 5s, then moves at constant velocity for 3s, then decelerates at 3 m/s² until it stops. Find total distance."

**JEE Solution Approach:**
- Phase 1: v = 0 + 2×5 = 10 m/s, s₁ = ½×2×25 = 25 m
- Phase 2: s₂ = 10×3 = 30 m
- Phase 3: 0 = 10 - 3t, t = 10/3 s, s₃ = 10×(10/3) - ½×3×(10/3)² = 50/3 m
- Total: s = 25 + 30 + 50/3 = 221/3 m

2. **Relative Motion Mastery**

*IB Approach:* Conceptual understanding with simple examples
*JEE Approach:* Complex multi-body relative motion

**Example:** Two trains approach each other at 60 km/h and 40 km/h. A bird flies between them at 80 km/h. Find total distance covered by bird if initial separation is 200 km.

**Solution Strategy:**
- Relative speed = 60 + 40 = 100 km/h
- Time to meet = 200/100 = 2 hours
- Bird's distance = 80×2 = 160 km

3. **Projectile Motion Complexity**

*IB Level:* Basic projectile motion with given angle
*JEE Level:* Variable angles, maximum range, trajectory equations

**Advanced Projectile Problems:**
- Projectile motion on inclined planes
- Maximum range calculations
- Time of flight variations
- Trajectory intersections

**Practice Strategy for IB Students:**
1. **Speed Building**: Solve 20 kinematics problems daily
2. **Formula Mastery**: Memorize all kinematic equations
3. **Graph to Equation**: Convert graph problems to calculations
4. **Multi-step Problems**: Practice complex scenarios
5. **Time Management**: 2 minutes per problem maximum`,
            duration: 50,
            isCompleted: false,
            exercises: [
              {
                id: 'kinematics-bridge-1',
                question: 'A ball is thrown at 45° with speed 20 m/s from a 10m high building. Find the horizontal distance traveled when it hits the ground. (g = 10 m/s²)',
                options: ['28.28 m', '32.36 m', '40.00 m', '44.72 m'],
                correctAnswer: 3,
                explanation: 'Using trajectory equation and solving quadratic: y = x - gx²/(2u²). Substituting values and solving gives x ≈ 44.72 m',
                questionType: 'mcq',
                boardStyle: 'cbse'
              },
              {
                id: 'kinematics-bridge-2',
                question: 'Two cars start from the same point. Car A moves at constant 60 km/h. Car B starts 1 hour later at 80 km/h. When will B overtake A?',
                options: ['2 hours after A starts', '3 hours after A starts', '4 hours after A starts', '5 hours after A starts'],
                correctAnswer: 2,
                explanation: 'Let t be time after A starts. Distance: 60t = 80(t-1). Solving: 60t = 80t - 80, so 20t = 80, t = 4 hours',
                questionType: 'mcq',
                boardStyle: 'cbse'
              }
            ]
          },
          {
            id: 'forces-dynamics-bridge',
            title: 'Forces and Dynamics: Advanced Problem Solving',
            content: `Elevating your IB forces understanding to JEE-level problem solving complexity.

**IB Forces Foundation:**
✓ Newton's laws conceptual understanding
✓ Free body diagram skills
✓ Real-world force applications
✓ Experimental force analysis

**JEE Forces Mastery Required:**
• Complex multi-body systems
• Constraint forces and tensions
• Friction in various scenarios
• Circular motion dynamics
• Non-inertial reference frames

**Advanced Force Concepts:**

1. **Multi-Body Connected Systems**

*IB Level:* Simple two-body problems
*JEE Level:* Multiple masses with pulleys, inclines, and constraints

**Example Problem:**
Three masses m₁ = 2kg, m₂ = 3kg, m₃ = 5kg are connected by strings over pulleys. m₁ and m₂ are on a horizontal surface (μ = 0.2), m₃ hangs vertically. Find acceleration.

**Solution Approach:**
- Free body diagrams for all three masses
- Constraint equations: a₁ = a₂ = a₃ = a
- Friction forces: f₁ = μm₁g, f₂ = μm₂g
- System equations:
  * For m₁: T₁ - f₁ = m₁a
  * For m₂: T₂ - T₁ - f₂ = m₂a  
  * For m₃: m₃g - T₂ = m₃a
- Solve simultaneously for a

2. **Circular Motion Dynamics**

*IB Approach:* Basic centripetal force concepts
*JEE Approach:* Complex circular motion scenarios

**Banking of Roads:**
A car takes a banked curve of radius R at angle θ. Find maximum speed without friction.

**Solution:**
- Forces: Weight (mg), Normal (N)
- Components: N sin θ = mv²/R, N cos θ = mg
- Eliminating N: tan θ = v²/Rg
- Maximum speed: v = √(Rg tan θ)

3. **Friction Mastery**

*IB Level:* Basic static and kinetic friction
*JEE Level:* Complex friction scenarios

**Advanced Friction Problems:**
- Rolling without slipping
- Friction on inclined planes
- Maximum angle before slipping
- Friction in circular motion

**Problem-Solving Strategy:**
1. **Systematic Approach**: Always draw FBDs first
2. **Constraint Analysis**: Identify all constraints clearly
3. **Component Resolution**: Break forces into components
4. **Equation Setup**: Write Newton's laws for each body
5. **Mathematical Solution**: Solve system of equations

**Practice Routine for IB Students:**
1. **Daily Problems**: 15 force problems daily
2. **Complexity Progression**: Start simple, increase difficulty
3. **Time Pressure**: Practice under time constraints
4. **Pattern Recognition**: Identify common problem types
5. **Formula Application**: Quick formula recall and application`,
            duration: 55,
            isCompleted: false,
            exercises: [
              {
                id: 'forces-bridge-1',
                question: 'A block of mass 5 kg is pulled by a force of 20 N at 30° above horizontal on a surface with μ = 0.3. Find acceleration. (g = 10 m/s²)',
                options: ['1.2 m/s²', '1.8 m/s²', '2.4 m/s²', '3.0 m/s²'],
                correctAnswer: 1,
                explanation: 'Horizontal: 20cos30° - μ(50-20sin30°) = 5a. Solving: 17.32 - 0.3×40 = 5a, so a = 1.8 m/s²',
                questionType: 'mcq',
                boardStyle: 'cbse'
              }
            ]
          }
        ]
      },
      {
        id: 'electromagnetism-bridge',
        title: 'Electromagnetism: IB to JEE Advanced Concepts',
        description: 'Transitioning from IB electromagnetic concepts to JEE mathematical rigor',
        isCompleted: false,
        lessons: [
          {
            id: 'electrostatics-intensive',
            title: 'Electrostatics: Mathematical Problem Solving',
            content: `Transforming IB electrostatics understanding into JEE computational mastery.

**IB Electrostatics Strengths:**
✓ Field line visualization and interpretation
✓ Conceptual understanding of electric fields
✓ Qualitative analysis of charge interactions
✓ Real-world applications understanding

**JEE Electrostatics Requirements:**
• Complex mathematical calculations
• Multiple charge configurations
• Gauss's law applications
• Potential and field relationships
• Capacitor networks and energy

**Key Transition Areas:**

1. **From Qualitative to Quantitative**

*IB Style:* "Describe how electric field varies with distance"
*JEE Style:* "Calculate electric field at point P due to charge configuration"

**Example Problem:**
Four charges +q, -q, +q, -q are placed at corners of a square of side 'a'. Find electric field at center.

**Solution Strategy:**
- Use superposition principle
- Calculate field due to each charge
- Consider symmetry to simplify calculation
- Result: E = 0 (due to symmetry)

2. **Gauss's Law Mastery**

*IB Level:* Conceptual understanding
*JEE Level:* Mathematical application for complex geometries

**Applications:**
- Infinite line charge: E = λ/(2πε₀r)
- Infinite plane sheet: E = σ/(2ε₀)
- Spherical charge distribution: E = Q/(4πε₀r²)
- Cylindrical symmetry problems

3. **Capacitor Networks**

*IB Approach:* Simple parallel plate capacitors
*JEE Approach:* Complex networks with series/parallel combinations

**Network Analysis:**
- Series: 1/C = 1/C₁ + 1/C₂ + 1/C₃
- Parallel: C = C₁ + C₂ + C₃
- Energy stored: U = ½CV² = ½QV = Q²/(2C)
- Energy density: u = ½ε₀E²

**Advanced Problem Types:**
1. **Multi-charge systems with symmetry**
2. **Electric field and potential calculations**
3. **Capacitor charging and discharging**
4. **Dielectric effects and applications**
5. **Energy and force calculations**

**Mathematical Tools Required:**
- Vector addition and subtraction
- Integration for continuous charge distributions
- Differential equations for varying fields
- Complex algebraic manipulations

**Practice Strategy:**
1. **Formula Memorization**: All electrostatic formulas
2. **Symmetry Recognition**: Identify symmetrical configurations
3. **Integration Practice**: Continuous charge distributions
4. **Network Analysis**: Complex capacitor circuits
5. **Speed Building**: Rapid calculation techniques`,
            duration: 60,
            isCompleted: false,
            exercises: [
              {
                id: 'electrostatics-bridge-1',
                question: 'Two point charges +4μC and -4μC are separated by 6cm. Find electric field at a point 4cm from +4μC charge along the line joining them.',
                options: ['4.5 × 10⁶ N/C', '6.75 × 10⁶ N/C', '9.0 × 10⁶ N/C', '13.5 × 10⁶ N/C'],
                correctAnswer: 3,
                explanation: 'E = k(4×10⁻⁶)/(0.04)² + k(4×10⁻⁶)/(0.02)² = 2.25×10⁶ + 9×10⁶ = 11.25×10⁶ N/C ≈ 13.5×10⁶ N/C',
                questionType: 'mcq',
                boardStyle: 'cbse'
              }
            ]
          }
        ]
      }
    ]
  },

  // Mathematics Bridge Course
  {
    id: 'ib-jee-math-bridge',
    title: 'IB to JEE Mathematics Bridge',
    description: 'Comprehensive mathematics bridge from IB Math AA/AI to JEE Main/Advanced level',
    subject: 'math',
    board: 'jee',
    grade: 'IB DP to JEE Transition',
    syllabus: 'IB-JEE Math Bridge 2025',
    difficulty: 'advanced',
    totalLessons: 70,
    completedLessons: 0,
    topics: [
      {
        id: 'ib-jee-math-gap-analysis',
        title: 'IB Math vs JEE Math: Complete Analysis',
        description: 'Understanding the fundamental differences and bridging the gap',
        isCompleted: false,
        lessons: [
          {
            id: 'math-curriculum-comparison',
            title: 'IB Math AA/AI vs JEE Mathematics Comparison',
            content: `Comprehensive analysis of mathematical differences and transition strategy.

**IB Mathematics Approach:**
• Conceptual understanding with technology support
• Real-world applications and modeling
• Internal Assessment and exploration projects
• Calculator-dependent problem solving
• Emphasis on mathematical communication

**JEE Mathematics Approach:**
• Pure mathematical rigor and speed
• Abstract problem solving without context
• Pattern recognition and formula manipulation
• Mental calculation and approximation skills
• Multiple choice format with time pressure

**Key Differences Analysis:**

1. **Calculation Methods**
   - IB: Calculator-based, focus on interpretation
   - JEE: Mental math, rapid calculations
   - **Gap**: Speed and accuracy in manual calculations

2. **Problem Complexity**
   - IB: Multi-step real-world problems
   - JEE: Abstract mathematical puzzles
   - **Gap**: Pattern recognition and trick identification

3. **Topics Coverage**
   - IB: Broader but less deep
   - JEE: Narrower but extremely deep
   - **Gap**: Advanced techniques in core topics

4. **Time Management**
   - IB: Extended time for thoughtful analysis
   - JEE: 1.5-2 minutes per question
   - **Gap**: Speed building and quick recognition

**Specific Topic Gaps:**

**Algebra:**
- IB: Basic algebraic manipulation
- JEE: Complex inequalities, functional equations
- **Bridge**: Advanced algebraic techniques

**Calculus:**
- IB: Applications and interpretations
- JEE: Pure mathematical calculations
- **Bridge**: Computational speed and accuracy

**Coordinate Geometry:**
- IB: Basic lines and circles
- JEE: Complex conic sections and loci
- **Bridge**: Advanced geometric problem solving

**Trigonometry:**
- IB: Basic trigonometric functions
- JEE: Complex identities and equations
- **Bridge**: Extensive identity memorization

**Transition Strategy:**
1. **Foundation Strengthening** (Months 1-3)
2. **Speed Building** (Months 4-6)
3. **Advanced Techniques** (Months 7-12)
4. **Mock Test Practice** (Months 13-18)`,
            duration: 40,
            isCompleted: false,
            exercises: [
              {
                id: 'math-gap-1',
                question: 'An IB student can solve a calculus problem in 15 minutes with a calculator. For JEE, the same type should be solved in:',
                options: ['5 minutes', '2 minutes', '1 minute', '30 seconds'],
                correctAnswer: 1,
                explanation: 'JEE Math has 30 questions in 65 minutes, allowing approximately 2 minutes per question including reading and verification time.',
                questionType: 'mcq',
                boardStyle: 'cbse'
              }
            ]
          },
          {
            id: 'mental-math-techniques',
            title: 'Mental Mathematics for JEE Success',
            content: `Developing rapid calculation skills essential for JEE mathematics.

**Why Mental Math Matters in JEE:**
• No calculator allowed in JEE Main/Advanced
• Time pressure requires instant calculations
• Complex problems need quick intermediate steps
• Approximation skills for elimination in MCQs

**Essential Mental Math Techniques:**

1. **Multiplication Shortcuts**

**Two-digit multiplication:**
- 23 × 47 = (20+3)(40+7) = 20×40 + 20×7 + 3×40 + 3×7 = 800 + 140 + 120 + 21 = 1081

**Squares near 50:**
- 47² = (50-3)² = 50² - 2×50×3 + 3² = 2500 - 300 + 9 = 2209

**Multiplication by 11:**
- 234 × 11 = 2(2+3)(3+4)4 = 2574

2. **Division Techniques**

**Division by 9:**
- Check: Sum of digits divisible by 9
- 234 ÷ 9: 2+3+4 = 9, so exactly divisible

**Fraction to Decimal:**
- 1/7 = 0.142857... (repeating)
- 1/11 = 0.090909... (repeating)
- 1/13 = 0.076923... (repeating)

3. **Percentage Calculations**

**Quick Percentage:**
- 15% of 240 = 10% + 5% = 24 + 12 = 36
- 37.5% = 3/8, so 37.5% of 80 = 30

4. **Square Root Approximations**

**Newton's Method:**
- √50 ≈ 7 (since 7² = 49)
- Better: √50 = √(49 + 1) ≈ 7 + 1/(2×7) = 7.07

5. **Trigonometric Values**

**Standard Angles (memorize exactly):**
- sin 30° = 1/2, cos 30° = √3/2
- sin 45° = cos 45° = 1/√2
- sin 60° = √3/2, cos 60° = 1/2

**Special Values:**
- sin 18° = (√5 - 1)/4
- cos 36° = (√5 + 1)/4

**Practice Routine:**
1. **Daily Drills**: 30 minutes mental math practice
2. **Speed Tests**: Timed calculation exercises
3. **Approximation**: Quick estimation techniques
4. **Pattern Recognition**: Common calculation patterns
5. **Verification**: Quick answer checking methods

**JEE-Specific Applications:**
- Quadratic formula calculations
- Trigonometric identity simplifications
- Coordinate geometry distance calculations
- Calculus derivative and integral evaluations`,
            duration: 45,
            isCompleted: false,
            exercises: [
              {
                id: 'mental-math-1',
                question: 'Calculate 47 × 53 mentally:',
                options: ['2391', '2491', '2591', '2691'],
                correctAnswer: 1,
                explanation: 'Using (50-3)(50+3) = 50² - 3² = 2500 - 9 = 2491',
                questionType: 'mcq',
                boardStyle: 'cbse'
              },
              {
                id: 'mental-math-2',
                question: 'What is 15% of 240?',
                options: ['32', '36', '40', '44'],
                correctAnswer: 1,
                explanation: '15% = 10% + 5% = 24 + 12 = 36',
                questionType: 'mcq',
                boardStyle: 'cbse'
              }
            ]
          }
        ]
      },
      {
        id: 'algebra-intensive',
        title: 'Advanced Algebra for JEE',
        description: 'Mastering complex algebraic techniques required for JEE success',
        isCompleted: false,
        lessons: [
          {
            id: 'complex-numbers-mastery',
            title: 'Complex Numbers: From IB Basics to JEE Mastery',
            content: `Elevating complex number understanding from IB level to JEE expertise.

**IB Complex Numbers Foundation:**
✓ Basic operations and geometric representation
✓ Polar form and De Moivre's theorem
✓ Simple applications in geometry
✓ Calculator-based computations

**JEE Complex Numbers Mastery:**
• Advanced algebraic manipulations
• Roots of unity and their properties
• Complex number geometry and loci
• Applications in coordinate geometry
• Polynomial equations with complex roots

**Advanced Concepts:**

1. **Roots of Unity**

**nth Roots of Unity:**
- ω = e^(2πi/n) = cos(2π/n) + i sin(2π/n)
- Properties: ωⁿ = 1, 1 + ω + ω² + ... + ωⁿ⁻¹ = 0

**Cube Roots of Unity:**
- ω = e^(2πi/3) = -1/2 + i√3/2
- ω² = e^(4πi/3) = -1/2 - i√3/2
- Properties: ω³ = 1, 1 + ω + ω² = 0, ω² = ω̄

**Applications:**
- Solving cubic equations
- Geometric problems involving rotation
- Simplifying complex expressions

2. **Complex Number Geometry**

**Locus Problems:**
- |z - a| = r represents circle with center a and radius r
- |z - a| = |z - b| represents perpendicular bisector of AB
- arg(z - a) = θ represents ray from point a

**Example:** Find locus of z if |z - 3i| + |z + 3i| = 10

**Solution:** This represents an ellipse with foci at ±3i and major axis 10

3. **Polynomial Applications**

**Vieta's Formulas with Complex Roots:**
For polynomial P(x) = xⁿ + a₁xⁿ⁻¹ + ... + aₙ with roots α₁, α₂, ..., αₙ:
- Sum of roots: α₁ + α₂ + ... + αₙ = -a₁
- Sum of products taken two at a time: Σαᵢαⱼ = a₂
- Product of all roots: α₁α₂...αₙ = (-1)ⁿaₙ

**Problem-Solving Strategies:**
1. **Algebraic Manipulation**: Master all complex operations
2. **Geometric Interpretation**: Visualize complex plane problems
3. **Pattern Recognition**: Identify standard forms and transformations
4. **Substitution Techniques**: Use appropriate substitutions
5. **Verification**: Check answers using properties

**Practice Focus Areas:**
- Modulus and argument calculations
- De Moivre's theorem applications
- Roots of unity problems
- Locus and geometric applications
- Polynomial equations with complex coefficients`,
            duration: 50,
            isCompleted: false,
            exercises: [
              {
                id: 'complex-bridge-1',
                question: 'If ω is a cube root of unity, then (1 + ω + ω²)³ equals:',
                options: ['0', '1', '3', '9'],
                correctAnswer: 0,
                explanation: 'Since 1 + ω + ω² = 0 for cube root of unity, (1 + ω + ω²)³ = 0³ = 0',
                questionType: 'mcq',
                boardStyle: 'cbse'
              }
            ]
          }
        ]
      }
    ]
  },

  // Chemistry Bridge Course
  {
    id: 'ib-jee-chemistry-bridge',
    title: 'IB to JEE Chemistry Bridge',
    description: 'Comprehensive chemistry bridge from IB Chemistry to JEE Main/Advanced preparation',
    subject: 'chemistry',
    board: 'jee',
    grade: 'IB DP to JEE Transition',
    syllabus: 'IB-JEE Chemistry Bridge 2025',
    difficulty: 'advanced',
    totalLessons: 60,
    completedLessons: 0,
    topics: [
      {
        id: 'ib-jee-chemistry-gap',
        title: 'IB Chemistry vs JEE Chemistry Analysis',
        description: 'Understanding the approach differences and knowledge gaps',
        isCompleted: false,
        lessons: [
          {
            id: 'chemistry-approach-comparison',
            title: 'IB vs JEE Chemistry: Fundamental Differences',
            content: `Analyzing the key differences between IB and JEE chemistry approaches.

**IB Chemistry Characteristics:**
• Conceptual understanding with real-world context
• Emphasis on experimental design and data analysis
• Internal Assessment laboratory work
• Environmental and industrial applications
• Qualitative analysis and explanation-based questions

**JEE Chemistry Characteristics:**
• Factual knowledge and rapid recall
• Mathematical calculations and numerical problems
• Extensive memorization of reactions and mechanisms
• Abstract theoretical concepts
• Multiple choice questions with time pressure

**Key Transition Areas:**

1. **Memorization vs Understanding**
   - IB: Understand concepts, look up specific facts
   - JEE: Memorize vast amounts of factual information
   - **Gap**: Extensive memorization required

2. **Mathematical Chemistry**
   - IB: Basic calculations with calculator support
   - JEE: Complex numerical problems without calculator
   - **Gap**: Mathematical problem-solving speed

3. **Organic Chemistry Depth**
   - IB: Basic mechanisms and functional groups
   - JEE: Extensive reaction mechanisms and synthesis
   - **Gap**: Advanced organic chemistry knowledge

4. **Inorganic Chemistry Scope**
   - IB: Selected topics with applications
   - JEE: Comprehensive periodic table knowledge
   - **Gap**: Detailed inorganic chemistry facts

**Specific Knowledge Gaps:**

**Physical Chemistry:**
- IB: Basic thermodynamics and kinetics
- JEE: Advanced mathematical treatment
- **Bridge**: Intensive numerical problem solving

**Organic Chemistry:**
- IB: Functional group chemistry
- JEE: Complex synthesis and mechanisms
- **Bridge**: Reaction mechanism mastery

**Inorganic Chemistry:**
- IB: Selected elements and compounds
- JEE: Complete periodic table properties
- **Bridge**: Systematic element study

**Preparation Strategy:**
1. **Fact Compilation**: Create comprehensive fact sheets
2. **Reaction Banks**: Memorize all important reactions
3. **Numerical Practice**: Daily calculation problems
4. **Pattern Recognition**: Identify question patterns
5. **Speed Building**: Timed practice sessions`,
            duration: 35,
            isCompleted: false,
            exercises: [
              {
                id: 'chem-gap-1',
                question: 'In JEE Chemistry, approximately how many chemical reactions should a student memorize?',
                options: ['100-200', '300-500', '600-800', '1000+'],
                correctAnswer: 3,
                explanation: 'JEE Chemistry requires memorization of 1000+ reactions across organic, inorganic, and physical chemistry for comprehensive preparation.',
                questionType: 'mcq',
                boardStyle: 'cbse'
              }
            ]
          },
          {
            id: 'memorization-techniques',
            title: 'Effective Memorization Techniques for JEE Chemistry',
            content: `Developing systematic memorization strategies for JEE Chemistry success.

**Why Memorization is Critical in JEE Chemistry:**
• 40-50% questions are fact-based
• Rapid recall needed for time management
• Foundation for understanding complex concepts
• Essential for elimination in MCQs

**Systematic Memorization Strategies:**

1. **Periodic Table Mastery**

**Complete Memorization Required:**
- Atomic numbers 1-118
- Electronic configurations
- Atomic and ionic radii trends
- Ionization energies and electron affinities
- Electronegativity values
- Oxidation states
- Common compounds and their properties

**Memory Techniques:**
- Group-wise study (alkali metals, halogens, etc.)
- Trend-based learning (across periods and groups)
- Exception memorization (Cr, Cu configurations)
- Visual association (color of compounds)

2. **Reaction Memorization**

**Organic Reactions (300+ reactions):**
- Functional group transformations
- Name reactions (Friedel-Crafts, Grignard, etc.)
- Mechanism-based grouping
- Reagent-specific reactions

**Inorganic Reactions (400+ reactions):**
- Acid-base reactions
- Redox reactions
- Precipitation reactions
- Complex formation reactions

**Memory Aids:**
- Reaction trees and flowcharts
- Mnemonic devices for reagents
- Pattern-based grouping
- Regular revision cycles

3. **Formula and Constant Memorization**

**Physical Chemistry Formulas:**
- Thermodynamics: ΔG = ΔH - TΔS
- Kinetics: Rate = k[A]^m[B]^n
- Electrochemistry: E = E° - (RT/nF)ln Q
- Solutions: π = iMRT

**Important Constants:**
- R = 8.314 J mol⁻¹ K⁻¹
- F = 96485 C mol⁻¹
- NA = 6.022 × 10²³ mol⁻¹
- h = 6.626 × 10⁻³⁴ J s

4. **Systematic Study Schedule**

**Daily Routine:**
- Morning: New facts (30 minutes)
- Afternoon: Reaction practice (45 minutes)
- Evening: Previous day revision (30 minutes)
- Night: Weekly review (15 minutes)

**Weekly Cycle:**
- Monday: Periodic table properties
- Tuesday: Organic reactions
- Wednesday: Inorganic reactions
- Thursday: Physical chemistry formulas
- Friday: Numerical problems
- Saturday: Mixed practice
- Sunday: Complete revision

**Memory Retention Techniques:**
1. **Spaced Repetition**: Review at increasing intervals
2. **Active Recall**: Test yourself without looking
3. **Visual Association**: Create mental images
4. **Story Method**: Link facts in narrative form
5. **Acronyms**: Create memorable abbreviations

**Technology Aids:**
- Flashcard apps for quick review
- Reaction mechanism animations
- Periodic table interactive tools
- Formula derivation videos
- Practice test platforms`,
            duration: 40,
            isCompleted: false,
            exercises: [
              {
                id: 'memorization-1',
                question: 'Which memory technique is most effective for learning organic reaction mechanisms?',
                options: ['Rote repetition', 'Visual flowcharts', 'Audio recordings', 'Written notes only'],
                correctAnswer: 1,
                explanation: 'Visual flowcharts help understand reaction pathways, intermediates, and conditions, making memorization more effective and long-lasting.',
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

// Study plans and strategies specific to IB-JEE transition
export const ibToJeeTransitionStrategy = {
  overview: {
    title: 'IB to JEE Transition Strategy',
    description: 'Comprehensive 18-month program to bridge IB and JEE preparation',
    duration: '18 months',
    phases: [
      {
        name: 'Foundation Phase',
        duration: '3 months',
        focus: 'Gap analysis and basic skill building',
        goals: ['Identify knowledge gaps', 'Build mathematical foundation', 'Adapt to JEE format']
      },
      {
        name: 'Intensive Phase',
        duration: '9 months',
        focus: 'Comprehensive JEE preparation',
        goals: ['Master all JEE topics', 'Develop problem-solving speed', 'Build extensive knowledge base']
      },
      {
        name: 'Mastery Phase',
        duration: '6 months',
        focus: 'Advanced preparation and mock tests',
        goals: ['Perfect exam strategy', 'Achieve target scores', 'Build confidence']
      }
    ]
  },
  
  subjectSpecificStrategies: {
    physics: {
      challenges: [
        'Mathematical intensity gap',
        'Problem-solving speed requirement',
        'Formula memorization need',
        'MCQ format adaptation'
      ],
      solutions: [
        'Daily mathematical problem solving',
        'Timed practice sessions',
        'Comprehensive formula sheets',
        'MCQ technique training'
      ],
      timeline: {
        'Months 1-3': 'Mathematical foundation and basic problem solving',
        'Months 4-9': 'Advanced topics and speed building',
        'Months 10-15': 'Mock tests and strategy refinement',
        'Months 16-18': 'Final preparation and confidence building'
      }
    },
    
    mathematics: {
      challenges: [
        'Calculator dependency',
        'Mental math weakness',
        'Advanced technique gaps',
        'Speed and accuracy balance'
      ],
      solutions: [
        'Mental math training program',
        'Advanced technique mastery',
        'Speed building exercises',
        'Accuracy improvement drills'
      ],
      timeline: {
        'Months 1-3': 'Mental math and basic techniques',
        'Months 4-9': 'Advanced topics and pattern recognition',
        'Months 10-15': 'Speed optimization and mock tests',
        'Months 16-18': 'Strategy perfection and final preparation'
      }
    },
    
    chemistry: {
      challenges: [
        'Extensive memorization requirement',
        'Factual knowledge gaps',
        'Reaction mechanism complexity',
        'Numerical problem solving'
      ],
      solutions: [
        'Systematic memorization program',
        'Comprehensive fact compilation',
        'Mechanism-based learning',
        'Regular numerical practice'
      ],
      timeline: {
        'Months 1-3': 'Basic facts and fundamental concepts',
        'Months 4-9': 'Comprehensive memorization and practice',
        'Months 10-15': 'Advanced topics and integration',
        'Months 16-18': 'Revision and strategy optimization'
      }
    }
  },
  
  dailySchedule: {
    phase1: {
      physics: '2 hours (foundation building)',
      mathematics: '2.5 hours (mental math focus)',
      chemistry: '2 hours (basic memorization)',
      revision: '1 hour (previous day review)',
      assessment: '0.5 hours (daily quiz)'
    },
    phase2: {
      physics: '3 hours (advanced problem solving)',
      mathematics: '3 hours (speed and accuracy)',
      chemistry: '2.5 hours (comprehensive study)',
      revision: '1.5 hours (weekly review)',
      mockTests: '3 hours (alternate days)'
    },
    phase3: {
      physics: '2.5 hours (strategy refinement)',
      mathematics: '2.5 hours (perfection focus)',
      chemistry: '2 hours (final revision)',
      mockTests: '3 hours (daily)',
      analysis: '2 hours (performance review)'
    }
  },
  
  assessmentStrategy: {
    diagnosticTests: [
      'Initial gap analysis test',
      'Subject-wise foundation tests',
      'Speed and accuracy assessments',
      'Conceptual understanding evaluation'
    ],
    progressTracking: [
      'Weekly subject tests',
      'Monthly comprehensive tests',
      'Quarterly mock JEE exams',
      'Continuous performance analytics'
    ],
    finalPreparation: [
      'Daily full-length mock tests',
      'Subject-wise intensive tests',
      'Time management assessments',
      'Strategy optimization sessions'
    ]
  }
};

// Resources and materials for IB-JEE transition
export const ibToJeeResources = {
  books: {
    physics: [
      'HC Verma - Concepts of Physics (Both Volumes)',
      'DC Pandey - Understanding Physics Series',
      'Resnick Halliday Krane - Physics (Reference)',
      'Previous Year JEE Questions - Physics'
    ],
    mathematics: [
      'RD Sharma - Mathematics for JEE',
      'Cengage Learning - Mathematics for JEE',
      'Arihant - Skills in Mathematics',
      'Previous Year JEE Questions - Mathematics'
    ],
    chemistry: [
      'NCERT Chemistry (Class 11 & 12)',
      'OP Tandon - Physical Chemistry',
      'Morrison Boyd - Organic Chemistry',
      'JD Lee - Concise Inorganic Chemistry'
    ]
  },
  
  onlineResources: [
    'CampusPandit IB-JEE Bridge Course',
    'Khan Academy - JEE Preparation',
    'Unacademy - JEE Course',
    'Vedantu - IB to JEE Transition'
  ],
  
  practiceTests: [
    'JEE Main Previous Year Papers (2019-2024)',
    'JEE Advanced Previous Year Papers',
    'Mock Test Series - Multiple Providers',
    'Subject-wise Test Series'
  ]
};

export default ibToJeeBridgeCourses;