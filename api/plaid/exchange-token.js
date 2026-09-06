import { getPlaidClient, checkOwnerPin } from './_client.js'

// Exchanges a Link public_token for a long-lived access_token. This app has no
// database, so the access_token is handed back to the owner ONCE, to be saved
// as the PLAID_ACCESS_TOKEN env var in Vercel by hand — after that, this
// endpoint's job is done and the token never touches the server again except
// when transactions.js reads it back out of the env var to sync.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })
  if (!checkOwnerPin(req)) return res.status(403).json({ error: 'forbidden' })

  const { public_token } = req.body || {}
  if (!public_token) return res.status(400).json({ error: 'missing_public_token' })

  try {
    const client = getPlaidClient()
    const response = await client.itemPublicTokenExchange({ public_token })
    return res.status(200).json({ access_token: response.data.access_token, item_id: response.data.item_id })
  } catch (err) {
    console.error(err?.response?.data || err)
    return res.status(500).json({ error: 'plaid_error', detail: err?.response?.data || String(err) })
  }
}
