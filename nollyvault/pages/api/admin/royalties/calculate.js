// pages/api/admin/royalties/calculate.js
// Run this on the 1st of each month (cron job or manual trigger).
// Distributes 30% of revenue proportionally by watch minutes per movie.
import { createServerSupabaseClient } from '../../../../lib/supabase'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',')
const ROYALTY_POOL_PCT = 0.30  // 30% of revenue goes to royalty pool

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const supabase = createServerSupabaseClient(req, res)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !ADMIN_EMAILS.includes(session.user.email)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { period, totalRevenueNGN } = req.body
  // period: '2024-06', totalRevenueNGN: total naira collected that month

  if (!period || !totalRevenueNGN) return res.status(400).json({ error: 'Missing period or revenue' })

  const poolNGN = totalRevenueNGN * ROYALTY_POOL_PCT

  // Get total minutes per movie for the period
  const { data: events, error } = await supabase
    .from('play_events')
    .select('movie_id, minutes_watched, movies(title, producer, producer_id)')
    .eq('period', period)

  if (error) return res.status(500).json({ error: error.message })

  // Aggregate by movie
  const totals = {}
  let grandTotal = 0
  for (const e of events) {
    const mid = e.movie_id
    totals[mid] = totals[mid] || { movie_id: mid, minutes: 0, movie: e.movies }
    totals[mid].minutes += (e.minutes_watched || 1)
    grandTotal += (e.minutes_watched || 1)
  }

  if (grandTotal === 0) return res.json({ message: 'No plays this period', distributions: [] })

  // Calculate each movie's share
  const distributions = Object.values(totals).map((t) => ({
    period,
    movie_id: t.movie_id,
    producer: t.movie?.producer,
    total_minutes: t.minutes,
    pool_share_pct: parseFloat(((t.minutes / grandTotal) * 100).toFixed(2)),
    amount_ngn: parseFloat(((t.minutes / grandTotal) * poolNGN).toFixed(2)),
    status: 'pending',
  }))

  // Insert distribution records
  const { data: inserted } = await supabase
    .from('royalty_distributions')
    .insert(distributions)
    .select()

  return res.json({
    period,
    pool_ngn: poolNGN,
    total_minutes: grandTotal,
    distributions: inserted,
  })
}
