/** All runtime settings live here — no environment variables. */
export const config = {
  port: 3000,

  // Flip to true to make the card-mgt headers mandatory (401/400 responses).
  strictHeaders: false,

  upstream: {
    baseUrl: 'https://uat-api.combank.net',
    timeoutMs: 30000,
  },
};
