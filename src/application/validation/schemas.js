import { z } from 'zod';
import { STATUS_VALUES } from '../../domain/value-objects/Status.js';

/**
 * Zod schemas define the application-layer input contracts. They live here (not
 * in controllers) so validation is reusable and framework-independent.
 */

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const status = z.enum(STATUS_VALUES);

export const authSchemas = {
    login: z.object({
        email: z.string().email(),
        password: z.string().min(6),
        remember: z.boolean().optional().default(false),
    }),
};

export const moduleSchemas = {
    create: z.object({
        name: z.string().min(2).max(120),
        description: z.string().max(2000).optional().default(''),
        icon: z.string().max(200).optional().default(''),
        displayOrder: z.number().int().min(0).optional().default(0),
        status: status.optional(),
    }),
    update: z.object({
        name: z.string().min(2).max(120).optional(),
        description: z.string().max(2000).optional(),
        icon: z.string().max(200).optional(),
        displayOrder: z.number().int().min(0).optional(),
        status: status.optional(),
    }),
};

export const categorySchemas = {
    create: z.object({
        moduleId: objectId,
        name: z.string().min(2).max(120),
        description: z.string().max(2000).optional().default(''),
        displayOrder: z.number().int().min(0).optional().default(0),
        status: status.optional(),
    }),
    update: z.object({
        moduleId: objectId.optional(),
        name: z.string().min(2).max(120).optional(),
        description: z.string().max(2000).optional(),
        displayOrder: z.number().int().min(0).optional(),
        status: status.optional(),
    }),
};

export const articleSchemas = {
    create: z.object({
        title: z.string().min(3).max(200),
        slug: z.string().max(220).optional(),
        moduleId: objectId,
        categoryId: objectId,
        shortDescription: z.string().max(500).optional().default(''),
        content: z.string().min(1),
        thumbnail: z.string().max(500).optional().default(''),
        bannerImage: z.string().max(500).optional().default(''),
        tags: z.array(z.string().max(50)).max(30).optional().default([]),
        status: status.optional(),
        seoTitle: z.string().max(200).optional().default(''),
        seoDescription: z.string().max(500).optional().default(''),
        featured: z.boolean().optional().default(false),
        publishedDate: z.coerce.date().optional(),
    }),
    update: z.object({
        title: z.string().min(3).max(200).optional(),
        slug: z.string().max(220).optional(),
        moduleId: objectId.optional(),
        categoryId: objectId.optional(),
        shortDescription: z.string().max(500).optional(),
        content: z.string().min(1).optional(),
        thumbnail: z.string().max(500).optional(),
        bannerImage: z.string().max(500).optional(),
        tags: z.array(z.string().max(50)).max(30).optional(),
        status: status.optional(),
        seoTitle: z.string().max(200).optional(),
        seoDescription: z.string().max(500).optional(),
        featured: z.boolean().optional(),
        publishedDate: z.coerce.date().optional(),
    }),
};

export const videoSchemas = {
    create: z.object({
        title: z.string().min(3).max(200),
        moduleId: objectId,
        categoryId: objectId,
        videoUrl: z.string().url(),
        thumbnail: z.string().max(500).optional().default(''),
        description: z.string().max(2000).optional().default(''),
        duration: z.string().max(20).optional().default(''),
        tags: z.array(z.string().max(50)).max(30).optional().default([]),
        status: status.optional(),
        featured: z.boolean().optional().default(false),
        publishedDate: z.coerce.date().optional(),
    }),
    update: z.object({
        title: z.string().min(3).max(200).optional(),
        moduleId: objectId.optional(),
        categoryId: objectId.optional(),
        videoUrl: z.string().url().optional(),
        thumbnail: z.string().max(500).optional(),
        description: z.string().max(2000).optional(),
        duration: z.string().max(20).optional(),
        tags: z.array(z.string().max(50)).max(30).optional(),
        status: status.optional(),
        featured: z.boolean().optional(),
        publishedDate: z.coerce.date().optional(),
    }),
};

export const querySchemas = {
    list: z.object({
        page: z.coerce.number().int().min(1).optional().default(1),
        limit: z.coerce.number().int().min(1).max(200).optional().default(20),
        sort: z.enum(['latest', 'popular', 'alphabetical']).optional().default('latest'),
        status: status.optional(),
        moduleId: objectId.optional(),
        categoryId: objectId.optional(),
        featured: z.coerce.boolean().optional(),
        q: z.string().max(200).optional(),
    }),
    search: z.object({
        q: z.string().min(1).max(200),
        limit: z.coerce.number().int().min(1).max(50).optional().default(10),
    }),
    visitors: z.object({
        page: z.coerce.number().int().min(1).optional().default(1),
        limit: z.coerce.number().int().min(1).max(200).optional().default(50),
        country: z.string().max(100).optional(),
        deviceType: z.string().max(30).optional(),
        path: z.string().max(300).optional(),
    }),
};

export { objectId };
