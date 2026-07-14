/* eslint-disable no-unused-vars */
/**
 * Visitor repository contract (port).
 */
export class IVisitorRepository {
    /** @param {import('../entities/Visitor.js').Visitor} visitor */
    async create(visitor) { throw new Error('Not implemented'); }
    /** @param {object} query */
    async list(query) { throw new Error('Not implemented'); }
    /** Aggregated stats for the dashboard. */
    async stats() { throw new Error('Not implemented'); }
}
