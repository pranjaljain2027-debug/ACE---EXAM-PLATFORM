/**
 * Frozen counting taxonomy (plan §17, §19.1).
 * A question counts once, toward its canonical question type, however many paths or topics it is tagged to.
 * Changing this file changes the coverage report; record any change in docs/question-bank.md.
 */

export type Domain = 'spatial' | 'pattern' | 'logical' | 'quantitative' | 'verbal' | 'directions';
export type PathId = 'cogat' | 'olsat' | 'nnat' | 'general';

export interface QuestionType {
  id: string;
  title: string;
  domain: Domain;
  definition: string;
  excludes: string;
  ageBands: string[];
  difficultyBands: number[];
  /** Whether this repository can render and validate the type today. */
  engine: 'available' | 'planned';
  target: number;
  acceptance: string[];
}

const T = 200;
const common = ['Exactly four distinct options', 'Exactly one defensible answer under the stated rule', 'Hint does not reveal the answer', 'Explanation and per-option rationales present'];

export const QUESTION_TYPES: QuestionType[] = [
  // Spatial
  { id: 'spatial_cube_rotation', title: '3D cube rotation', domain: 'spatial', definition: 'Pick the connected-cube shape after a stated quarter-turn about a stated axis.', excludes: 'Viewpoint changes, mirror images as the correct answer.', ageBands: ['8-10', '10-12'], difficultyBands: [1, 2, 3, 4, 5], engine: 'available', target: T, acceptance: [...common, 'Axis and direction stated in the prompt', 'Correct option equals the transformed geometry; no distractor is equivalent', 'Options render visually distinct'] },
  { id: 'spatial_viewpoint', title: 'Views of a cube structure', domain: 'spatial', definition: 'Pick the flat view of a cube structure seen from a stated side.', excludes: 'Perspective drawings; hidden-cube counting.', ageBands: ['8-10', '10-12'], difficultyBands: [1, 2, 3, 4], engine: 'available', target: T, acceptance: [...common, 'Viewing side and viewer orientation stated', 'Correct grid equals the computed silhouette'] },
  { id: 'spatial_plane_reflection', title: '3D mirror reflection', domain: 'spatial', definition: 'Pick the mirror image of a cube shape across a stated vertical or horizontal plane.', excludes: 'Diagonal planes (planned).', ageBands: ['8-10', '10-12'], difficultyBands: [2, 3, 4, 5], engine: 'available', target: T, acceptance: [...common, 'Mirror plane stated', 'Correct option equals the reflected geometry'] },
  { id: 'paper_folding', title: 'Paper folding and hole punch', domain: 'spatial', definition: 'Predict holes after folding, punching and unfolding.', excludes: '', ageBands: ['8-10', '10-12'], difficultyBands: [1, 2, 3, 4], engine: 'planned', target: T, acceptance: common },
  { id: 'nets_folding', title: 'Nets and folded solids', domain: 'spatial', definition: 'Match a net to the solid it folds into.', excludes: '', ageBands: ['10-12'], difficultyBands: [2, 3, 4], engine: 'planned', target: T, acceptance: common },
  { id: 'face_counting', title: 'Visible and hidden faces', domain: 'spatial', definition: 'Count visible faces or infer hidden cubes.', excludes: '', ageBands: ['8-10', '10-12'], difficultyBands: [1, 2, 3], engine: 'planned', target: T, acceptance: common },
  { id: 'shape_assembly', title: 'Assembly and disassembly', domain: 'spatial', definition: 'Pick the piece that completes or splits a shape.', excludes: '', ageBands: ['8-10', '10-12'], difficultyBands: [2, 3, 4], engine: 'planned', target: T, acceptance: common },
  // Pattern and matrix (2D figural)
  { id: 'figure_matrix', title: 'Figure matrices', domain: 'pattern', definition: '2x2 or 3x3 grid with one missing cell governed by row/column rules.', excludes: '', ageBands: ['8-10', '10-12'], difficultyBands: [1, 2, 3, 4, 5], engine: 'available', target: T, acceptance: [...common, 'Rule recomputed from the generator'] },
  { id: 'figural_analogy', title: 'Figural analogies', domain: 'pattern', definition: 'A is to B as C is to ?, with shapes.', excludes: '', ageBands: ['8-10', '10-12'], difficultyBands: [1, 2, 3, 4], engine: 'available', target: T, acceptance: common },
  { id: 'figural_series', title: 'Figural series', domain: 'pattern', definition: 'Pick what comes next in a sequence of figures.', excludes: '', ageBands: ['8-10', '10-12'], difficultyBands: [1, 2, 3, 4], engine: 'available', target: T, acceptance: common },
  { id: 'figure_classification', title: 'Figure classification', domain: 'pattern', definition: 'Pick the figure that does not share the rule, or the one that does.', excludes: '', ageBands: ['8-10', '10-12'], difficultyBands: [1, 2, 3, 4], engine: 'available', target: T, acceptance: common },
  { id: 'pattern_completion', title: 'Pattern completion', domain: 'pattern', definition: 'Complete a missing region of a tiled design.', excludes: '', ageBands: ['8-10'], difficultyBands: [1, 2, 3], engine: 'planned', target: T, acceptance: common },
  // Quantitative
  { id: 'number_series', title: 'Number series', domain: 'quantitative', definition: 'Find the next number from a stated-type progression.', excludes: '', ageBands: ['8-10', '10-12'], difficultyBands: [1, 2, 3, 4], engine: 'available', target: T, acceptance: [...common, 'Rule recomputed; no other option fits a simpler rule'] },
  { id: 'number_puzzle', title: 'Balance and shape equations', domain: 'quantitative', definition: 'Find a value from balanced scales or icon equations.', excludes: '', ageBands: ['8-10', '10-12'], difficultyBands: [1, 2, 3, 4], engine: 'available', target: T, acceptance: [...common, 'Unique positive-integer solution verified by search'] },
  { id: 'number_analogy', title: 'Number analogies', domain: 'quantitative', definition: 'a -> b as c -> ?', excludes: '', ageBands: ['8-10', '10-12'], difficultyBands: [1, 2, 3], engine: 'planned', target: T, acceptance: common },
  { id: 'arithmetic_reasoning', title: 'Arithmetic word problems', domain: 'quantitative', definition: 'Short multi-step word problems.', excludes: '', ageBands: ['8-10', '10-12'], difficultyBands: [1, 2, 3], engine: 'planned', target: T, acceptance: common },
  // Logical
  { id: 'logical_deduction', title: 'Ordering and deduction', domain: 'logical', definition: 'Deduce order or identity from clues.', excludes: '', ageBands: ['8-10', '10-12'], difficultyBands: [2, 3, 4], engine: 'planned', target: T, acceptance: common },
  // Verbal
  { id: 'verbal_analogy', title: 'Picture and word analogies', domain: 'verbal', definition: 'A is to B as C is to ?, with words or pictures.', excludes: '', ageBands: ['8-10', '10-12'], difficultyBands: [1, 2, 3], engine: 'available', target: T, acceptance: [...common, 'Human semantic review required'] },
  { id: 'verbal_classification', title: 'Word classification', domain: 'verbal', definition: 'Pick the word that does not belong.', excludes: '', ageBands: ['8-10', '10-12'], difficultyBands: [1, 2, 3], engine: 'available', target: T, acceptance: [...common, 'Human semantic review required'] },
  { id: 'sentence_completion', title: 'Sentence completion', domain: 'verbal', definition: 'Pick the word that best completes a sentence.', excludes: '', ageBands: ['8-10', '10-12'], difficultyBands: [1, 2, 3], engine: 'planned', target: T, acceptance: common },
  { id: 'synonyms_antonyms', title: 'Synonyms and antonyms', domain: 'verbal', definition: '', excludes: '', ageBands: ['8-10', '10-12'], difficultyBands: [1, 2, 3], engine: 'planned', target: T, acceptance: common },
  { id: 'sentence_arrangement', title: 'Sentence arrangement', domain: 'verbal', definition: '', excludes: '', ageBands: ['10-12'], difficultyBands: [2, 3], engine: 'planned', target: T, acceptance: common },
  { id: 'aural_reasoning', title: 'Aural reasoning', domain: 'verbal', definition: 'Read-aloud clues, pick the answer.', excludes: '', ageBands: ['8-10'], difficultyBands: [1, 2], engine: 'planned', target: T, acceptance: common },
  // Directions
  { id: 'following_directions', title: 'Following directions', domain: 'directions', definition: 'Positional and multi-step directions.', excludes: '', ageBands: ['8-10'], difficultyBands: [1, 2, 3], engine: 'planned', target: T, acceptance: common },
];

export interface Topic {
  id: string;
  title: string;
  types: string[];
  alignment?: string;
}
export interface Section {
  id: string;
  title: string;
  topics: Topic[];
}
export interface LearningPath {
  id: PathId;
  title: string;
  kind: 'exam_prep' | 'general_reasoning';
  description: string;
  sections: Section[];
}

const NOTE = 'Original practice aligned to publicly described skills. Not affiliated with the test publisher.';

export const LEARNING_PATHS: LearningPath[] = [
  {
    id: 'cogat', title: 'CogAT practice', kind: 'exam_prep', description: NOTE,
    sections: [
      { id: 'cogat-verbal', title: 'Verbal Battery', topics: [
        { id: 'cogat-verbal-analogies', title: 'Picture / verbal analogies', types: ['verbal_analogy'] },
        { id: 'cogat-sentence-completion', title: 'Sentence completion', types: ['sentence_completion'] },
        { id: 'cogat-verbal-classification', title: 'Picture / verbal classification', types: ['verbal_classification'] },
      ] },
      { id: 'cogat-quant', title: 'Quantitative Battery', topics: [
        { id: 'cogat-number-analogies', title: 'Number analogies', types: ['number_analogy'] },
        { id: 'cogat-number-series', title: 'Number series', types: ['number_series'] },
        { id: 'cogat-number-puzzles', title: 'Number puzzles', types: ['number_puzzle'] },
      ] },
      { id: 'cogat-nonverbal', title: 'Nonverbal Battery', topics: [
        { id: 'cogat-figure-matrices', title: 'Figure matrices', types: ['figure_matrix', 'figural_analogy'] },
        { id: 'cogat-paper-folding', title: 'Paper folding', types: ['paper_folding'] },
        { id: 'cogat-figure-classification', title: 'Figure classification', types: ['figure_classification'] },
      ] },
    ],
  },
  {
    id: 'olsat', title: 'OLSAT practice', kind: 'exam_prep', description: NOTE,
    sections: [
      { id: 'olsat-comprehension', title: 'Verbal comprehension', topics: [
        { id: 'olsat-directions', title: 'Following directions', types: ['following_directions'] },
        { id: 'olsat-synonyms', title: 'Synonyms and antonyms', types: ['synonyms_antonyms'] },
        { id: 'olsat-arrangement', title: 'Sentence completion and arrangement', types: ['sentence_completion', 'sentence_arrangement'] },
      ] },
      { id: 'olsat-verbal-reasoning', title: 'Verbal reasoning', topics: [
        { id: 'olsat-aural', title: 'Aural reasoning', types: ['aural_reasoning'] },
        { id: 'olsat-arithmetic', title: 'Arithmetic reasoning', types: ['arithmetic_reasoning'] },
        { id: 'olsat-verbal-analogies', title: 'Verbal analogies and classification', types: ['verbal_analogy', 'verbal_classification'] },
      ] },
      { id: 'olsat-figural', title: 'Pictorial and figural reasoning', topics: [
        { id: 'olsat-figural-classification', title: 'Figural classification', types: ['figure_classification'] },
        { id: 'olsat-figural-series', title: 'Figural series', types: ['figural_series'] },
        { id: 'olsat-matrices', title: 'Pattern matrices', types: ['figure_matrix', 'figural_analogy'] },
      ] },
      { id: 'olsat-quant', title: 'Quantitative reasoning', topics: [
        { id: 'olsat-number', title: 'Number relationships and puzzles', types: ['number_series', 'number_puzzle'] },
      ] },
    ],
  },
  {
    id: 'nnat', title: 'NNAT practice', kind: 'exam_prep', description: NOTE,
    sections: [
      { id: 'nnat-core', title: 'Nonverbal reasoning', topics: [
        { id: 'nnat-pattern-completion', title: 'Pattern completion', types: ['pattern_completion'] },
        { id: 'nnat-analogy', title: 'Reasoning by analogy', types: ['figural_analogy', 'figure_matrix'] },
        { id: 'nnat-serial', title: 'Serial reasoning', types: ['figural_series'] },
        { id: 'nnat-spatial', title: 'Spatial visualization', types: ['spatial_cube_rotation', 'spatial_viewpoint', 'spatial_plane_reflection'] },
      ] },
    ],
  },
  {
    id: 'general', title: 'General Reasoning Studio', kind: 'general_reasoning', description: 'Shapes, patterns, numbers and words, at your own pace.',
    sections: [
      { id: 'gen-spatial', title: 'Shapes and space', topics: [
        { id: 'gen-3d-rotation', title: '3D rotation', types: ['spatial_cube_rotation'] },
        { id: 'gen-viewpoints', title: 'Views from different sides', types: ['spatial_viewpoint'] },
        { id: 'gen-mirrors', title: 'Mirrors in 3D', types: ['spatial_plane_reflection'] },
        { id: 'gen-folding', title: 'Folding and nets', types: ['paper_folding', 'nets_folding'] },
        { id: 'gen-assembly', title: 'Building and counting', types: ['face_counting', 'shape_assembly'] },
      ] },
      { id: 'gen-pattern', title: 'Patterns', topics: [
        { id: 'gen-matrices', title: 'Grids and analogies', types: ['figure_matrix', 'figural_analogy'] },
        { id: 'gen-series', title: 'What comes next', types: ['figural_series', 'pattern_completion'] },
        { id: 'gen-odd-one-out', title: 'Odd one out', types: ['figure_classification'] },
      ] },
      { id: 'gen-numbers', title: 'Numbers', topics: [
        { id: 'gen-number-series', title: 'Number patterns', types: ['number_series', 'number_analogy'] },
        { id: 'gen-balance', title: 'Balance puzzles', types: ['number_puzzle'] },
        { id: 'gen-word-problems', title: 'Word problems', types: ['arithmetic_reasoning'] },
      ] },
      { id: 'gen-logic', title: 'Logic', topics: [
        { id: 'gen-deduction', title: 'Clues and order', types: ['logical_deduction'] },
      ] },
      { id: 'gen-words', title: 'Words', topics: [
        { id: 'gen-word-analogies', title: 'Word analogies', types: ['verbal_analogy'] },
        { id: 'gen-word-groups', title: 'Word groups', types: ['verbal_classification'] },
        { id: 'gen-sentences', title: 'Sentences', types: ['sentence_completion', 'sentence_arrangement'] },
        { id: 'gen-directions', title: 'Following directions', types: ['following_directions', 'aural_reasoning'] },
      ] },
    ],
  },
];

export const ALL_TOPICS = LEARNING_PATHS.flatMap((p) => p.sections.flatMap((s) => s.topics.map((t) => ({ ...t, pathId: p.id, sectionId: s.id, sectionTitle: s.title }))));
export const TYPE_IDS = new Set(QUESTION_TYPES.map((t) => t.id));
export const TOPIC_IDS = new Set(ALL_TOPICS.map((t) => t.id));

/** Existing 2D items map onto canonical types so they are counted once. */
export const ACTIVITY_TYPE_TO_QUESTION_TYPE: Record<string, string> = {
  matrix: 'figure_matrix',
  analogy: 'figural_analogy',
  sequence: 'figural_series',
  classification: 'figure_classification',
};
