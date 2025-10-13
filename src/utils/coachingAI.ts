import { supabase } from './supabase';

// =====================================================
// TYPES
// =====================================================

export interface WeakArea {
  id: string;
  student_id: string;
  subject: 'physics' | 'mathematics' | 'chemistry' | 'biology' | 'computer_science' | 'english' | 'other';
  topic: string;
  subtopic?: string;
  chapter_id?: string;
  resource_id?: string;
  weakness_severity: 'low' | 'medium' | 'high' | 'critical';
  priority: number;
  identified_from: 'flashcard_accuracy' | 'tutor_session' | 'mock_test' | 'chapter_progress' | 'self_assessment' | 'ai_analysis';
  identification_reason?: string;
  current_accuracy_percentage?: number;
  attempts_count: number;
  failures_count: number;
  status: 'active' | 'improving' | 'resolved' | 'ignored';
  times_repeated: number;
  target_repetitions: number;
  initial_accuracy?: number;
  current_improvement_percentage?: number;
  target_accuracy_percentage: number;
  next_review_date?: string;
  ai_recommendations?: string[];
  tutor_notes?: string;
  student_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CoachingSession {
  id: string;
  student_id: string;
  session_type: 'daily' | 'weekly' | 'emergency' | 'milestone' | 'exam_prep';
  session_focus: string[];
  weak_areas_identified: number;
  weak_areas_improving: number;
  weak_areas_resolved: number;
  new_weak_areas_found: number;
  overall_accuracy?: number;
  study_hours_this_week?: number;
  topics_studied_count?: number;
  flashcards_reviewed?: number;
  problems_solved?: number;
  recommendations?: any;
  priority_actions?: string[];
  suggested_study_plan?: string;
  motivational_message?: string;
  student_viewed: boolean;
  created_at: string;
}

export interface RepetitionSchedule {
  id: string;
  student_id: string;
  weak_area_id: string;
  repetition_number: number;
  scheduled_date: string;
  scheduled_time_slot?: string;
  content_type: 'flashcards' | 'problems' | 'theory' | 'video' | 'tutor_session' | 'mixed';
  flashcard_set_id?: string;
  problems_to_solve?: string[];
  chapters_to_review?: string[];
  estimated_duration_minutes?: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'skipped' | 'rescheduled';
  completed_at?: string;
  accuracy_achieved?: number;
  problems_attempted?: number;
  problems_solved?: number;
  notes?: string;
  created_at: string;
}

export interface PerformanceAnalytics {
  id: string;
  student_id: string;
  analysis_date: string;
  period_type: 'daily' | 'weekly' | 'monthly' | 'all_time';
  period_start: string;
  period_end: string;
  total_study_hours?: number;
  total_flashcards_reviewed?: number;
  total_problems_solved?: number;
  total_tutor_sessions?: number;
  average_session_rating?: number;
  physics_accuracy?: number;
  mathematics_accuracy?: number;
  chemistry_accuracy?: number;
  biology_accuracy?: number;
  active_weak_areas?: number;
  resolved_weak_areas_this_period?: number;
  new_weak_areas_this_period?: number;
  overall_improvement_percentage?: number;
  study_consistency_score?: number;
  target_achievement_percentage?: number;
  strongest_topics?: string[];
  weakest_topics?: string[];
  most_improved_topics?: string[];
  needs_attention_topics?: string[];
  study_streak_days?: number;
  predicted_exam_readiness?: number;
  estimated_weeks_to_target?: number;
  ai_insights?: any;
  created_at: string;
}

export interface CoachingRecommendation {
  id: string;
  student_id: string;
  coaching_session_id?: string;
  recommendation_type: 'study_plan' | 'resource' | 'tutor_session' | 'practice' | 'revision' | 'break' | 'motivation';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  rationale?: string;
  subject?: string;
  topics?: string[];
  weak_area_id?: string;
  action_steps?: string[];
  estimated_time_hours?: number;
  suggested_deadline?: string;
  recommended_resources?: any;
  tutor_required: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
  completion_percentage: number;
  was_helpful?: boolean;
  student_rating?: number;
  created_at: string;
}

// =====================================================
// WEAK AREA IDENTIFICATION
// =====================================================

/**
 * Analyzes flashcard performance to identify weak areas
 */
export async function identifyWeakAreasFromFlashcards(studentId: string) {
  try {
    // Get flashcard sets with low accuracy
    const { data: flashcardData, error } = await supabase
      .from('flashcards')
      .select(`
        *,
        flashcard_sets!inner(subject, title)
      `)
      .eq('flashcard_sets.student_id', studentId)
      .lt('accuracy_percentage', 70)
      .order('accuracy_percentage', { ascending: true });

    if (error) throw error;

    // Group by subject and topic
    const weakAreas: Map<string, any> = new Map();

    flashcardData?.forEach((card: any) => {
      const key = `${card.flashcard_sets.subject}-${card.topic || 'general'}`;

      if (!weakAreas.has(key)) {
        weakAreas.set(key, {
          subject: card.flashcard_sets.subject,
          topic: card.topic || card.flashcard_sets.title,
          cards: [],
          totalAccuracy: 0,
          totalAttempts: 0,
          totalFailures: 0
        });
      }

      const area = weakAreas.get(key);
      area.cards.push(card);
      area.totalAccuracy += card.accuracy_percentage || 0;
      area.totalAttempts += card.times_reviewed || 0;
      area.totalFailures += Math.round((card.times_reviewed * (100 - (card.accuracy_percentage || 0))) / 100);
    });

    // Create or update weak areas
    const weakAreasToUpsert = Array.from(weakAreas.values()).map(area => {
      const avgAccuracy = area.totalAccuracy / area.cards.length;
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';

      if (avgAccuracy < 50) severity = 'critical';
      else if (avgAccuracy < 60) severity = 'high';
      else if (avgAccuracy < 70) severity = 'medium';
      else severity = 'low';

      return {
        student_id: studentId,
        subject: area.subject,
        topic: area.topic,
        weakness_severity: severity,
        priority: severity === 'critical' ? 1 : severity === 'high' ? 2 : 3,
        identified_from: 'flashcard_accuracy',
        identification_reason: `Low flashcard accuracy (${avgAccuracy.toFixed(1)}%) across ${area.cards.length} cards`,
        current_accuracy_percentage: avgAccuracy,
        initial_accuracy: avgAccuracy,
        attempts_count: area.totalAttempts,
        failures_count: area.totalFailures,
        target_accuracy_percentage: 85,
        ai_recommendations: [
          'Review flashcards daily with spaced repetition',
          'Focus on understanding concepts, not memorization',
          'Create additional flashcards for this topic',
          'Consider booking a tutor session for clarification'
        ]
      };
    });

    if (weakAreasToUpsert.length > 0) {
      const { data, error: upsertError } = await supabase
        .from('student_weak_areas')
        .upsert(weakAreasToUpsert, {
          onConflict: 'student_id,subject,topic,subtopic',
          ignoreDuplicates: false
        })
        .select();

      if (upsertError) throw upsertError;
      return data;
    }

    return [];
  } catch (error) {
    console.error('Error identifying weak areas from flashcards:', error);
    throw error;
  }
}

/**
 * Analyzes chapter progress to identify weak areas
 */
export async function identifyWeakAreasFromChapters(studentId: string) {
  try {
    const { data, error } = await supabase
      .from('student_chapter_progress')
      .select(`
        *,
        resource_chapters!inner(title, topics_covered, google_learn_module_id),
        learning_resources!inner(subject, title)
      `)
      .eq('student_id', studentId)
      .or('self_assessed_understanding.lte.2,confidence_level.eq.low')
      .eq('needs_tutor_help', true);

    if (error) throw error;

    const weakAreasToUpsert = data?.map((chapter: any) => ({
      student_id: studentId,
      subject: chapter.learning_resources.subject,
      topic: chapter.resource_chapters.title,
      chapter_id: chapter.chapter_id,
      resource_id: chapter.resource_id,
      weakness_severity: chapter.self_assessed_understanding === 1 ? 'critical' : 'high',
      priority: chapter.needs_tutor_help ? 1 : 2,
      identified_from: 'chapter_progress',
      identification_reason: `Self-assessed understanding: ${chapter.self_assessed_understanding}/5, Confidence: ${chapter.confidence_level}`,
      attempts_count: 1,
      failures_count: chapter.self_assessed_understanding <= 2 ? 1 : 0,
      target_accuracy_percentage: 85,
      ai_recommendations: [
        'Re-read the chapter from the textbook',
        'Complete Google Learn Your Way module if available',
        'Work through all examples step-by-step',
        'Book a tutor session for personalized help',
        'Review your notes and create flashcards'
      ]
    })) || [];

    if (weakAreasToUpsert.length > 0) {
      const { data: upsertedData, error: upsertError } = await supabase
        .from('student_weak_areas')
        .upsert(weakAreasToUpsert, {
          onConflict: 'student_id,subject,topic,subtopic',
          ignoreDuplicates: false
        })
        .select();

      if (upsertError) throw upsertError;
      return upsertedData;
    }

    return [];
  } catch (error) {
    console.error('Error identifying weak areas from chapters:', error);
    throw error;
  }
}

/**
 * Comprehensive analysis that identifies weak areas from all sources
 */
export async function performComprehensiveWeakAreaAnalysis(studentId: string) {
  try {
    const results = await Promise.allSettled([
      identifyWeakAreasFromFlashcards(studentId),
      identifyWeakAreasFromChapters(studentId)
    ]);

    const allWeakAreas: WeakArea[] = [];

    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        allWeakAreas.push(...result.value);
      }
    });

    return allWeakAreas;
  } catch (error) {
    console.error('Error performing comprehensive weak area analysis:', error);
    throw error;
  }
}

// =====================================================
// REPETITION SCHEDULING
// =====================================================

/**
 * Creates a repetition schedule for a weak area
 */
export async function scheduleRepetitions(weakAreaId: string, studentId: string) {
  try {
    // Get weak area details
    const { data: weakArea, error: weakAreaError } = await supabase
      .from('student_weak_areas')
      .select('*, ai_coaching_config!inner(*)')
      .eq('id', weakAreaId)
      .single();

    if (weakAreaError) throw weakAreaError;

    // Get student config or use defaults
    let config = weakArea.ai_coaching_config?.[0];
    if (!config) {
      config = {
        default_repetition_count: 5,
        days_between_repetitions: 3
      };
    }

    const repetitionCount = weakArea.target_repetitions || config.default_repetition_count;
    const daysBetween = config.days_between_repetitions;

    // Create repetition schedules
    const schedules = [];
    for (let i = 0; i < repetitionCount; i++) {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + (daysBetween * (i + 1)));

      schedules.push({
        student_id: studentId,
        weak_area_id: weakAreaId,
        repetition_number: i + 1,
        scheduled_date: scheduledDate.toISOString().split('T')[0],
        content_type: i < 2 ? 'flashcards' : i < 4 ? 'problems' : 'mixed',
        estimated_duration_minutes: 30 + (i * 10),
        status: 'scheduled'
      });
    }

    const { data, error } = await supabase
      .from('repetition_schedule')
      .insert(schedules)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error scheduling repetitions:', error);
    throw error;
  }
}

/**
 * Gets upcoming repetitions for a student
 */
export async function getUpcomingRepetitions(studentId: string, days: number = 7) {
  try {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const { data, error } = await supabase
      .from('repetition_schedule')
      .select(`
        *,
        student_weak_areas!inner(subject, topic, subtopic, current_accuracy_percentage)
      `)
      .eq('student_id', studentId)
      .eq('status', 'scheduled')
      .gte('scheduled_date', new Date().toISOString().split('T')[0])
      .lte('scheduled_date', futureDate.toISOString().split('T')[0])
      .order('scheduled_date', { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting upcoming repetitions:', error);
    throw error;
  }
}

/**
 * Completes a repetition and updates weak area
 */
export async function completeRepetition(
  repetitionId: string,
  accuracyAchieved: number,
  problemsAttempted: number,
  problemsSolved: number,
  notes?: string
) {
  try {
    // Update repetition schedule
    const { data: repetition, error: updateError } = await supabase
      .from('repetition_schedule')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        accuracy_achieved: accuracyAchieved,
        problems_attempted: problemsAttempted,
        problems_solved: problemsSolved,
        notes: notes
      })
      .eq('id', repetitionId)
      .select('weak_area_id, student_id')
      .single();

    if (updateError) throw updateError;

    // Update weak area
    const { data: weakArea, error: weakAreaError } = await supabase
      .from('student_weak_areas')
      .select('*')
      .eq('id', repetition.weak_area_id)
      .single();

    if (weakAreaError) throw weakAreaError;

    const { error: updateWeakAreaError } = await supabase
      .from('student_weak_areas')
      .update({
        times_repeated: weakArea.times_repeated + 1,
        current_accuracy_percentage: accuracyAchieved,
        last_attempted_at: new Date().toISOString(),
        attempts_count: weakArea.attempts_count + problemsAttempted,
        failures_count: weakArea.failures_count + (problemsAttempted - problemsSolved)
      })
      .eq('id', repetition.weak_area_id);

    if (updateWeakAreaError) throw updateWeakAreaError;

    // Check if milestone reached
    if (accuracyAchieved >= weakArea.target_accuracy_percentage) {
      await createImprovementMilestone(
        repetition.student_id,
        repetition.weak_area_id,
        'target_reached',
        'Target Accuracy Reached!',
        `You've achieved ${accuracyAchieved}% accuracy in ${weakArea.topic}. Keep up the great work!`,
        'accuracy',
        weakArea.initial_accuracy || 0,
        accuracyAchieved
      );
    }

    return repetition;
  } catch (error) {
    console.error('Error completing repetition:', error);
    throw error;
  }
}

// =====================================================
// PERFORMANCE ANALYTICS
// =====================================================

/**
 * Generates weekly performance analytics
 */
export async function generateWeeklyAnalytics(studentId: string) {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    // Get study sessions
    const { data: sessions } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('student_id', studentId)
      .gte('started_at', startDate.toISOString())
      .lte('started_at', endDate.toISOString());

    // Get flashcard reviews
    const { data: flashcardReviews } = await supabase
      .from('flashcard_reviews')
      .select('*, flashcards!inner(*, flashcard_sets!inner(subject))')
      .eq('flashcards.flashcard_sets.student_id', studentId)
      .gte('reviewed_at', startDate.toISOString())
      .lte('reviewed_at', endDate.toISOString());

    // Get tutor sessions
    const { data: tutorSessions } = await supabase
      .from('tutoring_sessions')
      .select('*, session_reviews(*)')
      .eq('student_id', studentId)
      .gte('scheduled_start', startDate.toISOString())
      .lte('scheduled_start', endDate.toISOString());

    // Get weak areas
    const { data: weakAreas } = await supabase
      .from('student_weak_areas')
      .select('*')
      .eq('student_id', studentId);

    // Calculate metrics
    const totalStudyHours = sessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / 60 || 0;
    const totalFlashcardsReviewed = flashcardReviews?.length || 0;
    const totalProblems = sessions?.reduce((sum, s) => sum + (s.problems_solved || 0), 0) || 0;
    const totalTutorSessions = tutorSessions?.length || 0;
    const avgRating = tutorSessions?.reduce((sum, s) => sum + (s.session_reviews?.[0]?.rating || 0), 0) / (totalTutorSessions || 1);

    // Subject-wise accuracy
    const subjectAccuracy: any = {};
    flashcardReviews?.forEach((review: any) => {
      const subject = review.flashcards.flashcard_sets.subject;
      if (!subjectAccuracy[subject]) {
        subjectAccuracy[subject] = { correct: 0, total: 0 };
      }
      subjectAccuracy[subject].total++;
      if (review.was_correct) subjectAccuracy[subject].correct++;
    });

    // Count study days
    const uniqueDays = new Set(sessions?.map(s => s.started_at.split('T')[0]));
    const daysStudied = uniqueDays.size;

    // Weak areas analysis
    const activeWeakAreas = weakAreas?.filter(w => w.status === 'active').length || 0;
    const resolvedThisWeek = weakAreas?.filter(w =>
      w.status === 'resolved' &&
      w.resolved_at &&
      new Date(w.resolved_at) >= startDate
    ).length || 0;

    const analytics: Partial<PerformanceAnalytics> = {
      student_id: studentId,
      analysis_date: endDate.toISOString().split('T')[0],
      period_type: 'weekly',
      period_start: startDate.toISOString().split('T')[0],
      period_end: endDate.toISOString().split('T')[0],
      total_study_hours: totalStudyHours,
      total_flashcards_reviewed: totalFlashcardsReviewed,
      total_problems_solved: totalProblems,
      total_tutor_sessions: totalTutorSessions,
      average_session_rating: avgRating,
      physics_accuracy: subjectAccuracy.physics ? (subjectAccuracy.physics.correct / subjectAccuracy.physics.total) * 100 : 0,
      mathematics_accuracy: subjectAccuracy.mathematics ? (subjectAccuracy.mathematics.correct / subjectAccuracy.mathematics.total) * 100 : 0,
      chemistry_accuracy: subjectAccuracy.chemistry ? (subjectAccuracy.chemistry.correct / subjectAccuracy.chemistry.total) * 100 : 0,
      active_weak_areas: activeWeakAreas,
      resolved_weak_areas_this_period: resolvedThisWeek,
      study_streak_days: daysStudied,
      days_studied_this_period: daysStudied,
      study_consistency_score: (daysStudied / 7) * 100
    };

    // Insert analytics
    const { data, error } = await supabase
      .from('student_performance_analytics')
      .upsert(analytics, {
        onConflict: 'student_id,analysis_date,period_type'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error generating weekly analytics:', error);
    throw error;
  }
}

// =====================================================
// COACHING SESSIONS
// =====================================================

/**
 * Generates a daily coaching session with recommendations
 */
export async function generateDailyCoachingSession(studentId: string) {
  try {
    // Generate latest analytics
    const analytics = await generateWeeklyAnalytics(studentId);

    // Get weak areas
    const { data: weakAreas } = await supabase
      .from('student_weak_areas')
      .select('*')
      .eq('student_id', studentId)
      .order('priority', { ascending: true })
      .limit(10);

    // Count weak area statuses
    const activeAreas = weakAreas?.filter(w => w.status === 'active').length || 0;
    const improvingAreas = weakAreas?.filter(w => w.status === 'improving').length || 0;
    const resolvedToday = weakAreas?.filter(w =>
      w.status === 'resolved' &&
      w.resolved_at &&
      new Date(w.resolved_at).toDateString() === new Date().toDateString()
    ).length || 0;

    // Generate recommendations
    const priorityActions: string[] = [];
    const recommendations: any = {
      high_priority_weak_areas: [],
      practice_today: [],
      revision_needed: [],
      tutor_session_suggested: []
    };

    weakAreas?.slice(0, 3).forEach(area => {
      if (area.priority <= 2) {
        priorityActions.push(`Focus on ${area.topic} in ${area.subject} - Current accuracy: ${area.current_accuracy_percentage?.toFixed(1)}%`);
        recommendations.high_priority_weak_areas.push({
          subject: area.subject,
          topic: area.topic,
          reason: area.identification_reason,
          action: 'Complete scheduled repetition and review flashcards'
        });
      }
    });

    // Generate motivational message
    let motivationalMessage = '';
    if (analytics.study_streak_days && analytics.study_streak_days > 3) {
      motivationalMessage = `🔥 Amazing ${analytics.study_streak_days}-day study streak! You're building excellent habits. `;
    }
    if (resolvedToday > 0) {
      motivationalMessage += `🎉 You resolved ${resolvedToday} weak area(s) today! Keep pushing forward!`;
    } else if (improvingAreas > 0) {
      motivationalMessage += `📈 You're improving in ${improvingAreas} area(s). Consistency is key!`;
    } else {
      motivationalMessage += `💪 Every study session brings you closer to your goals. Let's make today count!`;
    }

    // Create coaching session
    const session: Partial<CoachingSession> = {
      student_id: studentId,
      session_type: 'daily',
      session_focus: ['weak_area_review', 'progress_check', 'motivation'],
      weak_areas_identified: activeAreas,
      weak_areas_improving: improvingAreas,
      weak_areas_resolved: resolvedToday,
      overall_accuracy: analytics.physics_accuracy || 0,
      study_hours_this_week: analytics.total_study_hours,
      topics_studied_count: analytics.total_problems_solved,
      flashcards_reviewed: analytics.total_flashcards_reviewed,
      recommendations: recommendations,
      priority_actions: priorityActions,
      motivational_message: motivationalMessage,
      student_viewed: false,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    const { data, error } = await supabase
      .from('ai_coaching_sessions')
      .insert(session)
      .select()
      .single();

    if (error) throw error;

    // Generate specific recommendations
    await generateRecommendationsFromSession(data.id, studentId, weakAreas || []);

    return data;
  } catch (error) {
    console.error('Error generating daily coaching session:', error);
    throw error;
  }
}

/**
 * Generates specific recommendations from a coaching session
 */
async function generateRecommendationsFromSession(
  sessionId: string,
  studentId: string,
  weakAreas: WeakArea[]
) {
  try {
    const recommendations: Partial<CoachingRecommendation>[] = [];

    // For each critical/high priority weak area, create a recommendation
    weakAreas.filter(w => w.priority <= 2 && w.status !== 'resolved').forEach(area => {
      recommendations.push({
        student_id: studentId,
        coaching_session_id: sessionId,
        recommendation_type: 'practice',
        priority: area.weakness_severity === 'critical' ? 'urgent' : 'high',
        title: `Master ${area.topic} in ${area.subject}`,
        description: `This topic needs focused attention. Your current accuracy is ${area.current_accuracy_percentage?.toFixed(1)}%. Let's improve it to ${area.target_accuracy_percentage}%.`,
        rationale: area.identification_reason,
        subject: area.subject,
        topics: [area.topic],
        weak_area_id: area.id,
        action_steps: area.ai_recommendations || [
          'Review related flashcards daily',
          'Solve practice problems',
          'Watch explanation videos',
          'Discuss with tutor if needed'
        ],
        estimated_time_hours: 2,
        tutor_required: area.weakness_severity === 'critical',
        status: 'pending',
        completion_percentage: 0
      });
    });

    // Add study plan recommendation if needed
    if (weakAreas.filter(w => w.status === 'active').length > 5) {
      recommendations.push({
        student_id: studentId,
        coaching_session_id: sessionId,
        recommendation_type: 'study_plan',
        priority: 'high',
        title: 'Structured Study Plan Needed',
        description: `You have ${weakAreas.length} active weak areas. Let's create a structured plan to tackle them systematically.`,
        rationale: 'Too many weak areas to handle simultaneously',
        action_steps: [
          'Prioritize top 3 weak areas',
          'Allocate 1 hour daily for weak area practice',
          'Track progress weekly',
          'Adjust plan based on improvements'
        ],
        estimated_time_hours: 1,
        tutor_required: false,
        status: 'pending',
        completion_percentage: 0
      });
    }

    if (recommendations.length > 0) {
      const { error } = await supabase
        .from('coaching_recommendations')
        .insert(recommendations);

      if (error) throw error;
    }
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw error;
  }
}

// =====================================================
// IMPROVEMENT TRACKING
// =====================================================

/**
 * Creates an improvement milestone
 */
export async function createImprovementMilestone(
  studentId: string,
  weakAreaId: string,
  milestoneType: 'first_improvement' | 'consistency' | 'target_reached' | 'mastery' | 'streak',
  title: string,
  description: string,
  metricName: string,
  previousValue: number,
  currentValue: number
) {
  try {
    const improvementPercentage = previousValue > 0
      ? ((currentValue - previousValue) / previousValue) * 100
      : 0;

    const milestone = {
      student_id: studentId,
      weak_area_id: weakAreaId,
      milestone_type: milestoneType,
      title: title,
      description: description,
      metric_name: metricName,
      previous_value: previousValue,
      current_value: currentValue,
      improvement_percentage: improvementPercentage,
      celebration_message: description,
      points_awarded: milestoneType === 'mastery' ? 100 : milestoneType === 'target_reached' ? 50 : 25,
      is_public: false,
      shared_with_tutor: true
    };

    const { data, error } = await supabase
      .from('improvement_milestones')
      .insert(milestone)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating improvement milestone:', error);
    throw error;
  }
}

// =====================================================
// QUERY FUNCTIONS
// =====================================================

/**
 * Gets all weak areas for a student
 */
export async function getWeakAreas(studentId: string, status?: string) {
  try {
    let query = supabase
      .from('student_weak_areas')
      .select('*')
      .eq('student_id', studentId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('priority', { ascending: true });

    if (error) throw error;
    return data as WeakArea[];
  } catch (error) {
    console.error('Error getting weak areas:', error);
    throw error;
  }
}

/**
 * Gets coaching sessions for a student
 */
export async function getCoachingSessions(studentId: string, limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from('ai_coaching_sessions')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as CoachingSession[];
  } catch (error) {
    console.error('Error getting coaching sessions:', error);
    throw error;
  }
}

/**
 * Gets recommendations for a student
 */
export async function getRecommendations(studentId: string, status?: string) {
  try {
    let query = supabase
      .from('coaching_recommendations')
      .select('*, student_weak_areas(subject, topic)')
      .eq('student_id', studentId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('priority', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting recommendations:', error);
    throw error;
  }
}

/**
 * Gets latest performance analytics
 */
export async function getLatestAnalytics(studentId: string, periodType: string = 'weekly') {
  try {
    const { data, error } = await supabase
      .from('student_performance_analytics')
      .select('*')
      .eq('student_id', studentId)
      .eq('period_type', periodType)
      .order('analysis_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as PerformanceAnalytics | null;
  } catch (error) {
    console.error('Error getting latest analytics:', error);
    return null; // Return null instead of throwing for empty data
  }
}

/**
 * Updates weak area manually
 */
export async function updateWeakArea(weakAreaId: string, updates: Partial<WeakArea>) {
  try {
    const { data, error } = await supabase
      .from('student_weak_areas')
      .update(updates)
      .eq('id', weakAreaId)
      .select()
      .single();

    if (error) throw error;
    return data as WeakArea;
  } catch (error) {
    console.error('Error updating weak area:', error);
    throw error;
  }
}

/**
 * Marks coaching session as viewed
 */
export async function markCoachingSessionViewed(sessionId: string) {
  try {
    const { data, error } = await supabase
      .from('ai_coaching_sessions')
      .update({
        student_viewed: true,
        viewed_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error marking session viewed:', error);
    throw error;
  }
}

/**
 * Updates recommendation status
 */
export async function updateRecommendationStatus(
  recommendationId: string,
  status: 'in_progress' | 'completed' | 'dismissed',
  completionPercentage?: number
) {
  try {
    const updates: any = { status };

    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
      updates.completion_percentage = 100;
    } else if (status === 'dismissed') {
      updates.dismissed_at = new Date().toISOString();
    } else if (completionPercentage !== undefined) {
      updates.completion_percentage = completionPercentage;
      updates.started_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('coaching_recommendations')
      .update(updates)
      .eq('id', recommendationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating recommendation status:', error);
    throw error;
  }
}
