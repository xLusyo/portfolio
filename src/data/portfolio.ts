import { getCollection } from 'astro:content';
import type { iconPaths } from '../components/IconPaths';
import portrait from '../assets/portrait.jpeg';

interface Experience {
	employer: string;
	role: string;
	period: string;
	summary: string;
}

interface Tool {
	name: string;
	description: string;
	icon: keyof typeof iconPaths;
}

export const portfolio = {
	name: 'Christian Baloncio',
	initials: 'CB',
	role: 'Full Stack Web Developer',
	location: 'Philippines',
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
	experience: [] as Experience[],
	experienceEmpty: 'Work history details have not been provided yet.',
	resume: { pdf: null as string | null, sampleFilename: 'Portfolio-Sample-Resume.txt' },
	tools: [
		{ name: 'Laravel', description: 'Full stack development', icon: 'laravel-logo' },
		{ name: 'WordPress', description: 'Custom themes & plugins', icon: 'wordpress-logo' },
		{ name: 'JavaScript', description: 'Interactive experiences', icon: 'javascript-logo' },
		{ name: 'React', description: 'Interface development', icon: 'react-logo' },
		{ name: 'HTML & CSS', description: 'Responsive interfaces', icon: 'html-logo' },
		{ name: 'HubSpot', description: 'CRM & integrations', icon: 'hubspot' },
		{ name: 'Docker', description: 'Development environments', icon: 'docker' },
		{ name: 'Git', description: 'Code & collaboration', icon: 'git' },
	] satisfies Tool[],
};

export async function getPortfolioProjects() {
	return (await getCollection('work')).sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf());
}

export function getSampleResume() {
	return 'SAMPLE RÉSUMÉ — DESIGN REVIEW ONLY\n\nThis is a sample download, not Christian Baloncio’s résumé.\nNo employment history or qualifications are represented by this file.\nReplace it by setting resume.pdf in src/data/portfolio.ts to a supplied PDF URL.\n';
}
