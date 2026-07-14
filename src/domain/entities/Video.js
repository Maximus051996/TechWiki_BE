import { Status } from '../value-objects/Status.js';

/**
 * Video domain entity. Belongs to one Module and one Category.
 * Only valid YouTube URLs are accepted (enforced by the application layer).
 */
export class Video {
    constructor({
        id = null,
        title,
        moduleId,
        categoryId,
        videoUrl,
        youtubeId = '',
        thumbnail = '',
        description = '',
        duration = '',
        tags = [],
        status = Status.DRAFT,
        featured = false,
        views = 0,
        publishedDate = null,
        createdAt = null,
        updatedAt = null,
    }) {
        this.id = id;
        this.title = title;
        this.moduleId = moduleId;
        this.categoryId = categoryId;
        this.videoUrl = videoUrl;
        this.youtubeId = youtubeId;
        this.thumbnail = thumbnail;
        this.description = description;
        this.duration = duration;
        this.tags = tags;
        this.status = status;
        this.featured = featured;
        this.views = views;
        this.publishedDate = publishedDate;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    isPublished() {
        return this.status === Status.PUBLISHED;
    }
}
