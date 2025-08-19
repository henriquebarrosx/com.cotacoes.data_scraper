import { cmeWorker } from "./cme/mod.ts";
import { ptaxWorker } from "./ptax/mod.ts";
import { PtaxInput } from "./ptax/ptax_scraper.ts";
import { messageBroker } from "./adapter/message_broker/mod.ts";
import { MessageBrokerQueues } from "./adapter/message_broker/queues.ts";

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
