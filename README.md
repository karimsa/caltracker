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

To run E2E tests, run `npm test` in the project root. This will start the API server, the web server, and run tests with Cypress. To develop E2E tests, run `npm run cy:open` instead - it will open cypress in open mode and run the same api & web servers.

## Considerations

 1. **Timezones:** Currently, the application assumes that the backend & frontend are operating under the same timezone and therefore have the same concept of a 'day'. One simple way to fix this assumption would be to introduce a second user setting for timezone, which would allow the user to specify their own timezone and the backend to utilize this when making daily calorie calculations.
