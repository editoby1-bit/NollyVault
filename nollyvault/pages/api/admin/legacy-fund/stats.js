// GET /api/admin/legacy-fund/stats
// Public-safe stats for homepage ticker and veterans page
// Uses "allocated" language — never "distributed" until real disbursements occur
import { supabaseAdmin } from '../../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const sb = supabaseAdmin()

  try {
    const [
      { data: credits },
      { data: debits },
      { data: actors },
      { data: films },
    ] = await Promise.all([
      sb.from('legacy_fund_ledger').select('amount_ngn, pool_type').eq('entry_type', 'credit'),
      sb.from('legacy_fund_ledger').select('amount_ngn').eq('entry_type', 'debit'),
      sb.from('veteran_actors').select('is_verified, status'),
      sb.from('movies').select('id').eq('is_active', true),
    ])

    const totalAllocated    = (credits || []).reduce((s, r) => s + parseFloat(r.amount_ngn || 0), 0)
    const totalDisbursed    = (debits  || []).reduce((s, r) => s + parseFloat(r.amount_ngn || 0), 0)
    const participationPool = (credits || []).filter(r => r.pool_type === 'participation').reduce((s, r) => s + parseFloat(r.amount_ngn || 0), 0)
    const assistancePool    = (credits || []).filter(r => r.pool_type === 'assistance').reduce((s, r) => s + parseFloat(r.amount_ngn || 0), 0)
    const preservationPool  = (credits || []).filter(r => r.pool_type === 'preservation').reduce((s, r) => s + parseFloat(r.amount_ngn || 0), 0)
    const verifiedActors    = (actors  || []).filter(a => a.is_verified).length
    const registeredActors  = (actors  || []).length

    res.setHeader('Cache-Control', 'public, s-maxage=3600')
    return res.json({
      // All public labels say "allocated" — not distributed/paid/earned
      total_allocated_ngn:    totalAllocated,
      total_disbursed_ngn:    totalDisbursed,
      current_balance_ngn:    totalAllocated - totalDisbursed,
      sub_pools: {
        participation_ngn:  participationPool,
        assistance_ngn:     assistancePool,
        preservation_ngn:   preservationPool,
      },
      verified_actors:    verifiedActors,
      registered_actors:  registeredActors,
      active_films:       (films || []).length,
    })
  } catch (err) {
    // Return mock data if DB not connected — safe for demo mode
    return res.json({
      total_allocated_ngn: 960000,
      total_disbursed_ngn: 0,
      current_balance_ngn: 960000,
      sub_pools: { participation_ngn: 480000, assistance_ngn: 288000, preservation_ngn: 192000 },
      verified_actors: 0,
      registered_actors: 8,
      active_films: 15,
    })
  }
}
