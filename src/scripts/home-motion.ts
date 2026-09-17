import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/** Progressive enhancement: the static document is always the readable fallback. */
function mountHomeMotion(root: HTMLElement): () => void {
	gsap.registerPlugin(ScrollTrigger);
	const media = gsap.matchMedia();
	const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-motion]'));
	const seen = new WeakSet<HTMLElement>();
	let disposed = false;

	// Back/forward navigation should restore a readable page, not replay entrances.
	const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
	if (navigation?.type === 'back_forward') return () => {};

	media.add('(prefers-reduced-motion: no-preference) and (forced-colors: none)', (context) => {
		const animations = new Map<HTMLElement, gsap.core.Animation>();
		const triggers: ScrollTrigger[] = [];
		const finishFocusedTarget = (event: FocusEvent) => {
			if (!(event.target instanceof Element)) return;
			const target = event.target.closest<HTMLElement>('[data-motion]');
			if (!target || !root.contains(target)) return;
			animations.get(target)?.progress(1);
			triggers.filter((trigger) => trigger.trigger === target).forEach((trigger) => trigger.kill());
		};

		try {
			// Read geometry before writing styles. Already-passed or focused content stays visible.
			const candidates = targets.filter((target) => !seen.has(target));
			const bounds = new Map(candidates.map((target) => [target, target.getBoundingClientRect()]));
			const eligible = candidates.filter((target) => {
				if (bounds.get(target)!.bottom <= 0 || target.contains(document.activeElement)) {
					seen.add(target);
					return false;
				}
				return true;
			});
			const hero = eligible.filter((target) => target.dataset.motion === 'hero');
			const portrait = eligible.find((target) => target.dataset.motion === 'portrait');
			const heroPortrait = portrait && bounds.get(portrait)!.top < window.innerHeight * 0.88 ? portrait : undefined;
			const heroTargets = heroPortrait ? [...hero, heroPortrait] : hero;
			const scrollTargets = eligible.filter((target) => !heroTargets.includes(target));
			const end = { opacity: 1, y: 0, clearProps: 'opacity,transform' };

			// Opacity (not autoAlpha) intentionally preserves keyboard focusability.
			// The focusin handler finishes an entrance before a focused link can remain invisible.
			if (heroTargets.length) {
				const timeline = gsap.timeline({
					defaults: { duration: 0.55, ease: 'power2.out' },
					onComplete: () => heroTargets.forEach((target) => seen.add(target)),
				});
				if (hero.length) timeline.fromTo(hero, { opacity: 0, y: 16 }, { ...end, stagger: 0.08 }, 0);
				if (heroPortrait) timeline.fromTo(heroPortrait, { opacity: 0, y: 16 }, { ...end, duration: 0.65 }, 0.12);
				heroTargets.forEach((target) => animations.set(target, timeline));
			}

			// Independent triggers keep stacked mobile content from revealing too early.
			for (const target of scrollTargets) {
				const tween = gsap.fromTo(target, { opacity: 0, y: 16 }, {
					...end,
					duration: 0.55,
					ease: 'power2.out',
					onComplete: () => { seen.add(target); },
					scrollTrigger: {
						trigger: target,
						start: 'clamp(top 88%)',
						end: 'clamp(bottom top)',
						toggleActions: 'play none none none',
						once: true,
					},
				});
				animations.set(target, tween);
				if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
				// A clamped start of zero will not fire onEnter until scrolling begins.
				// Play content already inside the reveal region immediately.
				if (bounds.get(target)!.top < window.innerHeight * 0.88) tween.play();
			}
			root.addEventListener('focusin', finishFocusedTarget);
		} catch (error) {
			// Partial initialization must never strand content at opacity zero.
			context.revert();
			console.warn('Homepage motion unavailable; using the static layout.', error);
		}

		return () => {
			root.removeEventListener('focusin', finishFocusedTarget);
			// A preference change reveals everything and must not re-hide it if toggled back.
			targets.forEach((target) => seen.add(target));
		};
	}, root);

	void document.fonts.ready.then(() => {
		if (!disposed && root.isConnected) ScrollTrigger.refresh();
	});

	return () => {
		disposed = true;
		media.revert();
	};
}

const root = document.querySelector<HTMLElement>('[data-home-motion]');
if (root) {
	const dispose = mountHomeMotion(root);
	// Also makes a bfcache-restored document static, without duplicate listeners/triggers.
	window.addEventListener('pagehide', dispose, { once: true });
	if (import.meta.hot) import.meta.hot.dispose(() => {
		window.removeEventListener('pagehide', dispose);
		dispose();
	});
}
