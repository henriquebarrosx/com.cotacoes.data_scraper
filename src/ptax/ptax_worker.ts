import type { MessageBroker } from "../adapter/message_broker/message_broker.ts";

import { MessageBrokerQueues } from "../adapter/message_broker/queues.ts";
import { AsyncQueue } from "../adapter/async_queue/async_queue.ts";
import { PtaxInput, PtaxScraper } from "./ptax_scraper.ts";

export class PtaxWorker {

	constructor(
		private readonly ptaxScraper: PtaxScraper,
		private readonly asyncQueue: AsyncQueue,
		private readonly messageBroker: MessageBroker,
	) { }

	async execute(id: string, params: PtaxInput) {
		await new Promise((resolve, reject) => {
			this.asyncQueue.addTask(id, async () => {
				try {
					const ptaxData = await this.ptaxScraper.run(params);

					await this.messageBroker.publish(
						{
							queue: MessageBrokerQueues.PTAX_DATA_STORE,
							message: ptaxData,
						}
					);

					resolve(true);
				}

				catch (error) {
					reject(error);
					throw error;
				}
			});
		});
	}

}