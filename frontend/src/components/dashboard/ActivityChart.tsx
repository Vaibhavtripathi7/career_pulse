import {AreaChart, Area, XAxis, YAxis, Tooltip,ResponsiveContainer, CartesianGrid} from 'recharts';

interface Props {
  data: { date: string; count: number }[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 text-sm"
      style={{
        background: 'rgba(12,18,32,0.95)',
        border: '1px solid rgba(59,130,246,0.25)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <p className="text-slate-400 text-xs mb-0.5">{label}</p>
      <p className="font-bold" style={{ color: '#3b82f6', fontFamily: 'var(--font-mono)' }}>
        {payload[0].value} application{payload[0].value !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

function CustomDot(props: any) {
  const { cx, cy } = props;
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill="#00FF85" style={{ filter: 'drop-shadow(0 0 6px rgba(59,130,246,0.8))' }} />
      <circle cx={cx} cy={cy} r={3} fill="#fff" />
    </g>
  );
}

export default function ActivityChart({ data }: Props) {
  const hasData = data.length > 0;

  return (
    <div
      className="rounded-2xl p-5 h-[300px] flex flex-col"
      style={{
        background: 'rgb(0, 0, 0)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
        Application Activity
      </h3>

      {hasData ? (
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
              <defs>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="20%"   stopColor="#00FF85" stopOpacity={1} />
                  <stop offset="100%" stopColor="#00FF85" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="rgba(255,255,255,0.04)"
                strokeDasharray="0"
                vertical={false}
              />

              <XAxis
                dataKey="date"
                tick={{ fill: '#475569', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                axisLine={false}
                tickLine={false}
                dy={8}
              />
              <YAxis
                tick={{ fill: '#475569', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />

              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(59,130,246,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }} />

              <Area
                type="monotoneX"
                dataKey="count"
                stroke="#000000"
                strokeWidth={2}
                fill="url(#blueGrad)"
                dot={false}
                activeDot={<CustomDot />}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <div className="text-3xl opacity-30">📈</div>
          <p className="text-xs text-slate-600">No activity yet</p>
        </div>
      )}
    </div>
  );
}
