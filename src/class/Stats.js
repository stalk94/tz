import CountMinSketch from "./CountMinSketch";
import P2Median from "./P2Median";


const TOP_COUNT_MAX = 8;            // ограничение по размеру "словаря"
const ANOMALY_Z_THRESHOLD = 2;      // сколько σ должно быть, чтобы признать аномалию

/**
 * @typedef {Object} StatsResult
 * @property {number|null} mean    Среднее значение
 * @property {number|null} std     Стандартное отклонение
 * @property {number|null} median  Медиана (через P²)   устойчивая оценка центрального значения потока
 * @property {number|null} mode    Мода (аппроксимация через Count-Min Sketch)
 * @property {number}      lost    Количество потерянных котировок
 * @property {number}      [time]  Время расчёта (мс)
 * @property {number}      [count] Всего котировок
 */


/**
 * Основной класс статистики, 
 * содержит в композиции: 
 *  medianEstimator <P2Median> расчет медианы
 *  sketch <CountMinSketch> мода
 */
class Stats {
    constructor () {
        this.n = 0;                 // счетчик элементов
        this.mean = 0;              // текущее среднее (Welford)
        this.M2 = 0;                // вспомогательная сумма квадратов (Welford)

        this.prevId = null;         // предыдущий id для поиска потерянных котировок
        this.lost = 0;              // счётчик потерянных котировок


        this.medianEstimator = new P2Median();          // медиана по алгоритму P²
        this.sketch = new CountMinSketch();             // структура для частот (для моды)
        this.candidates = new Map();                    // топ-кандидаты для моды

        this.onAnomaly = null;
    }

    #q(x) {
        return Math.round(x * 100);                     // квантование числа до 0.01 (чтобы мода считалась быстрее)
    }
    
    #checkAnomaly(value) {
        if (this.n < 2) return;                     // нужно хотя бы 2 значения
        const std = this.n > 1 ? Math.sqrt(this.M2 / (this.n - 1)) : 0;
        if (std === 0) return;
        const z = (value - this.mean) / std;

        if (Math.abs(z) > ANOMALY_Z_THRESHOLD) {
            const anomaly = {
                id: this.n,
                value,
                z: parseFloat(z.toFixed(2)),
                mean: parseFloat(this.mean.toFixed(2)),
                std: parseFloat(std.toFixed(2)),
            };

            this.lastAnomaly = anomaly;
            this.onAnomaly?.(anomaly);
        }
    }

    /**
     * 
     * @param {number} id 
     * @param {number} x 
     */
    add(id, x) {
        if (this.prevId !== null && id !== this.prevId + 1) {
            this.lost += id - this.prevId - 1;          // считаем "пропущенные" котировки
        }
        this.prevId = id;

        // среднее и std (welford)
        this.n++;                                       // увеличиваем счётчик
        const delta = x - this.mean;
        this.mean += delta / this.n;
        this.M2 += delta * (x - this.mean);

        // медиана
        this.medianEstimator.add(x);                    // P2Median

        // мода
        const key = this.#q(x);
        this.sketch.add(key);
        const est = this.sketch.estimate(key);
        this.candidates.set(key, est);

        if (this.candidates.size > (TOP_COUNT_MAX * 4)) {
            const top = [...this.candidates.entries()]          // берем все пары
                .sort((a, b) => b[1] - a[1])                    // сортируем по убыванию
                .slice(0, TOP_COUNT_MAX);                       // оставляем только топ самых частых
            
            this.candidates.clear();
            for (const [k, v] of top) this.candidates.set(k, v);
        }

        // фича
        this.#checkAnomaly(x);
    }

    /**
     * 
     * @returns {StatsResult}
     */
    getStats() {
        const start = performance.now();                    // начало замера

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
        
        const end = performance.now();                      // конец замера

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

    resetAll() {
        this.n = 0;
        this.mean = 0;
        this.M2 = 0;
        this.prevId = null;
        this.lost = 0;
        this.medianEstimator = new P2Median();
        this.sketch = new CountMinSketch();
        this.candidates.clear();
    }
}


export default Stats;