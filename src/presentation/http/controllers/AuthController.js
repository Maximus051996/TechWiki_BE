import { ok } from '../presenters/respond.js';

/**
 * Auth controller. Thin: validates already-parsed input, delegates to use cases,
 * shapes the HTTP response. No business logic here (SRP).
 */
export class AuthController {
    constructor({ loginUseCase, refreshTokenUseCase }) {
        this.loginUseCase = loginUseCase;
        this.refreshTokenUseCase = refreshTokenUseCase;
        this.login = this.login.bind(this);
        this.refresh = this.refresh.bind(this);
        this.me = this.me.bind(this);
    }

    async login(req, res) {
        const result = await this.loginUseCase.execute(req.body);
        return ok(res, result);
    }

    async refresh(req, res) {
        const result = await this.refreshTokenUseCase.execute({
            refreshToken: req.body.refreshToken ?? req.headers['x-refresh-token'],
        });
        return ok(res, result);
    }

    async me(req, res) {
        return ok(res, { user: req.user });
    }
}
