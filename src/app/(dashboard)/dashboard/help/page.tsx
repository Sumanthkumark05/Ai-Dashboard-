"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  BookOpen,
  ExternalLink,
  Search,
  Video,
  Users,
  Zap,
  Mail,
  MessageSquare,
  Globe,
  ChevronDown,
  ChevronRight,
  FileText,
  Code2,
  PlayCircle,
  Star,
  ArrowRight,
  CheckCircle2,
  Clock,
  Bot,
  Shield,
  Headphones,
} from "lucide-react";



import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/* ─────────────────────────── DATA ─────────────────────────── */

const SUPPORT_CARDS = [
  {
    id: "docs",
    icon: BookOpen,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    iconBg: "bg-blue-500/10 group-hover:bg-blue-500 group-hover:text-white",
    title: "API & SDK Documentation",
    description:
      "Explore comprehensive guides for integrating NeuroDesk AI models and agentic workflows into your applications.",
    label: "Read Docs",
    badge: "Updated",
    badgeColor: "bg-blue-500/15 text-blue-400",
  },
  {
    id: "support",
    icon: Headphones,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
    iconBg: "bg-violet-500/10 group-hover:bg-violet-500 group-hover:text-white",
    title: "24/7 Enterprise Support",
    description:
      "Get instant help from our AI ops engineering team. Dedicated response SLA: < 15 minutes.",
    label: "Contact Support",
    badge: "< 15 min SLA",
    badgeColor: "bg-violet-500/15 text-violet-400",
  },
  {
    id: "tutorials",
    icon: Video,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    iconBg:
      "bg-emerald-500/10 group-hover:bg-emerald-500 group-hover:text-white",
    title: "Video Tutorials",
    description:
      "Step-by-step video walkthroughs for building AI pipelines, dataset management and model fine-tuning.",
    label: "View Tutorials",
    badge: "42 Videos",
    badgeColor: "bg-emerald-500/15 text-emerald-400",
  },
  {
    id: "community",
    icon: Users,
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
    iconBg:
      "bg-orange-500/10 group-hover:bg-orange-500 group-hover:text-white",
    title: "Community Forum",
    description:
      "Connect with thousands of engineers and AI practitioners building on NeuroDesk. Share and learn.",
    label: "Join Community",
    badge: "12.4K Members",
    badgeColor: "bg-orange-500/15 text-orange-400",
  },
  {
    id: "notes",
    icon: FileText,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
    iconBg:
      "bg-yellow-500/10 group-hover:bg-yellow-500 group-hover:text-white",
    title: "Release Notes",
    description:
      "Stay current with the latest platform improvements, new model capabilities, and breaking-change notices.",
    label: "View Notes",
    badge: "v3.4.1",
    badgeColor: "bg-yellow-500/15 text-yellow-400",
  },
  {
    id: "status",
    icon: Shield,
    color: "text-teal-400",
    bg: "bg-teal-500/10 border-teal-500/20",
    iconBg: "bg-teal-500/10 group-hover:bg-teal-500 group-hover:text-white",
    title: "System Status",
    description:
      "Real-time operational status, historical uptime and incident post-mortems for all NeuroDesk services.",
    label: "View Status",
    badge: "All Systems OK",
    badgeColor: "bg-teal-500/15 text-teal-400",
  },
];

const QUICK_GUIDES = [
  {
    id: "qg1",
    icon: Zap,
    title: "Getting Started in 5 Minutes",
    steps: [
      "Create your workspace and set up an AI model",
      "Upload your first dataset",
      "Run a prompt pipeline via the AI Chat",
      "Export results to your team workspace",
    ],
  },
  {
    id: "qg2",
    icon: Code2,
    title: "Connecting the REST API",
    steps: [
      "Generate an API key from Settings → API Keys",
      "Install the NeuroDesk SDK: npm install @neurodesk/sdk",
      "Authenticate with your bearer token",
      "Call /api/v1/ai/chat with your payload",
    ],
  },
  {
    id: "qg3",
    icon: Bot,
    title: "AI Chat & Prompt Engineering",
    steps: [
      "Navigate to AI Chat in the sidebar",
      "Select your active workspace context",
      "Ask questions or stream prompts against your datasets",
      "Review response details in real time",
    ],
  },

];

const RESOURCES = [
  {
    id: "r1",
    icon: BookOpen,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    title: "Full Documentation",
    items: ["Quickstart Guide", "API Reference", "SDK Reference", "Webhooks"],
    label: "View Docs",
  },
  {
    id: "r2",
    icon: PlayCircle,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    title: "Tutorials & Examples",
    items: [
      "RAG Pipeline Tutorial",
      "Agent Orchestration",
      "Dataset Prep Guide",
      "Model Evaluation",
    ],
    label: "View Tutorials",
  },
  {
    id: "r3",
    icon: FileText,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    title: "Release Notes",
    items: ["v3.4.1 – WebSocket Streaming", "v3.3 – RBAC Overhaul", "v3.2 – Analytics v2", "v3.1 – File Manager"],
    label: "View All Resources",
  },
];

const FAQS = [
  {
    id: "f1",
    question: "How do I reset my API key if it gets compromised?",
    answer:
      "Navigate to Settings → API Keys, find the key you want to rotate, click the ⋯ menu and choose Rotate. A new key is generated instantly and the old one is invalidated. Your integrations using the previous key will receive 401 responses.",
  },
  {
    id: "f2",
    question: "What is the rate limit on the AI Chat endpoint?",
    answer:
      "Rate limits depend on your plan tier. Enterprise plans receive 10,000 RPM. Pro plans 2,000 RPM. Free plans 100 RPM. All limits apply per API key. You can monitor usage in Analytics → API Usage.",
  },
  {
    id: "f3",
    question: "Can I use NeuroDesk models in my own application?",
    answer:
      "Yes. Use the REST API or official SDK (TypeScript, Python, Go). All inference endpoints are available at /api/v1/ai/*. Authentication requires a valid API key passed as a Bearer token.",
  },
  {
    id: "f4",
    question: "How does the fine-tuning pipeline handle data privacy?",
    answer:
      "Your training data is encrypted at rest (AES-256) and in transit (TLS 1.3). Training jobs run in isolated compute environments. Data is never used to train shared models. You retain full ownership and can delete at any time.",
  },
  {
    id: "f5",
    question: "What SLA does the 24/7 Enterprise Support provide?",
    answer:
      "P0 (system down) incidents receive a 15-minute first response. P1 incidents 2 hours. P2 within 8 business hours. All Enterprise plan holders get a dedicated Slack channel and named Customer Success Engineer.",
  },
];

const CHANNELS = [
  {
    id: "email",
    icon: Mail,
    title: "Email Support",
    description: "Detailed async help for non-urgent issues.",
    detail: "support@neurodesk.ai",
    label: "Email Support",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20 hover:border-blue-500/50",
  },
  {
    id: "chat",
    icon: MessageSquare,
    title: "Live Chat",
    description: "Instant messaging with our support engineers.",
    detail: "Average wait: < 2 min",
    label: "Live Chat",
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20 hover:border-violet-500/50",
  },
  {
    id: "community-ch",
    icon: Globe,
    title: "Community",
    description: "Peer-to-peer help from 12,000+ NeuroDesk builders.",
    detail: "forum.neurodesk.ai",
    label: "Visit Forum",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/50",
  },
];

/* ─────────────────────────── SUB-COMPONENTS ─────────────────────────── */

function FaqItem({
  item,
  index,
}: {
  item: (typeof FAQS)[0];
  index: number;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
    >
      <button
        id={`faq-trigger-${item.id}`}
        type="button"
        aria-expanded={open}
        aria-controls={`faq-panel-${item.id}`}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 rounded-xl border border-border bg-card text-left hover:border-primary/40 hover:bg-accent/30 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
      >
        <span className="text-sm font-semibold text-foreground leading-snug">
          {item.question}
        </span>
        <span className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary transition-transform duration-200">
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`faq-panel-${item.id}`}
            role="region"
            aria-labelledby={`faq-trigger-${item.id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="px-5 pt-2 pb-4 text-sm text-muted-foreground leading-relaxed">
              {item.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─────────────────────────── PAGE ─────────────────────────── */

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredFaqs = React.useMemo(
    () =>
      FAQS.filter(
        (f) =>
          f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.answer.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [searchQuery]
  );

  return (
    <div className="space-y-10 pb-16 max-w-6xl">
      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <HelpCircle className="h-4.5 w-4.5 text-primary" />
          </span>
          Help &amp; Knowledge Center
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          Documentation, tutorials, API reference, release notes, and direct
          technical support — everything you need to build with NeuroDesk AI.
        </p>
      </motion.div>

      {/* ── Search + Quick Links ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="space-y-3"
      >
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            id="help-search"
            type="search"
            placeholder="Search FAQs, guides, docs…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-all"
            aria-label="Search help documentation"
          />
        </div>

        {/* Quick link pills */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Quickstart", icon: Zap },
            { label: "API Reference", icon: Code2 },
            { label: "Tutorials", icon: PlayCircle },
            { label: "Release Notes", icon: FileText },
            { label: "Status Page", icon: Shield },
          ].map((pill) => (
            <button
              key={pill.label}
              type="button"
              aria-label={`Go to ${pill.label}`}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-accent/50 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
            >
              <pill.icon className="h-3 w-3" />
              {pill.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Support Cards Grid ── */}
      <section aria-label="Support resources">
        <h2 className="text-base font-semibold text-foreground mb-4">
          Resources &amp; Support
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SUPPORT_CARDS.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
              whileHover={{ y: -2 }}
            >
              <Card className="group p-5 h-full flex flex-col gap-4 hover:border-primary/40 hover:shadow-md transition-all duration-200">
                {/* Icon + Badge row */}
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={cn(
                      "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border transition-colors duration-200",
                      card.iconBg,
                      card.color
                    )}
                  >
                    <card.icon className="h-5 w-5" />
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide",
                      card.badgeColor
                    )}
                  >
                    {card.badge}
                  </span>
                </div>

                {/* Title + Desc */}
                <div className="flex-1 space-y-1.5">
                  <h3 className="text-sm font-semibold text-foreground leading-snug">
                    {card.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {card.description}
                  </p>
                </div>

                {/* CTA Button */}
                <Button
                  id={`help-card-btn-${card.id}`}
                  variant="outline"
                  size="sm"
                  aria-label={card.label}
                  className="self-start min-w-[120px] justify-center"
                  rightIcon={<ExternalLink className="h-3.5 w-3.5" />}
                >
                  {card.label}
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Quick-Start Guides ── */}
      <section aria-label="Quick start guides">
        <h2 className="text-base font-semibold text-foreground mb-4">
          Quick-Start Guides
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {QUICK_GUIDES.map((guide, i) => (
            <motion.div
              key={guide.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.06 }}
            >
              <Card className="group p-5 h-full flex flex-col gap-4 hover:border-primary/40 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                    <guide.icon className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground leading-snug">
                    {guide.title}
                  </h3>
                </div>

                <ol className="flex-1 space-y-2.5" aria-label={`Steps for ${guide.title}`}>
                  {guide.steps.map((step, si) => (
                    <li key={si} className="flex items-start gap-2.5">
                      <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-0.5">
                        {si + 1}
                      </span>
                      <span className="text-xs text-muted-foreground leading-relaxed">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>

                <Button
                  id={`guide-btn-${guide.id}`}
                  variant="outline"
                  size="sm"
                  aria-label={`View guide: ${guide.title}`}
                  className="self-start min-w-[110px] justify-center"
                  rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
                >
                  View Guide
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Resource Hub ── */}
      <section aria-label="Resource hub">
        <h2 className="text-base font-semibold text-foreground mb-4">
          Resource Hub
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {RESOURCES.map((res, i) => (
            <motion.div
              key={res.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.06 }}
            >
              <Card className="p-5 h-full flex flex-col gap-4 hover:border-primary/40 transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg",
                      res.bg,
                      res.color
                    )}
                  >
                    <res.icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {res.title}
                  </h3>
                </div>

                <ul className="flex-1 space-y-2" aria-label={res.title}>
                  {res.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-primary/60" />
                      <span className="text-xs text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  id={`resource-btn-${res.id}`}
                  variant="outline"
                  size="sm"
                  aria-label={res.label}
                  className="self-start min-w-[140px] justify-center"
                  rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                >
                  {res.label}
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Support Channels ── */}
      <section aria-label="Support channels">
        <h2 className="text-base font-semibold text-foreground mb-4">
          Contact Support
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {CHANNELS.map((ch, i) => (
            <motion.div
              key={ch.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.06 }}
            >
              <Card
                className={cn(
                  "group p-5 flex flex-col gap-4 border transition-all duration-200 cursor-pointer",
                  ch.bg
                )}
              >
                <div className="flex items-center gap-3">
                  <ch.icon className={cn("h-5 w-5 flex-shrink-0", ch.color)} />
                  <h3 className="text-sm font-semibold text-foreground">
                    {ch.title}
                  </h3>
                </div>
                <div className="flex-1 space-y-1.5">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {ch.description}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-muted-foreground/60" />
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {ch.detail}
                    </span>
                  </div>
                </div>
                <Button
                  id={`channel-btn-${ch.id}`}
                  variant="outline"
                  size="sm"
                  aria-label={ch.label}
                  className="self-start min-w-[120px] justify-center"
                >
                  {ch.label}
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FAQ Accordion ── */}
      <section aria-label="Frequently asked questions">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">
            Frequently Asked Questions
          </h2>
          {searchQuery && (
            <span className="text-xs text-muted-foreground">
              {filteredFaqs.length} result{filteredFaqs.length !== 1 ? "s" : ""}{" "}
              for &quot;{searchQuery}&quot;
            </span>
          )}
        </div>

        <div className="space-y-2">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, i) => (
              <FaqItem key={faq.id} item={faq} index={i} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No FAQs matched &quot;{searchQuery}&quot;
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Try different keywords or contact support.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Enterprise CTA Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="relative overflow-hidden p-6 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          {/* Decorative glow */}
          <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-400" />
                <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">
                  Enterprise Plan
                </span>
              </div>
              <h3 className="text-base font-bold text-foreground">
                Need a dedicated support engineer?
              </h3>
              <p className="text-sm text-muted-foreground">
                Enterprise customers get a named CSE, private Slack channel, and
                custom SLA agreements.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 flex-shrink-0">
              <Button
                id="help-enterprise-contact"
                variant="primary"
                size="md"
                aria-label="Contact enterprise sales"
                className="min-w-[140px] justify-center"
              >
                Contact Sales
              </Button>
              <Button
                id="help-enterprise-docs"
                variant="outline"
                size="md"
                aria-label="View enterprise documentation"
                className="min-w-[130px] justify-center"
                rightIcon={<ExternalLink className="h-3.5 w-3.5" />}
              >
                Enterprise Docs
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
