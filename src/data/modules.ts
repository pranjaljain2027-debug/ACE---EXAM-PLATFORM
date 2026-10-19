export interface SubskillInfo {
  id: string;
  title: string;
  description: string;
  difficultyBand: string;
  focusRule: string;
}

export interface ModuleInfo {
  id: 'rotation' | 'reflection' | 'progression' | 'attributes';
  title: string;
  tagline: string;
  description: string;
  color: string;
  iconName: string;
  subskills: SubskillInfo[];
}

export const CURRICULUM_MODULES: ModuleInfo[] = [
  {
    id: 'rotation',
    title: 'Rotation & Angular Dynamics',
    tagline: 'Understanding orientation and turning in space',
    description:
      'Children explore how objects preserve their intrinsic geometry while changing direction across quarter turns, half turns, clockwise and counterclockwise paths.',
    color: '#0E2235',
    iconName: 'RotateCw',
    subskills: [
      {
        id: 'rot-quarter-cw',
        title: 'Quarter Turns (90° Clockwise)',
        description: 'Tracking cardinal directional shifts: Up → Right → Down → Left.',
        difficultyBand: 'Foundational',
        focusRule: 'rotation',
      },
      {
        id: 'rot-quarter-ccw',
        title: 'Counterclockwise Reversals',
        description: 'Navigating counter-rotation and inverted directional pathways.',
        difficultyBand: 'Foundational',
        focusRule: 'rotation',
      },
      {
        id: 'rot-half-turn',
        title: 'Half Turns & Inversions (180°)',
        description: 'Recognizing diametric opposites and upright-to-inverted transitions.',
        difficultyBand: 'Intermediate',
        focusRule: 'rotation',
      },
      {
        id: 'rot-incremental-45',
        title: 'Diagonal Increments (45° Turns)',
        description: 'Detecting 8-point compass progressions across complex polygonal figures.',
        difficultyBand: 'Advanced',
        focusRule: 'rotation',
      },
    ],
  },
  {
    id: 'reflection',
    title: 'Reflection & Axial Symmetry',
    tagline: 'Mirror lines, chiral forms, and spatial inversions',
    description:
      'Mastering the distinction between turning an object and flipping it across a mirror plane. Children analyze bilateral symmetry and solve chiral figure transformations.',
    color: '#718C7B',
    iconName: 'FlipHorizontal',
    subskills: [
      {
        id: 'ref-horizontal',
        title: 'Horizontal Mirror Reflection',
        description: 'Flipping left-right across a vertical bilateral mirror axis.',
        difficultyBand: 'Foundational',
        focusRule: 'reflection',
      },
      {
        id: 'ref-vertical',
        title: 'Vertical Water Reflection',
        description: 'Inverting top-bottom across a horizontal reflection horizon.',
        difficultyBand: 'Foundational',
        focusRule: 'reflection',
      },
      {
        id: 'ref-vs-rotation',
        title: 'Reflection vs. Rotation Discrimination',
        description: 'Discerning whether an asymmetric shape was rotated or flipped.',
        difficultyBand: 'Intermediate',
        focusRule: 'reflection',
      },
      {
        id: 'ref-compound-axis',
        title: 'Dual-Axis Mirror Systems',
        description: 'Predicting quadrant reflections in 2x2 matrix arrangements.',
        difficultyBand: 'Advanced',
        focusRule: 'reflection',
      },
    ],
  },
  {
    id: 'progression',
    title: 'Visual Progression & Sequence Rules',
    tagline: 'Count rhythms, scale ladders, and orbital paths',
    description:
      'Identifying systematic additions, subtractions, linear progressions, and position shifts across horizontal sequence strips and multi-cell matrices.',
    color: '#C99543',
    iconName: 'TrendingUp',
    subskills: [
      {
        id: 'prog-count-step',
        title: 'Shape Count Steps (+1 / -1)',
        description: 'Additive and subtractive element counts across frames.',
        difficultyBand: 'Foundational',
        focusRule: 'count_progression',
      },
      {
        id: 'prog-size-scale',
        title: 'Proportional Size Progression',
        description: 'Nested and standalone geometric scaling patterns.',
        difficultyBand: 'Intermediate',
        focusRule: 'size_change',
      },
      {
        id: 'prog-position-orbit',
        title: 'Translational Orbit & Grid Moves',
        description: 'Tracking element translation across corners, edges, and center nodes.',
        difficultyBand: 'Intermediate',
        focusRule: 'position_change',
      },
      {
        id: 'prog-alternating',
        title: 'Alternating Oscillation Sequences',
        description: 'A-B-A-B state recurrence and dual-track progressions.',
        difficultyBand: 'Advanced',
        focusRule: 'count_progression',
      },
    ],
  },
  {
    id: 'attributes',
    title: 'Color & Attribute Conjunctions',
    tagline: 'Disentangling multiple variables and noisy distractors',
    description:
      'Separating relevant transformation rules from irrelevant distractor details. Children analyze two-attribute conjunctions such as simultaneous rotation and color cycling.',
    color: '#2B4C7E',
    iconName: 'Layers',
    subskills: [
      {
        id: 'attr-color-cycle',
        title: 'Triadic & Binary Color Cycles',
        description: 'Predicting hue transitions across ochre, navy, and sage palettes.',
        difficultyBand: 'Foundational',
        focusRule: 'color_change',
      },
      {
        id: 'attr-shape-substitution',
        title: 'Shape Category Substitution',
        description: 'Systematic replacement of internal geometric tokens.',
        difficultyBand: 'Intermediate',
        focusRule: 'shape_substitution',
      },
      {
        id: 'attr-dual-conjunction',
        title: 'Dual Conjunction (Rotation + Color)',
        description: 'Decoupling two concurrent transformation rules operating simultaneously.',
        difficultyBand: 'Advanced',
        focusRule: 'overlap',
      },
      {
        id: 'attr-distractor-filter',
        title: 'Distractor Attribute Invariance',
        description: 'Identifying which property changes predictably while ignoring noisy changes.',
        difficultyBand: 'Advanced',
        focusRule: 'shape_substitution',
      },
    ],
  },
];
