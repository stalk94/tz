import React, { useEffect, useState } from "react";



export default function MonitorWidget() {
    const [state, setState] = useState({
        cpuLoad: 0,
        loopLag: 0,
        memory: null,
    });

    
    useEffect(() => {
        let lastTime = performance.now();

        const interval = setInterval(() => {
            const now = performance.now();

            // Event loop lag = насколько таймер "опоздал"
            const lag = now - lastTime - 1000;
            lastTime = now;

            // CPU load — на основе busy frame % (очень грубая оценка)
            const cpuLoad = Math.min(100, Math.max(0, (lag / 16.7) * 100));

            // Memory API (только Chrome)
            let mem = null;
            if (performance.memory) {
                const used = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
                const total = (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(1);
                mem = `${used} / ${total} MB`;
            }

            setState({
                cpuLoad: cpuLoad.toFixed(1),
                loopLag: lag.toFixed(2),
                memory: mem,
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);


    return (
        <div
            style={{
                position: "fixed",
                top: 10,
                right: 10,
                background: "rgba(0,0,0,0.75)",
                color: "#0f0",
                padding: "6px 10px",
                fontSize: "12px",
                fontFamily: "monospace",
                borderRadius: "6px",
                lineHeight: "1.4",
                zIndex: 9999,
            }}
        >
            <div>CPU (approx): {state.cpuLoad}%</div>
            <div>Loop lag: {state.loopLag} ms</div>
            <div>
                Memory: {state.memory ? state.memory : "N/A"}
            </div>
        </div>
    );
}