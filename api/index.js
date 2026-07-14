import { getApp } from "../src/app.js";

function applyCors(req, res) {
    const allowed = (process.env.CORS_ORIGINS ?? "")
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean);

    const origin = req.headers.origin;

    if (origin && (allowed.length === 0 || allowed.includes(origin))) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }

    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Refresh-Token");
}

export default async function handler(req, res) {
    applyCors(req, res);

    if (req.method === "OPTIONS") {
        return res.status(204).end();
    }

    try {
        const app = await getApp();
        return app(req, res);
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
}