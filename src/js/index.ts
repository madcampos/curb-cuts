import '../components/index.js';

// Handle closing the menu when a link is clicked
const dialog = document.querySelector('dialog');
dialog?.addEventListener('click', (evt) => {
	if (!(evt.target instanceof HTMLAnchorElement)) {
		return;
	}

	dialog.hidePopover();
}, { passive: true });
