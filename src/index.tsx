import React, { useState, useRef, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";



function App() {
    const [stats, setStats] = useState<any>(null);
    const [started, setStarted] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const workerRef = useRef<Worker | null>(null);


    const handleStartStop = () => {
        if (!started) {
            workerRef.current = new Worker(
                new URL("./worker.ts", import.meta.url),
                { type: "module" }
            );
            workerRef.current.onmessage = (e) => {
                if (e.data.type === "stats") {
                    setStats(e.data.payload);
                }
            };
            workerRef.current.postMessage({ type: "start" });
            setStarted(true);
        } 
        else {
            workerRef.current?.terminate();
            workerRef.current = null;
            setStarted(false);
        }
    }
    const handleToggleStats = () => {
        if (!started) return;
        if (showStats) {
            setShowStats(false);
        } else {
            workerRef.current?.postMessage({ type: "get-stats" });
            setShowStats(true);
        }
    }

    useEffect(() => {
        const interval = setInterval(() => {
            if (started) {
                workerRef.current?.postMessage({ type: "get-stats" });
            }
        }, 2000);
        return () => clearInterval(interval);
    }, [started]);


    return (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {showStats && stats && (
                <div className="stats-box">
                    <p>Получено котировок: {stats.count}</p>
                    <p>Среднее: {stats.mean}</p>
                    <p>Стандартное отклонение: {stats.std}</p>
                    <p>Медиана: {stats.median}</p>
                    <p>Мода (приближённая): {stats.mode}</p>
                    <p>Потерянные котировки: {stats.lost}</p>
                    <p>Время расчёта: {stats.time} мс</p>
                </div>
            )}

            <div style={{margin: 'auto'}}>
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
        </section>
    );
}

createRoot(document.getElementById("root")!).render(<App />);