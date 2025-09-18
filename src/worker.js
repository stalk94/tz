import Stats from "./class/Stats";
import { Backoff } from "./backoff.js";

/**
 * @typedef {Object} WorkerRequestStart
 * @property {"start"} type
 *
 * @typedef {Object} WorkerRequestStop
 * @property {"stop"} type
 *
 * @typedef {Object} WorkerRequestStats
 * @property {"get-stats"} type
 *
 * @typedef {WorkerRequestStart|WorkerRequestStop|WorkerRequestStats} WorkerRequest
 *
 * @typedef {Object} WorkerResponse
 * @property {"stats"} type
 * @property {import("./class/Stats").StatsResult} payload
 */

let stats = new Stats();
/** @type {WebSocket|null} */
let socket = null;
let stoppedByUser = false;
let lastMessageAt = Date.now();
let idleTimer = null;
const backoff = new Backoff(250, 8000); // от 250мс до 8с

///////////////////////////////////////////////////////////////
function clearIdle() {
	if (idleTimer) {
		clearInterval(idleTimer);
		idleTimer = null;
	}
}
function watchIdle() {
	clearIdle();
	idleTimer = setInterval(() => {
		if (stoppedByUser || !socket) return;
		const idle = Date.now() - lastMessageAt;
		if (idle > 5000) {
			try { socket.close(); } catch { }
		}
	}, 1000);
}
function connect() {
	const url = "wss://trade.termplat.com:8800/?password=1234";
	socket = new WebSocket(url);

	socket.onopen = () => {
		backoff.reset();
		lastMessageAt = Date.now();
		watchIdle();
	};

	socket.onmessage = (msg) => {
		try {
			const data = JSON.parse(msg.data);

			if (
				typeof data !== "object" ||
				data === null ||
				typeof data.id !== "number" ||
				!Number.isFinite(data.id) ||
				data.id < 0 || !Number.isSafeInteger(data.id) ||
				typeof data.value !== "number" ||
				!Number.isFinite(data.value)||
				data.value < 0 ||         				// ❗ отрицательные котировки игнорим
				data.value > 1e6						// ❗ слишком большие котировки игнорим
			) {
				// Некорректные данные — пропускаем
				console.warn('ignore');
				return;
			}

			let { id, value } = data;
			if (id <= stats.prevId) return; 			// игнорим старые/дубли

			// ⚠️ искусственно теряем котировки иногда
			// if (Math.random() < 0.01)id += 2;
			

			stats.add(id, value);
		} 
		catch {
			// Некорректный JSON — пропускаем
			console.error('❗⚠️ JSON error')
		}
	};

	socket.onerror = () => {};
	socket.onclose = () => {
		clearIdle();
		if (!stoppedByUser) {
			const delay = backoff.next();
			setTimeout(() => {
				if (!stoppedByUser) connect();
			}, delay);
		}
	};
}
///////////////////////////////////////////////////////////////


/**
 * Обработка сообщений от главного потока
 * @param {MessageEvent<WorkerRequest>} e
 */
self.onmessage = (e) => {
	if (e.data.type === "start") {
		stoppedByUser = false;
		stats = new Stats(); // сброс статистики
		if (!socket || socket.readyState === WebSocket.CLOSED) connect();
	}
	else if (e.data.type === "get-stats") {
		/** @type {WorkerResponse} */
		const response = { type: "stats", payload: stats.getStats() };
		self.postMessage(response);
	}
	else if (e.data.type === "stop") {
		stoppedByUser = true;
		try { socket?.close(); } catch { }
		socket = null;
		clearIdle();
	}
}