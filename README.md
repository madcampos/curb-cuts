# Curb Cuts Arts Website

## Prerequisites

- [Node.js](https://nodejs.org/), preferably installed using a version management tool like [nvm](https://github.com/nvm-sh/nvm) or [mise](https://mise.jdx.dev/).
- [pnpm](https://pnpm.io/)
- [mkcert](https://github.com/FiloSottile/mkcert)

## Tools used

- `pnpm` as the package manager
- `oxlint` as the linter
- `typescript`
- `dprint` for formatting code
- `vite` for running the dev server and building the project

## Project structure

This is a one page website/landing page using `vite`. The main file to pay attention is `src/index.html`.

All files that are referenced from `index.html` are in the `src` folder.
Other files that should be included but are not listed (such as the `favicon` icons, PWA manifest, social media images, and `robots.txt`) are included in the `public` folder.

The folders on `src` are:

- `components` that lists the CSS and JS for each of the custom elements, or components to be reused throughout the page.
  - Each component has it's own folder
  - `index.css` entry point to load the components CSS.
  - `index.ts` entry point to load the components JS.
- `css` the general CSS shared by the project.
  - `base` the styles to apply for elements themselves, organized by section, following the same organization as [MDN's list of HTML elements sections](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements). All files are loaded by `index.css`.
  - `fonts` custom font files.
  - `accessible.css` overrides to apply on top of the general CSS for preferences like increased contrast and forced colors.
  - `fonts.css` font face declarations and variables to load those font faces.
  - `index.css` main CSS entry point, loads all other files.
  - `vars.css` all variables declared by the project.
- `images` the images referenced on the page.
- `js` general JS to load on the page.
  - `index.ts` it is the entry point for all JS.
- `pages` CSS and JS to specific pages that are not covered by the general files.
- `404.html` error page.
- `env.d.ts` ambient declaration for vite's variables to work.
- `index.html` main HTML file.

## Getting started

Install dependencies running:

```bash
pnpm install
```

Then start the dev server by running:

```bash
pnpm start
```
