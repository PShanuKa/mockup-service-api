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

| Method | Path                 | Response                        |
| ------ | -------------------- | ------------------------------- |
| GET    | `/health`            | `{ status, uptime }`            |
| GET    | `/api/hello`         | `{ message: "Hello, World!" }`  |
| GET    | `/api/hello?name=X`  | `{ message: "Hello, X!" }`      |

## Adding a new mock route

1. Create `src/routes/<name>.js` exporting an Express `Router`.
2. Mount it in [src/app.js](src/app.js) with `app.use('/api', <name>Router)`.
