# TechWiki Backend

Node.js + Express + MongoDB API built with **Clean Architecture**, **SOLID**, and
classic design patterns.

## Layers (dependencies point inward)

```
presentation → application → domain ← infrastructure
```

| Layer            | Path                       | Responsibility                                   |
|------------------|----------------------------|--------------------------------------------------|
| `domain`         | `src/domain`               | Entities, value objects, repository/service ports. No framework code. |
| `application`    | `src/application`          | Use cases (business orchestration), validation schemas. |
| `infrastructure` | `src/infrastructure`       | Mongoose models + repositories, JWT, bcrypt, cache, worker pool, DI container. |
| `presentation`   | `src/presentation`         | Express controllers, routes, middleware, presenters. |
| `shared`         | `src/shared`               | Errors, logger, pure utilities.                  |

### SOLID & patterns applied

- **SRP** — each use case / controller has one reason to change.
- **OCP** — new content types plug in via new repositories + use cases; nothing existing changes.
- **LSP** — every `Mongo*Repository` is substitutable for its `I*Repository` port.
- **ISP** — narrow, focused port interfaces (`IPasswordHasher`, `ITokenService`, `ICacheService`, `ITaskRunner`).
- **DIP** — application depends on abstractions; the DI **composition root**
  (`infrastructure/container.js`) is the only place wiring concretes.
- Patterns: **Repository**, **Adapter** (bcrypt/JWT/cache/worker ports),
  **Strategy** (sort/task selection), **Factory** (`createApp`, `createContainer`),
  **Object Pool** (worker threads), **Facade** (use-case classes).

## Performance & concurrency (300+ concurrent readers)

- **Cluster** (`src/cluster.js`) — one worker process per CPU core; OS load-balances
  connections and respawns crashed workers.
- **Worker-thread pool** (`infrastructure/concurrency`) — CPU-bound work
  (reading-time computation, search ranking) runs off the event loop so I/O stays
  responsive. Bounded pool = no thread explosion.
- **LRU cache** with TTL — hot lists/articles served from memory; bounded size
  keeps memory flat (leak-free).
- **`.lean()` reads + field projection** — skips Mongoose hydration and drops
  heavy `content` from list queries.
- **Compound indexes** on every customer query path (status + category + date, etc.).
- **Connection pool** tuned (`maxPoolSize: 50`) per worker.
- **Compression**, **helmet**, **rate limiting**, and **graceful shutdown** that
  drains connections and disposes the worker pool + DB pool.

## Getting started

```bash
cp .env.example .env         # set MONGODB_URI + JWT_SECRET
npm install
npm run seed                 # bootstrap admin + sample published content
npm run start:single         # single process (dev)         → http://localhost:4000
# or
npm start                    # clustered (production)
```

Default seeded admin: `admin@techwiki.dev` / `Admin@12345` (change in `.env`).

## API surface

- **Customer (public, read-only):** `GET /api/public/{modules,categories,articles,videos,search}`
- **Admin (JWT):** `POST /api/admin/auth/login`, then full CRUD under
  `/api/admin/{modules,categories,articles,videos}` + `/api/admin/{dashboard,search}`.

The two portals live under distinct base paths, matching the requirement that the
Customer and Admin portals have different URLs.
