import { getPlaidClient, checkOwnerPin } from './_client.js'

// Cursor-based sync: the client keeps the `cursor` (in localStorage) and sends
// it back each call; this returns everything new since that cursor plus the
// next one to store. No server-side database — PLAID_ACCESS_TOKEN is the only
// server-side state, set by hand after exchange-token.js.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })
  if (!checkOwnerPin(req)) return res.status(403).json({ error: 'forbidden' })

  const accessToken = process.env.PLAID_ACCESS_TOKEN
  if (!accessToken) return res.status(400).json({ error: 'not_connected' })

  const { cursor } = req.body || {}

  try {
    const client = getPlaidClient()
    let added = []
    let modified = []
    let removed = []
    let nextCursor = cursor || undefined
    let hasMore = true

    while (hasMore) {
      const response = await client.transactionsSync({
        access_token: accessToken,
        cursor: nextCursor,
        count: 250,
      })
      added = added.concat(response.data.added)
      modified = modified.concat(response.data.modified)
      removed = removed.concat(response.data.removed)
      nextCursor = response.data.next_cursor
      hasMore = response.data.has_more
    }

    return res.status(200).json({ added, modified, removed, next_cursor: nextCursor })
  } catch (err) {
    console.error(err?.response?.data || err)
    return res.status(500).json({ error: 'plaid_error', detail: err?.response?.data || String(err) })
  }
}
