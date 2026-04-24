import { useState, useEffect, useRef } from 'react';

interface Props {
  isOpen:  boolean;
  onClose: () => void;
  onAdd:   (data: any) => Promise<void> | void;
}

const STATUS_OPTIONS = [
  { value: 'applied',      label: 'Applied',      color: '#3b82f6' },
  { value: 'interviewing', label: 'Interviewing', color: '#8b5cf6' },
  { value: 'offer',        label: 'Offer',        color: '#10b981' },
  { value: 'rejected',     label: 'Rejected',     color: '#ef4444' },
];

const WORK_OPTIONS = [
  { value: 'remote', label: 'Remote' },
  { value: 'onsite', label: 'On-site' },
  { value: 'hybrid', label: 'Hybrid' },
];

const INITIAL_FORM = { companyName: '', role: '', status: 'applied', workModel: 'remote' };

function Field({
  label, value, onChange, placeholder, error,
}: {
  label: string; value: string;
  onChange: (v: string) => void;
  placeholder?: string; error?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 tracking-wide"
        style={{ color: focused ? '#60a5fa' : '#64748b', transition: 'color .15s' }}>
        {label}
      </label>
      <input
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200"
        style={{
          background: 'rgba(6,10,16,0.8)',
          border:     error
            ? '1px solid rgba(239,68,68,0.4)'
            : focused
            ? '1px solid rgba(59,130,246,0.45)'
            : '1px solid rgba(255,255,255,0.08)',
          color:      '#f1f5f9',
          outline:    'none',
          boxShadow:  focused && !error ? '0 0 0 3px rgba(59,130,246,0.1)' : 'none',
        }}
      />
      {error && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{error}</p>}
    </div>
  );
}

function SegmentGroup<T extends string>({
  label, options, value, onChange,
}: {
  label: string;
  options: { value: T; label: string; icon: string; color?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: '#64748b' }}>
        {label}
      </label>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
        {options.map(opt => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className="flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95"
              style={{
                background: active ? `${opt.color ?? '#3b82f6'}15` : 'rgba(255,255,255,0.03)',
                border:     active ? `1px solid ${opt.color ?? '#3b82f6'}35` : '1px solid rgba(255,255,255,0.06)',
                color:      active ? (opt.color ?? '#60a5fa') : '#64748b',
                boxShadow:  active ? `0 0 12px ${opt.color ?? '#3b82f6'}18` : 'none',
              }}
            >
              <span className="text-base">{opt.icon}</span>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AddApplicationModal({ isOpen, onClose, onAdd }: Props) {
  const [form,    setForm]    = useState(INITIAL_FORM);
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const panelRef  = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      const { animate } = await import('animejs');
      if(!backdropRef.current) return;
      animate(backdropRef.current, {
        opacity:  [0, 1],
        duration: 200,
        easing:   'linear',
      });
      if(!panelRef.current) return;
      animate(panelRef.current, {
        opacity:    [0, 1],
        scale:      [0.93, 1],
        translateY: [16, 0],
        duration:   350,
        easing:     'cubicBezier(.16,1,.3,1)',
      });
    })();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  const handleClose = async () => {
    const { animate } = await import('animejs');
    if (!panelRef.current) return;
    await animate(panelRef.current, {
      opacity:    [1, 0],
      scale:      [1, 0.95],
      translateY: [0, 12],
      duration:   200,
      easing:     'easeInCubic',
      complete: () => {
        onClose();
        setForm(INITIAL_FORM);
        setErrors({});
      },
    });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.companyName.trim()) errs.companyName = 'Company name is required';
    if (!form.role.trim())        errs.role        = 'Role is required';
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      await onAdd(form);
      handleClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(2,4,6,0.8)', backdropFilter: 'blur(8px)', opacity: 0 }}
      onClick={e => { if (e.target === backdropRef.current) handleClose(); }}
    >
      <div
        ref={panelRef}
        className="relative w-full max-w-md rounded-2xl overflow-hidden"
        style={{ opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute -inset-px rounded-2xl pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(139,92,246,0.15), rgba(59,130,246,0.1))',
          }}
        />

        <div
          className="relative rounded-2xl p-6"
          style={{
            background: 'rgba(8,12,20,0.97)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06) inset',
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white">Add Application</h2>
              <p className="text-xs text-slate-500 mt-0.5">Track a new job application</p>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#64748b',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <Field
              label="Company Name"
              value={form.companyName}
              onChange={v => { setForm(f => ({ ...f, companyName: v })); setErrors(e => ({ ...e, companyName: '' })); }}
              placeholder="e.g. Stripe, Notion, Linear"
              error={errors.companyName}
            />
            <Field
              label="Role / Position"
              value={form.role}
              onChange={v => { setForm(f => ({ ...f, role: v })); setErrors(e => ({ ...e, role: '' })); }}
              placeholder="e.g. Senior Frontend Engineer"
              error={errors.role}
            />

            <SegmentGroup
              label="Status"
              options={STATUS_OPTIONS as any}
              value={form.status as any}
              onChange={v => setForm(f => ({ ...f, status: v }))}
            />

            <SegmentGroup
              label="Work Model"
              options={WORK_OPTIONS as any}
              value={form.workModel as any}
              onChange={v => setForm(f => ({ ...f, workModel: v }))}
            />
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-5"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95"
              style={{
                background: 'rgba(255,255,255,0.04)',
                color: '#64748b',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: '#fff',
                boxShadow: '0 2px 12px rgba(59,130,246,0.4)',
              }}
            >
              {submitting && (
                <svg className="animate-spin-slow" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
                  <path d="M7 2a5 5 0 0 1 5 5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
              {submitting ? 'Adding…' : 'Add Application'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
