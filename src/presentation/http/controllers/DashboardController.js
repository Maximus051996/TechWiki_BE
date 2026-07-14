import { ok } from '../presenters/respond.js';

export class DashboardController {
    constructor({ dashboardUseCase }) {
        this.uc = dashboardUseCase;
        this.summary = this.summary.bind(this);
    }

    async summary(_req, res) {
        return ok(res, await this.uc.getSummary());
    }
}
