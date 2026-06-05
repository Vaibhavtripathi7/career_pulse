import { useEffect, useRef, useState } from 'react';
import taskTracker from '../assets/icon_-task-tracking.png';
import autoSync from '../assets/auto_sync.png';
import visualAnlysis from '../assets/graph_icon.png';
import secure from '../assets/secure_icon.png';

const FEATURES = [
  { icon: autoSync, label: 'Auto-sync Gmail' },
  { icon: visualAnlysis, label: 'Visual analytics' },
  { icon: taskTracker, label: 'Status tracking' },
  { icon: secure, label: 'Secure & private' },
];

export default function Login() {
  const orbRef1  = useRef<HTMLDivElement>(null);
  const orbRef2  = useRef<HTMLDivElement>(null);
  const orbRef3  = useRef<HTMLDivElement>(null);
  const cardRef  = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    (async () => {
      const { animate } = await import('animejs');


      if (!cardRef.current) return ;
      animate(cardRef.current, {
        opacity:    [0, 1],
        translateY: [40, 0],
        scale:      [0.95, 1],
        duration:   900,
        easing:     'cubicBezier(.16,1,.3,1)',
      });

      if(!titleRef.current) return;
      animate(titleRef.current, {
        opacity:    [0, 1],
        translateY: [20, 0],
        duration:   700,
        delay:      200,
        easing:     'cubicBezier(.16,1,.3,1)',
      });

      if (!orbRef1.current) return;
      const orbAnim1 = animate(orbRef1.current, {
        translateX: [0, 60, -30, 0],
        translateY: [0, -40, 20, 0],
        scale:      [1, 1.15, 0.9, 1],
        duration:   12000,
        loop:       true,
        easing:     'easeInOutSine',
      });

      if (!orbRef2.current) return;
      const orbAnim2 = animate(orbRef2.current, {
        translateX: [0, -50, 40, 0],
        translateY: [0, 30, -50, 0],
        scale:      [1, 0.88, 1.1, 1],
        duration:   15000,
        loop:       true,
        delay:      2000,
        easing:     'easeInOutSine',
      });

      if(!orbRef3.current) return
      const orbAnim3 = animate(orbRef3.current, {
        translateX: [0, 30, -60, 0],
        translateY: [0, -60, 30, 0],
        scale:      [1, 1.2, 0.85, 1],
        duration:   18000,
        loop:       true,
        delay:      4000,
        easing:     'easeInOutSine',
      });

      animate('.feature-pill', {
        opacity:    [0, 1],
        translateY: [12, 0],
        delay:      (_, i) => 600 + i * 80,
        duration:   500,
        easing:     'cubicBezier(.16,1,.3,1)',
      });

      animate('.ambient-stat', {
        opacity:    [0, 1],
        translateY: [16, 0],
        delay:      (_, i) => 800 + i * 150,
        duration:   600,
        easing:     'cubicBezier(.16,1,.3,1)',
      });

      cleanup = () => {
        orbAnim1.pause();
        orbAnim2.pause();
        orbAnim3.pause();
      };
    })();

    return () => cleanup?.();
  }, []);

  const handleGoogleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
    }, 300);
  };

  return (
    <div className="noise relative min-h-screen bg-bg-void overflow-hidden flex items-center justify-center">

      <div className="absolute inset-0 pointer-events-none">
        <div
          ref={orbRef1}
          className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(99, 252, 249, 0.09) 0%, transparent 70%)',
            filter: 'blur(0px)',
          }}
        />
        <div
          ref={orbRef2}
          className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(138, 92, 246, 0.11) 0%, transparent 70%)',
          }}
        />
        <div
          ref={orbRef3}
          className="absolute top-1/2 right-1/4 w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(5, 184, 163, 0.04) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>


      <div
        ref={cardRef}
        className="relative z-10 w-full max-w-md mx-4 opacity-0"
      >
        <div
          className="absolute -inset-px rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(139,92,246,0.2), rgba(59,130,246,0.1))',
            filter: 'blur(1px)',
          }}
        />

        <div
          className="relative glass rounded-2xl p-8 sm:p-10"
          style={{ boxShadow: '0 32px 80px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.07)' }}
        >
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
              style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.15))',
                border: '1px solid rgba(254, 254, 254, 0.3)',
                boxShadow: '0 0 24px rgba(59,130,246,0.2)',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path
                  d="M2 14h4l3-8 4 16 3-10 3 6h7"
                  stroke="url(#pulse-grad)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <defs>
                  <linearGradient id="pulse-grad" x1="2" y1="14" x2="26" y2="14" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3b82f6" />
                    <stop offset="1" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <h1
              ref={titleRef}
              className="text-3xl font-bold tracking-tight opacity-0"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Career<span style={{
                background: 'linear-gradient(90deg, #00FF85, #6fffe9)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>Pulse</span>
            </h1>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
              Your intelligent job application tracker.<br />
            </p>
          </div>
          <div className="border-t border-white/[0.2] my-8" />

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full group relative flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 active:scale-[.97]"
            style={{
              background: loading ? 'rgba(255,255,255,0.85)' : '#ffffff',
              
              color: '#1e293b',
              boxShadow: loading
              
                ? 'none'
                : '0 4px 16px rgba(0,0,0,.4), 0 1px 0 rgba(255,255,255,.8) inset',
            }}
          >
            {loading ? (
              <svg className="animate-spin-slow" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#94a3b8" strokeWidth="3" strokeDasharray="32" strokeDashoffset="8"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {loading ? 'Connecting...' : 'Continue with Google'}

            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(0,0,0,.04), transparent)' }}
            />
          </button>

          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {FEATURES.map((f) => (
              <div
                key={f.label}
                className="feature-pill opacity-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: '#94a3b8',
                  height: '32px'
                }}
              >
                <img src={f.icon} alt="" className='w-4 h-4 object-contain opacity-80'
                style={{display: 'block'}}
                />
                <span className='leading-none'>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
        <div
              className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4"
            >
              <div
                className="flex items-center gap-2 rounded-full px-4 py-2"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    background: 'rgba(96,165,250,0.8)',
                    boxShadow: '0 0 10px rgba(96,165,250,0.45)',
                  }}
                />

                <p
                  className="text-[11px] sm:text-xs tracking-[0.01em]"
                  style={{
                    color: 'rgba(148,163,184,0.72)',
                  }}
                >
                  Cross-site cookies may be required for persistent login sessions
                </p>
              </div>
          </div>
    </div>
  );
}
