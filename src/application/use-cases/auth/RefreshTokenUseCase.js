import { UnauthorizedError } from '../../../shared/errors/AppError.js';

/**
 * Exchanges a valid refresh token for a new access token.
 */
export class RefreshTokenUseCase {
    constructor({ userRepository, tokenService }) {
        this.userRepository = userRepository;
        this.tokenService = tokenService;
    }

    async execute({ refreshToken }) {
        let decoded;
        try {
            decoded = this.tokenService.verify(refreshToken);
        } catch {
            throw new UnauthorizedError('Invalid or expired refresh token');
        }

        const user = await this.userRepository.findById(decoded.sub);
        if (!user) throw new UnauthorizedError('User no longer exists');

        const claims = { sub: user.id, role: user.role, email: user.email };
        return {
            accessToken: this.tokenService.sign(claims),
            user: user.toSafeObject(),
        };
    }
}
