import { StudyPlanData, StudyPlanDay, StudyPlanTask } from '../repositories/study-plan.repository.interface';
import { addDays } from '../../../shared/utils/ict-time';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export interface PlanWeakTopic {
  subjectId: string;
  topic: string;
  correctRate: number;
}

export interface BuildPlanInput {
  weekStart: string; // Monday YYYY-MM-DD
  dueCardCount: number;
  weakTopics: PlanWeakTopic[];
}

/**
 * Build a deterministic, personalised 7-day study plan (Mon–Sun) from the
 * student's due flashcards and weak topics. New students with no activity get
 * a generic onboarding plan.
 */
export function buildStudyPlan(input: BuildPlanInput): StudyPlanData {
  const days: StudyPlanDay[] = DAY_NAMES.map((dayName, i) => ({
    date: addDays(input.weekStart, i),
    dayName,
    tasks: [],
    totalEstimatedMinutes: 0,
  }));

  const hasActivity = input.dueCardCount > 0 || input.weakTopics.length > 0;
  if (!hasActivity) {
    addTask(days[0], onboardingTask('Generate flashcards from your course documents'));
    addTask(days[2], onboardingTask('Take a practice exam to find your weak spots'));
    addTask(days[4], onboardingTask('Chat with the AI tutor about a tricky topic'));
    return finalize(days);
  }

  // Daily flashcard review whenever cards are due.
  if (input.dueCardCount > 0) {
    for (const day of days) {
      addTask(day, {
        type: 'review_flashcards',
        title: 'Review your due flashcards',
        description: `You have around ${input.dueCardCount} cards due for review.`,
        estimatedMinutes: 10,
      });
    }
  }

  // Spread weak topics across the week.
  input.weakTopics.forEach((wt, idx) => {
    const day = days[idx % 7];
    addTask(day, {
      type: 'study_topic',
      title: `Study: ${wt.topic}`,
      description: `You scored ${Math.round(wt.correctRate * 100)}% on "${wt.topic}". Focus on this topic.`,
      resourceType: 'subject',
      resourceId: wt.subjectId,
      estimatedMinutes: 20,
    });
  });

  // Mid-week practice exam if there are weak topics to retest.
  if (input.weakTopics.length > 0) {
    addTask(days[4], {
      type: 'take_exam',
      title: 'Take a practice exam',
      description: 'Generate a practice exam to retest your weak topics.',
      resourceType: 'subject',
      resourceId: input.weakTopics[0].subjectId,
      estimatedMinutes: 30,
    });
  }

  return finalize(days);
}

function onboardingTask(title: string): StudyPlanTask {
  return { type: 'study_topic', title, description: 'Get started with your study routine.', estimatedMinutes: 15 };
}

function addTask(day: StudyPlanDay, task: StudyPlanTask): void {
  day.tasks.push(task);
}

function finalize(days: StudyPlanDay[]): StudyPlanData {
  for (const day of days) {
    day.totalEstimatedMinutes = day.tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  }
  return { days };
}
