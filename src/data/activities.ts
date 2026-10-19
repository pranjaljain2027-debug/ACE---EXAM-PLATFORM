import { ReasoningActivity } from '../types/reasoning';

export const ACTIVITIES: ReasoningActivity[] = [
  // ==========================================
  // MODULE 1: ROTATION & ANGULAR DYNAMICS
  // ==========================================
  {
    id: 'rot-101',
    title: 'The Cardinal Compass Turn',
    moduleId: 'rotation',
    moduleTitle: 'Rotation & Angular Dynamics',
    subskillId: 'rot-quarter-cw',
    subskillTitle: 'Quarter Turns (90° Clockwise)',
    difficulty: 1,
    ageBand: '8-10',
    activityFormat: 'sequence',
    promptText: 'Observe how the arrow moves across the four positions in the sequence.',
    observationPrompt: 'What do you notice changing as you look from left to right?',
    observationChoices: [
      { id: 'obs-dir', label: 'The direction the arrow is pointing', category: 'direction', isKeyFactor: true },
      { id: 'obs-col', label: 'The color of the arrow', category: 'color', isKeyFactor: false },
      { id: 'obs-siz', label: 'The size of the arrow', category: 'size', isKeyFactor: false },
      { id: 'obs-cnt', label: 'The number of arrows in the box', category: 'count', isKeyFactor: false },
    ],
    frames: [
      {
        stepIndex: 1,
        label: 'Step 1',
        objects: [{ id: 'f1-1', shape: 'arrow', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }],
      },
      {
        stepIndex: 2,
        label: 'Step 2',
        objects: [{ id: 'f2-1', shape: 'arrow', x: 50, y: 50, rotation: 90, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }],
      },
      {
        stepIndex: 3,
        label: 'Step 3',
        objects: [{ id: 'f3-1', shape: 'arrow', x: 50, y: 50, rotation: 180, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }],
      },
      {
        stepIndex: 4,
        label: 'Step 4 (?)',
        isMissing: true,
        objects: [],
      },
    ],
    missingFrameIndex: 3,
    initialState: [
      { id: 'user-obj-1', shape: 'arrow', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 },
    ],
    targetState: [
      { id: 'target-1', shape: 'arrow', x: 50, y: 50, rotation: 270, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 },
    ],
    allowedActions: ['rotate-90-cw', 'rotate-90-ccw'],
    ruleOptions: [
      {
        id: 'rule-90-cw',
        label: 'The arrow turns 90° clockwise (a quarter turn to the right) each step.',
        isCorrect: true,
        explanation: 'Up (0°) turns right to 90°, then down to 180°, and finally left to 270°.',
      },
      {
        id: 'rule-flip',
        label: 'The arrow flips upside down back and forth.',
        isCorrect: false,
        explanation: 'Notice that step 2 points horizontally to the right, which is not an upside-down flip.',
      },
      {
        id: 'rule-random',
        label: 'The arrow changes to point toward random corners.',
        isCorrect: false,
        explanation: 'The change follows an exact clockwise pattern, like hands on a clock.',
      },
    ],
    hints: [
      {
        tier: 1,
        name: 'Attention',
        content: 'Focus only on the sharp tip of the arrow. Which way does it point in each box?',
      },
      {
        tier: 2,
        name: 'Relationship',
        content: 'Notice how the arrow turns just like the hands on a wall clock—one quarter turn each step.',
      },
      {
        tier: 3,
        name: 'Guided Demonstration',
        content: 'From Step 3 pointing Down (180°), another 90° clockwise turn makes it point Left (270°).',
        actionPreview: { type: 'rotate', value: 270 },
      },
    ],
    explanationSteps: [
      'In Step 1, the arrow points straight up towards 12 o\'clock (0°).',
      'In Step 2, it makes a 90° clockwise quarter-turn to point right (3 o\'clock).',
      'In Step 3, it turns another 90° clockwise to point straight down (6 o\'clock).',
      'Following this invariant rule, the missing fourth position must turn 90° clockwise once more to point left (9 o\'clock).',
    ],
    transferChallenge: {
      id: 'trans-rot-101',
      prompt: 'Apply the same 90° clockwise rotation rule to this new problem with triangles.',
      ruleContext: 'The shape turns 90° clockwise each step.',
      missingIndex: 3,
      frames: [
        {
          stepIndex: 1,
          label: '1',
          objects: [{ id: 't1', shape: 'triangle', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 }],
        },
        {
          stepIndex: 2,
          label: '2',
          objects: [{ id: 't2', shape: 'triangle', x: 50, y: 50, rotation: 90, scale: 1.0, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 }],
        },
        {
          stepIndex: 3,
          label: '3',
          objects: [{ id: 't3', shape: 'triangle', x: 50, y: 50, rotation: 180, scale: 1.0, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 }],
        },
        {
          stepIndex: 4,
          label: '?',
          isMissing: true,
          objects: [],
        },
      ],
      options: [
        {
          id: 'opt-a',
          objects: [{ id: 'o-a', shape: 'triangle', x: 50, y: 50, rotation: 270, scale: 1.0, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 }],
          isCorrect: true,
          explanation: 'Correct! The vertex points left (270°), completing the 90° clockwise rotation cycle.',
        },
        {
          id: 'opt-b',
          objects: [{ id: 'o-b', shape: 'triangle', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 }],
          isCorrect: false,
          explanation: 'This points upward (0°), which skips the 270° position.',
        },
        {
          id: 'opt-c',
          objects: [{ id: 'o-c', shape: 'triangle', x: 50, y: 50, rotation: 180, scale: 1.0, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 }],
          isCorrect: false,
          explanation: 'This is identical to Step 3, with no rotation applied.',
        },
        {
          id: 'opt-d',
          objects: [{ id: 'o-d', shape: 'triangle', x: 50, y: 50, rotation: 90, scale: 1.0, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 }],
          isCorrect: false,
          explanation: 'This points right, which was Step 2.',
        },
      ],
    },
    pedagogicalTakeaway: 'Rotations preserve shape and size while altering cardinal orientation systematically.',
  },
  {
    id: 'rot-102',
    title: 'Counter-Clockwise Beacon',
    moduleId: 'rotation',
    moduleTitle: 'Rotation & Angular Dynamics',
    subskillId: 'rot-quarter-ccw',
    subskillTitle: 'Counterclockwise Reversals',
    difficulty: 2,
    ageBand: '8-10',
    activityFormat: 'sequence',
    promptText: 'Analyze the rotation path. Is it turning clockwise or counterclockwise?',
    observationPrompt: 'Which property changes consistently between frames?',
    observationChoices: [
      { id: 'obs-dir-2', label: 'The direction of rotation (turning backwards)', category: 'direction', isKeyFactor: true },
      { id: 'obs-shp-2', label: 'The geometric shape itself', category: 'shape', isKeyFactor: false },
      { id: 'obs-pos-2', label: 'The position on the canvas', category: 'position', isKeyFactor: false },
    ],
    frames: [
      {
        stepIndex: 1,
        label: 'Step 1',
        objects: [{ id: 'f1-2', shape: 'arrow', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#718C7B', reflectedX: false, reflectedY: false, zIndex: 1 }],
      },
      {
        stepIndex: 2,
        label: 'Step 2',
        objects: [{ id: 'f2-2', shape: 'arrow', x: 50, y: 50, rotation: 270, scale: 1.0, color: '#718C7B', reflectedX: false, reflectedY: false, zIndex: 1 }],
      },
      {
        stepIndex: 3,
        label: 'Step 3',
        objects: [{ id: 'f3-2', shape: 'arrow', x: 50, y: 50, rotation: 180, scale: 1.0, color: '#718C7B', reflectedX: false, reflectedY: false, zIndex: 1 }],
      },
      {
        stepIndex: 4,
        label: 'Step 4 (?)',
        isMissing: true,
        objects: [],
      },
    ],
    missingFrameIndex: 3,
    initialState: [
      { id: 'user-obj-2', shape: 'arrow', x: 50, y: 50, rotation: 180, scale: 1.0, color: '#718C7B', reflectedX: false, reflectedY: false, zIndex: 1 },
    ],
    targetState: [
      { id: 'target-2', shape: 'arrow', x: 50, y: 50, rotation: 90, scale: 1.0, color: '#718C7B', reflectedX: false, reflectedY: false, zIndex: 1 },
    ],
    allowedActions: ['rotate-90-cw', 'rotate-90-ccw'],
    ruleOptions: [
      {
        id: 'rule-90-ccw',
        label: 'The arrow rotates 90° counterclockwise (leftwards turn) each step.',
        isCorrect: true,
        explanation: 'From Up (0°) to Left (270°), then Down (180°), the next step is Right (90°).',
      },
      {
        id: 'rule-cw-miss',
        label: 'The arrow turns clockwise.',
        isCorrect: false,
        explanation: 'If it were clockwise, step 2 would point Right, but it points Left.',
      },
    ],
    hints: [
      {
        tier: 1,
        name: 'Attention',
        content: 'Check step 1 (pointing up) and step 2 (pointing left). Which direction did it turn?',
      },
      {
        tier: 2,
        name: 'Relationship',
        content: 'It is turning counterclockwise, opposite to the direction clock hands move.',
      },
      {
        tier: 3,
        name: 'Guided Demonstration',
        content: 'Turn from Down (180°) counterclockwise 90° to reach Right (90°).',
        actionPreview: { type: 'rotate', value: 90 },
      },
    ],
    explanationSteps: [
      'The figure rotates in reverse clock direction (counterclockwise).',
      '0° (Up) → 270° (Left) → 180° (Down) → 90° (Right).',
    ],
    transferChallenge: {
      id: 'trans-rot-102',
      prompt: 'Identify the missing crescent moon undergoing 90° counterclockwise rotation.',
      ruleContext: 'The shape rotates 90° counterclockwise each step.',
      missingIndex: 3,
      frames: [
        {
          stepIndex: 1,
          label: '1',
          objects: [{ id: 'tc1', shape: 'crescent', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#2B4C7E', reflectedX: false, reflectedY: false, zIndex: 1 }],
        },
        {
          stepIndex: 2,
          label: '2',
          objects: [{ id: 'tc2', shape: 'crescent', x: 50, y: 50, rotation: 270, scale: 1.0, color: '#2B4C7E', reflectedX: false, reflectedY: false, zIndex: 1 }],
        },
        {
          stepIndex: 3,
          label: '3',
          objects: [{ id: 'tc3', shape: 'crescent', x: 50, y: 50, rotation: 180, scale: 1.0, color: '#2B4C7E', reflectedX: false, reflectedY: false, zIndex: 1 }],
        },
        {
          stepIndex: 4,
          label: '?',
          isMissing: true,
          objects: [],
        },
      ],
      options: [
        {
          id: 'opt-tc-a',
          objects: [{ id: 'otc-a', shape: 'crescent', x: 50, y: 50, rotation: 90, scale: 1.0, color: '#2B4C7E', reflectedX: false, reflectedY: false, zIndex: 1 }],
          isCorrect: true,
          explanation: 'Correct! 180° counterclockwise 90° yields 90° (horns pointing downward-right).',
        },
        {
          id: 'opt-tc-b',
          objects: [{ id: 'otc-b', shape: 'crescent', x: 50, y: 50, rotation: 270, scale: 1.0, color: '#2B4C7E', reflectedX: false, reflectedY: false, zIndex: 1 }],
          isCorrect: false,
          explanation: 'This repeats step 2.',
        },
        {
          id: 'opt-tc-c',
          objects: [{ id: 'otc-c', shape: 'crescent', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#2B4C7E', reflectedX: false, reflectedY: false, zIndex: 1 }],
          isCorrect: false,
          explanation: 'This returns to step 1 too early.',
        },
      ],
    },
    pedagogicalTakeaway: 'Distinguishing clockwise from counterclockwise requires comparing consecutive transitions.',
  },
  {
    id: 'rot-103',
    title: 'The Inverted Keystone (180° Half Turns)',
    moduleId: 'rotation',
    moduleTitle: 'Rotation & Angular Dynamics',
    subskillId: 'rot-half-turn',
    subskillTitle: 'Half Turns & Inversions (180°)',
    difficulty: 2,
    ageBand: '8-10',
    activityFormat: 'sequence',
    promptText: 'Study the relationship between alternating positions.',
    observationPrompt: 'What happens to the diamond arrow between consecutive frames?',
    observationChoices: [
      { id: 'obs-invert', label: 'It completely flips upside down (180°)', category: 'direction', isKeyFactor: true },
      { id: 'obs-color', label: 'The border color shifts', category: 'color', isKeyFactor: false },
    ],
    frames: [
      {
        stepIndex: 1,
        label: 'Step 1',
        objects: [{ id: 'f1-3', shape: 'arrow', x: 50, y: 50, rotation: 45, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }],
      },
      {
        stepIndex: 2,
        label: 'Step 2',
        objects: [{ id: 'f2-3', shape: 'arrow', x: 50, y: 50, rotation: 225, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }],
      },
      {
        stepIndex: 3,
        label: 'Step 3',
        objects: [{ id: 'f3-3', shape: 'arrow', x: 50, y: 50, rotation: 45, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }],
      },
      {
        stepIndex: 4,
        label: 'Step 4 (?)',
        isMissing: true,
        objects: [],
      },
    ],
    missingFrameIndex: 3,
    initialState: [
      { id: 'user-obj-3', shape: 'arrow', x: 50, y: 50, rotation: 45, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 },
    ],
    targetState: [
      { id: 'target-3', shape: 'arrow', x: 50, y: 50, rotation: 225, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 },
    ],
    allowedActions: ['rotate-90-cw', 'rotate-90-ccw', 'rotate-45'],
    ruleOptions: [
      {
        id: 'rule-half-turn',
        label: 'The shape undergoes a half-turn (180° rotation), pointing in the opposite direction.',
        isCorrect: true,
        explanation: '45° + 180° = 225° (pointing northeast, then southwest).',
      },
      {
        id: 'rule-quarter',
        label: 'The shape turns by only 90 degrees.',
        isCorrect: false,
        explanation: 'A 90° turn would point southeast (135°), but this points completely southwest.',
      },
    ],
    hints: [
      {
        tier: 1,
        name: 'Attention',
        content: 'Notice the arrow points towards the top-right corner, then directly to the bottom-left corner.',
      },
      {
        tier: 2,
        name: 'Relationship',
        content: 'Opposite diagonal corners mean a 180° straight half-turn.',
      },
      {
        tier: 3,
        name: 'Guided Demonstration',
        content: 'Rotate two quarter turns (180°) to point to the opposite diagonal.',
        actionPreview: { type: 'rotate', value: 225 },
      },
    ],
    explanationSteps: [
      'A 180° rotation reverses the direction along the same diagonal axis.',
      'Frame 1: 45° (top-right). Frame 2: 225° (bottom-left). Frame 3: 45°. Frame 4: 225°.',
    ],
    transferChallenge: {
      id: 'trans-rot-103',
      prompt: 'Which pentagon / arrow completes the alternating 180° inversion rule?',
      ruleContext: 'The shape alternates between 45° and 225° (180° inversion).',
      missingIndex: 3,
      frames: [
        {
          stepIndex: 1,
          label: '1',
          objects: [{ id: 'ti1', shape: 'diamond', x: 50, y: 50, rotation: 0, scale: 1.2, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 },
                    { id: 'ti1-b', shape: 'circle', x: 50, y: 30, rotation: 0, scale: 0.5, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 2 }],
        },
        {
          stepIndex: 2,
          label: '2',
          objects: [{ id: 'ti2', shape: 'diamond', x: 50, y: 50, rotation: 180, scale: 1.2, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 },
                    { id: 'ti2-b', shape: 'circle', x: 50, y: 70, rotation: 180, scale: 0.5, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 2 }],
        },
        {
          stepIndex: 3,
          label: '3',
          objects: [{ id: 'ti3', shape: 'diamond', x: 50, y: 50, rotation: 0, scale: 1.2, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 },
                    { id: 'ti3-b', shape: 'circle', x: 50, y: 30, rotation: 0, scale: 0.5, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 2 }],
        },
        {
          stepIndex: 4,
          label: '?',
          isMissing: true,
          objects: [],
        },
      ],
      options: [
        {
          id: 'opt-ti-a',
          objects: [{ id: 'oti-a', shape: 'diamond', x: 50, y: 50, rotation: 180, scale: 1.2, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 },
                    { id: 'oti-a-b', shape: 'circle', x: 50, y: 70, rotation: 180, scale: 0.5, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 2 }],
          isCorrect: true,
          explanation: 'Correct! The entire compound object is inverted 180°, placing the inner circle at the bottom.',
        },
        {
          id: 'opt-ti-b',
          objects: [{ id: 'oti-b', shape: 'diamond', x: 50, y: 50, rotation: 0, scale: 1.2, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 },
                    { id: 'oti-b-b', shape: 'circle', x: 50, y: 30, rotation: 0, scale: 0.5, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 2 }],
          isCorrect: false,
          explanation: 'This leaves the object upright, failing the inversion pattern.',
        },
      ],
    },
    pedagogicalTakeaway: 'A 180° rotation flips all coordinates through the origin point.',
  },
  {
    id: 'rot-104',
    title: 'Diagonal Increments (45° Turns)',
    moduleId: 'rotation',
    moduleTitle: 'Rotation & Angular Dynamics',
    subskillId: 'rot-incremental-45',
    subskillTitle: 'Diagonal Increments (45° Turns)',
    difficulty: 3,
    ageBand: '10-12',
    activityFormat: 'sequence',
    promptText: 'Look closely at the angle of rotation between consecutive frames.',
    observationPrompt: 'What kind of turn is occurring between frames?',
    observationChoices: [
      { id: 'obs-45', label: 'A gentle diagonal turn (45 degrees)', category: 'direction', isKeyFactor: true },
      { id: 'obs-90', label: 'A full quarter turn (90 degrees)', category: 'direction', isKeyFactor: false },
    ],
    frames: [
      { stepIndex: 1, label: '0°', objects: [{ id: 'f1-4', shape: 'arrow', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 }] },
      { stepIndex: 2, label: '45°', objects: [{ id: 'f2-4', shape: 'arrow', x: 50, y: 50, rotation: 45, scale: 1.0, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 }] },
      { stepIndex: 3, label: '90°', objects: [{ id: 'f3-4', shape: 'arrow', x: 50, y: 50, rotation: 90, scale: 1.0, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 }] },
      { stepIndex: 4, label: '?', isMissing: true, objects: [] },
    ],
    missingFrameIndex: 3,
    initialState: [{ id: 'user-4', shape: 'arrow', x: 50, y: 50, rotation: 90, scale: 1.0, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 }],
    targetState: [{ id: 'target-4', shape: 'arrow', x: 50, y: 50, rotation: 135, scale: 1.0, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 }],
    allowedActions: ['rotate-45', 'rotate-90-cw', 'rotate-90-ccw'],
    ruleOptions: [
      { id: 'rule-45-cw', label: 'The shape turns 45° clockwise each step (half a quarter turn).', isCorrect: true, explanation: '0° → 45° → 90° → 135°.' },
      { id: 'rule-90-err', label: 'The shape turns 90° clockwise.', isCorrect: false, explanation: 'Step 2 is at 45°, which is halfway to 90°.' },
    ],
    hints: [
      { tier: 1, name: 'Attention', content: 'Step 2 points to the top-right corner, not directly to the right.' },
      { tier: 2, name: 'Relationship', content: 'Each turn is an eighth of a full circle (45 degrees).' },
      { tier: 3, name: 'Guided Demonstration', content: 'From 90° (Right), add 45° to reach 135° (Bottom-Right).', actionPreview: { type: 'rotate', value: 135 } },
    ],
    explanationSteps: [
      'The rotation increment is 45° clockwise.',
      '0° (North) → 45° (Northeast) → 90° (East) → 135° (Southeast).',
    ],
    transferChallenge: {
      id: 'trans-rot-104',
      prompt: 'Which hexagon pointer follows the 45° clockwise progression from 90°?',
      ruleContext: 'The pointer turns 45° clockwise each frame.',
      missingIndex: 3,
      frames: [
        { stepIndex: 1, label: '1', objects: [{ id: 'tp1', shape: 'hexagon', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }] },
        { stepIndex: 2, label: '2', objects: [{ id: 'tp2', shape: 'hexagon', x: 50, y: 50, rotation: 45, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }] },
        { stepIndex: 3, label: '3', objects: [{ id: 'tp3', shape: 'hexagon', x: 50, y: 50, rotation: 90, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }] },
        { stepIndex: 4, label: '?', isMissing: true, objects: [] },
      ],
      options: [
        {
          id: 'opt-tp-a',
          objects: [{ id: 'otp-a', shape: 'hexagon', x: 50, y: 50, rotation: 135, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }],
          isCorrect: true,
          explanation: 'Correct! 135° is the precise 45° continuation.',
        },
        {
          id: 'opt-tp-b',
          objects: [{ id: 'otp-b', shape: 'hexagon', x: 50, y: 50, rotation: 180, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }],
          isCorrect: false,
          explanation: '180° skipped 45°.',
        },
      ],
    },
    pedagogicalTakeaway: 'Reasoning assessments often test intermediate 45° angles to assess precision.',
  },

  // ==========================================
  // MODULE 2: REFLECTION & AXIAL SYMMETRY
  // ==========================================
  {
    id: 'ref-101',
    title: 'The Chiral Crescent',
    moduleId: 'reflection',
    moduleTitle: 'Reflection & Axial Symmetry',
    subskillId: 'ref-horizontal',
    subskillTitle: 'Horizontal Mirror Reflection',
    difficulty: 1,
    ageBand: '8-10',
    activityFormat: 'sequence',
    promptText: 'Examine how the crescent moon mirrors across the central dividing axis.',
    observationPrompt: 'What happens to the crescent between Step 1 and Step 2?',
    observationChoices: [
      { id: 'obs-flip-h', label: 'It mirrors horizontally (left becomes right)', category: 'direction', isKeyFactor: true },
      { id: 'obs-rot', label: 'It turns around like a wheel', category: 'direction', isKeyFactor: false },
      { id: 'obs-size', label: 'It gets thicker and thinner', category: 'size', isKeyFactor: false },
    ],
    frames: [
      {
        stepIndex: 1,
        label: 'Step 1',
        objects: [{ id: 'rf1', shape: 'crescent', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#718C7B', reflectedX: false, reflectedY: false, zIndex: 1 }],
      },
      {
        stepIndex: 2,
        label: 'Step 2',
        objects: [{ id: 'rf2', shape: 'crescent', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#718C7B', reflectedX: true, reflectedY: false, zIndex: 1 }],
      },
      {
        stepIndex: 3,
        label: 'Step 3',
        objects: [{ id: 'rf3', shape: 'crescent', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#718C7B', reflectedX: false, reflectedY: false, zIndex: 1 }],
      },
      {
        stepIndex: 4,
        label: 'Step 4 (?)',
        isMissing: true,
        objects: [],
      },
    ],
    missingFrameIndex: 3,
    initialState: [
      { id: 'user-ref-1', shape: 'crescent', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#718C7B', reflectedX: false, reflectedY: false, zIndex: 1 },
    ],
    targetState: [
      { id: 'target-ref-1', shape: 'crescent', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#718C7B', reflectedX: true, reflectedY: false, zIndex: 1 },
    ],
    allowedActions: ['reflect-x', 'reflect-y'],
    ruleOptions: [
      {
        id: 'rule-flip-h',
        label: 'The shape reflects horizontally across a vertical mirror line each step.',
        isCorrect: true,
        explanation: 'The curve alternates facing right, then left, like looking into a mirror.',
      },
      {
        id: 'rule-rot-180',
        label: 'The shape rotates 180 degrees.',
        isCorrect: false,
        explanation: 'If rotated 180°, the top and bottom tips would trade places! Here, top stays top.',
      },
    ],
    hints: [
      {
        tier: 1,
        name: 'Attention',
        content: 'Check the tips of the crescent moon. Do the top and bottom tips swap, or does only the curve swap left-to-right?',
      },
      {
        tier: 2,
        name: 'Relationship',
        content: 'Because top stays at the top while left becomes right, this is a horizontal reflection (flip).',
      },
      {
        tier: 3,
        name: 'Guided Demonstration',
        content: 'Reflect the shape horizontally across the vertical axis.',
        actionPreview: { type: 'reflect', value: 'horizontal' },
      },
    ],
    explanationSteps: [
      'Reflection flips an object across a mirror line without rotating.',
      'In a horizontal reflection across a vertical mirror, the Y coordinates remain fixed while X coordinates invert.',
      'Step 1 faces left, Step 2 faces right, Step 3 faces left, so Step 4 must face right.',
    ],
    transferChallenge: {
      id: 'trans-ref-101',
      prompt: 'Select the horizontally reflected counterpart of this asymmetric arrow.',
      ruleContext: 'The shape reflects horizontally across the vertical midline.',
      missingIndex: 1,
      frames: [
        {
          stepIndex: 1,
          label: 'Original',
          objects: [{ id: 'tra1', shape: 'arrow', x: 50, y: 50, rotation: 90, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }],
        },
        {
          stepIndex: 2,
          label: 'Reflected (?)',
          isMissing: true,
          objects: [],
        },
      ],
      options: [
        {
          id: 'opt-ref-a',
          objects: [{ id: 'ora', shape: 'arrow', x: 50, y: 50, rotation: 270, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }],
          isCorrect: true,
          explanation: 'Correct! Horizontal reflection of an arrow pointing right turns it pointing left.',
        },
        {
          id: 'opt-ref-b',
          objects: [{ id: 'orb', shape: 'arrow', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }],
          isCorrect: false,
          explanation: 'Pointing up is a rotation, not a reflection.',
        },
      ],
    },
    pedagogicalTakeaway: 'Mirror reflections invert chirality; no pure rotation in the plane can replicate a reflection of an asymmetric shape.',
  },
  {
    id: 'ref-102',
    title: 'Water Reflection Horizon',
    moduleId: 'reflection',
    moduleTitle: 'Reflection & Axial Symmetry',
    subskillId: 'ref-vertical',
    subskillTitle: 'Vertical Water Reflection',
    difficulty: 2,
    ageBand: '8-10',
    activityFormat: 'analogy',
    promptText: 'Analyze the top-to-bottom reflection like a mountain reflecting over calm water.',
    observationPrompt: 'How does the shape in Box A transform to produce Box B?',
    observationChoices: [
      { id: 'obs-vert-flip', label: 'Flipped vertically over a horizontal horizon', category: 'direction', isKeyFactor: true },
      { id: 'obs-color-shift', label: 'Color inverted', category: 'color', isKeyFactor: false },
    ],
    frames: [
      {
        stepIndex: 1,
        label: 'A : Top',
        objects: [{ id: 'rf-v1', shape: 'triangle', x: 50, y: 40, rotation: 0, scale: 1.0, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 }],
      },
      {
        stepIndex: 2,
        label: 'B : Horizon Reflection',
        objects: [{ id: 'rf-v2', shape: 'triangle', x: 50, y: 60, rotation: 0, scale: 1.0, color: '#C99543', reflectedX: false, reflectedY: true, zIndex: 1 }],
      },
      {
        stepIndex: 3,
        label: 'C : Top',
        objects: [{ id: 'rf-v3', shape: 'arrow', x: 50, y: 40, rotation: 0, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }],
      },
      {
        stepIndex: 4,
        label: 'D (?)',
        isMissing: true,
        objects: [],
      },
    ],
    missingFrameIndex: 3,
    initialState: [
      { id: 'user-rv-1', shape: 'arrow', x: 50, y: 40, rotation: 0, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 },
    ],
    targetState: [
      { id: 'target-rv-1', shape: 'arrow', x: 50, y: 60, rotation: 0, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: true, zIndex: 1 },
    ],
    allowedActions: ['reflect-y', 'reposition'],
    ruleOptions: [
      {
        id: 'rule-vert-flip',
        label: 'Vertical reflection across a horizontal baseline.',
        isCorrect: true,
        explanation: 'Top points downward, mirroring across the water horizon.',
      },
      {
        id: 'rule-horiz-flip',
        label: 'Horizontal reflection across a vertical line.',
        isCorrect: false,
        explanation: 'Horizontal flip would keep the arrow pointing up.',
      },
    ],
    hints: [
      { tier: 1, name: 'Attention', content: 'Observe how Triangle A pointed up, and Triangle B pointed down.' },
      { tier: 2, name: 'Relationship', content: 'Apply the identical vertical flip rule to Arrow C.' },
      { tier: 3, name: 'Guided Demonstration', content: 'Reflect the arrow vertically across the horizon line.', actionPreview: { type: 'reflect', value: 'vertical' } },
    ],
    explanationSteps: [
      'A is to B as C is to D.',
      'A is reflected across the horizontal line to become B.',
      'Therefore, C (Arrow pointing up) must be reflected vertically to point down at position D.',
    ],
    transferChallenge: {
      id: 'trans-ref-102',
      prompt: 'Which crescent moon represents the vertical reflection of the upper crescent?',
      ruleContext: 'The figure reflects across a horizontal horizon line.',
      missingIndex: 1,
      frames: [
        {
          stepIndex: 1,
          label: 'Upper',
          objects: [{ id: 'tc-v1', shape: 'crescent', x: 50, y: 35, rotation: 90, scale: 1.0, color: '#718C7B', reflectedX: false, reflectedY: false, zIndex: 1 }],
        },
        {
          stepIndex: 2,
          label: 'Lower (?)',
          isMissing: true,
          objects: [],
        },
      ],
      options: [
        {
          id: 'opt-rv-a',
          objects: [{ id: 'orva', shape: 'crescent', x: 50, y: 65, rotation: 90, scale: 1.0, color: '#718C7B', reflectedX: false, reflectedY: true, zIndex: 1 }],
          isCorrect: true,
          explanation: 'Correct! The horns reflect vertically across the horizontal line.',
        },
        {
          id: 'opt-rv-b',
          objects: [{ id: 'orvb', shape: 'crescent', x: 50, y: 65, rotation: 90, scale: 1.0, color: '#718C7B', reflectedX: true, reflectedY: false, zIndex: 1 }],
          isCorrect: false,
          explanation: 'This reflected horizontally instead of vertically.',
        },
      ],
    },
    pedagogicalTakeaway: 'In analogy matrices, identify the spatial transform connecting row elements and transfer it to the target row.',
  },
  {
    id: 'ref-103',
    title: 'Reflection or Rotation? (The Chiral Test)',
    moduleId: 'reflection',
    moduleTitle: 'Reflection & Axial Symmetry',
    subskillId: 'ref-vs-rotation',
    subskillTitle: 'Reflection vs. Rotation Discrimination',
    difficulty: 3,
    ageBand: '10-12',
    activityFormat: 'transformation',
    promptText: 'One of the most common pitfalls on reasoning tests is confusing rotation with reflection.',
    observationPrompt: 'Can this transformation be achieved by merely rotating the shape, or does it require a reflection?',
    observationChoices: [
      { id: 'obs-must-reflect', label: 'It must be a reflection because chiral handedness changed', category: 'direction', isKeyFactor: true },
      { id: 'obs-can-rotate', label: 'It can be solved by turning 90 degrees', category: 'direction', isKeyFactor: false },
    ],
    frames: [
      {
        stepIndex: 1,
        label: 'Source',
        objects: [{ id: 'cr1', shape: 'crescent', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }],
      },
      {
        stepIndex: 2,
        label: 'Target',
        objects: [{ id: 'cr2', shape: 'crescent', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#0E2235', reflectedX: true, reflectedY: false, zIndex: 1 }],
      },
    ],
    missingFrameIndex: 1,
    initialState: [
      { id: 'user-cr-1', shape: 'crescent', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 },
    ],
    targetState: [
      { id: 'target-cr-1', shape: 'crescent', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#0E2235', reflectedX: true, reflectedY: false, zIndex: 1 },
    ],
    allowedActions: ['rotate-90-cw', 'rotate-90-ccw', 'reflect-x', 'reflect-y'],
    ruleOptions: [
      {
        id: 'rule-must-reflect',
        label: 'Horizontal reflection. No amount of 2D rotation can match this figure.',
        isCorrect: true,
        explanation: 'Try rotating the crescent 90°, 180°, or 270°. You will notice the curve and tips never match the reflected target without flipping!',
      },
      {
        id: 'rule-can-turn',
        label: 'Rotation of 180 degrees.',
        isCorrect: false,
        explanation: 'Rotate 180° and test it: the tips flip upside down, unlike the target!',
      },
    ],
    hints: [
      { tier: 1, name: 'Attention', content: 'Try using the rotation buttons in the experiment canvas. Can you get the crescent to match the target?' },
      { tier: 2, name: 'Relationship', content: 'Notice how rotating 180° inverts the tips. Only horizontal reflection keeps the tips in place while flipping the spine.' },
      { tier: 3, name: 'Guided Demonstration', content: 'Use the "Reflect Horizontally" action button to solve it instantly.', actionPreview: { type: 'reflect', value: 'horizontal' } },
    ],
    explanationSteps: [
      'An asymmetric shape has "handedness" (chirality).',
      'Rotation preserves handedness.',
      'Reflection reverses handedness.',
      'Therefore, a flipped crescent cannot be duplicated by rotation alone.',
    ],
    transferChallenge: {
      id: 'trans-ref-103',
      prompt: 'Which transformation produced Shape B from Shape A: Rotation or Reflection?',
      ruleContext: 'Determine whether handedness changed (reflection) or remained intact (rotation).',
      missingIndex: 1,
      frames: [
        {
          stepIndex: 1,
          label: 'Shape A',
          objects: [{ id: 'ta1', shape: 'triangle', x: 50, y: 50, rotation: 90, scale: 1.0, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 },
                    { id: 'ta1-dot', shape: 'circle', x: 65, y: 35, rotation: 0, scale: 0.35, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 2 }],
        },
        {
          stepIndex: 2,
          label: 'Shape B',
          objects: [{ id: 'ta2', shape: 'triangle', x: 50, y: 50, rotation: 90, scale: 1.0, color: '#C99543', reflectedX: false, reflectedY: true, zIndex: 1 },
                    { id: 'ta2-dot', shape: 'circle', x: 65, y: 65, rotation: 0, scale: 0.35, color: '#0E2235', reflectedX: false, reflectedY: true, zIndex: 2 }],
        },
      ],
      options: [
        {
          id: 'opt-chiral-ref',
          objects: [{ id: 'o-ref', shape: 'triangle', x: 50, y: 50, rotation: 90, scale: 1.0, color: '#C99543', reflectedX: false, reflectedY: true, zIndex: 1 },
                    { id: 'o-ref-d', shape: 'circle', x: 65, y: 65, rotation: 0, scale: 0.35, color: '#0E2235', reflectedX: false, reflectedY: true, zIndex: 2 }],
          isCorrect: true,
          explanation: 'Correct! The indicator dot moved across the horizontal axis, proving vertical reflection.',
        },
        {
          id: 'opt-chiral-rot',
          objects: [{ id: 'o-rot', shape: 'triangle', x: 50, y: 50, rotation: 270, scale: 1.0, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 },
                    { id: 'o-rot-d', shape: 'circle', x: 35, y: 65, rotation: 0, scale: 0.35, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 2 }],
          isCorrect: false,
          explanation: 'This is a 180° rotation, which turns the triangle to point left.',
        },
      ],
    },
    pedagogicalTakeaway: 'The "point-test" (tracking an asymmetrical marker or tip) reliably distinguishes reflection from rotation.',
  },

  // ==========================================
  // MODULE 3: VISUAL PROGRESSION & SEQUENCE RULES
  // ==========================================
  {
    id: 'prog-101',
    title: 'The Ascending Archway (+1 Count)',
    moduleId: 'progression',
    moduleTitle: 'Visual Progression & Sequence Rules',
    subskillId: 'prog-count-step',
    subskillTitle: 'Shape Count Steps (+1 / -1)',
    difficulty: 1,
    ageBand: '8-10',
    activityFormat: 'sequence',
    promptText: 'Count the elements inside each consecutive frame of the sequence.',
    observationPrompt: 'What arithmetic or visual pattern is happening to the dots?',
    observationChoices: [
      { id: 'obs-count-up', label: 'One dot is added in each step (+1)', category: 'count', isKeyFactor: true },
      { id: 'obs-color-change', label: 'The dot colors are shifting', category: 'color', isKeyFactor: false },
      { id: 'obs-scale-up', label: 'The dots are getting larger', category: 'size', isKeyFactor: false },
    ],
    frames: [
      {
        stepIndex: 1,
        label: '1 Dot',
        objects: [{ id: 'p1-1', shape: 'circle', x: 50, y: 50, rotation: 0, scale: 0.7, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 }],
      },
      {
        stepIndex: 2,
        label: '2 Dots',
        objects: [
          { id: 'p2-1', shape: 'circle', x: 35, y: 50, rotation: 0, scale: 0.7, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 },
          { id: 'p2-2', shape: 'circle', x: 65, y: 50, rotation: 0, scale: 0.7, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 },
        ],
      },
      {
        stepIndex: 3,
        label: '3 Dots',
        objects: [
          { id: 'p3-1', shape: 'circle', x: 25, y: 50, rotation: 0, scale: 0.7, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 },
          { id: 'p3-2', shape: 'circle', x: 50, y: 50, rotation: 0, scale: 0.7, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 },
          { id: 'p3-3', shape: 'circle', x: 75, y: 50, rotation: 0, scale: 0.7, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 },
        ],
      },
      {
        stepIndex: 4,
        label: '4 (?)',
        isMissing: true,
        objects: [],
      },
    ],
    missingFrameIndex: 3,
    initialState: [
      { id: 'user-p-1', shape: 'circle', x: 20, y: 50, rotation: 0, scale: 0.7, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 },
      { id: 'user-p-2', shape: 'circle', x: 40, y: 50, rotation: 0, scale: 0.7, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 },
      { id: 'user-p-3', shape: 'circle', x: 60, y: 50, rotation: 0, scale: 0.7, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 },
    ],
    targetState: [
      { id: 'target-p-1', shape: 'circle', x: 20, y: 50, rotation: 0, scale: 0.7, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 },
      { id: 'target-p-2', shape: 'circle', x: 40, y: 50, rotation: 0, scale: 0.7, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 },
      { id: 'target-p-3', shape: 'circle', x: 60, y: 50, rotation: 0, scale: 0.7, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 },
      { id: 'target-p-4', shape: 'circle', x: 80, y: 50, rotation: 0, scale: 0.7, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 },
    ],
    allowedActions: ['add-element', 'remove-element'],
    ruleOptions: [
      {
        id: 'rule-plus-one',
        label: 'Each frame adds exactly one dot (+1 progression).',
        isCorrect: true,
        explanation: 'Sequence count is 1, 2, 3, and the fourth must have 4.',
      },
      {
        id: 'rule-doubling',
        label: 'The dots double each time (1, 2, 4, 8).',
        isCorrect: false,
        explanation: 'Step 3 has 3 dots, not 4 dots.',
      },
    ],
    hints: [
      { tier: 1, name: 'Attention', content: 'Count the number of items in each frame: 1, then 2, then 3.' },
      { tier: 2, name: 'Relationship', content: 'The pattern increases by adding 1 element at each consecutive step.' },
      { tier: 3, name: 'Guided Demonstration', content: 'Add a 4th circle to complete the sequence of 4.', actionPreview: { type: 'shift', value: 4 } },
    ],
    explanationSteps: [
      'Frame 1: 1 circle.',
      'Frame 2: 2 circles.',
      'Frame 3: 3 circles.',
      'Frame 4: 4 circles.',
    ],
    transferChallenge: {
      id: 'trans-prog-101',
      prompt: 'Apply the +1 progression rule to this sequence of stars.',
      ruleContext: 'The count of stars increases by 1 in each step.',
      missingIndex: 3,
      frames: [
        { stepIndex: 1, label: '1', objects: [{ id: 'ts1', shape: 'star', x: 50, y: 50, rotation: 0, scale: 0.8, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }] },
        { stepIndex: 2, label: '2', objects: [
          { id: 'ts2-a', shape: 'star', x: 35, y: 50, rotation: 0, scale: 0.8, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 },
          { id: 'ts2-b', shape: 'star', x: 65, y: 50, rotation: 0, scale: 0.8, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 },
        ]},
        { stepIndex: 3, label: '3', objects: [
          { id: 'ts3-a', shape: 'star', x: 25, y: 50, rotation: 0, scale: 0.8, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 },
          { id: 'ts3-b', shape: 'star', x: 50, y: 50, rotation: 0, scale: 0.8, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 },
          { id: 'ts3-c', shape: 'star', x: 75, y: 50, rotation: 0, scale: 0.8, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 },
        ]},
        { stepIndex: 4, label: '?', isMissing: true, objects: [] },
      ],
      options: [
        {
          id: 'opt-ts-4',
          objects: [
            { id: 'ots-1', shape: 'star', x: 20, y: 50, rotation: 0, scale: 0.8, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 },
            { id: 'ots-2', shape: 'star', x: 40, y: 50, rotation: 0, scale: 0.8, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 },
            { id: 'ots-3', shape: 'star', x: 60, y: 50, rotation: 0, scale: 0.8, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 },
            { id: 'ots-4', shape: 'star', x: 80, y: 50, rotation: 0, scale: 0.8, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 },
          ],
          isCorrect: true,
          explanation: 'Correct! 4 stars continue the +1 count progression.',
        },
        {
          id: 'opt-ts-5',
          objects: [
            { id: 'ots-5a', shape: 'star', x: 15, y: 50, rotation: 0, scale: 0.7, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 },
            { id: 'ots-5b', shape: 'star', x: 32, y: 50, rotation: 0, scale: 0.7, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 },
            { id: 'ots-5c', shape: 'star', x: 50, y: 50, rotation: 0, scale: 0.7, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 },
            { id: 'ots-5d', shape: 'star', x: 68, y: 50, rotation: 0, scale: 0.7, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 },
            { id: 'ots-5e', shape: 'star', x: 85, y: 50, rotation: 0, scale: 0.7, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 },
          ],
          isCorrect: false,
          explanation: 'This has 5 stars, jumping two steps.',
        },
      ],
    },
    pedagogicalTakeaway: 'Numerical invariance across spatial frames forms the basis of quantitative reasoning.',
  },
  {
    id: 'prog-102',
    title: 'Nested Concentric Scaling',
    moduleId: 'progression',
    moduleTitle: 'Visual Progression & Sequence Rules',
    subskillId: 'prog-size-scale',
    subskillTitle: 'Proportional Size Progression',
    difficulty: 2,
    ageBand: '8-10',
    activityFormat: 'sequence',
    promptText: 'Study the geometric dimensions of the square across each step.',
    observationPrompt: 'What attribute is systematically decreasing?',
    observationChoices: [
      { id: 'obs-scale-down', label: 'The size of the square is shrinking step by step', category: 'size', isKeyFactor: true },
      { id: 'obs-rot-sq', label: 'The square is turning', category: 'direction', isKeyFactor: false },
    ],
    frames: [
      { stepIndex: 1, label: 'Scale 1.4', objects: [{ id: 'ps1', shape: 'square', x: 50, y: 50, rotation: 0, scale: 1.4, color: '#718C7B', reflectedX: false, reflectedY: false, zIndex: 1 }] },
      { stepIndex: 2, label: 'Scale 1.1', objects: [{ id: 'ps2', shape: 'square', x: 50, y: 50, rotation: 0, scale: 1.1, color: '#718C7B', reflectedX: false, reflectedY: false, zIndex: 1 }] },
      { stepIndex: 3, label: 'Scale 0.8', objects: [{ id: 'ps3', shape: 'square', x: 50, y: 50, rotation: 0, scale: 0.8, color: '#718C7B', reflectedX: false, reflectedY: false, zIndex: 1 }] },
      { stepIndex: 4, label: '?', isMissing: true, objects: [] },
    ],
    missingFrameIndex: 3,
    initialState: [{ id: 'user-ps', shape: 'square', x: 50, y: 50, rotation: 0, scale: 0.8, color: '#718C7B', reflectedX: false, reflectedY: false, zIndex: 1 }],
    targetState: [{ id: 'target-ps', shape: 'square', x: 50, y: 50, rotation: 0, scale: 0.5, color: '#718C7B', reflectedX: false, reflectedY: false, zIndex: 1 }],
    allowedActions: ['resize'],
    ruleOptions: [
      { id: 'rule-shrink', label: 'The shape reduces in scale proportionally at each frame.', isCorrect: true, explanation: 'Large → Medium-Large → Medium-Small → Smallest.' },
      { id: 'rule-grow', label: 'The shape expands.', isCorrect: false, explanation: 'It is getting smaller, not larger.' },
    ],
    hints: [
      { tier: 1, name: 'Attention', content: 'Compare the outer boundaries of Step 1 and Step 3.' },
      { tier: 2, name: 'Relationship', content: 'Each step reduces the square scale by 0.3 units.' },
      { tier: 3, name: 'Guided Demonstration', content: 'Shrink the square to scale 0.5.', actionPreview: { type: 'scale', value: 0.5 } },
    ],
    explanationSteps: [
      'Size decreases proportionally across the sequence.',
      '1.4 → 1.1 → 0.8 → 0.5.',
    ],
    transferChallenge: {
      id: 'trans-prog-102',
      prompt: 'Select the circle that completes the shrinking size progression.',
      ruleContext: 'The shape shrinks in equal size steps.',
      missingIndex: 3,
      frames: [
        { stepIndex: 1, label: '1', objects: [{ id: 'tc-sc-1', shape: 'circle', x: 50, y: 50, rotation: 0, scale: 1.4, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 }] },
        { stepIndex: 2, label: '2', objects: [{ id: 'tc-sc-2', shape: 'circle', x: 50, y: 50, rotation: 0, scale: 1.1, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 }] },
        { stepIndex: 3, label: '3', objects: [{ id: 'tc-sc-3', shape: 'circle', x: 50, y: 50, rotation: 0, scale: 0.8, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 }] },
        { stepIndex: 4, label: '?', isMissing: true, objects: [] },
      ],
      options: [
        {
          id: 'opt-sc-small',
          objects: [{ id: 'osc-s', shape: 'circle', x: 50, y: 50, rotation: 0, scale: 0.5, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 }],
          isCorrect: true,
          explanation: 'Correct! The smallest circle continues the decreasing scale rule.',
        },
        {
          id: 'opt-sc-big',
          objects: [{ id: 'osc-b', shape: 'circle', x: 50, y: 50, rotation: 0, scale: 1.4, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 }],
          isCorrect: false,
          explanation: 'This returns to the initial large size.',
        },
      ],
    },
    pedagogicalTakeaway: 'Scale variance requires estimating proportional ratio differences between successive figures.',
  },
  {
    id: 'prog-103',
    title: 'Clockwise Corner Orbit',
    moduleId: 'progression',
    moduleTitle: 'Visual Progression & Sequence Rules',
    subskillId: 'prog-position-orbit',
    subskillTitle: 'Translational Orbit & Grid Moves',
    difficulty: 3,
    ageBand: '10-12',
    activityFormat: 'sequence',
    promptText: 'Track the path of the satellite element moving around the corners.',
    observationPrompt: 'How is the small element moving inside the square frame?',
    observationChoices: [
      { id: 'obs-pos-orbit', label: 'It travels from corner to corner clockwise', category: 'position', isKeyFactor: true },
      { id: 'obs-shape-c', label: 'It changes into different shapes', category: 'shape', isKeyFactor: false },
    ],
    frames: [
      { stepIndex: 1, label: 'Top-Left', objects: [{ id: 'co1', shape: 'circle', x: 25, y: 25, rotation: 0, scale: 0.6, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }] },
      { stepIndex: 2, label: 'Top-Right', objects: [{ id: 'co2', shape: 'circle', x: 75, y: 25, rotation: 0, scale: 0.6, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }] },
      { stepIndex: 3, label: 'Bottom-Right', objects: [{ id: 'co3', shape: 'circle', x: 75, y: 75, rotation: 0, scale: 0.6, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }] },
      { stepIndex: 4, label: '?', isMissing: true, objects: [] },
    ],
    missingFrameIndex: 3,
    initialState: [{ id: 'user-co', shape: 'circle', x: 50, y: 50, rotation: 0, scale: 0.6, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }],
    targetState: [{ id: 'target-co', shape: 'circle', x: 25, y: 75, rotation: 0, scale: 0.6, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }],
    allowedActions: ['reposition'],
    ruleOptions: [
      { id: 'rule-orbit-cw', label: 'The dot steps one corner clockwise around the perimeter each frame.', isCorrect: true, explanation: 'Top-Left → Top-Right → Bottom-Right → Bottom-Left.' },
      { id: 'rule-diagonal', label: 'The dot jumps diagonally across the center.', isCorrect: false, explanation: 'It is following the perimeter corners in clock order.' },
    ],
    hints: [
      { tier: 1, name: 'Attention', content: 'Follow the 4 corners: Top-Left, Top-Right, Bottom-Right.' },
      { tier: 2, name: 'Relationship', content: 'Which corner has not been visited yet along the clockwise path?' },
      { tier: 3, name: 'Guided Demonstration', content: 'Move the dot to the Bottom-Left corner (x: 25, y: 75).', actionPreview: { type: 'shift', value: 'bottom-left' } },
    ],
    explanationSteps: [
      'Step 1: (25, 25) Top-Left.',
      'Step 2: (75, 25) Top-Right.',
      'Step 3: (75, 75) Bottom-Right.',
      'Step 4: (25, 75) Bottom-Left.',
    ],
    transferChallenge: {
      id: 'trans-prog-103',
      prompt: 'Which frame completes the clockwise corner orbit for the diamond?',
      ruleContext: 'The element advances one corner clockwise each step.',
      missingIndex: 3,
      frames: [
        { stepIndex: 1, label: '1', objects: [{ id: 'tco1', shape: 'diamond', x: 25, y: 25, rotation: 0, scale: 0.6, color: '#718C7B', reflectedX: false, reflectedY: false, zIndex: 1 }] },
        { stepIndex: 2, label: '2', objects: [{ id: 'tco2', shape: 'diamond', x: 75, y: 25, rotation: 0, scale: 0.6, color: '#718C7B', reflectedX: false, reflectedY: false, zIndex: 1 }] },
        { stepIndex: 3, label: '3', objects: [{ id: 'tco3', shape: 'diamond', x: 75, y: 75, rotation: 0, scale: 0.6, color: '#718C7B', reflectedX: false, reflectedY: false, zIndex: 1 }] },
        { stepIndex: 4, label: '?', isMissing: true, objects: [] },
      ],
      options: [
        {
          id: 'opt-tco-bl',
          objects: [{ id: 'otco-bl', shape: 'diamond', x: 25, y: 75, rotation: 0, scale: 0.6, color: '#718C7B', reflectedX: false, reflectedY: false, zIndex: 1 }],
          isCorrect: true,
          explanation: 'Correct! Bottom-Left finishes the clockwise corner cycle.',
        },
        {
          id: 'opt-tco-tl',
          objects: [{ id: 'otco-tl', shape: 'diamond', x: 25, y: 25, rotation: 0, scale: 0.6, color: '#718C7B', reflectedX: false, reflectedY: false, zIndex: 1 }],
          isCorrect: false,
          explanation: 'Top-Left was Step 1.',
        },
      ],
    },
    pedagogicalTakeaway: 'Orbital transformations decouple position translation from shape orientation.',
  },

  // ==========================================
  // MODULE 4: COLOR & ATTRIBUTE CONJUNCTIONS
  // ==========================================
  {
    id: 'attr-101',
    title: 'The Tri-Color Loom',
    moduleId: 'attributes',
    moduleTitle: 'Color & Attribute Conjunctions',
    subskillId: 'attr-color-cycle',
    subskillTitle: 'Triadic & Binary Color Cycles',
    difficulty: 1,
    ageBand: '8-10',
    activityFormat: 'sequence',
    promptText: 'Look at the color pattern repeating across the frames.',
    observationPrompt: 'What attribute is cycling through a predictable sequence?',
    observationChoices: [
      { id: 'obs-color-cycle', label: 'The fill color cycles: Ochre → Navy → Sage', category: 'color', isKeyFactor: true },
      { id: 'obs-rot-c', label: 'The shape is rotating', category: 'direction', isKeyFactor: false },
    ],
    frames: [
      { stepIndex: 1, label: 'Ochre', objects: [{ id: 'cl1', shape: 'hexagon', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 }] },
      { stepIndex: 2, label: 'Navy', objects: [{ id: 'cl2', shape: 'hexagon', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }] },
      { stepIndex: 3, label: 'Sage', objects: [{ id: 'cl3', shape: 'hexagon', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#718C7B', reflectedX: false, reflectedY: false, zIndex: 1 }] },
      { stepIndex: 4, label: '?', isMissing: true, objects: [] },
    ],
    missingFrameIndex: 3,
    initialState: [{ id: 'user-cl', shape: 'hexagon', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }],
    targetState: [{ id: 'target-cl', shape: 'hexagon', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 }],
    allowedActions: ['change-color'],
    ruleOptions: [
      { id: 'rule-cycle-3', label: 'A 3-color repeating cycle: Ochre, Navy, Sage, then back to Ochre.', isCorrect: true, explanation: 'After completing the trio, the loop restarts.' },
      { id: 'rule-random-c', label: 'Colors alternate between two colors only.', isCorrect: false, explanation: 'There are three distinct colors in the sequence.' },
    ],
    hints: [
      { tier: 1, name: 'Attention', content: 'Say the colors out loud in order: Ochre, Navy, Sage...' },
      { tier: 2, name: 'Relationship', content: 'In a modular cycle of 3, the fourth position restarts the cycle.' },
      { tier: 3, name: 'Guided Demonstration', content: 'Select Ochre (#C99543) for the fourth position.', actionPreview: { type: 'color', value: '#C99543' } },
    ],
    explanationSteps: [
      'Position 1: Ochre (#C99543).',
      'Position 2: Navy (#0E2235).',
      'Position 3: Sage (#718C7B).',
      'Position 4 restarts at Ochre (#C99543).',
    ],
    transferChallenge: {
      id: 'trans-attr-101',
      prompt: 'Which star restarts the Ochre → Navy → Sage color cycle?',
      ruleContext: 'The 3-color cycle restarts at index 4.',
      missingIndex: 3,
      frames: [
        { stepIndex: 1, label: '1', objects: [{ id: 'ts-cl1', shape: 'star', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 }] },
        { stepIndex: 2, label: '2', objects: [{ id: 'ts-cl2', shape: 'star', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }] },
        { stepIndex: 3, label: '3', objects: [{ id: 'ts-cl3', shape: 'star', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#718C7B', reflectedX: false, reflectedY: false, zIndex: 1 }] },
        { stepIndex: 4, label: '?', isMissing: true, objects: [] },
      ],
      options: [
        {
          id: 'opt-tcl-ochre',
          objects: [{ id: 'otcl-ochre', shape: 'star', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 }],
          isCorrect: true,
          explanation: 'Correct! Ochre restarts the tri-color progression.',
        },
        {
          id: 'opt-tcl-sage',
          objects: [{ id: 'otcl-sage', shape: 'star', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#718C7B', reflectedX: false, reflectedY: false, zIndex: 1 }],
          isCorrect: false,
          explanation: 'Sage was step 3.',
        },
      ],
    },
    pedagogicalTakeaway: 'Modular arithmetic mod 3 underpins cyclic attribute sequences in gifted assessments.',
  },
  {
    id: 'attr-102',
    title: 'Dual Rule Conjunction (Rotation + Color)',
    moduleId: 'attributes',
    moduleTitle: 'Color & Attribute Conjunctions',
    subskillId: 'attr-dual-conjunction',
    subskillTitle: 'Dual Conjunction (Rotation + Color)',
    difficulty: 3,
    ageBand: '10-12',
    activityFormat: 'sequence',
    promptText: 'Two different rules are happening at the exact same time!',
    observationPrompt: 'Which TWO properties are changing simultaneously?',
    observationChoices: [
      { id: 'obs-two-props', label: 'Direction (rotation) AND color both change', category: 'direction', isKeyFactor: true },
      { id: 'obs-one-prop', label: 'Only the size is changing', category: 'size', isKeyFactor: false },
    ],
    frames: [
      { stepIndex: 1, label: 'Up · Ochre', objects: [{ id: 'dc1', shape: 'arrow', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 }] },
      { stepIndex: 2, label: 'Right · Navy', objects: [{ id: 'dc2', shape: 'arrow', x: 50, y: 50, rotation: 90, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }] },
      { stepIndex: 3, label: 'Down · Ochre', objects: [{ id: 'dc3', shape: 'arrow', x: 50, y: 50, rotation: 180, scale: 1.0, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 }] },
      { stepIndex: 4, label: '?', isMissing: true, objects: [] },
    ],
    missingFrameIndex: 3,
    initialState: [{ id: 'user-dc', shape: 'arrow', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 }],
    targetState: [{ id: 'target-dc', shape: 'arrow', x: 50, y: 50, rotation: 270, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }],
    allowedActions: ['rotate-90-cw', 'rotate-90-ccw', 'change-color'],
    ruleOptions: [
      {
        id: 'rule-dual-rot-col',
        label: 'Rotates 90° clockwise AND alternates color (Ochre ↔ Navy).',
        isCorrect: true,
        explanation: 'From Down (180°), 90° clockwise is Left (270°). Color switches from Ochre to Navy.',
      },
      {
        id: 'rule-only-rot',
        label: 'Only rotates 90° clockwise, color stays constant.',
        isCorrect: false,
        explanation: 'Color alternated in step 2 and 3.',
      },
    ],
    hints: [
      { tier: 1, name: 'Attention', content: 'Separate the two problems: first solve the direction, then solve the color.' },
      { tier: 2, name: 'Relationship', content: 'Direction turns 90° clockwise (Left). Color alternates: Ochre, Navy, Ochre, so next is Navy.' },
      { tier: 3, name: 'Guided Demonstration', content: 'Rotate to 270° Left and set color to Navy (#0E2235).', actionPreview: { type: 'rotate', value: 270 } },
    ],
    explanationSteps: [
      'Rule 1 (Orientation): 0° → 90° → 180° → 270° (Left).',
      'Rule 2 (Color): Ochre → Navy → Ochre → Navy.',
      'Conjunction result: Left-pointing Navy arrow.',
    ],
    transferChallenge: {
      id: 'trans-attr-102',
      prompt: 'Select the triangle with the correct dual conjunction: 90° clockwise turn + alternating color.',
      ruleContext: 'The shape turns 90° clockwise each step and alternates Ochre/Navy.',
      missingIndex: 3,
      frames: [
        { stepIndex: 1, label: '1', objects: [{ id: 'dt1', shape: 'triangle', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 }] },
        { stepIndex: 2, label: '2', objects: [{ id: 'dt2', shape: 'triangle', x: 50, y: 50, rotation: 90, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }] },
        { stepIndex: 3, label: '3', objects: [{ id: 'dt3', shape: 'triangle', x: 50, y: 50, rotation: 180, scale: 1.0, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 }] },
        { stepIndex: 4, label: '?', isMissing: true, objects: [] },
      ],
      options: [
        {
          id: 'opt-dt-navy-left',
          objects: [{ id: 'odt-nl', shape: 'triangle', x: 50, y: 50, rotation: 270, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }],
          isCorrect: true,
          explanation: 'Correct! Vertex points Left (270°) and color is Navy (#0E2235).',
        },
        {
          id: 'opt-dt-ochre-left',
          objects: [{ id: 'odt-ol', shape: 'triangle', x: 50, y: 50, rotation: 270, scale: 1.0, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 }],
          isCorrect: false,
          explanation: 'Direction is right, but color should be Navy, not Ochre.',
        },
      ],
    },
    pedagogicalTakeaway: 'Conjunctive reasoning tests the child\'s working memory capacity to track two rules in parallel.',
  },
  {
    id: 'attr-103',
    title: 'Distractor Shield (Invariant vs Noisy Attributes)',
    moduleId: 'attributes',
    moduleTitle: 'Color & Attribute Conjunctions',
    subskillId: 'attr-distractor-filter',
    subskillTitle: 'Distractor Attribute Invariance',
    difficulty: 3,
    ageBand: '10-12',
    activityFormat: 'sequence',
    promptText: 'Filter out the distracting noise to find which rule actually matters.',
    observationPrompt: 'Which property is governed by a consistent, predictable rule?',
    observationChoices: [
      { id: 'obs-clean-rot', label: 'The direction rotates in regular 90° steps; color changes are random', category: 'direction', isKeyFactor: true },
      { id: 'obs-color-noise', label: 'Color is the primary rule', category: 'color', isKeyFactor: false },
    ],
    frames: [
      { stepIndex: 1, label: 'Up', objects: [{ id: 'df1', shape: 'arrow', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 }] },
      { stepIndex: 2, label: 'Right', objects: [{ id: 'df2', shape: 'arrow', x: 50, y: 50, rotation: 90, scale: 1.0, color: '#718C7B', reflectedX: false, reflectedY: false, zIndex: 1 }] },
      { stepIndex: 3, label: 'Down', objects: [{ id: 'df3', shape: 'arrow', x: 50, y: 50, rotation: 180, scale: 1.0, color: '#2B4C7E', reflectedX: false, reflectedY: false, zIndex: 1 }] },
      { stepIndex: 4, label: '?', isMissing: true, objects: [] },
    ],
    missingFrameIndex: 3,
    initialState: [{ id: 'user-df', shape: 'arrow', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }],
    targetState: [{ id: 'target-df', shape: 'arrow', x: 50, y: 50, rotation: 270, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }],
    allowedActions: ['rotate-90-cw', 'rotate-90-ccw'],
    ruleOptions: [
      {
        id: 'rule-rot-only',
        label: 'Orientation is the only true rule (90° clockwise). The colors are non-rule distractors.',
        isCorrect: true,
        explanation: 'In advanced tests, extraneous features are placed to test cognitive filtering.',
      },
      {
        id: 'rule-col-only',
        label: 'Color is predictable.',
        isCorrect: false,
        explanation: 'The colors jump unpredictably, whereas orientation is strictly 90° clockwise.',
      },
    ],
    hints: [
      { tier: 1, name: 'Attention', content: 'Ignore the colors completely and look only at the pointing direction.' },
      { tier: 2, name: 'Relationship', content: 'Up, Right, Down: the next rotation must point Left (270°).' },
      { tier: 3, name: 'Guided Demonstration', content: 'Rotate to 270° pointing Left.', actionPreview: { type: 'rotate', value: 270 } },
    ],
    explanationSteps: [
      'Standardized visual reasoning assessments (CogAT / NNAT) often include irrelevant visual variations.',
      'Learning to suppress distractor cues is a hallmark of mature visual reasoning.',
    ],
    transferChallenge: {
      id: 'trans-attr-103',
      prompt: 'Identify the shape that satisfies the true orientation rule, ignoring background color.',
      ruleContext: 'The pointer turns 90° clockwise; color variation is irrelevant.',
      missingIndex: 3,
      frames: [
        { stepIndex: 1, label: '1', objects: [{ id: 'tdf1', shape: 'crescent', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 }] },
        { stepIndex: 2, label: '2', objects: [{ id: 'tdf2', shape: 'crescent', x: 50, y: 50, rotation: 90, scale: 1.0, color: '#718C7B', reflectedX: false, reflectedY: false, zIndex: 1 }] },
        { stepIndex: 3, label: '3', objects: [{ id: 'tdf3', shape: 'crescent', x: 50, y: 50, rotation: 180, scale: 1.0, color: '#0E2235', reflectedX: false, reflectedY: false, zIndex: 1 }] },
        { stepIndex: 4, label: '?', isMissing: true, objects: [] },
      ],
      options: [
        {
          id: 'opt-tdf-left',
          objects: [{ id: 'otdf-l', shape: 'crescent', x: 50, y: 50, rotation: 270, scale: 1.0, color: '#5C6B73', reflectedX: false, reflectedY: false, zIndex: 1 }],
          isCorrect: true,
          explanation: 'Correct! Orientation at 270° satisfies the invariant rule.',
        },
        {
          id: 'opt-tdf-up',
          objects: [{ id: 'otdf-u', shape: 'crescent', x: 50, y: 50, rotation: 0, scale: 1.0, color: '#C99543', reflectedX: false, reflectedY: false, zIndex: 1 }],
          isCorrect: false,
          explanation: 'This points up, matching step 1 color but violating rotation.',
        },
      ],
    },
    pedagogicalTakeaway: 'Distractor suppression is the cognitive ability to filter irrelevant visual noise.',
  },
];

// Helper to get activity by ID
export function getActivityById(id: string): ReasoningActivity | undefined {
  return ACTIVITIES.find((a) => a.id === id);
}

// Helper to get activities for a module
export function getActivitiesByModule(moduleId: string): ReasoningActivity[] {
  return ACTIVITIES.filter((a) => a.moduleId === moduleId);
}
