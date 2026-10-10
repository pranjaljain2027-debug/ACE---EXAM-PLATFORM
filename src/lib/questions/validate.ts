/**
 * Question content validation (U8, KTD5, AE2).
 *
 * The point of this module is that a question cannot ship with an explanation
 * that contradicts its own answer key. Everything else it checks exists because
 * the content model cross-references itself: explanation steps point at
 * elements of the visual by id, and choices point at group members by id. A
 * dangling or duplicated id is not a cosmetic problem — it makes a step
 * highlight the wrong thing, or makes a question unrenderable, and both teach
 * the child the wrong thing while looking perfectly correct.
 *
 * The checks return issues rather than throwing, so a content author or a
 * build gate sees every problem in one pass.
 */
import {
  DIFFICULTIES,
  type ChoiceBase,
  type FigureGlyph,
  type Question,
  type ReasoningCategory,
} from "@/content/questions/types";

export interface ValidationIssue {
  /** Where the problem is, e.g. `explanation[2]` or `choices[1].itemId`. */
  readonly path: string;
  readonly message: string;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly issues: readonly ValidationIssue[];
}

const VALID_DIFFICULTIES: readonly string[] = DIFFICULTIES;

function collect(issues: readonly ValidationIssue[]): ValidationResult {
  return { valid: issues.length === 0, issues };
}

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

/* -------------------------------------------------------------------------- */
/* Visual element ids                                                         */
/* -------------------------------------------------------------------------- */

interface VisualElements {
  /** Ids a `highlightIds` entry may point at. */
  readonly ids: readonly string[];
  /** Ids of the glyphs inside the visual, for the alt-text check. */
  readonly glyphs: readonly FigureGlyph[];
}

function visualElements(question: Question): VisualElements {
  switch (question.type) {
    case "figure-matrix": {
      const ids: string[] = [];
      const glyphs: FigureGlyph[] = [];
      for (const row of question.visual.rows) {
        for (const cell of row) {
          ids.push(cell.cellId);
          if (cell.glyph !== null) {
            ids.push(cell.glyph.glyphId);
            glyphs.push(cell.glyph);
          }
        }
      }
      return { ids, glyphs };
    }
    case "figure-analogy": {
      const { first, second, third } = question.visual;
      const figures = [first, second, third];
      return {
        ids: figures.flatMap((figure) => [figure.figureId, figure.glyph.glyphId]),
        glyphs: figures.map((figure) => figure.glyph),
      };
    }
    case "classification": {
      const ids: string[] = [];
      const glyphs: FigureGlyph[] = [];
      for (const item of question.visual.items) {
        ids.push(item.itemId);
        if (item.kind === "figure") {
          ids.push(item.glyph.glyphId);
          glyphs.push(item.glyph);
        }
      }
      return { ids, glyphs };
    }
    case "number-series": {
      return {
        ids: question.visual.terms.map((term) => term.termId),
        glyphs: [],
      };
    }
    case "verbal-analogy": {
      const { first, second, third } = question.visual;
      return { ids: [first.termId, second.termId, third.termId], glyphs: [] };
    }
  }
}

/** Ids the question itself refers to, gathered so they can be checked too. */
function choiceGlyphs(choice: ChoiceBase): readonly FigureGlyph[] {
  const glyph = (choice as { readonly glyph?: FigureGlyph }).glyph;
  return glyph === undefined ? [] : [glyph];
}

/* -------------------------------------------------------------------------- */
/* Per-check helpers                                                          */
/* -------------------------------------------------------------------------- */

function checkDuplicateIds(
  ids: readonly string[],
  path: string,
  describe: (id: string) => string,
  issues: ValidationIssue[],
): void {
  const seen = new Set<string>();
  const reported = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      if (!reported.has(id)) {
        reported.add(id);
        issues.push({ path, message: describe(id) });
      }
      continue;
    }
    seen.add(id);
  }
}

function checkNonEmptyChoiceIds(
  choices: readonly ChoiceBase[],
  issues: ValidationIssue[],
): void {
  for (const [index, choice] of choices.entries()) {
    if (!hasText(choice.id)) {
      issues.push({
        path: `choices[${index}].id`,
        message: "a choice has an empty id",
      });
    }
  }
}

function checkVisualShape(question: Question, issues: ValidationIssue[]): void {
  switch (question.type) {
    case "figure-matrix": {
      const cells = question.visual.rows.flat();
      const missing = cells.find((cell) => cell.cellId === question.visual.missingCellId);
      if (missing === undefined) {
        issues.push({
          path: "visual.missingCellId",
          message: `names the cell "${question.visual.missingCellId}", which is not in the board`,
        });
      } else if (missing.glyph !== null) {
        issues.push({
          path: "visual.missingCellId",
          message: `names the cell "${missing.cellId}", but that cell is not empty`,
        });
      }
      return;
    }
    case "classification": {
      const itemIds = new Set(question.visual.items.map((item) => item.itemId));
      for (const [index, choice] of question.choices.entries()) {
        if (!itemIds.has(choice.itemId)) {
          issues.push({
            path: `choices[${index}].itemId`,
            message: `choice "${choice.id}" points at "${choice.itemId}", which is not one of the group members`,
          });
        }
      }
      return;
    }
    case "number-series": {
      const slot = question.visual.terms.find(
        (term) => term.termId === question.visual.answerSlotId,
      );
      if (slot === undefined) {
        issues.push({
          path: "visual.answerSlotId",
          message: `names the term "${question.visual.answerSlotId}", which is not in the line`,
        });
        return;
      }
      const blanks = question.visual.terms.filter((term) => term.value === null);
      if (slot.value !== null) {
        issues.push({
          path: "visual.answerSlotId",
          message: `names the term "${slot.termId}", but that term already has a value`,
        });
      } else if (blanks.length > 1) {
        issues.push({
          path: "visual.terms",
          message: `has ${blanks.length} terms with no value; only the answer slot may be blank`,
        });
      }
      return;
    }
    case "figure-analogy":
    case "verbal-analogy": {
      return;
    }
  }
}

function checkGlyphs(glyphs: readonly FigureGlyph[], issues: ValidationIssue[]): void {
  for (const glyph of glyphs) {
    if (!hasText(glyph.altText)) {
      issues.push({
        path: glyph.glyphId,
        message: `the picture "${glyph.glyphId}" has no alt text, so it has no name for a screen reader`,
      });
    }
  }
}

/**
 * The parts of an explanation step the validator reads, whatever the question
 * type's visual state is. The per-type `ExplanationStep<State>` types are all
 * assignable to this, so the checks below apply to every supported type.
 */
interface StepUnderCheck {
  readonly id: string;
  readonly narration: string;
  readonly highlightIds: readonly string[];
  readonly operation: string;
  readonly revealsChoiceId?: string;
}

function checkExplanation(
  steps: readonly StepUnderCheck[],
  choices: readonly string[],
  correctChoiceId: string,
  elementIds: readonly string[],
  issues: ValidationIssue[],
): void {
  checkDuplicateIds(
    steps.map((step) => step.id),
    "explanation",
    (id) => `has two explanation steps with the id "${id}"`,
    issues,
  );

  const known = new Set(elementIds);
  const choiceSet = new Set(choices);
  const keyResolves = choiceSet.has(correctChoiceId);
  const revealCount = steps.filter((step) => step.operation === "reveal").length;

  for (const [index, step] of steps.entries()) {
    const path = `explanation[${index}]`;
    if (!hasText(step.narration)) {
      issues.push({
        path,
        message: `explanation step "${step.id}" has an empty narration`,
      });
    }
    for (const highlightId of step.highlightIds) {
      if (!known.has(highlightId)) {
        issues.push({
          path: `${path}.highlightIds`,
          message: `explanation step "${step.id}" highlights "${highlightId}", which is not an element of the visual`,
        });
      }
    }
    if (step.operation !== "reveal") {
      continue;
    }
    const revealed = step.revealsChoiceId;
    if (revealed === undefined) {
      issues.push({
        path: `${path}.revealsChoiceId`,
        message: `explanation step "${step.id}" reveals an answer without naming the choice it reveals`,
      });
    } else if (!choiceSet.has(revealed)) {
      issues.push({
        path: `${path}.revealsChoiceId`,
        message: `explanation step "${step.id}" reveals "${revealed}", which is not one of the answer choices`,
      });
    } else if (keyResolves && revealed !== correctChoiceId) {
      // The headline check (AE2): the explanation and the key must point at the
      // same choice. Skipped when the key itself does not resolve, because the
      // key check already reports that and repeating it per step helps nobody.
      issues.push({
        path: `${path}.revealsChoiceId`,
        message: `explanation step "${step.id}" reveals choice "${revealed}", but the answer key is "${correctChoiceId}"`,
      });
    }
  }

  if (steps.length === 0) {
    issues.push({ path: "explanation", message: "has no explanation steps" });
  } else if (revealCount === 0) {
    issues.push({
      path: "explanation",
      message: "has no explanation step that reveals an answer",
    });
  }
}

function checkQuestionHeader(question: Question, issues: ValidationIssue[]): void {
  if (!hasText(question.id)) {
    issues.push({ path: "id", message: "has an empty id" });
  }
  if (!hasText(question.prompt)) {
    issues.push({ path: "prompt", message: "has an empty prompt" });
  }
  if (!VALID_DIFFICULTIES.includes(question.difficulty)) {
    issues.push({
      path: "difficulty",
      message: `has an unknown difficulty "${question.difficulty}"`,
    });
  }
}

function checkChoices(
  choices: readonly ChoiceBase[],
  correctChoiceId: string,
  issues: ValidationIssue[],
): void {
  checkDuplicateIds(
    choices.map((choice) => choice.id),
    "choices",
    (id) => `has two choices with the id "${id}"`,
    issues,
  );
  checkNonEmptyChoiceIds(choices, issues);

  const choiceIds = choices.map((choice) => choice.id);
  if (!choiceIds.includes(correctChoiceId)) {
    issues.push({
      path: "correctChoiceId",
      message: `the answer key names the choice "${correctChoiceId}", which is not one of the answer choices`,
    });
  }
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Validate one question. `valid` is true only when `issues` is empty.
 *
 * Takes the typed question rather than `unknown` so a mistake the type system
 * can catch never reaches here; the runtime checks cover what types cannot
 * express — repeated ids, text that is only whitespace, and references that
 * point at nothing.
 */
export function validateQuestion(question: Question): ValidationResult {
  const issues: ValidationIssue[] = [];

  checkQuestionHeader(question, issues);
  checkChoices(question.choices, question.correctChoiceId, issues);

  const elements = visualElements(question);
  checkDuplicateIds(
    elements.ids,
    "visual",
    (id) => `the visual uses the element id "${id}" more than once, so a highlight would point at two things`,
    issues,
  );
  checkGlyphs([...elements.glyphs, ...question.choices.flatMap(choiceGlyphs)], issues);
  checkVisualShape(question, issues);
  checkExplanation(
    question.explanation,
    question.choices.map((choice) => choice.id),
    question.correctChoiceId,
    elements.ids,
    issues,
  );

  return collect(issues);
}

/**
 * Validate a whole corpus against the coverage the product claims: no question
 * may be invalid, no two may share an id, and every claimed reasoning category
 * needs at least one question that passes validation. A claim the content
 * cannot back is a coverage claim that is not true (R9).
 */
export function validateCorpusCoverage(
  corpus: readonly Question[],
  claimedCategories: readonly ReasoningCategory[],
): ValidationResult {
  const issues: ValidationIssue[] = [];

  checkDuplicateIds(
    corpus.map((question) => question.id),
    "corpus",
    (id) => `the corpus has two questions with the id "${id}"`,
    issues,
  );

  const validByCategory = new Map<string, number>();
  for (const question of corpus) {
    const result = validateQuestion(question);
    if (result.valid) {
      validByCategory.set(
        question.reasoningCategory,
        (validByCategory.get(question.reasoningCategory) ?? 0) + 1,
      );
    }
  }

  for (const category of claimedCategories) {
    if (!validByCategory.has(category)) {
      issues.push({
        path: "claimedCategories",
        message: `the corpus claims to cover the reasoning category "${category}", but no validated question does`,
      });
    }
  }

  return collect(issues);
}