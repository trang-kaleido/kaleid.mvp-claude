/**
 * GradingService — pure grading functions.
 *
 * WHY a separate file?
 * These functions contain no database calls, no imports, and no side effects.
 * Keeping them isolated means they can be tested in isolation with simple unit tests
 * (just call the function with different inputs — no mocking needed).
 *
 * Only gradeMCQ is implemented here (F08). gradeScramble and gradeFillBlanks
 * will be added in F09 and F10 respectively.
 */
export class GradingService {
  /**
   * gradeMCQ — returns true if the student selected the correct option.
   *
   * Both selectedIndex and correctIndex are 0-based (first option = 0).
   * This matches the `correct_index` field in MCQQuestion (LAB-SCHOOL-CONTRACT §7.3).
   *
   * @param selectedIndex - The option the student clicked (0–4)
   * @param correctIndex  - The correct option from the data (0–4)
   */
  static gradeMCQ(selectedIndex: number, correctIndex: number): boolean {
    return selectedIndex === correctIndex;
  }

  /**
   * gradeScrambleJoin — for L1S and L2S.
   *
   * Joins the student's arranged items with a space and compares to the
   * target answer string. Case-insensitive, trim-normalized.
   *
   * WHY join with space?
   * L1S chips are individual words (e.g. ["government", "funding"]) → "government funding".
   * L2S chunks are phrase fragments that form a sentence when joined.
   * Both cases use the same join-and-compare approach.
   *
   * @param arranged - The student's placed items in order (chip texts / chunk texts)
   * @param answer   - The correct target string from the data
   */
  static gradeScrambleJoin(arranged: string[], answer: string): boolean {
    return arranged.join(" ").trim().toLowerCase() === answer.trim().toLowerCase();
  }

  /**
   * gradeScrambleOrder — for L3S and L4S.
   *
   * Compares the student's arranged ID sequence to the correct answer_order.
   * Both arrays must have the same length and identical values in the same order.
   *
   * L3S: arranged = sentence_id[], answerOrder = correct sentence_id[]
   * L4S: arranged = paragraph name[], answerOrder = correct paragraph name[]
   *
   * @param arranged    - The student's current ordering (id strings)
   * @param answerOrder - The correct order from the data
   */
  static gradeScrambleOrder(arranged: string[], answerOrder: string[]): boolean {
    if (arranged.length !== answerOrder.length) return false;
    return arranged.every((id, i) => id === answerOrder[i]);
  }

  /**
   * gradeFillBlanks — for L1F (Phrase Fill).
   *
   * Compares each blank's user input to the expected answer, case-insensitively.
   * Returns a pass flag (ALL blanks correct) plus the list of wrong blank indices
   * so the UI can highlight exactly which blanks were wrong.
   *
   * WHY return wrongIndices?
   * UX Spec §9.3: show a red X on each specific wrong blank, not a generic
   * "wrong answer" message. The caller uses wrongIndices to add a red ring to
   * the affected inputs.
   *
   * @param userAnswers - Map of blank_index → typed text
   * @param blanks      - Array of { index, answer } from the question data
   */
  static gradeFillBlanks(
    userAnswers: Record<number, string>,
    blanks: Array<{ index: number; answer: string }>
  ): { pass: boolean; wrongIndices: number[] } {
    const wrongIndices = blanks
      .filter(
        (b) =>
          (userAnswers[b.index] ?? "").trim().toLowerCase() !==
          b.answer.trim().toLowerCase()
      )
      .map((b) => b.index);
    return { pass: wrongIndices.length === 0, wrongIndices };
  }
}
