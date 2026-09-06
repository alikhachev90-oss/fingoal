import { getPlaidClient, checkOwnerPin } from './_client.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })
  if (!checkOwnerPin(req)) return res.status(403).json({ error: 'forbidden' })

  try {
    const client = getPlaidClient()
    const response = await client.linkTokenCreate({
      user: { client_user_id: 'owner' },
      client_name: 'Fintera',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
    })
    return res.status(200).json({ link_token: response.data.link_token })
  } catch (err) {
    console.error(err?.response?.data || err)
    return res.status(500).json({ error: 'plaid_error', detail: err?.response?.data || String(err) })
  }
}
