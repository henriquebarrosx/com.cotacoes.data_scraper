export class Logger {
	info(message: string, ...args: unknown[]): void {
		const params = {
			type: 'INFO',
			title: message,
			timestamp: new Date().toString(),
			...(args.length ? { args } : {})
		}

		console.log(params)
	}

	error(message: string, reason?: string | unknown): void {
		const params = {
			type: 'ERROR',
			title: message,
			timestamp: new Date().toString(),
			reason: reason,
		}

		console.error(params)
	}
}