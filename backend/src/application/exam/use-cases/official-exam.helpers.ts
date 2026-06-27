import { UnprocessableEntityException } from '@nestjs/common';
import { OfficialQuestionDto } from '../dtos/exam.dto';

const REQUIRED_OPTION_KEYS = ['A', 'B', 'C', 'D'];

/**
 * Enforce the content rules for a manually authored official exam (BR-EF2-03/04):
 * at least one question, each with exactly options A/B/C/D and a correctAnswer
 * that matches one of those keys. Throws 422 on any violation.
 */
export function validateOfficialQuestions(questions: OfficialQuestionDto[]): void {
  if (!questions || questions.length < 1) {
    throw new UnprocessableEntityException('An exam must have at least one question');
  }

  questions.forEach((q, idx) => {
    const keys = q.options.map((o) => o.key);
    const uniqueKeys = new Set(keys);
    const hasExactKeys =
      uniqueKeys.size === REQUIRED_OPTION_KEYS.length &&
      REQUIRED_OPTION_KEYS.every((k) => uniqueKeys.has(k));
    if (!hasExactKeys) {
      throw new UnprocessableEntityException(
        `Question ${idx + 1} must have exactly four options with keys A, B, C, D`,
      );
    }
    if (!keys.includes(q.correctAnswer)) {
      throw new UnprocessableEntityException(
        `Question ${idx + 1}: correctAnswer must match one of the option keys`,
      );
    }
  });
}
