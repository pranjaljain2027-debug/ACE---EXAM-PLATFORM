# Question bank

How original questions get from a file to a child's screen. Plan reference: HEIR_OF_WISDOM_3D_SPATIAL_REASONING_PLAN §17 to §20.

## Lifecycle

```
file ──validate (local)──> import (dry run) ──> import ──> review_required
                                                  │              │
                                                  └─ validation_failed (closed; fix as a new version)
review_required ──approve──> approved ──publish──> published ──retire──> retired ──rollback──> published
        │                                                                     
        ├─request changes──> changes_requested ──approve / reject
        └─reject──> rejected (closed)
```

Rules the database enforces (migration `20261024000005_question_bank.sql`):

- A version is immutable once imported. Payload, answer key, type, topic and validation report cannot change. Fixes ship as `version + 1`.
- Only `service_role` can call the importer. Browsers go through the `bank-import` edge function, which checks the caller has a staff role and runs the TypeScript validator itself.
- Approval needs a named reviewer (or, via the operator-only `owner_publish` function, the owner's name, recorded as `approval_basis = 'owner_instruction'`) (a row in `staff_roles`), a passed validation report, and the checklist: learner view checked, single answer confirmed, age appropriate. Verbal items also need "semantic review done".
- Publishing needs `approved`. Publishing a new version retires the old one.
- Learners only ever see `published` rows, through RPCs. The answer key never leaves the server before the child answers. The hint is held back until it is requested and counted.
- Spatial items are predict-first: `qa_explore`, `qa_hint` and `qa_answer` refuse until `qa_predict` has recorded the first guess. The first guess cannot be changed.

## Roles

Reviewers and authors are ordinary parent accounts with a staff role. Grant from the Supabase SQL editor after the person has signed up:

```sql
select public.grant_staff_by_email('person@example.com', 'reviewer', 'granted by <your name>');
```

Roles: `author` (import, view), `reviewer` (also approve, publish, retire, roll back), `admin` (everything).
The staff area is at `/staff` and sits behind the parent PIN.

## File format

A batch file is JSON:

```json
{ "batch_id": "seed-batch-002", "questions": [ BankQuestion, ... ] }
```

Schema: [`docs/question-bank.schema.json`](question-bank.schema.json). Types: `src/content/bank/schema.ts`. Full examples of every supported type: `content/bank/seed-batch-001.json`.

Required on every question: `id` (lowercase, digits, hyphens), `version`, `question_type`, `title`, `primary_topic`, `secondary_topics`, `exam_alignment`, `age_band`, `reading_load`, `difficulty` (1 to 5), `language`, `learning_objective`, `accessibility` (`alt`, `relies_on_color`), `payload`, `answer_key`, `authoring`.

- `payload` is what the learner sees. It must not contain `correct`, `rationales`, `distractor_kinds` or `solution`.
- `answer_key.correct` is an option id. `rationales` covers every option. `distractor_kinds` covers every wrong option.
- `authoring.source` is one of `hand_authored`, `deterministic_generator`, `ai_assisted_draft`. Be honest. AI drafts are fine; they are reviewed like anything else.

### Spatial conventions

Right-handed, Y up, +Z toward the viewer. Cells are integer `[x, y, z]`, connected face to face, at most 12 cells and 5 wide on any axis. Equality ignores position but not orientation, so a mirror image is a different shape.

- Rotation: `{ "type": "rotation", "axis": "x"|"y"|"z", "quarter_turns": ±1..3, "described_as": "..." }`. Positive is counterclockwise looking from the positive end of the axis. `+1` about `y` swings the front to the viewer's right.
- Reflection: `{ "type": "reflection", "plane_normal": "x"|"y"|"z", "described_as": "..." }`.
- Viewpoint: `{ "type": "viewpoint", "side": "front"|"back"|"left"|"right"|"top"|"bottom", "described_as": "..." }`. Grids are rows top to bottom of `#` and `.`. From the right side, the back of the shape is on the viewer's right. From above, the back is at the top.

The prompt must contain `described_as` word for word, so the transformation is always stated.

## What the validator checks

`src/content/bank/validate.ts`, version in `VALIDATOR_VERSION`. Errors block import; warnings do not.

| Type | Recomputed |
|---|---|
| Spatial rotation, reflection | Applies the transform, requires exactly one option equal to the result, no two equivalent options, no two options that render the same picture, rejects shapes the transform leaves unchanged. Warns on mirror questions with an achiral shape. |
| Spatial viewpoint | Computes the silhouette and requires exactly one matching grid. |
| Figure matrix, analogy, series | Re-applies the named generator rule (`answer_key.figure_rule`) and requires exactly one matching option. |
| Number series | Regenerates the terms from `answer_key.rule`. |
| Balance puzzle | Searches every assignment 1 to 12 and requires the asked ratio to be the same in all of them. |
| Verbal | Structure only. Always flagged for human semantic review. |

All types: exactly four options with distinct ids and content, key is an option, rationales for every option, explanation present, hint does not name an option or contain the numeric answer, topics exist and list the type, the type's engine is built. Batch level: duplicate `id@version` in the file or already in the bank, unknown transfer targets, likely near-duplicates (warning).

## Commands

```
npm run content:validate -- content/bank/my-batch.json   # local, no network, exit 1 on errors
npm run content:import -- content/bank/my-batch.json     # dry run through bank-import
npm run content:import -- content/bank/my-batch.json --commit
npm run content:export [status]                          # default: published
npm run content:coverage [files...]                      # counts in local files
npm run content:bank-seed                                # rebuild seed-batch-001.json from src/content/bank/seed.ts
npm run content:taxonomy                                 # regenerate the taxonomy migration from taxonomy.ts
npm run content:bundle                                   # rebuild the validator bundled into bank-import
```

Import and export need `HOW_STAFF_EMAIL` and `HOW_STAFF_PASSWORD` for an account with a staff role. The `/staff/import` page does the same from the browser.

After changing `validate.ts`, run `content:bundle` and redeploy `bank-import`, or the server keeps validating with the old rules.

## Coverage

Target: 200 published per leaf question type, 24 types, 4,800 in total. One question counts once, toward its own type, however many paths it appears in. `/staff/coverage` shows planned, draft, in review and published per type, plus the older 2D items ("legacy live") until a person reviews them.

Status on 2026-10-24: 24 questions (seed batch 001) published on the owner's instruction, before any staff review. They show in /staff as "owner published, not reviewed" until a reviewer confirms each one with the checklist or retires it. Types marked "not built" (paper folding, nets, face counting, assembly, pattern completion, number analogies, word problems, deduction, sentence types, aural, directions) have no renderer or validator yet and the importer rejects them.

## Live 2D content

The 54 lessons and items that were live before the bank existed stay live. Their `reviewed_by` now says what it always was, a machine validation, and `human_reviewed` is false until a reviewer approves each one in `/staff`. Rejecting one takes it off the site.
