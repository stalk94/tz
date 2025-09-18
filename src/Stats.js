/**
 * @typedef {Object} StatsResult
 * @property {number|null} mean    Среднее значение
 * @property {number|null} std     Стандартное отклонение
 * @property {number|null} median  Медиана (через P²)
 * @property {number|null} mode    Мода (аппроксимация через Count-Min Sketch)
 * @property {number}      lost    Количество потерянных котировок
 * @property {number}      [time]  Время расчёта (мс)
 * @property {number}      [count] Всего котировок
 */

/**
 * Count-Min Sketch для аппроксимации моды
 */
class CountMinSketch {
    constructor (width = 2000, depth = 5) {
        this.width = width;
        this.depth = depth;
        this.counts = Array.from({ length: depth }, () => new Uint32Array(width));
        this.hashSeeds = Array.from({ length: depth }, (_, i) => i * 31 + 7);
    }
    hash(x, seed) {
        return (Math.imul(x ^ seed, 2654435761) >>> 0) % this.width;
    }
    add(x) {
        this.hashSeeds.forEach((seed, i) => {
            const idx = this.hash(x, seed);
            this.counts[i][idx]++;
        });
    }
    estimate(x) {
        return Math.min(
            ...this.hashSeeds.map((seed, i) => {
                const idx = this.hash(x, seed);
                return this.counts[i][idx];
            })
        );
    }
}

/**
 * P² алгоритм для оценки медианы
 * https://www.cse.wustl.edu/~jain/papers/ftp/psqr.pdf
 */
class P2Median {
    constructor () {
        this.n = 0;
        this.q = [];
        this.np = [0, 0.5, 1];
        this.pos = [1, 2, 3];
        this.desired = [1, 1.5, 3];
    }

    add(x) {
        this.n++;
        if (this.n <= 3) {
            this.q.push(x);
            this.q.sort((a, b) => a - b);
            return;
        }

        if (x < this.q[0]) this.q[0] = x;
        if (x > this.q[2]) this.q[2] = x;

        for (let i = 0; i < 3; i++) {
            this.desired[i] += this.np[i];
        }

        const d = this.desired[1] - this.pos[1];
        if (
            (d >= 1 && this.pos[1] < this.pos[2] - 1) ||
            (d <= -1 && this.pos[1] > this.pos[0] + 1)
        ) {
            const sign = Math.sign(d);
            const newVal =
                this.q[1] +
                (sign / (this.pos[2] - this.pos[0])) *
                ((this.pos[1] - this.pos[0] + sign) *
                    (this.q[2] - this.q[1]) /
                    (this.pos[2] - this.pos[1]) +
                    (this.pos[2] - this.pos[1] - sign) *
                    (this.q[1] - this.q[0]) /
                    (this.pos[1] - this.pos[0]));
            this.q[1] = Math.min(Math.max(newVal, this.q[0]), this.q[2]);
            this.pos[1] += sign;
        }
    }

    get() {
        if (this.n === 0) return null;
        if (this.n <= 3) return this.q[Math.floor(this.q.length / 2)];
        return this.q[1];
    }
}


/**
 * Основной класс статистики
 */
export class Stats {
    constructor () {
        this.n = 0;
        this.mean = 0;
        this.M2 = 0;
        this.prevId = null;
        this.lost = 0;

        this.medianEstimator = new P2Median();

        this.sketch = new CountMinSketch();
        this.candidates = new Map();
        this.topK = 8;
    }

    _q(x) {
        return Math.round(x * 100); // квантование до 0.01
    }

    add(id, x) {
        if (this.prevId !== null && id !== this.prevId + 1) {
            this.lost += id - this.prevId - 1;
        }
        this.prevId = id;

        // среднее и std
        this.n++;
        const delta = x - this.mean;
        this.mean += delta / this.n;
        this.M2 += delta * (x - this.mean);

        // медиана
        this.medianEstimator.add(x);

        // мода
        const key = this._q(x);
        this.sketch.add(key);
        const est = this.sketch.estimate(key);
        this.candidates.set(key, est);
        if (this.candidates.size > this.topK * 4) {
            const top = [...this.candidates.entries()]
                .sort((a, b) => b[1] - a[1])
                .slice(0, this.topK);
            this.candidates.clear();
            for (const [k, v] of top) this.candidates.set(k, v);
        }
    }

    getStats() {
        const start = performance.now();

        const std = this.n > 1 ? Math.sqrt(this.M2 / (this.n - 1)) : null;
        const median = this.medianEstimator.get();

        let mode = null;
        let best = -1;
        for (const k of this.candidates.keys()) {
            const est = this.sketch.estimate(k);
            if (est > best) {
                best = est;
                mode = k / 100;
            }
        }

        const end = performance.now();

        return {
            mean: this.n > 0 ? parseFloat(this.mean.toFixed(2)) : null,
            std: std !== null ? parseFloat(std.toFixed(2)) : null,
            median: median !== null ? parseFloat(median.toFixed(2)) : null,
            mode: mode !== null ? parseFloat(mode.toFixed(2)) : null,
            lost: this.lost,
            time: parseFloat((end - start).toFixed(4)),
            count: this.n,
        };
    }
}