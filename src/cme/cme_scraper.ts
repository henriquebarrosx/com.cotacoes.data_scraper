import Puppeteer from 'npm:puppeteer-extra';
import StealthPlugin from 'npm:puppeteer-extra-plugin-stealth';

import type { HTMLDocument } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

import type { Logger } from "../adapter/logger/logger.ts";
import type { CmeRawDTO } from "./cme_raw_dto.ts";

export class CmeScraper {

	constructor(private readonly logger: Logger) { }

	async run() {
		try {
			const puppeteer = Puppeteer.default;
			puppeteer.use(StealthPlugin());

			const baseURL = Deno.env.get("CME_RESOURCE_URL");
			if (!baseURL) throw new Error('Cannot proceed cme data scrap: missing cme resource url')

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
				baseURL,
				{
					waitUntil: 'domcontentloaded',
					timeout: 60000,
				}
			);

			await page.waitForSelector('.main-table-wrapper table tbody tr');

			const data = await page.evaluate(() => {
				// @ts-ignore: it only exist at browser-side
				const rows = document.querySelectorAll('.main-table-wrapper table tbody tr');
				const data: CmeRawDTO[] = [];

				rows.forEach((row: HTMLDocument) => {
					const columns = row.querySelectorAll('td');

					const params = {
						last: columns[3].innerText.trim(),
						change: columns[4].innerText.trim(),
						high: columns[7].innerText.trim(),
						low: columns[8].innerText.trim(),
						volume: columns[9].innerText.trim(),
						updated: columns[10].innerText.trim()
					}

					const notEmpty = Object.values(params).every(value => !!value);
					if (notEmpty) data.push(params);
				});

				return data.slice(0, 1);
			});

			await browser.close();
			return data[0];
		}

		catch (error) {
			if (error && typeof error === 'object' && 'message' in error) {
				this.logger.error('Cme data scrap failed', error.message);
			}

			throw error;
		}
	}

}