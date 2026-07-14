import { Status } from '../value-objects/Status.js';

/**
 * Category domain entity. Each Category belongs to exactly one Module.
 */
export class Category {
    constructor({
        id = null,
        moduleId,
        name,
        slug,
        description = '',
        displayOrder = 0,
        status = Status.DRAFT,
        createdAt = null,
        updatedAt = null,
    }) {
        this.id = id;
        this.moduleId = moduleId;
        this.name = name;
        this.slug = slug;
        this.description = description;
        this.displayOrder = displayOrder;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    isPublished() {
        return this.status === Status.PUBLISHED;
    }
}
