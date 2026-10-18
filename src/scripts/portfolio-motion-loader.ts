export function loadPortfolioMotion() {
	const preference = matchMedia('(prefers-reduced-motion: no-preference) and (forced-colors: none)');
	let requested = false;
	let exited = false;
	let dispose: (() => void) | undefined;

	async function load() {
		if (!preference.matches || requested || exited) return;
		requested = true;
		try {
			const { setupPortfolioMotion } = await import('./portfolio-motion');
			if (!exited) dispose = setupPortfolioMotion();
		} catch (error) {
			console.error('Portfolio motion could not be initialized; content remains available.', error);
		}
	}

	preference.addEventListener('change', load);
	window.addEventListener('pagehide', () => {
		exited = true;
		preference.removeEventListener('change', load);
		dispose?.();
	}, { once: true });
	void load();
}
