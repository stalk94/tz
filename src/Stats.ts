import type { StatsResult } from "./types";



class Heap {
    private data: number[] = [];
    constructor(private cmp: (a: number, b: number) => boolean) { }

    push(x: number) {
        this.data.push(x);
        this.up(this.data.length - 1);
    }
    pop(): number | undefined {
        if (!this.data.length) return;
        const top = this.data[0];
        const end = this.data.pop()!;
        if (this.data.length) {
            this.data[0] = end;
            this.down(0);
        }
        return top;
    }
    peek() {
        return this.data[0];
    }
    size() {
        return this.data.length;
    }

    private up(i: number) {
        while (i > 0) {
            const p = Math.floor((i - 1) / 2);
            if (!this.cmp(this.data[i], this.data[p])) break;
            [this.data[i], this.data[p]] = [this.data[p], this.data[i]];
            i = p;
        }
    }
    private down(i: number) {
        const n = this.data.length;
        while (true) {
            let l = 2 * i + 1,
                r = 2 * i + 2,
                m = i;
            if (l < n && this.cmp(this.data[l], this.data[m])) m = l;
            if (r < n && this.cmp(this.data[r], this.data[m])) m = r;
            if (m === i) break;
            [this.data[i], this.data[m]] = [this.data[m], this.data[i]];
            i = m;
        }
    }
}


class CountMinSketch {
    private counts: Uint32Array[];
    private hashSeeds: number[];
    constructor(private width = 2000, private depth = 5) {
        this.counts = Array.from({ length: depth }, () => new Uint32Array(width));
        this.hashSeeds = Array.from({ length: depth }, (_, i) => i * 31 + 7);
    }
    private hash(x: number, seed: number) {
        return (Math.imul(x ^ seed, 2654435761) >>> 0) % this.width;
    }
    add(x: number) {
        this.hashSeeds.forEach((seed, i) => {
            const idx = this.hash(x, seed);
            this.counts[i][idx]++;
        });
    }
    estimate(x: number) {
        return Math.min(
            ...this.hashSeeds.map((seed, i) => {
                const idx = this.hash(x, seed);
                return this.counts[i][idx];
            })
        );
    }
}


export class Stats {
    private n = 0;
    private mean = 0;
    private M2 = 0;
    private prevId: number | null = null;
    private lost = 0;

    private low = new Heap((a, b) => a > b);
    private high = new Heap((a, b) => a < b);
    private sketch = new CountMinSketch();

    add(id: number, x: number) {
        if (this.prevId !== null && id !== this.prevId + 1) {
            this.lost += id - this.prevId - 1;
        }
        this.prevId = id;

        // Среднее и std (Welford)
        this.n++;
        const delta = x - this.mean;
        this.mean += delta / this.n;
        this.M2 += delta * (x - this.mean);

        // Медиана (две кучи)
        if (!this.low.size() || x <= this.low.peek()!) {
            this.low.push(x);
        } else {
            this.high.push(x);
        }
        if (this.low.size() > this.high.size() + 1) {
            this.high.push(this.low.pop()!);
        } else if (this.high.size() > this.low.size()) {
            this.low.push(this.high.pop()!);
        }

        // Мода (Count-Min Sketch)
        this.sketch.add(x);
    }

    getStats(): StatsResult {
        const start = performance.now();

        const std = this.n > 1 ? Math.sqrt(this.M2 / (this.n - 1)) : null;
        const median =
            this.low.size() === this.high.size()
                ? (this.low.peek()! + this.high.peek()!) / 2
                : this.low.peek();

        const mode = median; // временно приближение

        const end = performance.now();

        return {
            mean: this.n > 0 ? parseFloat(this.mean.toFixed(2)) : null,
            std: std !== null ? parseFloat(std.toFixed(2)) : null,
            median: median !== undefined ? parseFloat(median.toFixed(2)) : null,
            mode: mode !== undefined ? parseFloat(mode.toFixed(2)) : null,
            lost: this.lost,
            time: parseFloat((end - start).toFixed(4)),
            count: this.n,
        };
    }
}