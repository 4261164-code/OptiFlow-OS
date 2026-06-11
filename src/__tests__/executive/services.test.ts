// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";

const mocks = vi.hoisted(() => {
    return {
        onSnapshot: vi.fn(),
        collection: vi.fn(),
        query: vi.fn(),
        where: vi.fn()
    };
});

vi.mock("firebase/firestore", () => ({
    collection: mocks.collection,
    query: mocks.query,
    where: mocks.where,
    onSnapshot: mocks.onSnapshot,
    getFirestore: vi.fn(),
    Timestamp: class {
        seconds: number;
        nanoseconds: number;
        constructor(seconds: number, nanoseconds: number) { this.seconds = seconds; this.nanoseconds = nanoseconds; }
        static fromMillis(ms: number) { return { toMillis: () => ms }; }
        toMillis() { return this.seconds * 1000; }
    }
}));

vi.mock("firebase/app", () => ({ initializeApp: vi.fn(), getApps: vi.fn().mockReturnValue([]), getApp: vi.fn() }));
vi.mock("firebase/auth", () => ({ getAuth: vi.fn(), onAuthStateChanged: vi.fn(), signInWithPopup: vi.fn(), GoogleAuthProvider: vi.fn(), signOut: vi.fn(), signInAnonymously: vi.fn() }));

vi.mock("../../../lib/firebase", () => ({
    db: {}
}));

import { subscribeToRevenueEvents } from "../../services/executive/revenueService";

describe("Executive Services", () => {
    it("Each service function returns empty/zero shape when collection is empty", () => {
        mocks.onSnapshot.mockImplementationOnce((q, cb) => {
            // empty snapshot
            cb({ forEach: () => {} });
        });

        const cb = vi.fn();
        subscribeToRevenueEvents(cb);

        expect(cb).toHaveBeenCalledWith(0, 0, 0, 0, 0, 0); // Zeros
    });

    it("Each service function returns correct shape when collection is populated", () => {
        const now = Date.now();
        mocks.onSnapshot.mockImplementationOnce((q, cb) => {
            cb({
                forEach: (fn: any) => {
                    // last 30 doc
                    fn({ data: () => ({ amount: 100, type: "sale", timestamp: now }) });
                    // reversal
                    fn({ data: () => ({ amount: 20, type: "reversal", timestamp: now }) });
                    // prior 30 doc
                    fn({ data: () => ({ amount: 50, type: "sale", timestamp: now - 40 * 24 * 60 * 60 * 1000 }) });
                }
            });
        });

        const cb = vi.fn();
        subscribeToRevenueEvents(cb);

        // total: 150
        // net: 130
        // last30Total: 100
        // last30Net: 80
        // prior30Total: 50
        // prior30Net: 50
        expect(cb).toHaveBeenCalledWith(150, 130, 100, 80, 50, 50);
    });
});
