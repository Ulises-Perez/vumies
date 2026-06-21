/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ===== Tokens shadcn/ui (valores OKLCH estilo ritup: negro+violeta) =====
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'oklch(var(--ring) / <alpha-value>)',
        background: 'oklch(var(--background) / <alpha-value>)',
        foreground: 'oklch(var(--foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'oklch(var(--primary) / <alpha-value>)',
          foreground: 'oklch(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'oklch(var(--secondary) / <alpha-value>)',
          foreground: 'oklch(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'oklch(var(--muted) / <alpha-value>)',
          foreground: 'oklch(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'oklch(var(--accent) / <alpha-value>)',
          foreground: 'oklch(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'oklch(var(--destructive) / <alpha-value>)',
          foreground: 'oklch(var(--destructive-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'oklch(var(--popover) / <alpha-value>)',
          foreground: 'oklch(var(--popover-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'oklch(var(--card) / <alpha-value>)',
          foreground: 'oklch(var(--card-foreground) / <alpha-value>)',
        },
        sidebar: {
          DEFAULT: 'oklch(var(--sidebar) / <alpha-value>)',
          foreground: 'oklch(var(--sidebar-foreground) / <alpha-value>)',
          primary: 'oklch(var(--sidebar-primary) / <alpha-value>)',
          'primary-foreground': 'oklch(var(--sidebar-primary-foreground) / <alpha-value>)',
          accent: 'oklch(var(--sidebar-accent) / <alpha-value>)',
          'accent-foreground': 'oklch(var(--sidebar-accent-foreground) / <alpha-value>)',
          border: 'var(--sidebar-border)',
          ring: 'oklch(var(--sidebar-ring) / <alpha-value>)',
        },

        // ===== Compatibilidad con clases legacy (repuntadas al tema shadcn) =====
        // `dark` se reasigna a la escala negro-violeta para que bg-dark / from-dark /
        // via-dark/40 sigan funcionando con el nuevo look.
        dark: {
          DEFAULT: 'oklch(var(--background) / <alpha-value>)',
          50: 'oklch(var(--accent) / <alpha-value>)',
          100: 'oklch(var(--card) / <alpha-value>)',
          200: 'oklch(var(--popover) / <alpha-value>)',
          300: 'oklch(var(--background) / <alpha-value>)',
          400: 'oklch(0.12 0.004 285 / <alpha-value>)',
          500: 'oklch(0.10 0.004 285 / <alpha-value>)',
          600: 'oklch(0.08 0.004 285 / <alpha-value>)',
        },
      },
      borderRadius: {
        sm: 'calc(var(--radius) - 4px)',
        md: 'calc(var(--radius) - 2px)',
        lg: 'var(--radius)',
        xl: 'calc(var(--radius) + 4px)',
      },
      fontFamily: {
        // Inter como fuente shadcn. `poppins` se remapea a Inter para no tocar cada heading.
        sans: ['Inter', 'system-ui', 'sans-serif'],
        poppins: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
