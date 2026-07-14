/**
 * Publication status shared by Modules, Categories, Articles and Videos.
 * Only PUBLISHED content is visible to customers (business rule).
 */
export const Status = Object.freeze({
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ARCHIVED: 'archived',
});

export const STATUS_VALUES = Object.freeze(Object.values(Status));

export function isValidStatus(value) {
    return STATUS_VALUES.includes(value);
}
