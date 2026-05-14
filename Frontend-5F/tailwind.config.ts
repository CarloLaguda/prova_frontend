import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/**/*.{html,ts}',
  ],
  theme: {
    extend: {
      animation: {
        'fade-down': 'slideDown 0.5s ease-out forwards',
        'slide-in-right': 'slideInRight 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        'slide-out-right': 'slideOutRight 0.3s cubic-bezier(0.55, 0, 0.1, 1) forwards',
        'sidebar-in': 'sidebarIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        'modal-pop': 'modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'settings-section-in': 'settingSectionIn 0.4s ease-out both',
      },
      keyframes: {
        slideDown: {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          'from': { opacity: '0', transform: 'translateX(40px)' },
          'to': { opacity: '1', transform: 'translateX(0)' },
        },
        slideOutRight: {
          'from': { opacity: '1', transform: 'translateX(0)' },
          'to': { opacity: '0', transform: 'translateX(40px)' },
        },
        sidebarIn: {
          'from': { transform: 'translateX(100%)' },
          'to': { transform: 'translateX(0)' },
        },
        modalPop: {
          'from': { opacity: '0', transform: 'scale(0.95) translateY(8px)' },
          'to': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        settingSectionIn: {
          'from': { opacity: '0', transform: 'translateX(16px)' },
          'to': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      transitionDelay: {
        's1': '0.1s',
        's2': '0.2s',
        's3': '0.3s',
        's4': '0.4s',
      },
      animationDelay: {
        '1': '0.08s',
        '2': '0.16s',
        '3': '0.24s',
        '4': '0.32s',
        's1': '0.1s',
        's2': '0.2s',
        's3': '0.3s',
        's4': '0.4s',
      },
    },
  },
  plugins: [],
} satisfies Config;
