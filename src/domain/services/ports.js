/* eslint-disable no-unused-vars */
/**
 * Service ports (abstractions) consumed by the application layer.
 * Infrastructure supplies concrete adapters, keeping use cases framework-agnostic.
 */

export class IPasswordHasher {
    /** @param {string} plain @returns {Promise<string>} */
    async hash(plain) { throw new Error('Not implemented'); }
    /** @param {string} plain @param {string} hash @returns {Promise<boolean>} */
    async compare(plain, hash) { throw new Error('Not implemented'); }
}

export class ITokenService {
    /** @param {object} payload @returns {string} */
    sign(payload) { throw new Error('Not implemented'); }
    /** @param {object} payload @returns {string} */
    signRefresh(payload) { throw new Error('Not implemented'); }
    /** @param {string} token @returns {object} */
    verify(token) { throw new Error('Not implemented'); }
}

export class ICacheService {
    get(key) { throw new Error('Not implemented'); }
    set(key, value, ttlMs) { throw new Error('Not implemented'); }
    delete(key) { throw new Error('Not implemented'); }
    /** @param {string} prefix invalidate all keys beginning with prefix */
    invalidatePrefix(prefix) { throw new Error('Not implemented'); }
    clear() { throw new Error('Not implemented'); }
}

export class ITaskRunner {
    /**
     * Run a CPU-bound task, potentially off the main event loop.
     * @param {string} taskName @param {object} payload @returns {Promise<any>}
     */
    async run(taskName, payload) { throw new Error('Not implemented'); }
}

export class IGeoLocator {
    /**
     * Resolve approximate location from an IP address. Must resolve to a partial
     * object (possibly empty) rather than reject, so callers never block on it.
     * @param {string} ip
     * @returns {Promise<{country?:string, region?:string, city?:string}>}
     */
    async locate(ip) { throw new Error('Not implemented'); }
}
