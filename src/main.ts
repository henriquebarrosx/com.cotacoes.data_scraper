import type { PtaxInput } from "./ptax/ptax_scraper.ts";

import { cmeWorker } from "./cme/mod.ts";
import { ptaxWorker } from "./ptax/mod.ts";
import { theNewsWorker } from "./the_news/mod.ts";
import { messageBroker } from "./adapter/message_broker/mod.ts";
import { MessageBrokerQueues } from "./adapter/message_broker/queues.ts";
import { TheNewsInput } from "./the_news/the_news_scraper.ts";

await messageBroker.connect();

await messageBroker.listen(
  {
    queue: MessageBrokerQueues.CME_DATA_SCRAPER,
    callback: async ({ correlationId }) => {
      await cmeWorker.execute(correlationId);
    }
  }
);

await messageBroker.listen(
  {
    queue: MessageBrokerQueues.PTAX_DATA_SCRAPER,
    callback: async ({ correlationId, data }) => {
      const { fromDate } = JSON.parse(data) as PtaxInput;
      await ptaxWorker.execute(correlationId, { fromDate });
    }
  }
);

await messageBroker.listen(
  {
    queue: MessageBrokerQueues.THE_NEWS_SCRAPER,
    callback: async ({ correlationId, data }) => {
      const params = JSON.parse(data) as TheNewsInput ?? {};

      const fromDate = params['fromDate'];
      const today = new Date().toISOString();
      const targetDate = fromDate ?? today;

      await theNewsWorker.execute(correlationId, { fromDate: targetDate });
    }
  }
);
