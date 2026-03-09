import type { Config } from "tailwindcss";

const config: Omit<Config, "content"> = {
  theme: {
    extend: {
      colors: {
        brand: "#0070f3",
      },
    },
  },
  plugins: [],
};
export default config;