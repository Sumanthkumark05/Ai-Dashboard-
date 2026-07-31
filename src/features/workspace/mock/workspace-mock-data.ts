import { WorkspaceFolder, WorkspacePage, WorkspaceActivity } from "../types";

export const initialWorkspaceFolders: WorkspaceFolder[] = [
  { id: "fld_1", name: "Product Engineering", icon: "🚀", isExpanded: true },
  { id: "fld_2", name: "AI Architecture", icon: "⚡", isExpanded: true },
  { id: "fld_3", name: "Design System", icon: "🎨", isExpanded: false },
];

export const initialWorkspacePages: WorkspacePage[] = [
  {
    id: "pg_1",
    title: "AGY Multi-Agent SDK Architecture",
    icon: "📄",
    folderId: "fld_2",
    content: `<h1>AGY Multi-Agent SDK Architecture</h1>
<p>The Google Antigravity (AGY) SDK enables autonomous multi-agent orchestration across background subagents and tools.</p>
<h2>Key Capabilities</h2>
<ul>
  <li>Autonomous goal decomposition with recursive subagent delegation.</li>
  <li>Strict execution sandboxing and terminal safety.</li>
  <li>Real-time telemetry event streaming and persistent memory context.</li>
</ul>
<blockquote>"Build robust agentic loops with verifiable evaluation criteria."</blockquote>
<pre><code>import { Agent, Tool } from "@google/antigravity-sdk";

const agent = new Agent({
  name: "AntigravityOrchestrator",
  capabilities: ["code_search", "file_edit", "terminal"]
});</code></pre>`,
    createdBy: "Alex Vance",
    createdDate: "2026-07-20",
    updatedDate: "10 mins ago",
    tags: ["AGY SDK", "Architecture", "AI"],
    isFavourite: true,
    isPinned: true,
    wordCount: 142,
    readingTime: "1 min read",
  },
  {
    id: "pg_2",
    title: "DeepSeek R1 Prompt Engineering Strategy",
    icon: "🧠",
    folderId: "fld_2",
    content: `<h1>DeepSeek R1 Reasoning Strategy</h1>
<p>DeepSeek R1 provides step-by-step chain of thought reasoning for enterprise code refactoring.</p>
<h2>Best Practices</h2>
<ol>
  <li>Provide explicit inputs, outputs, and constraints.</li>
  <li>Use step-by-step reasoning tokens before generating code output.</li>
</ol>`,
    createdBy: "Sarah Chen",
    createdDate: "2026-07-22",
    updatedDate: "2 hours ago",
    tags: ["Prompt Engineering", "DeepSeek", "LLM"],
    isFavourite: true,
    isPinned: false,
    wordCount: 88,
    readingTime: "1 min read",
  },
  {
    id: "pg_3",
    title: "Tailwind CSS & Shadcn Design System Tokens",
    icon: "🎨",
    folderId: "fld_3",
    content: `<h1>Design System Tokens</h1>
<p>NeuroDesk AI relies on semantic HSL color tokens defined in <code>globals.css</code>.</p>
<h2>Color Tokens</h2>
<ul>
  <li>Primary: <code>hsl(var(--primary))</code></li>
  <li>Destructive: <code>hsl(var(--destructive))</code></li>
  <li>Muted: <code>hsl(var(--muted))</code></li>
</ul>`,
    createdBy: "Elena Rostova",
    createdDate: "2026-07-15",
    updatedDate: "Yesterday at 4:30 PM",
    tags: ["Design System", "Tailwind", "CSS"],
    isFavourite: false,
    isPinned: false,
    wordCount: 64,
    readingTime: "1 min read",
  },
  {
    id: "pg_4",
    title: "Q3 Engineering Sprint Notes",
    icon: "📌",
    folderId: "fld_1",
    content: `<h1>Q3 Sprint Notes</h1>
<p>Engineering priorities for Next.js 15 App Router migration and Recharts telemetry integration.</p>`,
    createdBy: "Marcus Brody",
    createdDate: "2026-07-25",
    updatedDate: "Jul 25 at 11:00 AM",
    tags: ["Sprint", "Roadmap"],
    isFavourite: false,
    isPinned: false,
    wordCount: 32,
    readingTime: "1 min read",
  },
];

export const initialWorkspaceActivities: WorkspaceActivity[] = [
  { id: "act_1", action: "edited page content", user: "Alex Vance", timestamp: "10 mins ago", pageTitle: "AGY Multi-Agent SDK Architecture" },
  { id: "act_2", action: "created new document", user: "Sarah Chen", timestamp: "2 hours ago", pageTitle: "DeepSeek R1 Prompt Engineering Strategy" },
  { id: "act_3", action: "added tags [Design System]", user: "Elena Rostova", timestamp: "Yesterday", pageTitle: "Tailwind CSS & Shadcn Design System Tokens" },
];
