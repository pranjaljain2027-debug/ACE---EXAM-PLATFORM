/**
 * Assessment coverage disclosures. Editable reference content: keep claims conservative,
 * never state publisher edition, level, timing or norm facts here without a cited source.
 */
export type GoalId = 'general' | 'cogat' | 'olsat' | 'nnat';

export const GOALS: { id: GoalId; title: string; covers: string[]; notCovered: string[] }[] = [
  {
    id: 'general',
    title: 'General visual reasoning',
    covers: ['Turning shapes (rotation)', 'Mirror images (reflection)', 'Patterns that grow or repeat', 'Colour and multi-rule changes'],
    notCovered: ['Reading, vocabulary and maths word problems'],
  },
  {
    id: 'cogat',
    title: 'CogAT',
    covers: ['Nonverbal: figure matrices', 'Nonverbal: figure classification', 'Spatial transformation foundations for paper folding'],
    notCovered: ['Verbal battery', 'Quantitative battery', 'Paper folding items themselves (planned)', 'Official timing and scoring'],
  },
  {
    id: 'olsat',
    title: 'OLSAT',
    covers: ['Nonverbal: figural analogies', 'Nonverbal: figural classification', 'Nonverbal: pattern and series reasoning'],
    notCovered: ['Verbal comprehension and verbal reasoning', 'Quantitative reasoning items', 'Official timing and scoring'],
  },
  {
    id: 'nnat',
    title: 'NNAT',
    covers: ['Pattern completion', 'Reasoning by analogy', 'Serial reasoning', 'Spatial visualization foundations'],
    notCovered: ['The exact item styles and timing of the real test', 'Official scoring'],
  },
];

export const AFFILIATION_NOTE =
  'Heir of Wisdom is independent. It is not affiliated with, endorsed by or connected to the publishers of CogAT, OLSAT or NNAT, which are trademarks of their respective owners. All practice items are original. We do not predict scores, percentiles or admission outcomes.';
