import { UnauthorizedError } from '../../../shared/errors/AppError.js';

/**
 * Authenticates an admin and issues access + refresh tokens.
 * Depends only on abstractions (IUserRepository, IPasswordHasher, ITokenService).
 */
export class LoginUseCase {
    constructor({ userRepository, passwordHasher, tokenService }) {
        this.userRepository = userRepository;
        this.passwordHasher = passwordHasher;
        this.tokenService = tokenService;
    }

    async execute({ email, password }) {
        const user = await this.userRepository.findByEmail(email.toLowerCase());
        // Constant-ish path: always compare to avoid trivial user-enumeration timing.
        const hash = user?.passwordHash ?? '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinv';
        const ok = await this.passwordHasher.compare(password, hash);

        if (!user || !ok) {
            throw new UnauthorizedError('Invalid email or password');
        }

        const claims = { sub: user.id, role: user.role, email: user.email };
        return {
            user: user.toSafeObject(),
            accessToken: this.tokenService.sign(claims),
            refreshToken: this.tokenService.signRefresh({ sub: user.id }),
        };
    }
}
