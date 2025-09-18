class Backoff {
    /**
     * @param {number} [base=250]  Базовая задержка (мс)
     * @param {number} [max=10000] Максимальная задержка (мс)
     */
    constructor (base = 250, max = 10000) {
        this.base = base;
        this.max = max;
        this.attempt = 0;
    }

    /** Рассчитать следующую задержку */
    next() {
        const exp = Math.min(this.max, this.base * Math.pow(2, this.attempt++));
        // добавляем небольшой случайный разброс (джиттер),
        // чтобы клиенты не переподключались синхронно
        const jitter = Math.random() * (exp * 0.2);
        return Math.floor(exp * 0.9 + jitter);
    }

    /** Сбросить счётчик после успешного подключения */
    reset() {
        this.attempt = 0;
    }
}


export default Backoff;