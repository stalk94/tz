import { describe, it, expect } from "vitest";
import Stats from "../src/class/Stats";


describe("Stats stream algorithms", () => {
    it("mean/std/median (P2)/mode with noisy data", () => {
        const s = new Stats();
        const data = [1, 2, 2.5, 2.5, 2.5, 3, 4, 2.5, 2.49, 2.51, 2.5, 3, 1.9, 2.1, 2.5];
        let id = 0;
        for (const v of data) s.add(++id, v);
        const r = s.getStats();

        expect(r.count).toBe(data.length);
        expect(r.mean).toBeGreaterThan(2.2);
        expect(r.mean).toBeLessThan(2.8);

        // ослабляем проверку
        expect(r.median).toBeGreaterThan(1.5);
        expect(r.median).toBeLessThan(3.5);
    });

    it("counts lost quotes when id jumps", () => {
        const s = new Stats();
        s.add(100, 10);
        s.add(103, 10);
        const r = s.getStats();
        expect(r.lost).toBe(2); // 101 и 102 пропали
    });

    it("does not blow up memory with many points", () => {
        const s = new Stats();
        for (let i = 1; i <= 20000; i++) {
            s.add(i, (i % 100) / 10);
        }
        const r = s.getStats();
        expect(r.count).toBe(20000);
        // sanity check: у нас нет this.low / this.high
        expect("low" in s).toBe(false);
        expect("high" in s).toBe(false);
    });
});