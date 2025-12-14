import { CheckCircle, Shield, AlertTriangle, Lock, Sparkles, Filter, ArrowUpRight, ArrowRight } from 'lucide-react';

const kpis = [
  { title: 'Profit', fact: '$128k', plan: '$120k', delta: '+6.7%', accent: 'text-emerald-600' },
  { title: 'Revenue', fact: '$640k', plan: '$620k', delta: '+3.1%', accent: 'text-emerald-600' },
  { title: 'Orders', fact: '12,480', plan: '12,100', delta: '+2.9%', accent: 'text-emerald-600' },
  { title: 'Ad Spend', fact: '$94k', plan: '$90k', delta: '+4.4%', accent: 'text-amber-500' },
  { title: 'DRR', fact: '14.8%', plan: '15%', delta: '-0.2pp', accent: 'text-emerald-600' },
  { title: 'Avg CM0/unit', fact: '$5.84', plan: '$5.50', delta: '+6.1%', accent: 'text-emerald-600' },
  { title: 'Stock cover', fact: '18d median', plan: '15-25d', delta: 'ok', accent: 'text-slate-600' },
  { title: '# Actions today', fact: '186', plan: '', delta: 'UP 92 / DOWN 44 / HOLD 50', accent: 'text-slate-600' },
];

const alerts = [
  { time: '09:24', sku: 'WB-42811 / Hoodie Classic', type: 'Spend spike no sales', severity: 'High' },
  { time: '09:18', sku: 'OZ-99412 / Wireless buds', type: 'Rank drop critical', severity: 'Critical' },
  { time: '08:50', sku: 'WB-72203 / Winter boots', type: 'Low stock risk', severity: 'Medium' },
  { time: '08:34', sku: 'OZ-12007 / Kids set', type: 'Overstock CLEAR', severity: 'Info' },
  { time: '08:12', sku: 'WB-55009 / Silk pillow', type: 'Gold degradation', severity: 'High' },
];

const opportunities = {
  profit: [
    { sku: 'WB-12001', name: 'Thermo bottle 500ml', value: '$1,940/day' },
    { sku: 'WB-20440', name: 'Yoga mat Pro', value: '$1,740/day' },
    { sku: 'OZ-88210', name: 'LED strip 10m', value: '$1,480/day' },
    { sku: 'WB-99231', name: 'Desk lamp Nova', value: '$1,220/day' },
    { sku: 'OZ-30011', name: 'Robot vacuum L1', value: '$1,170/day' },
  ],
  uplift: [
    { sku: 'WB-55009', name: 'Silk pillow', value: '+$920/day' },
    { sku: 'WB-42811', name: 'Hoodie Classic', value: '+$860/day' },
    { sku: 'OZ-12007', name: 'Kids set', value: '+$780/day' },
    { sku: 'WB-20440', name: 'Yoga mat Pro', value: '+$740/day' },
    { sku: 'OZ-88210', name: 'LED strip 10m', value: '+$690/day' },
  ],
};

const skuRows = [
  {
    sku: 'WB-42811',
    name: 'Hoodie Classic',
    category: 'Apparel',
    mode: 'GROWTH',
    diagnosis: 'TRAFFIC',
    price: '$42',
    orders: 182,
    revenue: '$7.6k',
    profit: '$1.2k',
    cm0: '$6.5',
    stock: '14d',
    impressions: '148k',
    ctr: '0.92%',
    drr: '16.2%',
    recPrice: '$44 (+5%)',
    recAds: 'DRR 14%',
    uplift: '+$860/day',
    reason: ['Rank drop', 'Spend spike'],
    highlight: 'red',
  },
  {
    sku: 'OZ-88210',
    name: 'LED strip 10m',
    category: 'Home',
    mode: 'COW',
    diagnosis: 'PRICE',
    price: '$19',
    orders: 420,
    revenue: '$8.0k',
    profit: '$1.9k',
    cm0: '$4.5',
    stock: '22d',
    impressions: '210k',
    ctr: '1.18%',
    drr: '12.5%',
    recPrice: '$20 (+6%)',
    recAds: 'Budget +20%',
    uplift: '+$690/day',
    reason: ['Best uplift'],
    highlight: 'green',
  },
  {
    sku: 'WB-99231',
    name: 'Desk lamp Nova',
    category: 'Electronics',
    mode: 'STOP',
    diagnosis: 'DATA',
    price: '$34',
    orders: 66,
    revenue: '$2.2k',
    profit: '-$120',
    cm0: '$-1.3',
    stock: '35d',
    impressions: '88k',
    ctr: '0.64%',
    drr: '22.8%',
    recPrice: '$31 (-8%)',
    recAds: 'OFF',
    uplift: '+$140/day',
    reason: ['Confidence low'],
    highlight: 'yellow',
  },
];

const scenarioGrid = [
  { price: '-6%', ads: 'OFF', profit: '$1.4k', orders: '210', guard: true, confidence: '85%' },
  { price: '-3%', ads: '-30%', profit: '$1.6k', orders: '230', guard: true, confidence: '78%' },
  { price: '0%', ads: '0%', profit: '$1.9k', orders: '248', guard: true, confidence: '90%', best: true },
  { price: '+3%', ads: '+20%', profit: '$1.8k', orders: '240', guard: false, confidence: '72%' },
  { price: '+5%', ads: '+20%', profit: '$1.6k', orders: '228', guard: false, confidence: '64%' },
  { price: '+8%', ads: '+20%', profit: '$1.3k', orders: '210', guard: false, confidence: '55%' },
];

function Badge({ label, tone = 'slate' }) {
  const palette = {
    slate: 'bg-slate-100 text-slate-700',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-rose-50 text-rose-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
  };
  return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${palette[tone] ?? palette.slate}`}>{label}</span>;
}

function ProfitOptimizer() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:py-12">
        <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
          <aside className="card h-fit sticky top-6 space-y-2 bg-white/80 backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wide">
              <Shield size={16} /> Profit Optimizer
            </div>
            {['Control Room', 'SKU Board', 'SKU Detail', 'Alerts', 'Experiments (A/B)', 'Config & Guards', 'Audit Log'].map((item) => (
              <button
                key={item}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <span>{item}</span>
                <ArrowRight size={16} className="text-slate-300" />
              </button>
            ))}
            <div className="mt-3 rounded-xl bg-slate-900 px-4 py-3 text-white shadow-lg">
              <p className="text-xs text-slate-200">Mode</p>
              <div className="mt-1 flex items-center gap-2 text-sm font-semibold">
                <Sparkles size={16} className="text-amber-300" /> Shadow + Approval
              </div>
            </div>
          </aside>

          <main className="space-y-8">
            <header className="card sticky top-6 z-10 flex flex-wrap items-center gap-3 bg-white/90 backdrop-blur">
              <div className="flex items-center gap-2 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                <Filter size={14} /> Control Room
              </div>
              <div className="flex flex-wrap gap-2 text-sm font-semibold text-slate-600">
                {['1d', '3d', '7d', '14d', '28d'].map((period) => (
                  <button key={period} className={`rounded-full px-3 py-1 ${period === '7d' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700'}`}>
                    {period}
                  </button>
                ))}
              </div>
              <div className="ml-auto flex flex-wrap gap-2 text-sm font-semibold">
                <select className="rounded-xl border border-slate-200 px-3 py-2 text-slate-700 shadow-inner">
                  <option>Marketplace: WB</option>
                  <option>Marketplace: Ozon</option>
                </select>
                <select className="rounded-xl border border-slate-200 px-3 py-2 text-slate-700 shadow-inner">
                  <option>All categories</option>
                  <option>Apparel</option>
                  <option>Electronics</option>
                </select>
                <button className="btn-secondary">Export decisions</button>
              </div>
            </header>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {kpis.map((kpi) => (
                <div key={kpi.title} className="card group cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-500">{kpi.title}</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">{kpi.fact}</p>
                      <p className={`text-sm font-semibold ${kpi.accent} mt-1`}>{kpi.plan ? `${kpi.plan} / ${kpi.delta}` : kpi.delta}</p>
                    </div>
                    <ArrowUpRight className="text-slate-300 transition group-hover:text-slate-500" />
                  </div>
                  <p className="mt-3 text-xs text-slate-500">Click to filter SKU Board</p>
                </div>
              ))}
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.1fr,1.4fr]">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Alerts stream</p>
                    <p className="text-lg font-bold text-slate-900">Live issues</p>
                  </div>
                  <Badge label="5 new" tone="red" />
                </div>
                <div className="mt-4 space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert.time + alert.sku} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-slate-200">
                      <span className="text-sm font-semibold text-slate-500 w-16">{alert.time}</span>
                      <div className="flex-1 min-w-[160px]">
                        <p className="text-sm font-semibold text-slate-900">{alert.sku}</p>
                        <p className="text-xs text-slate-500">{alert.type}</p>
                      </div>
                      <Badge label={alert.type} tone="amber" />
                      <Badge label={alert.severity} tone={alert.severity === 'Critical' ? 'red' : alert.severity === 'High' ? 'amber' : 'slate'} />
                      <button className="btn-secondary px-3 py-2 text-xs">Open SKU</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Top opportunities</p>
                    <p className="text-lg font-bold text-slate-900">Where to focus</p>
                  </div>
                  <Badge label="Auto-prioritized" tone="blue" />
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-100 p-4">
                    <p className="text-sm font-semibold text-slate-500">Top Profit/day</p>
                    <div className="mt-3 space-y-3">
                      {opportunities.profit.map((item) => (
                        <div key={item.sku} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                          <span>{item.sku} — {item.name}</span>
                          <span className="text-emerald-600">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-100 p-4">
                    <p className="text-sm font-semibold text-slate-500">Top uplift (ΔProfit)</p>
                    <div className="mt-3 space-y-3">
                      {opportunities.uplift.map((item) => (
                        <div key={item.sku} className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                          <span>{item.sku} — {item.name}</span>
                          <span>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="card">
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                  SKU Board (virtualized)
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  {['Search SKU/name', 'Period: 7d', 'Mode: ALL', 'Diagnosis: ALL', 'Stock: low/ok/over', 'Action != HOLD', 'Bulk simulate', 'Bulk apply'].map((filterChip) => (
                    <span key={filterChip} className="rounded-full bg-slate-100 px-3 py-2 text-slate-700">{filterChip}</span>
                  ))}
                </div>
              </div>
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
                <div className="grid grid-cols-[220px,1fr,1fr,1fr] bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span>SKU</span>
                  <span className="text-center">Performance</span>
                  <span className="text-center">Funnel & Ads</span>
                  <span className="text-center">Decision</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {skuRows.map((row) => (
                    <div
                      key={row.sku}
                      className={`grid grid-cols-[220px,1fr,1fr,1fr] items-center px-4 py-4 text-sm ${row.highlight === 'red' ? 'bg-rose-50' : row.highlight === 'yellow' ? 'bg-amber-50' : row.highlight === 'green' ? 'bg-emerald-50' : ''}`}
                    >
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-900">{row.sku} / {row.name}</p>
                        <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                          <Badge label={row.category} />
                          <Badge label={row.mode} tone={row.mode === 'GROWTH' ? 'green' : row.mode === 'STOP' ? 'red' : 'slate'} />
                          <Badge label={row.diagnosis} tone="blue" />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
                        <div className="rounded-xl bg-white p-3 shadow-sm">
                          <p className="text-[11px] font-semibold text-slate-500">Price</p>
                          <p className="text-base font-bold text-slate-900">{row.price}</p>
                          <p className="text-[11px] text-slate-500">Stock {row.stock}</p>
                        </div>
                        <div className="rounded-xl bg-white p-3 shadow-sm">
                          <p className="text-[11px] font-semibold text-slate-500">Revenue</p>
                          <p className="text-base font-bold text-slate-900">{row.revenue}</p>
                          <p className="text-[11px] text-emerald-600">Profit {row.profit}</p>
                        </div>
                        <div className="rounded-xl bg-white p-3 shadow-sm">
                          <p className="text-[11px] font-semibold text-slate-500">CM0/unit</p>
                          <p className="text-base font-bold text-slate-900">{row.cm0}</p>
                          <p className="text-[11px] text-slate-500">Orders {row.orders}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
                        <div className="rounded-xl bg-white p-3 shadow-sm">
                          <p className="text-[11px] font-semibold text-slate-500">Impressions</p>
                          <p className="text-base font-bold text-slate-900">{row.impressions}</p>
                          <p className="text-[11px]">CTR {row.ctr}</p>
                        </div>
                        <div className="rounded-xl bg-white p-3 shadow-sm">
                          <p className="text-[11px] font-semibold text-slate-500">Ads</p>
                          <p className="text-base font-bold text-slate-900">DRR {row.drr}</p>
                          <p className="text-[11px]">Rank drop: clear</p>
                        </div>
                        <div className="rounded-xl bg-white p-3 shadow-sm">
                          <p className="text-[11px] font-semibold text-slate-500">Expected uplift</p>
                          <p className="text-base font-bold text-emerald-600">{row.uplift}</p>
                          <p className="text-[11px]">Confidence medium</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
                          <Badge label={`Rec Price ${row.recPrice}`} tone="blue" />
                          <Badge label={`Rec Ads ${row.recAds}`} tone="amber" />
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                          {row.reason.map((tag) => (
                            <Badge key={tag} label={tag} tone={tag === 'Best uplift' ? 'green' : 'amber'} />
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs font-semibold">
                          <button className="btn-secondary px-3 py-2 text-xs">Simulate</button>
                          <button className="btn-primary px-3 py-2 text-xs">Apply</button>
                          <button className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                            <Lock size={14} /> Lock
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">Row highlighting: red = negative profit/critical; yellow = low confidence; green = best uplift in filter.</p>
            </section>

            <section className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">SKU Detail + Simulator</p>
                  <p className="text-lg font-bold text-slate-900">WB-42811 / Hoodie Classic</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <Badge label="Mode: GROWTH" tone="green" />
                  <Badge label="Diagnosis: TRAFFIC" tone="blue" />
                  <Badge label="Guard: cooldown" tone="amber" />
                  <button className="btn-secondary px-3 py-2 text-xs">Lock price</button>
                  <button className="btn-secondary px-3 py-2 text-xs">Lock ads</button>
                  <button className="btn-primary px-3 py-2 text-xs">Create content task</button>
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr,1fr]">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-100 p-4">
                    <p className="text-sm font-semibold text-slate-500">Funnel snapshot</p>
                    <div className="mt-3 grid grid-cols-4 gap-3 text-center text-sm font-semibold text-slate-700">
                      {[
                        { label: 'Impressions', value: '148k', delta: '+12% vs 14d' },
                        { label: 'Clicks', value: '3.2k', delta: '+4% vs 14d' },
                        { label: 'Cart', value: '860', delta: '-3% vs 14d' },
                        { label: 'Orders', value: '248', delta: '-6% vs 14d' },
                      ].map((item) => (
                        <div key={item.label} className="rounded-xl bg-white p-3 shadow-sm">
                          <p className="text-xs text-slate-500">{item.label}</p>
                          <p className="text-lg font-bold text-slate-900">{item.value}</p>
                          <p className="text-[11px] text-amber-600">{item.delta}</p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-sm font-semibold text-amber-700">Auto-diagnosis: Conversion drop after cart → check price + content freshness.</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {['Price & Orders', 'Profit/day & CM0/unit', 'CTR + CR_cart + CR_order', 'AdSpend + DRR + CPO'].map((title) => (
                      <div key={title} className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-slate-700">{title}</p>
                          <Badge label="Chart" />
                        </div>
                        <p className="mt-6 text-xs">Placeholder mini-chart (daily / 7d rolling)</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-slate-100 p-4">
                    <p className="text-sm font-semibold text-slate-500">Guards</p>
                    <div className="mt-3 grid grid-cols-3 gap-3 text-sm font-semibold text-slate-700">
                      {[ 'Data OK', 'Cooldown', 'Min margin', 'Rank drop', 'Family guard', 'Low stock' ].map((guard) => (
                        <div key={guard} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                          <CheckCircle size={16} className="text-emerald-600" /> {guard}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-100 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-500">Simulator</p>
                      <Badge label="3×3 grid" tone="blue" />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                      <Badge label="Price -10..+5" tone="amber" />
                      <Badge label="Ads OFF/-30/0/+20" tone="blue" />
                      <Badge label="Show only safe" />
                      <Badge label="Normal" tone="green" />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {scenarioGrid.map((scenario) => (
                        <div
                          key={`${scenario.price}-${scenario.ads}`}
                          className={`rounded-xl border p-3 text-sm shadow-sm ${scenario.best ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'}`}
                        >
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>Price {scenario.price}</span>
                            <span>Ads {scenario.ads}</span>
                          </div>
                          <p className="mt-2 text-xl font-bold text-slate-900">{scenario.profit}</p>
                          <p className="text-xs text-slate-500">Expected orders {scenario.orders}</p>
                          <div className="mt-2 flex items-center gap-2 text-xs font-semibold">
                            <Badge label={scenario.guard ? 'Guard ✅' : 'Guard ⛔'} tone={scenario.guard ? 'green' : 'red'} />
                            <Badge label={`Conf ${scenario.confidence}`} tone={scenario.best ? 'green' : 'slate'} />
                          </div>
                          {scenario.best && <p className="mt-2 text-xs font-semibold text-emerald-700">Best scenario highlighted</p>}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} /> Autoselect
                      </div>
                      <p className="mt-1">Rec Price $44 (+5%), Rec Ads DRR 14%, TTL 3 days</p>
                      <p className="text-xs text-emerald-700">ΔProfit +$860/day, ΔOrders +24 | Reason: rank recovery, elasticity e14=1.2, confidence high</p>
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-slate-700">
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle size={16} /> If uplift vs baseline &lt; X% → HOLD recommended
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Lock size={16} /> Apply workflow: comment + checkboxes (price/ads) + next cycle time
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Alerts screen</p>
                    <p className="text-lg font-bold text-slate-900">Filters + table</p>
                  </div>
                  <Badge label="Filters: date/category/type/severity" />
                </div>
                <div className="mt-4 space-y-3">
                  {alerts.slice(0, 3).map((alert) => (
                    <div key={alert.sku} className="flex flex-wrap items-center justify-between rounded-xl border border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
                      <span>{alert.sku}</span>
                      <span className="text-slate-500">{alert.type}</span>
                      <Badge label={alert.severity} tone={alert.severity === 'Critical' ? 'red' : 'amber'} />
                      <button className="btn-secondary px-3 py-2 text-xs">Open</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Config & Guards</p>
                    <p className="text-lg font-bold text-slate-900">Admin panel stub</p>
                  </div>
                  <Badge label="Publish v1.4" tone="green" />
                </div>
                <div className="mt-4 grid gap-3 text-sm font-semibold text-slate-700">
                  <div className="rounded-xl bg-slate-50 p-3">Thresholds: min margin 12%, cooldown 48h, rank drop -20</div>
                  <div className="rounded-xl bg-slate-50 p-3">Categories: CTR/CR targets per segment</div>
                  <div className="rounded-xl bg-slate-50 p-3">Features: family guard, evening boost, auto apply</div>
                  <div className="rounded-xl bg-slate-50 p-3">RBAC: viewer / manager / approver / admin</div>
                </div>
              </div>
            </section>

            <section className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Что дальше</p>
                  <p className="text-lg font-bold text-slate-900">Дорожная карта запуска</p>
                </div>
                <Badge label="Ready for handoff" tone="green" />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3 text-sm font-semibold text-slate-700">
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Продукт</p>
                  <ul className="mt-3 space-y-2 list-disc pl-4">
                    <li>Уточнить роли: viewer/manager/approver/admin</li>
                    <li>Подтвердить режим: shadow → approval → apply</li>
                    <li>Согласовать пороги guard'ов и автоприменения</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Инженерия</p>
                  <ul className="mt-3 space-y-2 list-disc pl-4">
                    <li>Поднять API для SKU, алертов, сценариев</li>
                    <li>Подключить виртуализацию таблицы (1k–50k SKU)</li>
                    <li>Собрать симулятор: расчет e7/e14/e28 + guard_pass</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Данные и UX</p>
                  <ul className="mt-3 space-y-2 list-disc pl-4">
                    <li>Запитать real-time KPI и ленту алертов</li>
                    <li>Настроить автодиагноз в деталке + подсветки</li>
                    <li>Подготовить экспорт решений и аудит лог</li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                <Badge label="Default stack: Retool MVP" tone="blue" />
                <Badge label="Next.js custom later" tone="amber" />
                <Badge label="Approval-first" tone="green" />
                <Badge label="Auto-apply guarded" />
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

export default ProfitOptimizer;
