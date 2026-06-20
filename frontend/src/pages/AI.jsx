import { useEffect, useState, useRef } from 'react'
import api from '../api'
import { PageHeader, Chip, Spinner, Avatar } from '../components/ui'

const SEV = { critical: 'danger', warning: 'warning', info: 'info' }

function InsightCard({ title, icon, children, glow = false }) {
  return (
    <div className={`card p-6 relative overflow-hidden ${glow ? 'ring-1 ring-burgundy-800/30 shadow-lg shadow-burgundy-900/5' : ''}`}>
      {glow && <div className="absolute -right-20 -top-20 w-40 h-40 bg-rose-200/40 blur-3xl rounded-full" />}
      <div className="flex items-center gap-2 text-sm font-bold text-ink-900 uppercase tracking-wider mb-5 relative z-10">
        <span className="text-lg">{icon}</span> {title}
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  )
}

function AIChat() {
  const [msgs, setMsgs] = useState([
    { role: 'ai', text: 'Hello! I am Shiv AI. I continuously monitor your inventory, production, and sales. How can I help you today?' }
  ])
  const [input, setInput] = useState('')
  const endRef = useRef(null)

  const send = (e) => {
    e.preventDefault()
    if (!input.trim()) return
    setMsgs([...msgs, { role: 'user', text: input }])
    setInput('')
    setTimeout(() => {
      setMsgs(m => [...m, { role: 'ai', text: 'I am analyzing the data for you. This feature will be fully connected in the next update!' }])
    }, 1000)
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  return (
    <div className="card flex flex-col h-[600px] border border-burgundy-800/20 shadow-xl shadow-burgundy-900/5 bg-gradient-to-b from-white to-rose-50/30">
      <div className="p-4 bg-burgundy-800 text-white rounded-t-2xl flex items-center gap-3">
        <div className="relative">
          <Avatar name="Shiv AI" size="sm" />
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-burgundy-800" />
        </div>
        <div>
          <div className="font-semibold text-sm">Shiv AI Assistant</div>
          <div className="text-[10px] text-rose-200 uppercase tracking-widest">Active & Monitoring</div>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {msgs.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {m.role === 'ai' && <Avatar name="AI" size="xs" className="shrink-0 mt-1" />}
            <div className={`p-3 rounded-2xl text-sm max-w-[85%] ${
              m.role === 'user' ? 'bg-burgundy-800 text-white rounded-tr-sm' : 'bg-white border border-line shadow-sm text-ink-900 rounded-tl-sm'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="p-4 bg-white border-t border-line rounded-b-2xl flex gap-2">
        <input className="input flex-1 bg-paper-50" placeholder="Ask about stock, delays, or vendor prices..." 
          value={input} onChange={e => setInput(e.target.value)} />
        <button type="submit" className="btn-primary px-4" disabled={!input.trim()}>↑</button>
      </form>
    </div>
  )
}

export default function AI() {
  const [forecast, setForecast] = useState(null)
  const [vendors, setVendors] = useState([])
  const [mfg, setMfg] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = () => {
    api.get('/ai/forecast').then((r) => setForecast(r.data))
    api.get('/ai/vendors').then((r) => setVendors(r.data))
    api.get('/ai/manufacturing').then((r) => setMfg(r.data))
  }
  
  useEffect(() => { load() }, [])
  
  const regen = async () => { 
    setBusy(true)
    await api.post('/ai/regenerate')
    load()
    setBusy(false) 
  }
  
  if (!forecast) return <Spinner />

  return (
    <div className="animate-fade-in pb-10">
      <PageHeader title="Shiv AI" subtitle="Predictive Intelligence & Co-Pilot"
        actions={
          <button className="btn-primary shadow-lg shadow-burgundy-900/20 flex items-center gap-2" onClick={regen} disabled={busy}>
            {busy ? '🧠 Analyzing...' : '⚡ Regenerate Insights'}
          </button>
        } />

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Col: Insights */}
        <div className="lg:col-span-2 space-y-6">
          
          <InsightCard title="Inventory Forecasting" icon="🔮" glow>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-ink-500 text-[11px] uppercase tracking-wider border-b border-line/40">
                    <th className="text-left py-2 pb-3">Product</th>
                    <th className="text-right pb-3">Velocity/day</th>
                    <th className="text-right pb-3">Free</th>
                    <th className="text-right pb-3">Runout</th>
                    <th className="text-right pb-3">Reorder Qty</th>
                    <th className="text-right pb-3">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.map((f) => (
                    <tr key={f.product_id} className="border-b border-line/40 last:border-0 hover:bg-paper-50 transition-colors">
                      <td className="py-3 font-medium text-ink-900">{f.product}</td>
                      <td className="text-right font-mono text-ink-600">{f.daily_velocity}</td>
                      <td className="text-right font-mono text-ink-600">{f.free_to_use_qty}</td>
                      <td className="text-right font-mono font-semibold">
                        {f.runout_days == null ? <span className="text-ink-300">—</span> : (
                          <span className={f.runout_days <= 7 ? 'text-danger' : f.runout_days <= 14 ? 'text-warning' : 'text-success'}>
                            {f.runout_days}d
                          </span>
                        )}
                      </td>
                      <td className="text-right font-mono font-bold text-burgundy-800">{f.recommended_reorder_qty || '—'}</td>
                      <td className="text-right">
                        <Chip tone={SEV[f.severity]}>{f.severity === 'critical' ? '🔥 Critical' : f.severity === 'warning' ? '⚠️ Warning' : '✅ Safe'}</Chip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </InsightCard>

          <div className="grid sm:grid-cols-2 gap-6">
            <InsightCard title="Vendor Intelligence" icon="🤝">
              <div className="space-y-4">
                {vendors.map((v, i) => (
                  <div key={v.vendor_id} className="flex items-center justify-between p-3 rounded-xl border border-line bg-paper-50 hover:border-rose-200 transition-colors">
                    <div>
                      <div className="font-semibold text-sm text-ink-900 flex items-center gap-2 mb-1">
                        {v.vendor_name}
                        {i === 0 && <span className="bg-success text-white text-[9px] uppercase font-bold px-1.5 py-0.5 rounded shadow-sm">Top Pick</span>}
                      </div>
                      <div className="text-xs text-ink-500 flex items-center gap-3">
                        <span title="On Time Delivery">⏱️ {v.on_time_pct}%</span>
                        <span title="Order Fulfillment">📦 {v.fulfillment_pct}%</span>
                        <span title="Price Index">💲 {v.price_index}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-[10px] text-ink-400 font-bold uppercase tracking-widest mb-0.5">Score</div>
                      <div className="font-display text-2xl text-burgundy-800 leading-none">{v.overall}</div>
                    </div>
                  </div>
                ))}
              </div>
            </InsightCard>

            <InsightCard title="Manufacturing Risk" icon="⚙️">
              <div className="space-y-4">
                {mfg?.risks?.length ? mfg.risks.map((r, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-line bg-paper-50">
                    <div className="mt-0.5">
                      {r.severity === 'critical' ? <span className="text-danger text-lg">⚠️</span> : <span className="text-warning text-lg">⚡</span>}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-ink-900 font-mono mb-1">{r.mo}</div>
                      <div className="text-xs text-ink-600 leading-relaxed">{r.detail}</div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-6 text-success text-sm bg-success-bg/50 rounded-xl border border-success/20">
                    ✅ No active risks detected in production.
                  </div>
                )}
                
                {mfg?.bottlenecks?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-line/50">
                    <div className="text-[10px] uppercase font-bold text-ink-500 tracking-wider mb-3">Detected Bottlenecks</div>
                    <div className="space-y-2">
                      {mfg.bottlenecks.map((b, i) => (
                        <div key={i} className="flex justify-between text-sm items-center">
                          <span className="text-ink-600">{b.work_center}</span>
                          <span className="font-mono font-semibold text-danger bg-danger-bg px-2 py-0.5 rounded">{b.queued_hours}h queued</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </InsightCard>
          </div>

        </div>

        {/* Right Col: Chat */}
        <div className="lg:col-span-1">
          <AIChat />
        </div>

      </div>
    </div>
  )
}
