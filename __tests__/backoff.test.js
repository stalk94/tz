import { describe, it, expect } from "vitest";
import { Backoff } from "../src/backoff.js";


describe("Backoff", () => {
    it("grows and resets", () => {
        const b = new Backoff(100, 800);
        const d1 = b.next();
        const d2 = b.next();
        const d3 = b.next();
        expect(d2).toBeGreaterThanOrEqual(d1);
        expect(d3).toBeGreaterThanOrEqual(d2);

        b.reset();
        const d4 = b.next();
        expect(d4).toBeLessThanOrEqual(200);
    });
});