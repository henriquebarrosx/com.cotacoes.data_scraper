export class TheNewsUrl {
	/**
	 * 
	 * @param isoDate Ex.: 2025-08-19T20:42:44.651Z
	 */
	constructor(private readonly isoDate: string) { }

	get value(): string {
		const searchParams = new URLSearchParams();
		searchParams.append('q', this.#getDateFormat());
		return `${this.baseURL}/archive?${searchParams.toString()}`;
	}

	get baseURL() {
		const baseURL = Deno.env.get("THE_NEWS_RESOURCE_URL");
		if (!baseURL) throw new Error('Cannot build the news url: missing the news resource url');
		return baseURL;
	}

	#getDateFormat() {
		const date = new Date(this.isoDate);

		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const year = date.getFullYear();

		return `${day}/${month}/${year}`;
	}
}