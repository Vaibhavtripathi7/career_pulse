import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/authcontext';
import { useEffect, useRef } from 'react';

function LoadingScreen() {
  const logoRef = useRef<HTMLDivElement>(null);
  const barRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { animate } = await import('animejs');
      
      if(!logoRef.current) return;
      animate(logoRef.current, {
        opacity:  [0, 1],
        scale:    [0.8, 1],
        duration: 600,
        easing:   'cubicBezier(.16,1,.3,1)',
      });

      if(!barRef.current) return;
      animate(barRef.current, {
        width:    ['0%', '85%'],
        duration: 2200,
        easing:   'easeOutCubic',
      });
    })();
  }, []);

  return (
    <div className="min-h-screen bg-bg-void flex flex-col items-center justify-center gap-6">
      <div className="fixed top-0 left-0 right-0 h-0.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div
          ref={barRef}
          className="h-full rounded-full"
          style={{
            width: '0%',
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
            boxShadow: '0 0 8px rgba(59,130,246,0.6)',
          }}
        />
      </div>

      <div ref={logoRef} className="flex flex-col items-center gap-4 opacity-0">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center animate-float"
          style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.15))',
            border: '1px solid rgba(59,130,246,0.3)',
            boxShadow: '0 0 32px rgba(59,130,246,0.2)',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M2 14h4l3-8 4 16 3-10 3 6h7"
              stroke="url(#pr-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <defs>
              <linearGradient id="pr-grad" x1="2" y1="14" x2="26" y2="14" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3b82f6"/>
                <stop offset="1" stopColor="#8b5cf6"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        <p className="text-xs text-slate-600 tracking-widest uppercase">Verifying session…</p>
      </div>
    </div>
  );
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!user)     return <Navigate to="/login" replace />;

  return <>{children}</>;
}
