import Stats from "./Stats";
import Backoff from "./Backoff";


const INTERVAL_IDLE_TIMER = 1000;       // частота проверки на 'не помер ли сокет'
const IDLE_MAX_TIMEOUT = 10000;         // через сколько простоя соединение считаеться повисшим
const BASE_BACOFF_TIMEOUT = 250;
const MAX_BACOFF_TIMEOUT = 8000;


class QuoteWorker {
    constructor () {
        this.stats = new Stats();
        this.socket = null;
        this.stoppedByUser = false;
        this.lastMessageAt = Date.now();
        this.idleTimer = null;
        this.backoff = new Backoff(BASE_BACOFF_TIMEOUT, MAX_BACOFF_TIMEOUT);

        this.stats.onAnomaly = (anomaly) => {
            self.postMessage({ 
                type: "anomaly", 
                payload: anomaly 
            });
        };
    }

    #clearIdle() {
        if (this.idleTimer) {
            clearInterval(this.idleTimer);
            this.idleTimer = null;
        }
    }

    // контроль повисания сокета
    #watchIdle() {
        this.#clearIdle();

        this.idleTimer = setInterval(() => {
            if (this.stoppedByUser || !this.socket) return;
            const idle = Date.now() - this.lastMessageAt;

            if (idle > IDLE_MAX_TIMEOUT) {
                try {
                    this.socket.close(); 
                } 
                catch (err) { 
                    console.error('SOCKET close error: ', err);
                }
            }
        }, INTERVAL_IDLE_TIMER);
    }

    #connect() {
        const url = "wss://trade.termplat.com:8800/?password=1234";
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
            this.backoff.reset();
            this.lastMessageAt = Date.now();
            this.#watchIdle();
        };

        // ⚙️ обработка потока 
        this.socket.onmessage = (msg) => {
            try {
                const data = JSON.parse(msg.data);

                if (
                    typeof data !== "object" || data === null ||
                    typeof data.id !== "number" || !Number.isFinite(data.id) ||
                    data.id < 0 || !Number.isSafeInteger(data.id) ||                    // предел id будет 9 квадролионов
                    typeof data.value !== "number" || !Number.isFinite(data.value) ||
                    data.value < 0 || data.value > 1e6
                ) {
                    console.warn("ignore");
                    return;
                }

                let { id, value } = data;
                if (id <= this.stats.prevId) return;

                // 🔧 для теста можно добавить аномалию:
                // if (Math.random() < 0.01) value += 1e5;

                this.stats.add(id, value);
                this.lastMessageAt = Date.now();
            } 
            catch (err) {
                console.error(`❗⚠️ JSON error`, err);
            }
        };

        this.socket.onerror = (event) => {
            console.error("❗⚠️ WebSocket error event: ", event);
        };
        
        this.socket.onclose = () => {
            this.#clearIdle();
            if (!this.stoppedByUser) {
                const delay = this.backoff.next();

                setTimeout(() => {
                    if (!this.stoppedByUser) this.#connect();
                }, delay);
            }
        };
    }

    start() {
        this.stoppedByUser = false;
        this.stats = new Stats();

        // ставим наблюдателя
        this.stats.onAnomaly = (anomaly) => {
            self.postMessage({ 
                type: "anomaly", 
                payload: anomaly 
            });
        };

        if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
            this.#connect();
        }
    }

    stop() {
        this.stoppedByUser = true;

        try {
            this.socket?.close(); 
        } 
        catch (err) { 
            console.error('SOCKET stop error: ', err);
        }

        this.socket = null;
        this.#clearIdle();
    }

    getStats() {
        const response = { 
            type: "stats", 
            payload: this.stats.getStats() 
        }

        self.postMessage(response);
    }

    resetAll() {
        this.stats.resetAll();
        
        self.postMessage({ 
            type: "stats", 
            payload: this.stats.getStats() 
        });
    }
}


export default QuoteWorker;