/**
 * The demo data store (KTD6).
 *
 * File-backed, as the demo-mode decision specifies, so demo records survive a
 * restart. In-memory `Map`s were a deviation: the banner said records were erased
 * on restart, which meant the implementation and the decision disagreed about
 * what a parent would see if they reloaded.
 *
 * Writes go through a single serialising queue rather than straight to disk. Two
 * concurrent requests interleaving `readFile`/`writeFile` produce a truncated or
 * interleaved file, and a corrupted store that throws on every later read is
 * worse than a lost write. The queue makes each write atomic with respect to the
 * others.
 *
 * Ownership is settled in this module, not by its callers: `requireParentAccess`
 * runs before any child data is returned, so a guessed child id in a URL is
 * refused rather than resolved (R30, AE4).
 *
 * The demo banner's wording is updated by U16's report to match this file: the
 * records now persist until the file is deleted.
 */
import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type {
  ChildRecord,
  ParentSession,
  PracticeResponse,
  ReasoningCategory,
} from "./types";
import type { SessionRecord } from "../scoring/progress";

export type {
  ChildRecord,
  ParentSession,
  PracticeResponse,
  ReasoningCategory,
};

/** A child's recorded answers, grouped by the session they belong to. */
export type SessionWithResponses = SessionRecord;

/**
 * Where the store lives.
 *
 * Overridable through `DEMO_DATA_FILE` so a test can point at a temporary file
 * rather than writing to the repository, and so the path is one place to change
 * for deployment.
 *
 * `turbopackIgnore` is on the path construction rather than on each read and
 * write: Turbopack statically traces `path.resolve` arguments and a value it
 * cannot see pulls the whole project into the server bundle, which is both slow
 * to deploy and liable to exceed platform size limits.
 */
export const STORE_PATH = resolve(
  /* turbopackIgnore: true */ process.env.DEMO_DATA_FILE ?? ".data/demo-store.json",
);

interface StoreShape {
  readonly version: 1;
  readonly parents: readonly ParentSession[];
  readonly children: readonly ChildRecord[];
  readonly sessions: Readonly<Record<string, readonly SessionRecord[]>>;
}

/** Dates do not survive `JSON.stringify`, so they are revived on read. */
function reviveParent(entry: ParentSession): ParentSession {
  return { ...entry, createdAt: new Date(entry.createdAt), lastActiveAt: new Date(entry.lastActiveAt) };
}

function reviveChild(entry: ChildRecord): ChildRecord {
  return { ...entry, createdAt: new Date(entry.createdAt), lastActiveAt: new Date(entry.lastActiveAt) };
}

/**
 * Seed content.
 *
 * One demo parent and one demo child with a short practice history, so the
 * dashboard and results screen have something real to render instead of only
 * their empty states. Clearly seeded content, and labelled as demo data wherever
 * it is shown (R28) — not a fabricated child outcome.
 */
function seedStore(): StoreShape {
  const parentId = "parent-demo-1";
  const childId = "child-demo-1";
  const created = new Date("2026-01-01T00:00:00.000Z");

  const buildSession = (
    sessionId: string,
    completedOn: string,
    area: ReasoningCategory,
    correct: number,
    total: number,
  ): SessionRecord => ({
    sessionId,
    completedOn,
    responses: Array.from({ length: total }, (_, index) => ({
      questionId: `${sessionId}-${area}-${index}`,
      selectedChoiceId: index < correct ? "correct" : "other",
      correct: index < correct,
      reasoningCategory: area,
      answeredAt: new Date(`${completedOn}T12:00:00.000Z`),
    })),
  });

  return {
    version: 1,
    parents: [
      {
        id: parentId,
        email: "parent@example.com",
        demoMode: true,
        childIds: [childId],
        createdAt: created,
        lastActiveAt: created,
      },
    ],
    children: [
      {
        id: childId,
        parentId,
        ageBand: "developing",
        experienceLevel: "some_experience",
        goals: ["improve_problem_solving"],
        schedulePreference: "any_time",
        interests: ["patterns_shapes"],
        createdAt: created,
        lastActiveAt: created,
      },
    ],
    sessions: {
      [childId]: [
        buildSession("session-1", "2026-09-28", "nonverbal", 3, 3),
        buildSession("session-2", "2026-09-30", "nonverbal", 2, 3),
        buildSession("session-3", "2026-10-02", "quantitative", 1, 3),
        buildSession("session-4", "2026-10-05", "verbal", 2, 3),
      ],
    },
  };
}

function loadStore(): StoreShape {
  if (!existsSync(/* turbopackIgnore: true */ STORE_PATH)) {
    const seeded = seedStore();
    persistNow(seeded);
    return seeded;
  }

  try {
    const parsed: unknown = JSON.parse(readFileSync(/* turbopackIgnore: true */ STORE_PATH, "utf8"));
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      (parsed as { version?: unknown }).version === 1
    ) {
      const shape = parsed as StoreShape;
      return {
        version: 1,
        parents: shape.parents.map(reviveParent),
        children: shape.children.map(reviveChild),
        sessions: shape.sessions,
      };
    }
  } catch {
    // A corrupt or unreadable file falls back to a fresh seed rather than
    // throwing on every later read. Demo data is disposable by definition, and a
    // store that cannot be parsed is not worth failing a request over.
  }

  return seedStore();
}

function persistNow(store: StoreShape): void {
  mkdirSync(/* turbopackIgnore: true */ dirname(STORE_PATH), { recursive: true });
  // Written to a sibling file and renamed, so a crash mid-write cannot leave a
  // half-written store behind. Rename is atomic within a filesystem.
  const temporary = `${STORE_PATH}.tmp`;
  writeFileSync(/* turbopackIgnore: true */ temporary, JSON.stringify(store, null, 2), "utf8");
  renameSync(/* turbopackIgnore: true */ temporary, STORE_PATH);
}

/**
 * Serialised writes.
 *
 * Every mutation awaits the previous one. Without this, two requests reading the
 * same file and writing it back can interleave, and the slower one's write
 * silently discards the faster one's.
 */
let writeChain: Promise<void> = Promise.resolve();

function commit(mutate: (store: StoreShape) => StoreShape): Promise<void> {
  const next = writeChain.then(() => {
    const updated = mutate(loadStore());
    persistNow(updated);
  });
  // Keep the chain alive even if one write fails, so a single bad write does not
  // wedge every later one behind a rejected promise.
  writeChain = next.catch(() => undefined);
  return next;
}

let cached: StoreShape | null = null;

function current(): StoreShape {
  cached ??= loadStore();
  return cached;
}

function update(store: StoreShape): StoreShape {
  cached = store;
  return store;
}

/** The demo child id, for surfaces that need a default in demo mode. */
export const DEMO_CHILD_ID = "child-demo-1";

/**
 * Read a child, but only for a parent who owns it (R30, AE4).
 *
 * `null` rather than a throw, and `null` for both an unowned child and an
 * unknown one — the two are indistinguishable on purpose, so a caller probing
 * ids cannot learn which children exist.
 */
export function requireParentAccess(parentId: string, childId: string): ChildRecord | null {
  const child = current().children.find((entry) => entry.id === childId);
  if (!child || child.parentId !== parentId) return null;
  return child;
}

export const mockDataSource = {
  listParentIds(): readonly string[] {
    return current().parents.map((parent) => parent.id);
  },

  getParentSession(parentId: string): ParentSession | undefined {
    return current().parents.find((parent) => parent.id === parentId);
  },

  listChildren(parentId: string): readonly ChildRecord[] {
    return current().children.filter((child) => child.parentId === parentId);
  },

  listSessions(parentId: string, childId: string): readonly SessionRecord[] {
    if (!requireParentAccess(parentId, childId)) return [];
    return [...(current().sessions[childId] ?? [])].sort((a, b) =>
      b.completedOn.localeCompare(a.completedOn),
    );
  },

  getSession(parentId: string, childId: string, sessionId: string): SessionRecord | null {
    if (!requireParentAccess(parentId, childId)) return null;
    return current().sessions[childId]?.find((entry) => entry.sessionId === sessionId) ?? null;
  },

  /**
   * Update a child's record.
   *
   * Written through `commit` so the change reaches disk and survives a restart,
   * which is the whole point of the store being file-backed.
   */
  updateChild(
    parentId: string,
    childId: string,
    updates: Partial<ChildRecord>,
  ): Promise<ChildRecord | null> {
    if (!requireParentAccess(parentId, childId)) return Promise.resolve(null);

    return commit((store) => {
      const children = store.children.map((child) =>
        child.id === childId ? { ...child, ...updates, lastActiveAt: new Date() } : child,
      );
      return update({ ...store, children });
    }).then(() => requireParentAccess(parentId, childId));
  },

  /** Record an answer. Ownership enforced; the write is queued. */
  recordAnswer(
    parentId: string,
    childId: string,
    response: PracticeResponse,
    sessionId: string,
  ): Promise<void> {
    if (!requireParentAccess(parentId, childId)) return Promise.resolve();

    return commit((store) => {
      const existing = store.sessions[childId] ?? [];
      const without = existing.filter((entry) => entry.sessionId !== sessionId);
      const next: SessionRecord = {
        sessionId,
        completedOn: response.answeredAt.toISOString().slice(0, 10),
        responses: [...(without[0]?.responses ?? []), response],
      };
      return update({ ...store, sessions: { ...store.sessions, [childId]: [next, ...without.slice(1)] } });
    });
  },

  /** Remove a child and everything attached to them (R31). */
  deleteChild(parentId: string, childId: string): Promise<boolean> {
    if (!requireParentAccess(parentId, childId)) return Promise.resolve(false);

    return commit((store) => {
      const { [childId]: _removed, ...remainingSessions } = store.sessions;
      void _removed;
      return update({
        ...store,
        children: store.children.filter((child) => child.id !== childId),
        parents: store.parents.map((parent) =>
          parent.id === parentId
            ? { ...parent, childIds: parent.childIds.filter((id) => id !== childId) }
            : parent,
        ),
        sessions: remainingSessions,
      });
    }).then(() => true);
  },

  /** Discard the store and reseed. Test support, and a demo reset. */
  reset(): Promise<void> {
    return commit(() => update(seedStore()));
  },
};
