import { messageBroker } from "./adapter/message_broker/mod.ts";
import { MessageBrokerQueues } from "./adapter/message_broker/queues.ts";
import { cmeWorker } from "./cme/mod.ts";

await messageBroker.connect();

await messageBroker.listen(
  {
    queue: MessageBrokerQueues.CME_DATA_SCRAPER,
    callback: async ({ correlationId }) => {
      await cmeWorker.execute(correlationId);
    }
  }
);
