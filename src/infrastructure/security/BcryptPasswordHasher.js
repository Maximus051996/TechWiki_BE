import bcrypt from 'bcryptjs';
import { IPasswordHasher } from '../../domain/services/ports.js';

/**
 * bcrypt adapter for the IPasswordHasher port.
 */
export class BcryptPasswordHasher extends IPasswordHasher {
    constructor(rounds = 10) {
        super();
        this.rounds = rounds;
    }

    async hash(plain) {
        return bcrypt.hash(plain, this.rounds);
    }

    async compare(plain, hash) {
        return bcrypt.compare(plain, hash);
    }
}
