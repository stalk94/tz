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


export default P2Median;