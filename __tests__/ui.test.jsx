import { describe, it, expect } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { createRoot } from "react-dom/client";
import React from "react";
import App from "../src/App.jsx"; // экспортируй App отдельно!


// мок для Worker
class FakeWorker {
    constructor () { this.onmessage = null; }
    postMessage(msg) {
        if (msg?.type === "get-stats") {
            // сначала count=0 → loader
            setTimeout(() => {
                this.onmessage?.({
                    data: {
                        type: "stats", payload: {
                            count: 0, mean: null, std: null, median: null, mode: null, lost: 0, time: 0
                        }
                    }
                });

                // потом реальные данные
                setTimeout(() => {
                    this.onmessage?.({
                        data: {
                            type: "stats", payload: {
                                count: 10, mean: 2.4, std: 1.1, median: 2.0, mode: 2.5, lost: 0, time: 0.01
                            }
                        }
                    });
                }, 5);
            }, 5);
        }
    }
    terminate() { }
}
globalThis.Worker = FakeWorker;



describe("UI loader behaviour", () => {
    it("shows loader until count > 0", async () => {
        document.body.innerHTML = '<div id="root"></div>';
        const root = createRoot(document.getElementById("root"));
        root.render(<App />);

        const startBtn = await screen.findByText("Старт");
        fireEvent.click(startBtn);

        const statBtn = await screen.findByText("Статистика");
        fireEvent.click(statBtn);

        // loader виден
        const loader = await screen.findByText(/Загрузка…/i);
        expect(loader).toBeInTheDocument();

        // потом появляются реальные данные
        const received = await screen.findByText(/Получено котировок: 10/i);
        expect(received).toBeInTheDocument();
    });
});