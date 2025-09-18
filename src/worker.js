import QuoteWorker from "./class/QuoteWorker";


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



const qw = new QuoteWorker();



/**
 * Обработка сообщений от главного потока
 * @param {MessageEvent<WorkerRequest>} e
 */
self.onmessage = (e) => {
	if (e.data.type === "start") {
		qw.start();
	}
	else if (e.data.type === "get-stats") {
		qw.getStats();
	}
	else if (e.data.type === "stop") {
		qw.stop();
	}
	else if (e.data.type === "simulate-anomaly") {
		// 💡 ручная вставка аномалии для теста
		qw.stats.add(qw.stats.prevId + 1, qw.stats.mean + 10 * (qw.stats.std || 1000));
	}
}