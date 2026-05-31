// pages/admin/index.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import Link from 'next/link'
import ToastContainer, { showToast } from '../../components/Toast'

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',')

// Mock stats (replace with real Supabase queries)
const MOCK_STATS = [
  { label: 'Total Subscribers', value: '1,247', sub: '+83 this month', color: 'var(--gold)' },
  { label: 'Monthly Revenue', value: '₦3.2M', sub: 'Projected ₦11.5M at 5k', color: 'var(--green)' },
  { label: 'Total Watch Hours', value: '8,940', sub: 'This month', color: 'var(--purple)' },
  { label: 'Movies in Catalog', value: '15', sub: 'All licensed', color: 'var(--gold)' },
  { label: 'Royalty Pool (30%)', value: '₦960k', sub: 'Pending distribution', color: '#e8774a' },
  { label: 'Active Watch Parties', value: '3', sub: 'Right now', color: 'var(--purple)' },
]

const PLAN_BREAKDOWN = [
  { plan: 'Classic', count: 748, revenue: '₦1.12M', pct: 60 },
  { plan: 'Premium', count: 374, revenue: '₦1.12M', pct: 30 },
  { plan: 'Family', count: 125, revenue: '₦625k', pct: 10 },
]

export default function AdminDashboard() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const router = useRouter()
  const [movies, setMovies] = useState([])
  const [uploading, setUploading] = useState(false)
  const [tab, setTab] = useState('overview') // overview | movies | royalties | producers

  useEffect(() => {
    if (!session) return
    loadMovies()
  }, [session])

  async function loadMovies() {
    const { data } = await supabase.from('movies').select('*').order('created_at', { ascending: false })
    if (data) setMovies(data)
    else {
      // Mock fallback
      setMovies([
        { id: '1', title: 'Living in Bondage', year: 1992, category: 'Classic Horror & Occult', producer: 'NEK Video Links', is_active: true },
        { id: '2', title: 'Karishika', year: 1996, category: 'Classic Horror & Occult', producer: 'Vic. O Productions', is_active: true },
        { id: '3', title: 'Glamour Girls', year: 1994, category: 'Village Drama', producer: 'Zeb Ejiro', is_active: true },
        { id: '4', title: 'Rattlesnake', year: 1995, category: 'Crime & Thriller', producer: 'Amaka Igwe Films', is_active: true },
        { id: '5', title: 'Issakaba', year: 2000, category: 'Crime & Thriller', producer: 'Lancelot Imasuen', is_active: false },
      ])
    }
  }

  async function handleUpload(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    const body = {
      title: fd.get('title'), year: parseInt(fd.get('year')),
      category: fd.get('category'), description: fd.get('description'),
      producer: fd.get('producer'),
    }
    setUploading(true)
    try {
      const res = await fetch('/api/admin/upload-url', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.uploadUrl) {
        showToast(`Movie created! Upload file to: ${data.uploadUrl}`, 'gold')
        // In production: trigger a file picker, upload directly to data.uploadUrl via PUT
      } else {
        showToast(data.error || 'Upload failed', 'red')
      }
    } catch (err) {
      showToast('Upload request failed', 'red')
    } finally {
      setUploading(false)
    }
  }

  async function toggleActive(movie) {
    await supabase.from('movies').update({ is_active: !movie.is_active }).eq('id', movie.id)
    loadMovies()
    showToast(`${movie.title} ${movie.is_active ? 'hidden' : 'published'}`, 'gold')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');
        :root{--gold:#c8a84b;--gold-light:#e8c96e;--gold-dim:#7a6530;--bg:#080808;--bg2:#111;--bg3:#1a1a1a;--bg4:#222;--text:#f0ede6;--text2:#9a9590;--text3:#5a5550;--green:#4ace8a;--purple:#7b68ee;--red:#e84a4a;--radius:8px;--radius-lg:14px;--transition:.2s ease;}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;}
        .btn{display:inline-flex;align-items:center;gap:7px;padding:8px 16px;border-radius:var(--radius);font-size:13px;font-weight:600;cursor:pointer;border:none;transition:var(--transition);}
        .btn-gold{background:var(--gold);color:#000;} .btn-gold:hover{background:var(--gold-light);}
        .btn-ghost{background:transparent;color:var(--text2);border:1px solid var(--bg4);} .btn-ghost:hover{color:var(--text);}
        .btn-red{background:var(--red);color:#fff;}
        .btn:disabled{opacity:.5;cursor:not-allowed;}
        .card{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--radius-lg);}
        table{width:100%;border-collapse:collapse;}
        th{font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;padding:8px 12px;text-align:left;border-bottom:1px solid var(--bg4);}
        td{font-size:13px;padding:11px 12px;border-bottom:1px solid var(--bg3);color:var(--text2);vertical-align:middle;}
        tr:hover td{background:var(--bg3);}
        .form-input{width:100%;background:var(--bg3);border:1px solid var(--bg4);border-radius:var(--radius);padding:9px 12px;font-size:13px;color:var(--text);outline:none;font-family:'DM Sans',sans-serif;}
        .form-input:focus{border-color:var(--gold-dim);}
        .form-select{width:100%;background:var(--bg3);border:1px solid var(--bg4);border-radius:var(--radius);padding:9px 12px;font-size:13px;color:var(--text);outline:none;}
        .tab{padding:7px 16px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:500;color:var(--text2);background:transparent;border:none;transition:var(--transition);}
        .tab.active{color:var(--text);background:var(--bg3);}
      `}</style>

      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        {/* Nav */}
        <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--bg4)', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 12, height: 56 }}>
          <Link href="/browse">
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 900, color: 'var(--gold)', cursor: 'pointer' }}>
              Nolly<span style={{ color: 'var(--text)' }}>Vault</span>
            </span>
          </Link>
          <span style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700, background: 'rgba(200,168,75,0.12)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--gold-dim)', marginLeft: 4 }}>ADMIN</span>
          <div style={{ flex: 1 }} />
          <Link href="/browse"><button className="btn btn-ghost">← Back to App</button></Link>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px 80px' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, marginBottom: 4 }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 28 }}>Manage content, subscribers, royalties and producers</p>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'var(--bg2)', border: '1px solid var(--bg4)', borderRadius: 8, padding: 4, width: 'fit-content' }}>
            {['overview','movies','upload','royalties'].map(t => (
              <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW ───────────────────────────────────────────────── */}
          {tab === 'overview' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 32 }}>
                {MOCK_STATS.map(s => (
                  <div key={s.label} className="card" style={{ padding: '16px 18px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Plan breakdown */}
              <div className="card" style={{ padding: '20px 24px', marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Subscriber Plan Breakdown</h3>
                {PLAN_BREAKDOWN.map(p => (
                  <div key={p.plan} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text2)', marginBottom: 5 }}>
                      <span>{p.plan}</span>
                      <span>{p.count} subscribers · {p.revenue}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg4)', borderRadius: 3 }}>
                      <div style={{ height: '100%', background: 'var(--gold)', borderRadius: 3, width: `${p.pct}%`, transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Economics */}
              <div className="card" style={{ padding: '20px 24px' }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Revenue vs Costs</h3>
                <table>
                  <thead><tr><th>Item</th><th>Amount</th></tr></thead>
                  <tbody>
                    {[
                      ['Gross Revenue', '₦3,200,000'],
                      ['Royalty Pool (30%)', '−₦960,000'],
                      ['Cloudflare Stream', '−₦150,000'],
                      ['Paystack fees (1.5%)', '−₦48,000'],
                      ['Miscellaneous ops', '−₦80,000'],
                    ].map(([k, v]) => (
                      <tr key={k}>
                        <td>{k}</td>
                        <td style={{ color: v.startsWith('−') ? 'var(--red)' : 'var(--green)', fontWeight: 500 }}>{v}</td>
                      </tr>
                    ))}
                    <tr>
                      <td style={{ color: 'var(--text)', fontWeight: 600 }}>Net Margin</td>
                      <td style={{ color: 'var(--green)', fontWeight: 700, fontSize: 15 }}>₦1,962,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── MOVIES ─────────────────────────────────────────────────── */}
          {tab === 'movies' && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <table>
                <thead>
                  <tr>
                    <th>Title</th><th>Year</th><th>Category</th><th>Producer</th>
                    <th>Watch hrs</th><th>Royalty est.</th><th>Status</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {movies.map((m, i) => (
                    <tr key={m.id}>
                      <td style={{ color: 'var(--text)', fontWeight: 500 }}>{m.title}</td>
                      <td>{m.year}</td>
                      <td>
                        <span style={{ fontSize: 11, background: 'var(--bg4)', padding: '2px 8px', borderRadius: 4 }}>
                          {m.category?.split(' & ')[0]}
                        </span>
                      </td>
                      <td>{m.producer}</td>
                      <td>{120 + i * 47}</td>
                      <td style={{ color: 'var(--gold)' }}>₦{((120 + i * 47) * 320).toLocaleString()}</td>
                      <td>
                        <span style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 500,
                          background: m.is_active ? 'rgba(74,206,138,0.12)' : 'rgba(90,85,80,0.2)',
                          color: m.is_active ? 'var(--green)' : 'var(--text3)',
                        }}>
                          {m.is_active ? 'Live' : 'Hidden'}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => toggleActive(m)}>
                          {m.is_active ? 'Hide' : 'Publish'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── UPLOAD ─────────────────────────────────────────────────── */}
          {tab === 'upload' && (
            <div className="card" style={{ padding: '28px', maxWidth: 560 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Upload New Movie</h3>
              <form onSubmit={handleUpload}>
                {[
                  { name: 'title', label: 'Movie Title', type: 'text', placeholder: 'Living in Bondage' },
                  { name: 'year', label: 'Release Year', type: 'number', placeholder: '1992' },
                  { name: 'producer', label: 'Producer / Production Company', type: 'text', placeholder: 'NEK Video Links' },
                ].map(f => (
                  <div key={f.name} style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.07em' }}>{f.label}</label>
                    <input className="form-input" name={f.name} type={f.type} placeholder={f.placeholder} required />
                  </div>
                ))}

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.07em' }}>Category</label>
                  <select className="form-select" name="category" required>
                    {['Classic Horror & Occult','Village Drama','Crime & Thriller','Family Favorites','Romance','Action'].map(c => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.07em' }}>Description</label>
                  <textarea className="form-input" name="description" rows={3} placeholder="Brief plot description…" style={{ resize: 'vertical' }} />
                </div>

                <button type="submit" className="btn btn-gold" disabled={uploading}>
                  {uploading ? 'Getting upload URL…' : 'Create Movie & Get Upload Link'}
                </button>
                <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 10 }}>
                  After clicking, you'll receive a direct Cloudflare upload URL. Upload your video file there. Cloudflare auto-encodes to SD/HD.
                </p>
              </form>
            </div>
          )}

          {/* ── ROYALTIES ──────────────────────────────────────────────── */}
          {tab === 'royalties' && (
            <div>
              <div className="card" style={{ padding: '20px 24px', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Monthly Royalty Pool</h3>
                <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
                  30% of monthly revenue is distributed to producers proportionally by watch minutes.
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-gold"
                    onClick={async () => {
                      const res = await fetch('/api/admin/royalties/calculate', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ period: '2024-06', totalRevenueNGN: 3200000 }),
                      })
                      const data = await res.json()
                      showToast(`Calculated! Pool: ₦${data.pool_ngn?.toLocaleString()}`, 'gold')
                    }}
                  >
                    Calculate June 2024 Royalties
                  </button>
                  <button className="btn btn-ghost" onClick={() => showToast('Export to CSV — coming soon')}>
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Mock distribution table */}
              <div className="card" style={{ overflow: 'hidden' }}>
                <table>
                  <thead><tr><th>Movie</th><th>Producer</th><th>Watch hrs</th><th>Pool share</th><th>Payout (₦)</th><th>Status</th></tr></thead>
                  <tbody>
                    {[
                      ['Karishika','Vic. O Productions',340,'18.2%','174,720','Pending'],
                      ['Living in Bondage','NEK Video Links',280,'15.0%','144,000','Pending'],
                      ['Issakaba','Lancelot Imasuen',260,'13.9%','133,440','Paid'],
                      ['Rattlesnake','Amaka Igwe Films',180,'9.6%','92,160','Paid'],
                      ['Glamour Girls','Zeb Ejiro',160,'8.6%','82,560','Pending'],
                    ].map(row => (
                      <tr key={row[0]}>
                        <td style={{ color: 'var(--text)', fontWeight: 500 }}>{row[0]}</td>
                        <td>{row[1]}</td>
                        <td>{row[2]}</td>
                        <td style={{ color: 'var(--gold)' }}>{row[3]}</td>
                        <td style={{ fontWeight: 500 }}>₦{row[4]}</td>
                        <td>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: row[5] === 'Paid' ? 'rgba(74,206,138,0.12)' : 'rgba(200,168,75,0.1)', color: row[5] === 'Paid' ? 'var(--green)' : 'var(--gold)' }}>
                            {row[5]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      <ToastContainer />
    </>
  )
}
