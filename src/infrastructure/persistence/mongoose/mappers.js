import { Module } from '../../../domain/entities/Module.js';
import { Category } from '../../../domain/entities/Category.js';
import { Article } from '../../../domain/entities/Article.js';
import { Video } from '../../../domain/entities/Video.js';
import { User } from '../../../domain/entities/User.js';

/**
 * Persistence <-> domain mappers. Keeping mapping in one place means the domain
 * never leaks Mongoose specifics, and lean documents map just as easily.
 */
const idOf = (doc) => (doc._id ? doc._id.toString() : doc.id);

export const toModule = (d) =>
    d && new Module({
        id: idOf(d), name: d.name, slug: d.slug, description: d.description,
        icon: d.icon, displayOrder: d.displayOrder, status: d.status,
        createdAt: d.createdAt, updatedAt: d.updatedAt,
    });

export const toCategory = (d) =>
    d && new Category({
        id: idOf(d), moduleId: d.moduleId?.toString?.() ?? d.moduleId, name: d.name,
        slug: d.slug, description: d.description, displayOrder: d.displayOrder,
        status: d.status, createdAt: d.createdAt, updatedAt: d.updatedAt,
    });

export const toArticle = (d) =>
    d && new Article({
        id: idOf(d), title: d.title, slug: d.slug,
        moduleId: d.moduleId?.toString?.() ?? d.moduleId,
        categoryId: d.categoryId?.toString?.() ?? d.categoryId,
        shortDescription: d.shortDescription, content: d.content, thumbnail: d.thumbnail,
        bannerImage: d.bannerImage, tags: d.tags, status: d.status, seoTitle: d.seoTitle,
        seoDescription: d.seoDescription, featured: d.featured, readingTime: d.readingTime,
        views: d.views, publishedDate: d.publishedDate, createdAt: d.createdAt, updatedAt: d.updatedAt,
    });

export const toVideo = (d) =>
    d && new Video({
        id: idOf(d), title: d.title,
        moduleId: d.moduleId?.toString?.() ?? d.moduleId,
        categoryId: d.categoryId?.toString?.() ?? d.categoryId,
        videoUrl: d.videoUrl, youtubeId: d.youtubeId, thumbnail: d.thumbnail,
        description: d.description, duration: d.duration, tags: d.tags, status: d.status,
        featured: d.featured, views: d.views, publishedDate: d.publishedDate,
        createdAt: d.createdAt, updatedAt: d.updatedAt,
    });

export const toUser = (d) =>
    d && new User({
        id: idOf(d), name: d.name, email: d.email, passwordHash: d.passwordHash,
        role: d.role, createdAt: d.createdAt, updatedAt: d.updatedAt,
    });

import { Visitor } from '../../../domain/entities/Visitor.js';

export const toVisitor = (d) =>
    d && new Visitor({
        id: idOf(d), ip: d.ip, country: d.country, region: d.region, city: d.city,
        deviceType: d.deviceType, browser: d.browser, os: d.os, path: d.path,
        referrer: d.referrer, userAgent: d.userAgent, visitedAt: d.visitedAt, createdAt: d.createdAt,
    });
