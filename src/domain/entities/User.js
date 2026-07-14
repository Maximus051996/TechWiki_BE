/**
 * User (Admin) domain entity. Passwords are never stored on the entity in plain
 * text — the hash lives here only for the auth use case, and is stripped before
 * the entity crosses the presentation boundary.
 */
export const Role = Object.freeze({
    ADMIN: 'admin',
});

export class User {
    constructor({
        id = null,
        name,
        email,
        passwordHash = null,
        role = Role.ADMIN,
        createdAt = null,
        updatedAt = null,
    }) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    toSafeObject() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            role: this.role,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
