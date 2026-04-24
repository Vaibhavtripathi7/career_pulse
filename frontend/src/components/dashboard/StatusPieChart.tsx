import {PieChart, Pie, Cell, Tooltip, ResponsiveContainer,} from 'recharts';

interface Props {
  data: { name: string; value: number }[];
}
const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#ef4444'];
const GLOWS  = [
  'rgba(59,130,246,0.5)',
  'rgba(139,92,246,0.5)',
  'rgba(16,185,129,0.5)',
  'rgba(239,68,68,0.5)',
];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  const index = ['Applied', 'Interviewing', 'Offer', 'Rejected'].indexOf(name);
  return (
    <div
      className="rounded-xl px-3 py-2.5 text-sm"
      style={{
        background: 'rgba(12,18,32,0.95)',
        border: `1px solid ${COLORS[index]}40`,
        boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px ${COLORS[index]}20`,
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[index] }} />
        <span className="text-slate-300 font-medium">{name}</span>
        <span className="font-bold ml-1" style={{ color: COLORS[index], fontFamily: 'var(--font-mono)' }}>
          {value}
        </span>
      </div>
    </div>
  );
}

export default function StatusPieChart({ data }: Props) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const hasData = total > 0;

  return (
    <div
      className="rounded-2xl p-5 h-[300px] flex flex-col"
      style={{
        background: 'rgba(12,18,32,0.7)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
        Status Breakdown
      </h3>

      {hasData ? (
        <div className="flex-1 flex items-center gap-2">
          {/* Chart */}
          <div className="flex-1 h-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.map((_, i) => (
                    <Cell
                      key={i}
                      fill={COLORS[i % COLORS.length]}
                      style={{ filter: `drop-shadow(0 0 6px ${GLOWS[i % GLOWS.length]})` }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-mono)' }}>
                {total}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">total</span>
            </div>
          </div>

          <div className="space-y-2 min-w-[100px]">
            {data.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                <span className="text-xs text-slate-400 flex-1 truncate">{d.name}</span>
                <span
                  className="text-xs font-bold tabular-nums"
                  style={{ color: COLORS[i], fontFamily: 'var(--font-mono)' }}
                >
                  {d.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <div className="text-3xl opacity-30">📊</div>
          <p className="text-xs text-slate-600">No data yet</p>
        </div>
      )}
    </div>
  );
}
