import type { ParentSession, ChildRecord, PracticeResponse } from "./types";

const demoParentId = "parent-demo-1";

const initialParent: ParentSession = {
  id: demoParentId,
  email: "parent@example.com",
  demoMode: true,
  createdAt: new Date(),
  lastActiveAt: new Date(),
  childCount: 0,
};

const initialChildRecords: Map<string, ChildRecord> = new Map();
const initialPracticeResponses: Map<string, PracticeResponse> = new Map();

export type { ParentSession, ChildRecord, PracticeResponse };

export const mockDataSource = {
  parentSessions: new Map([[demoParentId, initialParent]]),
  childRecords: initialChildRecords,
  practiceResponses: initialPracticeResponses,

  async getParentSession(id: string): Promise<ParentSession | undefined> {
    return this.parentSessions.get(id);
  },

  async createParentSession(email: string, demoMode: boolean = false): Promise<ParentSession> {
    const id = `${Date.now()}-parent`;
    const session: ParentSession = {
      id,
      email,
      demoMode,
      createdAt: new Date(),
      lastActiveAt: new Date(),
      childCount: 0,
    };
    this.parentSessions.set(id, session);
    return session;
  },

  async updateParentSession(id: string, updates: Partial<ParentSession>): Promise<ParentSession | undefined> {
    const session = this.parentSessions.get(id);
    if (!session) return undefined;
    const updated = { ...session, ...updates, lastActiveAt: new Date() } as ParentSession;
    this.parentSessions.set(id, updated);
    return updated;
  },

  async getChildRecord(parentId: string, childId: string): Promise<ChildRecord | undefined> {
    return this.childRecords.get(`${parentId}-${childId}`);
  },

  async createChildRecord(parentId: string, childId: string, initial: Partial<ChildRecord>): Promise<ChildRecord> {
    const record: ChildRecord = {
      id: childId,
      parentId,
      ageBand: "introductory",
      experienceLevel: "new_to_reasoning",
      goals: [],
      schedulePreference: "any_time",
      interests: [],
      practiceResponses: [],
      createdAt: new Date(),
      lastActiveAt: new Date(),
      ...initial,
    };
    this.childRecords.set(`${parentId}-${childId}`, record);
    return record;
  },

  async updateChildRecord(parentId: string, childId: string, updates: Partial<ChildRecord>): Promise<ChildRecord | undefined> {
    const record = this.childRecords.get(`${parentId}-${childId}`);
    if (!record) return undefined;
    const updated = { ...record, ...updates, lastActiveAt: new Date() } as ChildRecord;
    this.childRecords.set(`${parentId}-${childId}`, updated);
    return updated;
  },

  async addPracticeResponse(parentId: string, questionId: string, selectedChoiceId: string): Promise<void> {
    const response: PracticeResponse = {
      questionId,
      selectedChoiceId,
      answeredAt: new Date(),
    };
    const key = `${parentId}-${questionId}`;
    this.practiceResponses.set(key, response);
  },

  getPracticeResponses(parentId: string, questionId?: string): PracticeResponse[] {
    if (questionId) {
      const key = `${parentId}-${questionId}`;
      const single = this.practiceResponses.get(key);
      return single ? [single] : [];
    }
    return Array.from(this.practiceResponses.values());
  },
};