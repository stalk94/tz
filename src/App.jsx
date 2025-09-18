import React, { useState, useRef, useEffect } from "react";
import Monitoring from './components/monitoring';
import { showAnomaly } from './components/anomaly';			// фича
import "./styles.css";



/**
 * @typedef {Object} StatsResult
 * @property {number|null} mean
 * @property {number|null} std
 * @property {number|null} median
 * @property {number|null} mode
 * @property {number} lost
 * @property {number} [time]
 * @property {number} [count]
 */
export default function App() {
    /** @type {[StatsResult|null, Function]} */
    const [stats, setStats] = useState(null);
    const [started, setStarted] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [loading, setLoading] = useState(false);
    /** @type {React.MutableRefObject<Worker|null>} */
    const workerRef = useRef(null);


    const handleStartStop = () => {
        if (!started) {
            workerRef.current = new Worker(
                new URL("./worker.js", import.meta.url),
                { type: "module" }
            );
            workerRef.current.onmessage = (e) => {
                if (e.data.type === "stats") {
                    const payload = e.data.payload;
                    setStats(payload);

                    if (payload.count > 0) {
                        setLoading(false);      // только если реально пришли данные
                    }
                }
                // фича аномалий
                if (e.data.type === "anomaly") {
                    showAnomaly( e.data.payload);
                }
            };
            workerRef.current.postMessage({ type: "start" });
            setStarted(true);
        } 
        else {
            workerRef.current?.terminate();
            workerRef.current = null;
            setStarted(false);
            setShowStats(false);
            setStats(null);
        }
    }
    const handleToggleStats = () => {
        if (!started) return;
        if (showStats) {
            setShowStats(false);
        } 
        else {
            setLoading(true); // включаем индикатор
            workerRef.current?.postMessage({ type: "get-stats" });
            setShowStats(true);
        }
    }

    // Автообновление статистики каждые секунду
    useEffect(() => {
        const interval = setInterval(() => {
            if (started) {
                workerRef.current?.postMessage({ type: "get-stats" });
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [started]);


    return (
        <section style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {showStats && (
                <div className="stats-box">
                    {loading || !stats || stats.count === 0 ? (
                        <div className="loader">Загрузка…</div>
                    ) : (
                            <div className="stats-card">
                                <h3>📊 Статистика</h3>
                                <table>
                                    <tbody>
                                        <tr><td>Получено котировок:</td><td>{stats.count}</td></tr>
                                        <tr><td>Среднее:</td><td>{stats.mean}</td></tr>
                                        <tr><td>Станд. отклонение:</td><td>{stats.std}</td></tr>
                                        <tr><td>Медиана:</td><td>{stats.median}</td></tr>
                                        <tr><td>Мода (≈):</td><td>{stats.mode}</td></tr>
                                        <tr><td>Потерянные котировки:</td><td>{stats.lost}</td></tr>
                                        <tr><td>Время расчёта:</td><td>{stats.time} мс</td></tr>
                                    </tbody>
                                </table>
                            </div>
                    )}
                </div>
            )}


            <div style={{ margin: "auto" }}>
                <button
                    onClick={handleStartStop}
                    className={started ? "btn stop" : "btn start"}
                >
                    {started ? "Стоп" : "Старт"}
                </button>

                <button onClick={handleToggleStats} className="btn stats">
                    {showStats ? "Скрыть" : "Статистика"}
                </button>
            </div>

            <Monitoring />
        </section>
    );
}