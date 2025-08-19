export class Logger {
	info(message: string, ...args: unknown[]): void {
		const datetime = new Date().toString();
		const msg = `[${datetime}] INFO: ${message}`
		console.log(msg, ...args);
	}

	error(message: string, ...args: unknown[]): void {
		const datetime = new Date().toString();
		const msg = `[${datetime}] ERROR: ${message}`
		console.log(msg, ...args);
	}
}