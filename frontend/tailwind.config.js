/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Geist', 'system-ui', 'sans-serif'],
        mono:    ['DM Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        brand: {
          blue:    '#3b82f6',
          violet:  '#8b5cf6',
          teal:    '#14b8a6',
          emerald: '#10b981',
        },
        bg: {
          void:    '#020406',
          base:    '#060a10',
          surface: '#0c1220',
          elevated:'#111827',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':  'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      animation: {
        'fade-up':    'fadeUp .6s cubic-bezier(.16,1,.3,1) both',
        'fade-in':    'fadeIn .4s ease both',
        'modal-pop':  'modal-pop .35s cubic-bezier(.16,1,.3,1) both',
        'spin-slow':  'spin-slow 1s linear infinite',
        'orb-pulse':  'orb-pulse 8s ease-in-out infinite',
        'float':      'float 4s ease-in-out infinite',
        'shimmer':    'shimmer 1.6s linear infinite',
        'grain':      'grain 8s steps(10) infinite',
      },
      keyframes: {
        fadeUp:     { from:{opacity:'0',transform:'translateY(24px)'}, to:{opacity:'1',transform:'translateY(0)'} },
        fadeIn:     { from:{opacity:'0'}, to:{opacity:'1'} },
        'modal-pop':{ '0%':{opacity:'0',transform:'scale(.93) translateY(16px)'}, '100%':{opacity:'1',transform:'scale(1) translateY(0)'} },
        'spin-slow':{ from:{transform:'rotate(0deg)'}, to:{transform:'rotate(360deg)'} },
        'orb-pulse':{ '0%,100%':{transform:'scale(1) translate(0,0)',opacity:'.6'}, '33%':{transform:'scale(1.08) translate(12px,-8px)',opacity:'.8'}, '66%':{transform:'scale(.95) translate(-8px,10px)',opacity:'.55'} },
        float:      { '0%,100%':{transform:'translateY(0)'}, '50%':{transform:'translateY(-8px)'} },
        shimmer:    { '0%':{backgroundPosition:'-600px 0'}, '100%':{backgroundPosition:'600px 0'} },
        grain:      { '0%,100%':{transform:'translate(0,0)'}, '10%':{transform:'translate(-5%,-10%)'}, '20%':{transform:'translate(-15%,5%)'}, '30%':{transform:'translate(7%,-25%)'}, '40%':{transform:'translate(-5%,25%)'}, '50%':{transform:'translate(-15%,10%)'}, '60%':{transform:'translate(15%,0%)'}, '70%':{transform:'translate(0%,15%)'}, '80%':{transform:'translate(3%,35%)'}, '90%':{transform:'translate(-10%,10%)'} },
      },
      boxShadow: {
        'glow-blue':   '0 0 60px rgba(59,130,246,.18), 0 0 120px rgba(59,130,246,.08)',
        'glow-violet': '0 0 60px rgba(139,92,246,.18), 0 0 120px rgba(139,92,246,.08)',
        'card':        '0 24px 64px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.05)',
        'card-hover':  '0 32px 80px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.08), 0 0 0 1px rgba(59,130,246,.2)',
      },
      backdropBlur: {
        xs: '4px',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(.16,1,.3,1)',
      }
    },
  },
  plugins: [],
}
