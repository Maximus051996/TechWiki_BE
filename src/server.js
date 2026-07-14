import http from "http";
import env from "./config/env.js";
import { getApp } from "./app.js";

async function startServer() {
    const app = await getApp();

    const server = http.createServer(app);

    server.listen(env.port, () => {
        console.log(`Server running on ${env.port}`);
    });
}

startServer();