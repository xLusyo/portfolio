export function setupNavigation() {
	const links = [...document.querySelectorAll<HTMLAnchorElement>('.section-nav a')];
	const sections = [...document.querySelectorAll<HTMLElement>('main > section')];
	const portfolio = document.querySelector<HTMLElement>('.portfolio');
	const content = document.querySelector<HTMLElement>('.content');
	const navigation = document.querySelector<HTMLElement>('.section-nav');
	if (!portfolio || !content || !navigation) return;
	const mobile = matchMedia('(max-width: 1024px)');
	let frame = 0;
	function updateActive() {
		frame = 0;
		const root = mobile.matches ? portfolio! : content!;
		const threshold = root.getBoundingClientRect().top + navigation!.offsetHeight + 24;
		let active = sections[0];
		for (const section of sections) {
			if (section.getBoundingClientRect().top <= threshold) active = section;
		}
		if (root.scrollTop > 0 && root.scrollTop + root.clientHeight >= root.scrollHeight - 2) active = sections.at(-1)!;
		links.forEach(link => {
			if (link.hash === `#${active.id}`) link.setAttribute('aria-current', 'location');
			else link.removeAttribute('aria-current');
		});
	}
	function scheduleUpdate() {
		if (!frame) frame = requestAnimationFrame(updateActive);
	}
	content.addEventListener('scroll', scheduleUpdate, { passive: true });
	portfolio.addEventListener('scroll', scheduleUpdate, { passive: true });
	window.addEventListener('resize', scheduleUpdate);
	mobile.addEventListener('change', () => {
		content.scrollTop = 0;
		portfolio.scrollTop = 0;
		scheduleUpdate();
	});
	updateActive();
}
