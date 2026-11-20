#!/usr/bin/env node

// oxlint-disable no-await-in-loop

import { encodeIco } from 'icojs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import puppeteer from 'puppeteer';

interface Icon {
	filename: string;
	width: number;
	height: number;
	format: string;
	type: 'any' | 'maskable' | 'monochrome' | 'ios';
}

const { values } = parseArgs({
	options: {
		svg: { type: 'string', short: 's' },
		manifest: { type: 'string', short: 'm' },
		output: { type: 'string', short: 'o' },
		ios: { type: 'string', short: 'i' },
		favicon: { type: 'boolean', default: false, short: 'f' }
	}
});

if (!values.manifest || !values.output || !values.svg) {
	throw new Error('Usage: generate-icons --svg <file> --manifest <file> --output-root <folder> [--ios] [--favicon]');
}

const manifestPath = resolve(values.manifest);
const outputRoot = resolve(values.output);
const manifest: { icons: { src: string, sizes: string, type: Icon['format'], purpose: string }[] } = JSON.parse(await readFile(manifestPath, 'utf8'));
const icons = manifest.icons
	.map((icon) => {
		const size = icon.sizes === 'any' ? undefined : /^(\d+)x(\d+)$/u.exec(icon.sizes);

		if (icon.sizes !== 'any' && !size) { throw new Error(`Unsupported icon size: ${icon.sizes}`); }

		const relativePath = icon.src.replace(/^[/\\]+/u, '');
		const iconPath = resolve(outputRoot, relativePath);
		const relativeIconPath = relative(outputRoot, iconPath);

		if (relativeIconPath.startsWith('..') || isAbsolute(relativeIconPath)) {
			throw new Error(`Icon source must be relative to the output root: ${icon.src}`);
		}

		const iconMetadata: Icon = {
			filename: relativeIconPath,
			// oxlint-disable-next-line no-magic-numbers
			width: size ? Number(size[1]) : 1024,
			// oxlint-disable-next-line no-magic-numbers
			height: size ? Number(size[2]) : 1024,
			format: icon.type,
			type: 'any'
		};

		if (icon.purpose.includes('maskable')) {
			iconMetadata.type = 'maskable';
		}

		if (icon.purpose.includes('monochrome')) {
			iconMetadata.type = 'monochrome';
		}

		return iconMetadata;
	});

if (values.ios) {
	const iconPath = resolve(outputRoot, values.ios);
	const filename = relative(outputRoot, iconPath);

	if (filename.startsWith('..') || isAbsolute(filename)) {
		throw new Error(`iOS icon path must be relative to the output root: ${values.ios}`);
	}

	icons.push({ filename, width: 180, height: 180, format: 'image/png', type: 'ios' });
}

const svgUrl = pathToFileURL(resolve(values.svg));

await mkdir(outputRoot, { recursive: true });

const browser = await puppeteer.launch();

try {
	const page = await browser.newPage();
	await page.goto(svgUrl.href);

	for (const { filename, width, height, format, type } of icons) {
		await page.evaluate((iconType) => {
			document.documentElement.setAttribute('data-icon-type', iconType);
		}, type);

		const outputPath = join(outputRoot, filename);
		await mkdir(dirname(outputPath), { recursive: true });

		if (format === 'image/svg+xml') {
			const svg = await page.evaluate((iconType) => {
				// oxlint-disable-next-line typescript/consistent-type-assertions typescript/no-unsafe-type-assertion
				const documentSvg = document.documentElement.cloneNode(true) as SVGElement;
				const iconAttribute = `data-${iconType}`;

				// Remove elements that should not show on this icon
				for (const element of documentSvg.querySelectorAll('[data-any], [data-maskable], [data-monochrome], [data-ios]')) {
					if (!element.hasAttribute(iconAttribute)) {
						element.remove();
					}
				}

				// Remove elements that are not references anymore
				for (const id of ['icon-shape', 'icon-bg', 'icon']) {
					const isReferenced = [...documentSvg.querySelectorAll('use')].some((element) => {
						const href = element.getAttribute('href') ?? element.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
						return href === `#${id}`;
					});

					if (!isReferenced) {
						documentSvg.querySelector(`#${id}`)?.remove();
					}
				}

				// Remove icon guide
				documentSvg.querySelector('#guide')?.remove();

				// Remove style tag (the first one should be the hide/show styles)
				documentSvg.querySelector('style')?.remove();

				// Remove comments
				const commentWalker = document.createTreeWalker(documentSvg, NodeFilter.SHOW_COMMENT);
				const comments: Node[] = [];
				while (commentWalker.nextNode()) {
					comments.push(commentWalker.currentNode);
				}

				for (const comment of comments) {
					comment.parentNode?.removeChild(comment);
				}

				return documentSvg.outerHTML;
			}, type);

			await writeFile(outputPath, svg.replace(/\s+/gu, ' ').trim());

			continue;
		}

		await page.setViewport({ width, height });
		await page.screenshot({
			path: outputPath,
			type: 'png',
			omitBackground: true
		});
	}

	if (values.favicon) {
		await page.evaluate(() => {
			document.documentElement.setAttribute('data-icon-type', 'any');
		});

		await page.setViewport({ width: 32, height: 32 });

		const png = await page.screenshot({
			type: 'png',
			omitBackground: true
		});
		const ico = await encodeIco([{ buffer: Buffer.from(png) }]);

		await writeFile(join(outputRoot, 'favicon.ico'), Buffer.from(ico));
	}
} finally {
	await browser.close();
}

process.exit(0);
