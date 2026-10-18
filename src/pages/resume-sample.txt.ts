import type { APIRoute } from 'astro';
import { getSampleResume } from '../data/portfolio';

export const GET: APIRoute = () => new Response(getSampleResume(), {
	headers: { 'Content-Type': 'text/plain; charset=utf-8' },
});
