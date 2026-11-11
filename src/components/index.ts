import type { FillerText } from './FillerText/filler-text.ts';

import './FillerText/filler-text.ts';

// #region HTML only elements
declare global {
	interface HTMLElementTagNameMap {
		'sr-only': HTMLElement;
		'filler-text': FillerText;
	}
}
// #endregion
