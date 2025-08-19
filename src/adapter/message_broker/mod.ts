import { logger } from "../logger/mod.ts";
import { MessageBroker } from "./message_broker.ts";

export const messageBroker = new MessageBroker(logger)