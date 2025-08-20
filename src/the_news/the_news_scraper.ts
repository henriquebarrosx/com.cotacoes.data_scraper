import Puppeteer from 'npm:puppeteer-extra';
import StealthPlugin from 'npm:puppeteer-extra-plugin-stealth';

import type { Logger } from "../adapter/logger/logger.ts";
import { TheNewsUrl } from "./the_news_url.ts";

export type TheNewsInput = {
	fromDate: string;
}

export class TheNewsScraper {

	constructor(private readonly logger: Logger) { }

	async run({ fromDate }: TheNewsInput) {
		try {
			const puppeteer = Puppeteer.default;
			puppeteer.use(StealthPlugin());

			const theNewsUrl = new TheNewsUrl(fromDate);

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
				theNewsUrl.value,
				{
					waitUntil: 'domcontentloaded',
					timeout: 60000,
				}
			);

			const links = await page.evaluate(() => {
				// @ts-ignore: it only exist at browser-side
				const container = document.querySelectorAll('div.grid div');

				const paths = Array.from(container)
					.filter((el) => {
						// @ts-ignore: it only exist at browser-side
						const isAnchor = el.querySelector('a[data-discover="true"]');
						return isAnchor;
					})
					.filter((el) => {
						// @ts-ignore: it only exist at browser-side
						const anchor = el.querySelector('a[data-discover="true"]').href
						return anchor.includes(`${location.origin}/p/`)
					})
					.reduce<Set<string>>((items, el) => {
						// @ts-ignore: it only exist at browser-side
						const anchor = el.querySelector('a[data-discover="true"]')
						items.add(anchor.href);
						return items;
					}, new Set<string>())

				return Array.from(paths);
			});

			let content = '';

			for await (const link of links) {
				await page.goto(link, {
					waitUntil: 'networkidle2',
					timeout: 60000
				});

				const text = await page.evaluate(() => {
					// @ts-ignore: it only exist at browser-side
					const elements = document.getElementById('content-blocks').children;
					// @ts-ignore: it only exist at browser-side
					const contentElements = Array.from(elements).filter((el) => el.tagName === 'DIV');
					// @ts-ignore: it only exist at browser-side
					const textContent = contentElements.map(el => el.textContent);
					const nonEmptyContent = textContent.filter(text => text.trim() !== '');
					return nonEmptyContent.join('\n');
				});

				content = text;
			}


			await browser.close();
			return content;
		}

		catch (error) {
			if (error && typeof error === 'object' && 'message' in error) {
				this.logger.error('The news scrap failed', error.message);
			}

			throw error;
		}
	}

}