import { logger } from "../adapter/logger/mod.ts";
import { asyncQueue } from "../adapter/async_queue/mod.ts";
import { messageBroker } from "../adapter/message_broker/mod.ts";
import { PtaxScraper } from "./ptax_scraper.ts";
import { PtaxWorker } from "./ptax_worker.ts";

const ptaxScraper = new PtaxScraper(logger);
export const ptaxWorker = new PtaxWorker(ptaxScraper, asyncQueue, messageBroker);