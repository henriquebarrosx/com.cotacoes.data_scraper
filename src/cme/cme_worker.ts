import type { MessageBroker } from "../adapter/message_broker/message_broker.ts";

import { MessageBrokerQueues } from "../adapter/message_broker/queues.ts";
import { AsyncQueue } from "../adapter/async_queue/async_queue.ts";
import { CmeScraper } from "./cme_scraper.ts";

export class CmeWorker {

	constructor(
		private readonly cmeScraper: CmeScraper,
		private readonly asyncQueue: AsyncQueue,
		private readonly messageBroker: MessageBroker,
	) { }

	async execute(id: string) {
		await new Promise((resolve, reject) => {
			this.asyncQueue.addTask(id, async () => {
				try {
					const cmeData = await this.cmeScraper.run();
					console.log({ cmeData });

					await this.messageBroker.publish(
						{
							queue: MessageBrokerQueues.CME_DATA_STORE,
							message: cmeData,
						}
					);

					resolve(true);
				}

				catch (error) {
					reject(error)
				}
			});
		});
	}

}