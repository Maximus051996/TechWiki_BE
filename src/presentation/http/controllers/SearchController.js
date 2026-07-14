import { ok } from '../presenters/respond.js';

export class SearchController {
    constructor({ globalSearchUseCase }) {
        this.uc = globalSearchUseCase;
        this.publicSearch = this.publicSearch.bind(this);
        this.adminSearch = this.adminSearch.bind(this);
    }

    async publicSearch(req, res) {
        return ok(res, await this.uc.execute({ ...req.query, publishedOnly: true }));
    }

    async adminSearch(req, res) {
        return ok(res, await this.uc.execute({ ...req.query, publishedOnly: false }));
    }
}
