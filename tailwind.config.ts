import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "nexus-bg": "#EEEEEE",
        "nexus-primary": "#D4BEE4",
        "nexus-secondary": "#9B7EBD",
        "nexus-tertiary": "#552E78", // now 552E78
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms")({
      strategy: "class",
    })
  ],
};
export default config;
