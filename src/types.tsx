export interface StatsResult {
	mean: number | null;
	std: number | null;
	median: number | null;
	mode: number | null;
	lost: number;
	time?: number;
}


// Запросы в воркер
export type WorkerRequest =
	| { type: "start" }
	| { type: "get-stats" };

// Ответы от воркера
export type WorkerResponse =
	| { type: "stats"; payload: StatsResult };