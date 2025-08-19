import { logger } from "../logger/mod.ts";
import { AsyncQueue } from "./async_queue.ts";

export const asyncQueue = new AsyncQueue(logger);