import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// No ISR / revalidation in the demo: static pages ship as assets, the AI routes run on demand.
export default defineCloudflareConfig({});
