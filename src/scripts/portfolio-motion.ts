import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const clearProperties = 'opacity,transform,willChange';
const introKinds = new Set(['portrait', 'profile', 'intro']);

export function setupPortfolioMotion() {
	const root = document.querySelector<HTMLElement>('.portfolio');
	const content = root?.querySelector<HTMLElement>('.content');
	const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
	if (!root || !content || location.hash || navigation?.type === 'back_forward') return () => {};
	const scrollers = { desktop: content, compact: root };

	gsap.registerPlugin(ScrollTrigger);
	const targets = [...root.querySelectorAll<HTMLElement>('[data-motion]')];
	const completed = new Set<HTMLElement>();
	const active = new Map<HTMLElement, gsap.core.Animation>();
	const media = gsap.matchMedia();
	let initialized = false;
	let disposed = false;

	function finishFocused(target: Element | null) {
		const element = target?.closest<HTMLElement>('[data-motion]');
		if (!element || !targets.includes(element)) return;
		active.get(element)?.progress(1);
		completed.add(element);
		gsap.set(element, { clearProps: clearProperties });
	}
	const onFocus = (event: FocusEvent) => finishFocused(event.target instanceof Element ? event.target : null);

	function setupResponsiveMotion(context: gsap.Context) {
		if (!context.conditions?.motion || context.conditions.forcedColors) return;
		const desktop = Boolean(context.conditions.desktop);
		const scroller = desktop ? scrollers.desktop : scrollers.compact;
		const bounds = scroller.getBoundingClientRect();
		const skipIntro = initialized;

		if (skipIntro) {
			targets.forEach(target => {
				const rect = target.getBoundingClientRect();
				if (introKinds.has(target.dataset.motion!) || rect.top < bounds.bottom) completed.add(target);
			});
		}
		initialized = true;

		const pending = targets.filter(target => !completed.has(target));
		gsap.set(pending, {
			opacity: 0,
			y: (_index: number, target: HTMLElement) => ['project', 'tool'].includes(target.dataset.motion!) ? 16 : 12,
		});

		function reveal(elements: HTMLElement[], isIntro = false) {
			const entering = elements.filter(element => !completed.has(element));
			if (!entering.length) return;
			entering.forEach(element => completed.add(element));
			context.add(() => {
				gsap.set(entering, { willChange: 'opacity,transform' });
				const options = {
					opacity: 1,
					y: 0,
					duration: isIntro ? 0.55 : 0.5,
					stagger: 0.08,
					ease: 'power2.out',
					overwrite: 'auto' as const,
					clearProps: clearProperties,
					onComplete: () => entering.forEach(element => active.delete(element)),
				};
				const animation = isIntro
					? gsap.timeline().to(entering, options)
					: gsap.to(entering, options);
				entering.forEach(element => active.set(element, animation));
			});
		}

		function revealOnScroll(elements: HTMLElement[], batchMax: number, isIntro = false) {
			if (!elements.length) return;
			const visible = elements.filter(element => {
				const rect = element.getBoundingClientRect();
				return rect.top < bounds.top + bounds.height * 0.88 && rect.bottom > bounds.top;
			});
			for (let index = 0; index < visible.length; index += batchMax) {
				reveal(visible.slice(index, index + batchMax), isIntro);
			}
			const waiting = elements.filter(element => !completed.has(element));
			if (!waiting.length) return;
			ScrollTrigger.batch(waiting, {
				scroller,
				start: 'clamp(top 88%)',
				once: true,
				interval: 0.08,
				batchMax,
				onEnter: batch => reveal(batch as HTMLElement[], isIntro),
				onEnterBack: batch => reveal(batch as HTMLElement[], isIntro),
			});
		}

		const introduction = pending.filter(target => introKinds.has(target.dataset.motion!));
		if (desktop) reveal(introduction, true);
		else revealOnScroll(introduction, 1, true);

		revealOnScroll(pending.filter(target => target.dataset.motion === 'experience'), 1);
		for (const kind of ['project', 'tool']) {
			const elements = pending.filter(target => target.dataset.motion === kind);
			const grid = elements[0]?.parentElement;
			const columns = grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').length : 1;
			revealOnScroll(elements, columns);
		}
		return () => active.clear();
	}

	try {
		media.add({
			desktop: '(min-width: 1025px)',
			compact: '(max-width: 1024px)',
			motion: '(prefers-reduced-motion: no-preference)',
			forcedColors: '(forced-colors: active)',
		}, setupResponsiveMotion, root);
	} catch (error) {
		media.revert();
		throw new Error('GSAP portfolio setup failed.', { cause: error });
	}

	function refresh() {
		if (!disposed) ScrollTrigger.refresh();
	}
	root.addEventListener('focusin', onFocus);
	finishFocused(document.activeElement);
	document.fonts.addEventListener('loadingdone', refresh);
	void document.fonts.ready.then(refresh);

	return () => {
		disposed = true;
		media.revert();
		active.clear();
		root.removeEventListener('focusin', onFocus);
		document.fonts.removeEventListener('loadingdone', refresh);
	};
}
