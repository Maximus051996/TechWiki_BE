import { Status } from '../value-objects/Status.js';

/**
 * Module domain entity. Pure business object with no persistence concerns.
 * A Module groups Categories.
 */
export class Module {
    constructor({
        id = null,
        name,
        slug,
        description = '',
        icon = '',
        displayOrder = 0,
        status = Status.DRAFT,
        createdAt = null,
        updatedAt = null,
    }) {
        this.id = id;
        this.name = name;
        this.slug = slug;
        this.description = description;
        this.icon = icon;
        this.displayOrder = displayOrder;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    isPublished() {
        return this.status === Status.PUBLISHED;
    }
}
