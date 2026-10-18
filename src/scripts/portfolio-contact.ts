import { lockPortfolioScroll } from './scroll-lock';

export function setupContact() {
	const dialog = document.querySelector<HTMLDialogElement>('#contact-dialog');
	const form = document.querySelector<HTMLFormElement>('#contact-form');
	const status = document.querySelector<HTMLElement>('.contact-status');
	if (!dialog || !form) return;
	let opener: HTMLElement | null = null;
	let unlock = () => {};
	document.querySelectorAll<HTMLButtonElement>('[data-contact]').forEach(button => {
		button.addEventListener('click', () => {
			opener = button;
			unlock = lockPortfolioScroll();
			dialog.showModal();
		});
	});
	dialog.querySelector('.close-dialog')!.addEventListener('click', () => dialog.close());
	const outside = (event: MouseEvent) => {
		const rect = dialog.getBoundingClientRect();
		return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
	};
	let startedOutside = false;
	dialog.addEventListener('pointerdown', event => { startedOutside = outside(event); });
	dialog.addEventListener('click', event => {
		if (event.target === dialog && startedOutside && outside(event)) dialog.close();
	});
	dialog.addEventListener('keydown', event => {
		if (event.key !== 'Tab') return;
		const controls = [...dialog.querySelectorAll<HTMLElement>('button, input, textarea, a[href]')];
		const first = controls[0];
		const last = controls.at(-1)!;
		if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
		else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
	});
	dialog.addEventListener('close', () => { unlock(); opener?.focus({ preventScroll: true }); });
	form.addEventListener('submit', event => {
		event.preventDefault();
		if (!form.reportValidity()) return;
		const values = new FormData(form);
		const subject = encodeURIComponent(`Portfolio enquiry from ${values.get('name')}`);
		const body = encodeURIComponent(`${values.get('message')}\n\n${values.get('name')}\n${values.get('email')}`);
		window.location.href = `mailto:${form.dataset.email}?subject=${subject}&body=${body}`;
		if (status) status.textContent = 'Opening your email app with a draft. Send it from there when you’re ready.';
	});
}
