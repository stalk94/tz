import { Stats } from "./Stats";


const stats = new Stats();
let socket: WebSocket | null = null;


self.onmessage = (e) => {
    if (e.data.type === "start") {
        if (!socket) {
            socket = new WebSocket("wss://trade.termplat.com:8800/?password=1234");
            socket.onmessage = (msg) => {
                try {
                    const data = JSON.parse(msg.data);
                    let { id, value } = data;

                    // ⚠️ искусственно теряем котировки иногда
                    if (Math.random() < 0.01) {
                        id += 2;
                    }

                    stats.add(id, value);
                } 
                catch { }
            };
        }
    } 
    else if (e.data.type === "get-stats") {
        self.postMessage({ type: "stats", payload: stats.getStats() });
    }
};