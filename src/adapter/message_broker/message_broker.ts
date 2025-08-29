import { connect } from "https://deno.land/x/amqp@v0.23.0/mod.ts"
import type { AmqpConnection, AmqpChannel } from "https://deno.land/x/amqp@v0.23.0/mod.ts"

import type { MessageBrokerQueues } from "./queues.ts";
import { Logger } from "../logger/logger.ts";

type PublishInput = {
	queue: MessageBrokerQueues;
	message: unknown;
	options?: {
		correlationId: string;
	}
}

type ConsumerInput = {
	queue: MessageBrokerQueues;
	callback: (output: ConsumerOutput) => Promise<void>;
}

type ConsumerOutput = {
	correlationId: string;
	data: string;
}

type RetryOptions = {
	queue: MessageBrokerQueues;
	correlationId: string;
	retryCount: number;
	message: Uint8Array<ArrayBufferLike>;
	deliveryTag: number;
}

export class MessageBroker {
	private conn?: AmqpConnection;

	constructor(
		private readonly logger: Logger,
	) { }

	async connect() {
		while (!this.conn) {
			try {
				const url = Deno.env.get("RABBITMQ_URL");
				if (!url) throw new Error('Cannot initilize message broker: url not defined');

				this.conn = await connect(url);
				this.logger.info('Message broker connection established');
			}

			catch (error) {
				if (error && typeof error === 'object' && 'message' in error) {
					this.logger.error("Failed to connect message broker, retrying in 5s", error.message);
				}

				await new Promise(res => setTimeout(res, 5000));
				this.conn = undefined;
			}
		}
	}

	async publish({ queue, message }: PublishInput) {
		if (!this.conn) {
			throw new Error('Cannot publish message: must establish a connection first')
		}

		const channel = await this.conn.openChannel();

		await channel.declareQueue(
			{
				durable: true,
				queue: queue,
			}
		);

		const correlationId = crypto.randomUUID();

		await channel.publish(
			{
				routingKey: queue,
			},
			{
				contentType: 'application/json',
				correlationId: correlationId,
			},
			new TextEncoder().encode(JSON.stringify(message))
		)

		this.logger.info(
			'Publishing new message',
			{
				event: 'PUBLISH',
				queue: queue,
				id: correlationId,
			}
		);
	}

	async listen({ queue, callback }: ConsumerInput) {
		if (!this.conn) {
			throw new Error(`Cannot consume message for queue ${queue}: must establish a connection first`)
		}

		const channel = await this.conn.openChannel();

		await channel.declareQueue(
			{
				queue: queue,
				durable: true,
			}
		);

		await channel.consume(
			{
				queue: queue,
				noAck: false,
			},
			async (args, props, message) => {
				const data = new TextDecoder().decode(message);

				const retryCount = Number(props.headers?.["x-retry"] ?? 0);
				const MAX_ALLOWED_RETRIES = 5;

				this.logger.info(
					'Receiving new message',
					{
						id: props.correlationId,
						event: 'RECEIVED',
						retries: `${retryCount}/5`,
						failed: retryCount !== 0,
						queue: queue,
					}
				);

				try {
					await callback({
						correlationId: props.correlationId!,
						data: data,
					});

					await channel.ack(
						{
							deliveryTag: args.deliveryTag,
							multiple: false,
						}
					);
				}

				catch {
					if (retryCount >= MAX_ALLOWED_RETRIES) {
						this.logger.error(`Max retries reached for ${props.correlationId} at ${queue} queue, discarding...`);
						await channel.ack({ deliveryTag: args.deliveryTag });
						return;
					}

					await this.asyncRetry(
						channel,
						{
							correlationId: props.correlationId!,
							queue: queue,
							retryCount: retryCount,
							message: message,
							deliveryTag: args.deliveryTag,
						}
					)
				}
			}
		)

		this.logger.info(`New message broker consumer registered for queue ${queue}`);
	}

	private async asyncRetry(channel: AmqpChannel, options: RetryOptions) {
		const { queue, correlationId, message, deliveryTag, retryCount } = options;

		await this.waitTime(30_000);

		await channel.publish(
			{
				routingKey: queue,
			},
			{
				contentType: 'application/json',
				correlationId: correlationId,
				headers: { "x-retry": retryCount + 1 },
			},
			message
		);

		await channel.ack({ deliveryTag: deliveryTag });
	}

	private async waitTime(amout: number) {
		await new Promise((resolve) => setTimeout(resolve, amout));
	}
}