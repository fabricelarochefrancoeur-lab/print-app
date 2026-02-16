import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Haxrcorp"', "monospace"],
        serif: ['"Haxrcorp"', "monospace"],
        pixel: ['"Haxrcorp"', "monospace"],
        mono: ['"Haxrcorp"', "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
