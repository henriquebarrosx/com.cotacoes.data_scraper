import { logger } from "../adapter/logger/mod.ts";
import { TheNewsWorker } from "./the_news_worker.ts";
import { TheNewsScraper } from "./the_news_scraper.ts";
import { asyncQueue } from "../adapter/async_queue/mod.ts";
import { messageBroker } from "../adapter/message_broker/mod.ts";

export const theNewsScraper = new TheNewsScraper(logger);
export const theNewsWorker = new TheNewsWorker(logger, asyncQueue, messageBroker, theNewsScraper);