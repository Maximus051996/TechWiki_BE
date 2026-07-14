/**
 * Visitor domain entity — a single customer access event captured on the public
 * portal. Stored for the Admin visitor log. Contains no PII beyond IP + derived
 * geo/device data, which is captured best-effort and never blocks the request.
 */
export class Visitor {
    constructor({
        id = null,
        ip = '',
        country = '',
        region = '',
        city = '',
        deviceType = '',
        browser = '',
        os = '',
        path = '',
        referrer = '',
        userAgent = '',
        visitedAt = null,
        createdAt = null,
    }) {
        this.id = id;
        this.ip = ip;
        this.country = country;
        this.region = region;
        this.city = city;
        this.deviceType = deviceType;
        this.browser = browser;
        this.os = os;
        this.path = path;
        this.referrer = referrer;
        this.userAgent = userAgent;
        this.visitedAt = visitedAt;
        this.createdAt = createdAt;
    }
}
