// POST /api/admin/legacy-fund/credit
// Credits the Legacy Fund and splits into three sub-pools:
//   50% → Legacy Participation Pool  (future direct actor payments)
//   30% → Veteran Assistance Fund    (medical, emergency, welfare)
//   20% → Preservation Fund          (VHS restoration, digitization, archival)
import { createServerSupabaseClient, supabaseAdmin } from '../../../../lib/supabase'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',')

// Revenue allocations
const FUND_PCT        = 0.10   // 10% of total revenue → entire fund
const PARTICIPATION   = 0.50   // 50% of fund → actor participation
const ASSISTANCE      = 0.30   // 30% of fund → veteran welfare
const PRESERVATION    = 0.20   // 20% of fund → film preservation

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const supabase = createServerSupabaseClient(req, res)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !ADMIN_EMAILS.includes(session.user.email))
    return res.status(403).json({ error: 'Forbidden' })

  const { period, totalRevenueNGN } = req.body
  if (!period || !totalRevenueNGN)
    return res.status(400).json({ error: 'Missing period or totalRevenueNGN' })

  const sb = supabaseAdmin()
  const totalFund        = parseFloat((totalRevenueNGN * FUND_PCT).toFixed(2))
  const participationAmt = parseFloat((totalFund * PARTICIPATION).toFixed(2))
  const assistanceAmt    = parseFloat((totalFund * ASSISTANCE).toFixed(2))
  const preservationAmt  = parseFloat((totalFund * PRESERVATION).toFixed(2))

  // ── 1. Credit three sub-pool ledger entries ───────────────────────────────
  await sb.from('legacy_fund_ledger').insert([
    {
      period, entry_type: 'credit', pool_type: 'participation',
      amount_ngn: participationAmt,
      description: `Legacy Participation Pool (50%) — ${period}`,
      total_platform_revenue_ngn: totalRevenueNGN, fund_pct: FUND_PCT * 100,
    },
    {
      period, entry_type: 'credit', pool_type: 'assistance',
      amount_ngn: assistanceAmt,
      description: `Veteran Assistance Fund (30%) — ${period}`,
      total_platform_revenue_ngn: totalRevenueNGN, fund_pct: FUND_PCT * 100,
    },
    {
      period, entry_type: 'credit', pool_type: 'preservation',
      amount_ngn: preservationAmt,
      description: `Film Preservation Fund (20%) — ${period}`,
      total_platform_revenue_ngn: totalRevenueNGN, fund_pct: FUND_PCT * 100,
    },
  ])

  // ── 2. Calculate actor Legacy Credits from Participation Pool ────────────
  const { data: playEvents } = await sb
    .from('play_events')
    .select('movie_id, minutes_watched')
    .eq('period', period)

  const movieIds = [...new Set((playEvents || []).map(e => e.movie_id))]

  const { data: pointsData } = await sb
    .from('movie_legacy_points')
    .select('movie_id, actor_name, legacy_points, veteran_actor_id')
    .in('movie_id', movieIds)

  if (!pointsData?.length) {
    return res.json({
      success: true, period,
      total_fund_ngn: totalFund,
      sub_pools: { participation: participationAmt, assistance: assistanceAmt, preservation: preservationAmt },
      message: 'Fund credited across 3 pools. Add legacy points to actors to activate credit calculations.',
    })
  }

  // Aggregate watch minutes per movie
  const movieMinutes = {}
  for (const e of playEvents || []) {
    movieMinutes[e.movie_id] = (movieMinutes[e.movie_id] || 0) + (e.minutes_watched || 1)
  }

  // Weighted legacy credits per actor
  const actorWeights = {}
  for (const p of pointsData) {
    const minutes = movieMinutes[p.movie_id] || 0
    const weighted = p.legacy_points * minutes
    const key = p.actor_name
    if (!actorWeights[key]) {
      actorWeights[key] = {
        actor_name: key,
        veteran_actor_id: p.veteran_actor_id || null,
        total_weighted: 0,
      }
    }
    actorWeights[key].total_weighted += weighted
  }

  const totalWeighted = Object.values(actorWeights)
    .reduce((s, a) => s + a.total_weighted, 0)

  if (totalWeighted === 0) {
    return res.json({
      success: true, period, total_fund_ngn: totalFund,
      message: 'Fund credited. No watch data yet to calculate credits.',
    })
  }

  // Build allocation records — labelled "Legacy Credits", not earnings
  const allocations = Object.values(actorWeights).map(a => ({
    period,
    actor_name: a.actor_name,
    veteran_actor_id: a.veteran_actor_id || null,
    pool_type: 'participation',
    total_points: a.total_weighted,
    pool_share_pct: parseFloat(((a.total_weighted / totalWeighted) * 100).toFixed(4)),
    // "calculated_amount" is internal only — publicly shown as Legacy Credits
    calculated_amount_ngn: parseFloat(
      ((a.total_weighted / totalWeighted) * participationAmt).toFixed(2)
    ),
    status: 'held', // NEVER auto-pay — held until actor is verified + agreement signed
  }))

  await sb.from('actor_legacy_allocations').insert(allocations)

  // ── 3. Update public impact stats ─────────────────────────────────────────
  await sb.from('impact_stats').upsert({
    period,
    total_revenue_ngn: totalRevenueNGN,
    fund_contribution_ngn: totalFund,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'period' })

  return res.json({
    success: true,
    period,
    total_fund_allocated_ngn: totalFund,   // "allocated", not "distributed"
    sub_pools: {
      participation_ngn: participationAmt,
      assistance_ngn: assistanceAmt,
      preservation_ngn: preservationAmt,
    },
    actor_credits_calculated: allocations.length,
    allocations,
  })
}
