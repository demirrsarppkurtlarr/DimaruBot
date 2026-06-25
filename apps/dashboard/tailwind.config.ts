import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        neonBlue: '#00F0FF',
        neonPurple: '#B829DD',
        dark: '#0B0C15',
        panel: '#12131D',
      },
    },
  },
  plugins: [],
};

export default config;
