import { Status } from '../value-objects/Status.js';

/**
 * Article domain entity. Belongs to one Module and one Category.
 * Content supports rich text, code blocks, images, tables, notes, tips, warnings
 * (the persisted `content` is treated as opaque rich HTML/markdown by the domain).
 */
export class Article {
    constructor({
        id = null,
        title,
        slug,
        moduleId,
        categoryId,
        shortDescription = '',
        content,
        thumbnail = '',
        bannerImage = '',
        tags = [],
        status = Status.DRAFT,
        seoTitle = '',
        seoDescription = '',
        featured = false,
        readingTime = 0,
        views = 0,
        publishedDate = null,
        createdAt = null,
        updatedAt = null,
    }) {
        this.id = id;
        this.title = title;
        this.slug = slug;
        this.moduleId = moduleId;
        this.categoryId = categoryId;
        this.shortDescription = shortDescription;
        this.content = content;
        this.thumbnail = thumbnail;
        this.bannerImage = bannerImage;
        this.tags = tags;
        this.status = status;
        this.seoTitle = seoTitle;
        this.seoDescription = seoDescription;
        this.featured = featured;
        this.readingTime = readingTime;
        this.views = views;
        this.publishedDate = publishedDate;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    isPublished() {
        return this.status === Status.PUBLISHED;
    }
}
