# mockup-service-api

Small Express backend that mocks the Combank **card-mgt** service for UI mockups.

## Setup

```bash
npm install
npm run dev     # nodemon, auto-reload
npm start       # plain node
```

Runs on port `3000`. All settings are hardcoded in [src/config.js](src/config.js) — no env vars, no `.env` file.

## Endpoints

| Method | Path                                          | Description                          |
| ------ | --------------------------------------------- | ------------------------------------ |
| GET    | `/health`                                     | `{ status, uptime }`                 |
| GET    | `/api/hello`                                  | `{ message: "Hello, World!" }`       |
| GET    | `/card-mgt/1.1.8/card-mgt/card-types`         | Card types, upstream response shape  |
| GET    | `/card-mgt/1.1.8/card-mgt/card-types/:code`   | Single card type — `JCC` or `JCCDC`  |

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
| `type`        | `DC`    | Echoed back, and appended to every `cardTypeCode` (`JCC` -> `JCCDC`) |
| `cardUseType` | —       | Accepted, ignored (upstream returns the same list)             |
| `fields`      | —       | Comma-separated projection, e.g. `fields=cardTypeCode,bin`     |
| `offset`      | `1`     | 1-based page number → `page.currentPage`                       |
| `limit`       | `100`   | Page size (max `500`) → `page.pageSizeRequested`               |

**Headers** — all six upstream headers are accepted. `locus` drives the `locus`
field in the body, and `transactionId` + `locus` are echoed back as response
headers. Validation is off by default so mockups just work; set
`strictHeaders: true` in [src/config.js](src/config.js) to get real `401` / `400`
responses:

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
    { "cardTypeCode": "ACLDC", "bin": "42168913", "description": "VISA DEBIT ACL", "contactless": "N" }
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

`cardTypeCode` always comes back with the requested `type` appended, so
`type=DC` yields `JCCDC` and `type=CC` yields `JCCCC`.

112 card types total → `offset=1` gives 100 items, `offset=2` gives 12.

## Passthrough proxy

`/proxy/*` forwards a request to the real service (`config.upstream.baseUrl`,
`https://uat-api.combank.net`) and returns its status, content-type and body
**verbatim** — useful for comparing the mock against the real thing.

```bash
curl --request GET   --url 'http://localhost:3000/proxy/card-mgt/1.1.8/card-mgt/card-types?type=DC&cardUseType=P&fields=&offset=1&limit=100'   --header 'Authorization: Bearer <token>'   --header 'eventType: '   --header 'locus: SL'   --header 'performedBy: 1234'   --header 'sourceSystem: MyCombank'   --header 'transactionId: 123'
```

Forwarded headers: `authorization`, `eventType`, `locus`, `performedBy`,
`sourceSystem`, `transactionId`, `content-type`, `accept`. Response carries
`x-proxy-target` and `x-proxy-duration-ms`.

If the upstream cannot be reached you get a `502` describing exactly what failed:

```json
{
  "code": "502",
  "message": "Upstream request failed",
  "target": "https://uat-api.combank.net/card-mgt/1.1.8/card-mgt/card-types?...",
  "durationMs": 10736,
  "error": {
    "name": "TypeError",
    "message": "fetch failed",
    "code": "UND_ERR_CONNECT_TIMEOUT",
    "cause": "Connect Timeout Error (attempted address: uat-api.combank.net:443, timeout: 10000ms)"
  }
}
```

Target host and the 30s timeout live in [src/config.js](src/config.js).

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

The image runs as the non-root `node` user and has a `/health` healthcheck.
To publish on a different host port, edit the `ports` mapping in
`docker-compose.yml`.

## Project layout

```
src/
  config.js                      all settings (port, strict headers, upstream)
  server.js                      entry point
  app.js                         express app factory + route mounting
  middleware/upstream-headers.js accepts/validates the card-mgt headers
  routes/hello.js                GET /api/hello
  routes/card-types.js           card-types endpoints
  routes/proxy.js                /proxy/* passthrough to the real service
  utils/paginate.js              offset/limit pagination helper
  data/product-list.json         mock data (112 card types)
```

## Adding a new mock route

1. Drop the mock payload in `src/data/`.
2. Create `src/routes/<name>.js` exporting an Express `Router`; use `paginate()`
   for list endpoints.
3. Mount it in `src/app.js` under the upstream base path.
