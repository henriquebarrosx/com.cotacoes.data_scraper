import { CmeWorker } from "./cme_worker.ts";
import { CmeScraper } from "./cme_scraper.ts";
import { logger } from "../adapter/logger/mod.ts";
import { asyncQueue } from "../adapter/async_queue/mod.ts";
import { messageBroker } from "../adapter/message_broker/mod.ts";

const cmeScraper = new CmeScraper(logger);
export const cmeWorker = new CmeWorker(cmeScraper, asyncQueue, messageBroker);