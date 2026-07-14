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
        console.log("============== LOGIN ==============");
        console.log("Email:", email);

        // Find user by email
        const user = await this.userRepository.findByEmail(email.toLowerCase());

        console.log("User Found:", user ? "YES" : "NO");

        // Always compare a hash to prevent timing attacks
        const hash =
            user?.passwordHash ??
            '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinv';

        const ok = await this.passwordHasher.compare(password, hash);

        console.log("Password Match:", ok);

        if (user) {
            console.log("User ID:", user.id);
            console.log("Role:", user.role);
            console.log("Email:", user.email);
        }

        console.log("==================================");

        if (!user || !ok) {
            throw new UnauthorizedError('Invalid email or password');
        }

        const claims = {
            sub: user.id,
            role: user.role,
            email: user.email,
        };

        return {
            user: user.toSafeObject(),
            accessToken: this.tokenService.sign(claims),
            refreshToken: this.tokenService.signRefresh({
                sub: user.id,
            }),
        };
    }
}