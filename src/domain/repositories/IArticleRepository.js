/* eslint-disable no-unused-vars */
/**
 * Article repository contract (port).
 */
export class IArticleRepository {
    async create(article) { throw new Error('Not implemented'); }
    async update(id, patch) { throw new Error('Not implemented'); }
    async delete(id) { throw new Error('Not implemented'); }
    async findById(id) { throw new Error('Not implemented'); }
    async findBySlug(slug) { throw new Error('Not implemented'); }
    async list(query) { throw new Error('Not implemented'); }
    /** @param {string} categoryId */
    async countByCategory(categoryId) { throw new Error('Not implemented'); }
    /** @param {string[]} categoryIds delete all articles in the given categories (cascade) */
    async deleteByCategories(categoryIds) { throw new Error('Not implemented'); }
    /** @param {string} moduleId delete all articles of a module (cascade) */
    async deleteByModule(moduleId) { throw new Error('Not implemented'); }
    /** @param {string} id increment views atomically */
    async incrementViews(id) { throw new Error('Not implemented'); }
    async search(term, opts) { throw new Error('Not implemented'); }
}
