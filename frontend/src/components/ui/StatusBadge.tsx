type Status = 'applied' | 'interviewing' | 'offer' | 'rejected';

interface Props { status: string; }

const STATUS_CONFIG: Record<Status, {
  label: string;
  bg: string;
  text: string;
  ring: string;
  dot: string;
  glow: string;
}> = {
  applied: {
    label: 'Applied',
    bg:   'rgba(59,130,246,0.1)',
    text: '#60a5fa',
    ring: 'rgba(59,130,246,0.25)',
    dot:  '#3b82f6',
    glow: 'rgba(59,130,246,0.2)',
  },
  interviewing: {
    label: 'Interviewing',
    bg:   'rgba(139,92,246,0.1)',
    text: '#a78bfa',
    ring: 'rgba(139,92,246,0.25)',
    dot:  '#8b5cf6',
    glow: 'rgba(139,92,246,0.2)',
  },
  offer: {
    label: 'Offer',
    bg:   'rgba(16,185,129,0.1)',
    text: '#34d399',
    ring: 'rgba(16,185,129,0.25)',
    dot:  '#10b981',
    glow: 'rgba(16,185,129,0.25)',
  },
  rejected: {
    label: 'Rejected',
    bg:   'rgba(239,68,68,0.08)',
    text: '#f87171',
    ring: 'rgba(239,68,68,0.2)',
    dot:  '#ef4444',
    glow: 'rgba(239,68,68,0.15)',
  },
};

const FALLBACK = {
  label: '',
  bg:   'rgba(100,116,139,0.1)',
  text: '#94a3b8',
  ring: 'rgba(100,116,139,0.2)',
  dot:  '#64748b',
  glow: 'transparent',
};

export default function StatusBadge({ status }: Props) {
  const normalized = status.toLowerCase() as Status;
  const config = STATUS_CONFIG[normalized] ?? { ...FALLBACK, label: status };

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap select-none transition-all duration-300"
      style={{
        background: config.bg,
        color:      config.text,
        boxShadow:  `0 0 0 1px ${config.ring}, 0 2px 8px ${config.glow}`,
        letterSpacing: '0.02em',
      }}
    >
      <span className="relative flex h-1.5 w-1.5">
        {normalized !== 'rejected' && (
          <span
            className="absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{
              background: config.dot,
              animation: 'status-ping 1.8s ease-out infinite',
            }}
          />
        )}
        <span
          className="relative inline-flex rounded-full h-1.5 w-1.5"
          style={{ background: config.dot }}
        />
      </span>

      {config.label}
    </span>
  );
}
