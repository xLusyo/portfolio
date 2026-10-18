import { getCollection } from 'astro:content';
import type { iconPaths } from '../components/IconPaths';
import portrait from '../assets/portrait.jpeg';

interface Experience {
	employer: string;
	logo: string;
	role: string;
	period: string;
	location: string;
	employmentType: string;
	highlights: string[];
}

interface ToolGroup {
	name: string;
	description: string;
	icon: keyof typeof iconPaths;
	technologies: string[];
}

export const portfolio = {
	name: 'Christian Baloncio',
	initials: 'CB',
	role: 'Full Stack Web Developer',
	location: 'Philippines',
	availability: 'Looking for work',
	portrait,
	portraitAlt: 'Christian Baloncio standing with his arms crossed',
	email: 'work.christianbaloncio@gmail.com',
	website: null as string | null,
	socials: [
		{ label: 'LinkedIn', href: 'https://www.linkedin.com/in/christian-baloncio-aa0465395', icon: 'linkedin-logo' as const },
		{ label: 'GitHub', href: 'https://github.com/xLusyo', icon: 'github-logo' as const },
	],
	headline: ['Thoughtful websites.', 'Work made simpler.'],
	summary: [
		'I’m Christian, a full stack web developer based in the Philippines. I build responsive websites, custom WordPress solutions, and automation workflows that make everyday work simpler.',
		'From user-friendly interfaces to backend logic and API integrations, I focus on clear experiences, maintainable code, and solutions that support real business goals.',
	],
	experience: [
		{
			employer: 'Secure Line Marketing',
			logo: '/assets/icons/securelinemarketing.com-192x192.png',
			role: 'Full Stack Developer',
			period: 'Jun 2025 – Sep 2026',
			location: 'Remote',
			employmentType: 'Full Time',
			highlights: [
				'Developed and optimized WordPress marketing websites, improving average page-load time and increasing qualified lead conversions.',
				'Built custom WordPress solutions and landing pages aligned with marketing funnels and analytics requirements.',
				'Implemented GA4, Google Tag Manager, Search Console, conversion tracking, and CRM attribution across WordPress marketing sites.',
			],
		},
		{
			employer: 'Smith Brothers Media',
			logo: '/assets/icons/smithbrothersmedia.com.au-192x192.jpg',
			role: 'Full Stack Developer',
			period: 'Feb 2024 – Apr 2026',
			location: 'Remote',
			employmentType: 'Part Time',
			highlights: [
				'Developed custom themes using Roots/Bedrock and Roots/Sage for WordPress websites with embedded custom solutions.',
				'Built custom e-commerce websites using WooCommerce and WordPress.',
				'Migrated websites from other servers to WP Engine or based on specified requirements.',
				'Maintained websites with security patches, updated dependencies, uptime, and stability.',
			],
		},
		{
			employer: 'Digital Feet Corporation',
			logo: '/assets/icons/digitalfeet.com-44x49.png',
			role: 'Full Stack Developer',
			period: 'Jun 2022 – Jun 2025',
			location: 'Philippines',
			employmentType: 'Full Time',
			highlights: [
				'Led end-to-end development of a client portal serving 10 clients and 20 internal users using Laravel with Livewire, centralizing service orders, asset uploads, status tracking, and project communication.',
				'Integrated HubSpot and Microsoft Dynamics through APIs and automated workflows, reducing onboarding turnaround time by 15% and eliminating 10 manual handoffs.',
				'Developed reusable modules and administrative components adopted across numerous projects, reducing duplicate implementation work by approximately 10%.',
			],
		},
	] satisfies Experience[],
	experienceEmpty: 'Work history details have not been provided yet.',
	resume: { pdf: null as string | null, sampleFilename: 'Portfolio-Sample-Resume.txt' },
	tools: [
		{
			name: 'Backend Development',
			description: 'Applications, databases & APIs',
			icon: 'laravel-logo',
			technologies: ['PHP', 'Laravel', 'Livewire', 'Blade', 'Node.js', 'Python', 'MySQL', 'REST APIs'],
		},
		{
			name: 'Frontend Development',
			description: 'Responsive, interactive interfaces',
			icon: 'react-logo',
			technologies: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Astro', 'Tailwind CSS', 'Bootstrap'],
		},
		{
			name: 'WordPress & Commerce',
			description: 'Custom websites & online stores',
			icon: 'wordpress-logo',
			technologies: ['WordPress', 'WooCommerce', 'Roots/Bedrock', 'Roots/Sage', 'Custom Themes & Plugins', 'ACF', 'Elementor'],
		},
		{
			name: 'Automation',
			description: 'Connected workflows & fewer manual steps',
			icon: 'zapier',
			technologies: ['Power Automate', 'Make', 'n8n', 'Zapier'],
		},
		{
			name: 'CRM & Analytics',
			description: 'Integrations, tracking & attribution',
			icon: 'hubspot',
			technologies: ['HubSpot', 'Microsoft Dynamics', 'GA4', 'Google Tag Manager', 'Search Console', 'Conversion Tracking'],
		},
		{
			name: 'Development Tools',
			description: 'Version control, environments & hosting',
			icon: 'docker',
			technologies: ['Git', 'Docker', 'Postman', 'WP Engine'],
		},
	] satisfies ToolGroup[],
};

export async function getPortfolioProjects() {
	return (await getCollection('work')).sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf());
}

export function getSampleResume() {
	return 'SAMPLE RÉSUMÉ — DESIGN REVIEW ONLY\n\nThis is a sample download, not Christian Baloncio’s résumé.\nNo employment history or qualifications are represented by this file.\nReplace it by setting resume.pdf in src/data/portfolio.ts to a supplied PDF URL.\n';
}
