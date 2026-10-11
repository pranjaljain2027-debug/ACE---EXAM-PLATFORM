import { describe, expect, it } from "vitest";
import { DEMO_CHILD_ID, STORE_PATH, mockDataSource, requireParentAccess } from "./mock";

const OWNING_PARENT = "parent-demo-1";
const OTHER_PARENT = "parent-someone-else";

describe("requireParentAccess", () => {
  it("returns the child for the parent who owns them", () => {
    expect(requireParentAccess(OWNING_PARENT, DEMO_CHILD_ID)?.id).toBe(DEMO_CHILD_ID);
  });

  it("refuses another parent's request for the same child id (AE4)", () => {
    expect(requireParentAccess(OTHER_PARENT, DEMO_CHILD_ID)).toBeNull();
  });

  it("refuses an unknown child id", () => {
    expect(requireParentAccess(OWNING_PARENT, "child-does-not-exist")).toBeNull();
  });
});

describe("mockDataSource child reads", () => {
  it("lists only the calling parent's children", () => {
    const mine = mockDataSource.listChildren(OWNING_PARENT);
    const theirs = mockDataSource.listChildren(OTHER_PARENT);

    expect(mine.map((child) => child.id)).toContain(DEMO_CHILD_ID);
    expect(theirs).toHaveLength(0);
  });

  it("returns no sessions for a child the parent does not own (R30)", () => {
    expect(mockDataSource.listSessions(OTHER_PARENT, DEMO_CHILD_ID)).toHaveLength(0);
  });

  it("returns no sessions for a child id that does not exist", () => {
    expect(mockDataSource.listSessions(OWNING_PARENT, "child-does-not-exist")).toHaveLength(0);
  });

  it("returns a child's own sessions newest first", () => {
    const sessions = mockDataSource.listSessions(OWNING_PARENT, DEMO_CHILD_ID);

    expect(sessions.length).toBeGreaterThan(0);
    expect(sessions[0]?.completedOn).toBe("2026-10-05");
    expect(sessions[0]?.sessionId).toBe("session-4");
  });

  it("refuses to update a child the parent does not own", async () => {
    await expect(
      mockDataSource.updateChild(OTHER_PARENT, DEMO_CHILD_ID, { ageBand: "advanced" }),
    ).resolves.toBeNull();
  });

  it("refuses to delete a child the parent does not own", async () => {
    await expect(mockDataSource.deleteChild(OTHER_PARENT, DEMO_CHILD_ID)).resolves.toBe(false);
    // The child must still be there afterwards.
    expect(mockDataSource.listChildren(OWNING_PARENT).map((c) => c.id)).toContain(DEMO_CHILD_ID);
  });

  it("writes an owned update through to the store", async () => {
    await mockDataSource.updateChild(OWNING_PARENT, DEMO_CHILD_ID, { ageBand: "advanced" });

    expect(mockDataSource.listChildren(OWNING_PARENT)[0]?.ageBand).toBe("advanced");

    // Put it back, so the assertion above cannot leak into another test.
    await mockDataSource.updateChild(OWNING_PARENT, DEMO_CHILD_ID, { ageBand: "developing" });
  });

  it("persists to a file, so records survive a restart", async () => {
    const { existsSync } = await import("node:fs");

    // The decision specified a file-backed store precisely so demo records are
    // not lost on restart; this asserts the file exists rather than trusting the
    // implementation detail in a comment.
    expect(existsSync(STORE_PATH)).toBe(true);
  });
});
