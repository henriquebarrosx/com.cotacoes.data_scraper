import Puppeteer from 'npm:puppeteer-extra';
import StealthPlugin from 'npm:puppeteer-extra-plugin-stealth';

import type { Logger } from "../adapter/logger/logger.ts";
import type { PtaxRawDTO } from "./ptax_raw_dto.ts";
import { PtaxUrl } from "./ptax_url.ts";

export type PtaxInput = {
	fromDate: string;
}

export class PtaxScraper {

	constructor(private readonly logger: Logger) { }

	async run({ fromDate }: PtaxInput) {
		try {
			const puppeteer = Puppeteer.default;
			puppeteer.use(StealthPlugin());

			const baseUrl = new PtaxUrl(fromDate);
			if (!baseUrl) throw new Error('Cannot proceed ptax data scrap: missing ptax resource url')

			const puppeteerArgs = ['--disable-http2', '--no-sandbox', '--disable-setuid-sandbox'];

			const browser = await puppeteer.launch(
				{
					args: puppeteerArgs,
					headless: true
				}
			);

			const page = await browser.newPage();
			await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');
			await page.setJavaScriptEnabled(true);
			await page.setCacheEnabled(false);

			await page.goto(
				baseUrl.value,
				{
					waitUntil: 'domcontentloaded',
					timeout: 60000,
				}
			);

			await page.waitForSelector('table.tabela tbody tr');

			const data = await page.evaluate(() => {
				// @ts-ignore: it only exist at browser-side
				const rows = document.querySelectorAll('table.tabela tbody tr');
				const data: PtaxRawDTO[] = [];

				for (const row of rows) {
					const MIN_AMOUNT_OF_COLUMNS_REQUIRED = 6;
					const columns = row.querySelectorAll("td");

					if (columns.length < MIN_AMOUNT_OF_COLUMNS_REQUIRED) continue;

					const params = {
						time: columns[0].innerText.trim(),
						type: columns[1].innerText.trim(),
						buyRateValue: columns[2].innerText.trim(),
						sellRateValue: columns[3].innerText.trim(),
					}

					data.push(params);
				}

				return data;
			});

			await browser.close();
			return data.map((params) => ({ ...params, date: fromDate }));
		}

		catch (error) {
			if (error && typeof error === 'object' && 'message' in error) {
				this.logger.error("Cannot scrap ptax data: ", error.message);
			}

			throw error;
		}
	}

}