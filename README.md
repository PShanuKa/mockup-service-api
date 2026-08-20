# mockup-service-api

Small Express backend that mocks the Combank **card-mgt** service for UI mockups.

## Setup

```bash
npm install
npm run dev     # nodemon, auto-reload
npm start       # plain node
```

Default port: `3000` (override with `PORT`).

## Endpoints

| Method | Path                                          | Description                          |
| ------ | --------------------------------------------- | ------------------------------------ |
| GET    | `/health`                                     | `{ status, uptime }`                 |
| GET    | `/api/hello`                                  | `{ message: "Hello, World!" }`       |
| GET    | `/card-mgt/1.1.8/card-mgt/card-types`         | Card types, upstream response shape  |
| GET    | `/card-mgt/1.1.8/card-mgt/card-types/:code`   | Single card type (mock-only extra)   |

`/api/card-types` is a short alias for the same router.

### `GET /card-mgt/1.1.8/card-mgt/card-types`

Drop-in replacement for the UAT endpoint — same path, query params, headers and
response body.

```bash
curl --request GET \
  --url 'http://localhost:3000/card-mgt/1.1.8/card-mgt/card-types?type=DC&cardUseType=P&fields=&offset=1&limit=100' \
  --header 'Authorization: Bearer <token>' \
  --header 'eventType: ' \
  --header 'locus: SL' \
  --header 'performedBy: 1234' \
  --header 'sourceSystem: MyCombank' \
  --header 'transactionId: 123'
```

**Query params**

| Param         | Default | Behaviour                                                     |
| ------------- | ------- | ------------------------------------------------------------- |
| `type`        | `DC`    | Echoed back in the response; the data set does not change      |
| `cardUseType` | —       | Accepted, ignored (upstream returns the same list)             |
| `fields`      | —       | Comma-separated projection, e.g. `fields=cardTypeCode,bin`     |
| `offset`      | `1`     | 1-based page number → `page.currentPage`                       |
| `limit`       | `100`   | Page size (max `500`) → `page.pageSizeRequested`               |

**Headers** — all six upstream headers are accepted. `locus` drives the `locus`
field in the body, and `transactionId` + `locus` are echoed back as response
headers. Validation is off by default so mockups just work; set
`STRICT_HEADERS=true` to get real `401` / `400` responses:

```
401 {"code":"401","message":"Missing or malformed Authorization header","transactionId":""}
400 {"code":"400","message":"Missing required header(s): locus, sourceSystem, transactionId, performedBy","transactionId":""}
```

**Response** — identical to upstream, including the `totalItems: 0` quirk. The
real count is available in the non-standard `x-mock-total-items` header.

```json
{
  "locus": "SL",
  "cardTypes": [
    { "cardTypeCode": "ACL", "bin": "42168913", "description": "VISA DEBIT ACL", "contactless": "N" }
  ],
  "page": {
    "currentPage": 1,
    "pageSizeRequested": 100,
    "pageSize": 100,
    "totalItems": 0,
    "totalPages": 2
  },
  "type": "DC"
}
```

112 card types total → `offset=1` gives 100 items, `offset=2` gives 12.

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

## Project layout

```
src/
  server.js                      entry point
  app.js                         express app factory + route mounting
  middleware/upstream-headers.js accepts/validates the card-mgt headers
  routes/hello.js                GET /api/hello
  routes/card-types.js           card-types endpoints
  utils/paginate.js              offset/limit pagination helper
  data/product-list.json         mock data (112 card types)
```

## Adding a new mock route

1. Drop the mock payload in `src/data/`.
2. Create `src/routes/<name>.js` exporting an Express `Router`; use `paginate()`
   for list endpoints.
3. Mount it in `src/app.js` under the upstream base path.
