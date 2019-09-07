# CalTracker

Web application to assist with calorie tracking.

## Setting up for development

 1. Clone the repo locally (let's say into `caltracker`).
 2. `cd caltracker && npx @karimsa/mono`
 3. Start dev server for web: `cd caltracker/packages/web && npm start`
 4. Start dev server for api: `cd caltracker/packages/api && npm start` (will use default env from `.env`)

## Deployment considerations

There is no other environment other than `local` configured for web yet, but can be done so by editing `packages/web/src/models/axios.js`. The publicly accessible domain name would need to be known for this. Toggling between environments is handled by the `ENV_TARGET` environment variable, which is currently always set to the value `local`.

## Running tests

To run integration tests for the API, simply run `npm test` in `packages/api`. Again, all environment bits are loaded from `.env` and the code has other defaults it applies for test environments.

To run E2E tests, run `npm test` in the project root. This will start the API server, the web server, and run tests with Cypress.
