import { IUserRepository } from '../../../../domain/repositories/IUserRepository.js';
import { UserModel } from '../models.js';
import { toUser } from '../mappers.js';

export class MongoUserRepository extends IUserRepository {
    async create(user) {
        const doc = await UserModel.create({
            name: user.name, email: user.email.toLowerCase(),
            passwordHash: user.passwordHash, role: user.role,
        });
        return toUser(doc.toObject());
    }

    async findById(id) {
        return toUser(await UserModel.findById(id).lean());
    }

    async findByEmail(email) {
        return toUser(await UserModel.findOne({ email: email.toLowerCase() }).lean());
    }

    async countAdmins() {
        return UserModel.countDocuments({ role: 'admin' });
    }
}
