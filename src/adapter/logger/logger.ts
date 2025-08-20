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
		const error = new Error(reason ? reason.toString() : '');

		const params = {
			type: 'ERROR',
			title: message,
			timestamp: new Date().toString(),
		}

		console.log()
		console.error(params)
		console.log()
		console.error(error.stack)
		console.log()
	}
}