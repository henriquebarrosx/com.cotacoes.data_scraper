import { Logger } from "../logger/logger.ts";

/**
 * Execute task asynchronously, one per time.
 */
export class AsyncQueue {
	#tasks = new Map<string, () => Promise<unknown>>([]);
	#inProcessing = false;

	constructor(private readonly logger: Logger) { }

	addTask(id: string, cb: () => Promise<unknown>) {
		this.logger.info(`Adding async task: ${id}`);
		this.#tasks.set(id, cb);
		this.#processNext();
	}

	#processNext() {
		const tasks = this.#tasks.entries();
		const next = tasks.next();

		if (next.done || this.#inProcessing) {
			return;
		}

		this.#inProcessing = true;
		const [id, task] = next.value;

		this.logger.info(`Executing async task: ${id}`);

		task()
			.then(() => {
				this.#tasks.delete(id);

				this.logger.info(`Task executed successfully: ${id}`);
				this.logger.info(`Pending enqueued tasks: ${this.#tasks.size}`);

				this.#inProcessing = false;
				this.#processNext();
			})
			.catch(() => {
				this.logger.info(`Task execution fail: ${id}`);
				this.#inProcessing = false;
			});
	}

}