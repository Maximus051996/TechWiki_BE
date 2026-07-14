import jwt from 'jsonwebtoken';
import { ITokenService } from '../../domain/services/ports.js';

/**
 * JWT adapter for the ITokenService port.
 */
export class JwtTokenService extends ITokenService {
    constructor({ secret, expiresIn, refreshExpiresIn }) {
        super();
        this.secret = secret;
        this.expiresIn = expiresIn;
        this.refreshExpiresIn = refreshExpiresIn;
    }

    sign(payload) {
        return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
    }

    signRefresh(payload) {
        return jwt.sign({ ...payload, type: 'refresh' }, this.secret, {
            expiresIn: this.refreshExpiresIn,
        });
    }

    verify(token) {
        return jwt.verify(token, this.secret);
    }
}
