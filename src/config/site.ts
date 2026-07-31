export const siteConfig = {
  name: "NeuroDesk AI",
  description: "Enterprise-grade AI SaaS Platform & Intelligence Dashboard",
  url: "https://neurodesk.ai",
  ogImage: "https://neurodesk.ai/og.png",
  links: {
    github: "https://github.com/neurodesk/neurodesk-ai",
  },
} as const;

export type SiteConfig = typeof siteConfig;
