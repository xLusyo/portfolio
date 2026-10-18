export function lockPortfolioScroll() {
	const roots = [document.documentElement, ...document.querySelectorAll<HTMLElement>('.portfolio, .content')];
	const previous = roots.map(root => ({ root, overflow: root.style.overflow }));
	roots.forEach(root => { root.style.overflow = 'hidden'; });
	return () => previous.forEach(({ root, overflow }) => { root.style.overflow = overflow; });
}
