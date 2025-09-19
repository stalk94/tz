import { describe, it, expect } from "vitest";
import CountMinSketch from "../src/class/CountMinSketch";


describe("CountMinSketch", () => {
    it("новый экземпляр имеет нулевые оценки", () => {
        const cms = new CountMinSketch();
        expect(cms.estimate(42)).toBe(0);
        expect(cms.estimate(99)).toBe(0);
    });

    it("однократное добавление даёт оценку ≥ 1", () => {
        const cms = new CountMinSketch();
        cms.add(123);
        expect(cms.estimate(123)).toBeGreaterThanOrEqual(1);
    });

    it("частота увеличивается при повторных добавлениях", () => {
        const cms = new CountMinSketch();
        cms.add(5);
        cms.add(5);
        cms.add(5);
        const freq = cms.estimate(5);
        expect(freq).toBeGreaterThanOrEqual(3); // может быть выше из-за коллизий
    });

    it("разные значения не должны сильно мешать друг другу", () => {
        const cms = new CountMinSketch(200, 5); // уменьшили width для скорости
        for (let i = 0; i < 50; i++) cms.add(1);
        for (let i = 0; i < 5; i++) cms.add(2);

        const est1 = cms.estimate(1);
        const est2 = cms.estimate(2);

        expect(est1).toBeGreaterThanOrEqual(50);
        expect(est2).toBeGreaterThanOrEqual(5);
        expect(est1).toBeGreaterThan(est2);
    });

    it("оценка никогда не меньше реального значения", () => {
        const cms = new CountMinSketch(2000, 5);
        const times = 100;
        for (let i = 0; i < times; i++) cms.add(42);

        const est = cms.estimate(42);
        expect(est).toBeGreaterThanOrEqual(times);
    });
});