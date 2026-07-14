/* eslint-disable no-unused-vars */
/**
 * Category repository contract (port).
 */
export class ICategoryRepository {
    async create(category) { throw new Error('Not implemented'); }
    async update(id, patch) { throw new Error('Not implemented'); }
    async delete(id) { throw new Error('Not implemented'); }
    async findById(id) { throw new Error('Not implemented'); }
    async findBySlug(slug) { throw new Error('Not implemented'); }
    /** @param {string} moduleId @param {string} name */
    async findByModuleAndName(moduleId, name) { throw new Error('Not implemented'); }
    async list(query) { throw new Error('Not implemented'); }
    /** @param {string} moduleId */
    async countByModule(moduleId) { throw new Error('Not implemented'); }
    /** @param {string} moduleId list all categories belonging to a module */
    async findByModule(moduleId) { throw new Error('Not implemented'); }
    /** @param {string} moduleId delete all categories of a module (cascade) */
    async deleteByModule(moduleId) { throw new Error('Not implemented'); }
    async search(term, opts) { throw new Error('Not implemented'); }
}
