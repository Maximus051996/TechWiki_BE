/* eslint-disable no-unused-vars */
/**
 * Video repository contract (port).
 */
export class IVideoRepository {
    async create(video) { throw new Error('Not implemented'); }
    async update(id, patch) { throw new Error('Not implemented'); }
    async delete(id) { throw new Error('Not implemented'); }
    async findById(id) { throw new Error('Not implemented'); }
    async list(query) { throw new Error('Not implemented'); }
    /** @param {string} categoryId */
    async countByCategory(categoryId) { throw new Error('Not implemented'); }
    /** @param {string[]} categoryIds delete all videos in the given categories (cascade) */
    async deleteByCategories(categoryIds) { throw new Error('Not implemented'); }
    /** @param {string} moduleId delete all videos of a module (cascade) */
    async deleteByModule(moduleId) { throw new Error('Not implemented'); }
    async incrementViews(id) { throw new Error('Not implemented'); }
    async search(term, opts) { throw new Error('Not implemented'); }
}
