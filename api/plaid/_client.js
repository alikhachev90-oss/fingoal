// Shared Plaid client for the serverless functions in this folder.
// Requires env vars: PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV ("sandbox" | "production"),
// and OWNER_PIN (a shared secret only the app owner knows — checked by every
// endpoint here so a friend who finds the URL can't link their own bank).
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'

export function getPlaidClient() {
  const env = process.env.PLAID_ENV === 'production' ? PlaidEnvironments.production : PlaidEnvironments.sandbox
  const configuration = new Configuration({
    basePath: env,
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
        'PLAID-SECRET': process.env.PLAID_SECRET,
      },
    },
  })
  return new PlaidApi(configuration)
}

// Returns true if the request carries the correct owner PIN header.
export function checkOwnerPin(req) {
  const provided = req.headers['x-owner-pin']
  const expected = process.env.OWNER_PIN
  return Boolean(expected) && provided === expected
}
