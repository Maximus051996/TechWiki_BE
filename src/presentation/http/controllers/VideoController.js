import { ok, created } from '../presenters/respond.js';

export class VideoController {
    constructor({ videoUseCases }) {
        this.uc = videoUseCases;
        ['create', 'update', 'remove', 'getById', 'list', 'listPublic', 'watchById']
            .forEach((m) => (this[m] = this[m].bind(this)));
    }

    async create(req, res) { return created(res, await this.uc.create(req.body)); }
    async update(req, res) { return ok(res, await this.uc.update(req.params.id, req.body)); }
    async remove(req, res) { return ok(res, await this.uc.delete(req.params.id)); }
    async getById(req, res) { return ok(res, await this.uc.getById(req.params.id)); }
    async list(req, res) { return ok(res, await this.uc.list(req.query)); }

    async listPublic(req, res) { return ok(res, await this.uc.list({ ...req.query, publishedOnly: true })); }
    async watchById(req, res) { return ok(res, await this.uc.watchById(req.params.id)); }
}
