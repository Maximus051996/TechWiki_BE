/* eslint-disable no-unused-vars */
/**
 * Module repository contract (port). Infrastructure provides an adapter.
 * The application layer depends only on this abstraction (DIP).
 */
export class IModuleRepository {
    /** @param {import('../entities/Module.js').Module} module */
    async create(module) { throw new Error('Not implemented'); }
    /** @param {string} id @param {object} patch */
    async update(id, patch) { throw new Error('Not implemented'); }
    /** @param {string} id */
    async delete(id) { throw new Error('Not implemented'); }
    /** @param {string} id */
    async findById(id) { throw new Error('Not implemented'); }
    /** @param {string} slug */
    async findBySlug(slug) { throw new Error('Not implemented'); }
    /** @param {string} name */
    async findByName(name) { throw new Error('Not implemented'); }
    /** @param {object} query */
    async list(query) { throw new Error('Not implemented'); }
    /** @param {string} term @param {object} [opts] */
    async search(term, opts) { throw new Error('Not implemented'); }
}
