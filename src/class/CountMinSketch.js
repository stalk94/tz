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
    
    #hash(x, seed) {
        return (Math.imul(x ^ seed, 2654435761) >>> 0) % this.width;
    }
    
    add(x) {
        this.hashSeeds.forEach((seed, i) => {
            const idx = this.#hash(x, seed);
            this.counts[i][idx]++;
        });
    }

    estimate(x) {
        return Math.min(
            ...this.hashSeeds.map((seed, i) => {
                const idx = this.#hash(x, seed);
                return this.counts[i][idx];
            })
        );
    }
}


export default CountMinSketch;