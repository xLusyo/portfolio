import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

export const collections = {
	work: defineCollection({
		// Load Markdown files in the src/content/work directory.
		loader: glob({ base: './src/content/work', pattern: '**/*.md' }),
		schema: ({ image }) => z.object({
			title: z.string(),
			description: z.string().optional(),
			url: z.string().url().refine((value) => /^https?:\/\//i.test(value), {
				message: 'Project links must use http or https.',
			}).optional(),
			publishDate: z.coerce.date(),
			tags: z.array(z.string()),
			img: image(),
			img_alt: z.string().optional(),
		}),
	}),
};
