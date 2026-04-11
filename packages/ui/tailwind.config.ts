import type { Config } from "tailwindcss";
import sharedConfig from "@repo/tailwind-config";

const config: Pick<Config, "prefix" | "presets" | "content"> = {
  content: [
    "./src/**/*.tsx",
    // If in apps/web, ensure you scan the UI package too:
    "../../packages/ui/src/**/*.tsx"
  ],
  presets: [sharedConfig],
};
export default config;