import type { MessageBroker } from "../adapter/message_broker/message_broker.ts";

import { MessageBrokerQueues } from "../adapter/message_broker/queues.ts";
import { AsyncQueue } from "../adapter/async_queue/async_queue.ts";
import { TheNewsInput, TheNewsScraper } from "./the_news_scraper.ts";
import { Logger } from "../adapter/logger/logger.ts";

export class TheNewsWorker {

	constructor(
		private readonly logger: Logger,
		private readonly asyncQueue: AsyncQueue,
		private readonly messageBroker: MessageBroker,
		private readonly theNewsScraper: TheNewsScraper,
	) { }

	async execute(id: string, params: TheNewsInput) {
		await new Promise((resolve, reject) => {
			this.asyncQueue.addTask(id, async () => {
				try {
					const content = await this.theNewsScraper.run(params);

					await this.messageBroker.publish(
						{
							queue: MessageBrokerQueues.THE_NEWS_ARTICLE_STORE,
							message: content,
						}
					);

					resolve(true);
				}

				catch (error) {
					this.logger.error("The news scrap failed: ", error);
					reject(error);
					throw error;
				}
			});
		});
	}

}