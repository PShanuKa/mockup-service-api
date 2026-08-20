# mockup-service-api

Small Express backend for serving mock APIs to UI mockups.

## Setup

```bash
npm install
npm run dev     # nodemon, auto-reload
npm start       # plain node
```

Default port: `3000` (override with `PORT`).

## Endpoints

| Method | Path                    | Description                                  |
| ------ | ----------------------- | -------------------------------------------- |
| GET    | `/health`               | `{ status, uptime }`                         |
| GET    | `/api/hello`            | `{ message: "Hello, World!" }`, `?name=X`    |
| GET    | `/api/card-types`       | Paginated card type list (117 items)         |
| GET    | `/api/card-types/:code` | Single card type by `cardTypeCode`           |

### `GET /api/card-types`

Query params (all optional):

| Param         | Default | Notes                                              |
| ------------- | ------- | -------------------------------------------------- |
| `page`        | `1`     | Clamped to `totalPages`; invalid values fall back   |
| `pageSize`    | `100`   | Max `500`                                           |
| `search`      | —       | Matches `cardTypeCode`, `description` or `bin`      |
| `contactless` | —       | `Y` / `N`                                           |
| `bin`         | —       | BIN prefix match                                    |
| `type`        | `DC`    | Echoed back in the response                         |

Response:

```json
{
  "locus": "SL",
  "cardTypes": [ { "cardTypeCode": "ACL", "bin": "42168913", "description": "VISA DEBIT ACL", "contactless": "N" } ],
  "page": {
    "currentPage": 1,
    "pageSizeRequested": 100,
    "pageSize": 100,
    "totalItems": 117,
    "totalPages": 2,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "type": "DC"
}
```

Examples:

```bash
curl "http://localhost:3000/api/card-types?page=2&pageSize=10"
curl "http://localhost:3000/api/card-types?search=unionpay"
curl "http://localhost:3000/api/card-types?contactless=N"
curl "http://localhost:3000/api/card-types/VFD"
```

## Project layout

```
src/
  server.js              entry point
  app.js                 express app factory
  routes/hello.js        GET /api/hello
  routes/card-types.js   GET /api/card-types, /api/card-types/:code
  utils/paginate.js      shared pagination helper
  data/product-list.json mock data (117 card types)
```

## Adding a new mock route

1. Drop the mock payload in `src/data/`.
2. Create `src/routes/<name>.js` exporting an Express `Router`; use `paginate()` for list endpoints.
3. Mount it in `src/app.js` with `app.use('/api', <name>Router)`.

## Docker

```bash
docker build -t mockup-service-api .
docker run --rm -p 3000:3000 mockup-service-api
```

Or with compose:

```bash
docker compose up --build       # add -d to detach
docker compose down
```

Host port override: `PORT=4000 docker compose up` maps `4000 -> 3000`.
The image runs as the non-root `node` user and has a `/health` healthcheck.
