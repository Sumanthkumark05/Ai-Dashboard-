"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X, FolderPlus, Shield, Users, Calendar, Building2, UserCheck } from "lucide-react";
import { useWorkspaceContextStore } from "@/stores/workspace-context-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/forms/input";
import { toast } from "@/components/feedback/toast";
import { WorkspaceVisibility } from "@/services/workspace-api";

const ICON_OPTIONS = ["💼", "🚀", "🧪", "⚡", "📁", "🧠", "🎯", "🔒", "🌐", "💡"];
const COLOR_OPTIONS = ["#3B82F6", "#10B981", "#8B5CF6", "#EC4899", "#F59E0B", "#6366F1", "#06B6D4", "#64748B"];
const PLACEHOLDER_EXAMPLES = ["Marketing Team", "AI Research", "Client Redesign Project", "Internal Dashboard"];

export function CreateWorkspaceModal() {
  const router = useRouter();
  const {
    isCreateModalOpen,
    setCreateModalOpen,
    createWorkspace,
    workspaces,
    fetchWorkspaces,
    setCurrentWorkspace,
  } = useWorkspaceContextStore();

  const [mounted, setMounted] = React.useState(false);

  // Project Type ("internal" | "client")
  const [projectType, setProjectType] = React.useState<"internal" | "client">("internal");

  // Basic Workspace Fields
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [icon, setIcon] = React.useState("💼");
  const [color, setColor] = React.useState("#3B82F6");
  const [visibility, setVisibility] = React.useState<WorkspaceVisibility>("private");

  // Conditional Client Information Fields
  const [clientName, setClientName] = React.useState("");
  const [clientDemoDate, setClientDemoDate] = React.useState("");
  const [internalReviewDate, setInternalReviewDate] = React.useState("");
  const [finalDeliveryDate, setFinalDeliveryDate] = React.useState("");
  const [priority, setPriority] = React.useState("medium");

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [touched, setTouched] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Body Scroll Lock & ESC Key Listener
  React.useEffect(() => {
    if (!isCreateModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCreateModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCreateModalOpen, setCreateModalOpen]);

  const randomPlaceholder = React.useMemo(() => {
    return projectType === "client" ? "e.g. Acme Mobile App Rebuild" : `e.g. ${PLACEHOLDER_EXAMPLES[0]}`;
  }, [projectType]);

  // Reset form when modal opens
  React.useEffect(() => {
    if (isCreateModalOpen) {
      setProjectType("internal");
      setName("");
      setDescription("");
      setIcon("💼");
      setColor("#3B82F6");
      setVisibility("private");
      setClientName("");
      setClientDemoDate("");
      setInternalReviewDate("");
      setFinalDeliveryDate("");
      setPriority("medium");
      setIsSubmitting(false);
      setTouched(false);
    }
  }, [isCreateModalOpen]);

  const trimmedName = name.trim();

  const nameError = React.useMemo(() => {
    if (!touched && trimmedName.length === 0) return null;
    if (trimmedName.length === 0) return "Workspace name is required";
    if (trimmedName.length < 2) return "Workspace name must be at least 2 characters";
    if (trimmedName.length > 60) return "Workspace name cannot exceed 60 characters";
    return null;
  }, [touched, trimmedName]);

  const clientNameError = React.useMemo(() => {
    if (projectType !== "client") return null;
    if (!touched && !clientName.trim()) return null;
    if (!clientName.trim()) return "Client name is required for client projects";
    return null;
  }, [projectType, touched, clientName]);

  const clientDemoDateError = React.useMemo(() => {
    if (projectType !== "client") return null;
    if (!touched && !clientDemoDate) return null;
    if (!clientDemoDate) return "Client demo date is required for client projects";
    return null;
  }, [projectType, touched, clientDemoDate]);

  const isFormValid = React.useMemo(() => {
    if (trimmedName.length < 2 || trimmedName.length > 60) return false;
    if (projectType === "client") {
      if (!clientName.trim() || !clientDemoDate) return false;
    }
    return true;
  }, [trimmedName, projectType, clientName, clientDemoDate]);

  const slugPreview = React.useMemo(() => {
    return (
      trimmedName
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "") || "my-workspace"
    );
  }, [trimmedName]);

  if (!mounted || !isCreateModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const payload = {
        name: trimmedName,
        description: description.trim() || undefined,
        icon,
        color,
        theme_color: color,
        visibility,
        slug: slugPreview,
        project_type: projectType,
        client_name: projectType === "client" ? (clientName.trim() || undefined) : undefined,
        project_name: trimmedName,
        client_demo_date: projectType === "client" ? (clientDemoDate || undefined) : undefined,
        internal_review_date: projectType === "client" ? (internalReviewDate || undefined) : undefined,
        final_delivery_date: projectType === "client" ? (finalDeliveryDate || undefined) : undefined,
        priority: projectType === "client" ? priority : undefined,
      };

      console.log("[CreateWorkspace] Submitting payload:", payload);

      const created = await createWorkspace(payload);

      console.log("[CreateWorkspace] Success. Created workspace:", created);

      // 1. Close modal
      setCreateModalOpen(false);

      // 2. Show success toast
      toast.success("Workspace Created!", {
        description: projectType === "client"
          ? `'${created.name}' created — calendar events auto-synced.`
          : `'${created.name}' created successfully.`,
      });

      // 3. Dispatch global sync events so Dashboard/Analytics/Calendar refresh
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("neurodesk:calendar_changed"));
        window.dispatchEvent(new Event("neurodesk:data_changed"));
        window.dispatchEvent(new CustomEvent("neurodesk:workspace_changed", { detail: { workspace: created } }));
      }

      // 4. Refresh the workspace list and set newly created as active
      await fetchWorkspaces();
      if (created?.id) {
        await setCurrentWorkspace(created.id);
      }

      // 5. Navigate to workspace manager to see the new workspace
      router.push("/dashboard/workspace-manager");
    } catch (err: unknown) {
      console.error("[CreateWorkspace] Error creating workspace:", err);
      const message = err instanceof Error ? err.message : "Could not create workspace. Please check backend connection.";
      toast.error("Workspace Creation Failed", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div
      tabIndex={-1}
      aria-modal="true"
      role="dialog"
      aria-labelledby="create-workspace-dialog-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-xs select-none animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setCreateModalOpen(false);
        }
      }}
    >
      <div
        className="relative w-full max-w-lg sm:max-w-xl md:max-w-[640px] lg:max-w-[700px] max-h-[90vh] my-auto rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh]">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/20 shrink-0">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl shadow-xs"
                style={{ backgroundColor: `${color}20`, borderColor: `${color}40`, borderWidth: 1 }}
              >
                {icon}
              </div>
              <div>
                <h2 id="create-workspace-dialog-title" className="text-base font-bold text-foreground leading-snug">
                  Create Workspace
                </h2>
                <p className="text-xs text-muted-foreground">Setup tenant workspace details and optional client timeline scheduling.</p>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setCreateModalOpen(false)}
              className="text-muted-foreground hover:text-foreground rounded-lg shrink-0"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Form Content Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 max-h-[calc(90vh-140px)]">
            {/* Project Type Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Project Type <span className="text-destructive">*</span></span>
                <span className="text-[10px] font-mono text-muted-foreground uppercase">{projectType}</span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setProjectType("internal")}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    projectType === "internal"
                      ? "border-primary bg-primary/10 ring-1 ring-primary shadow-xs"
                      : "border-border hover:bg-accent/40"
                  }`}
                >
                  <Building2 className={`h-5 w-5 shrink-0 mt-0.5 ${projectType === "internal" ? "text-primary" : "text-muted-foreground"}`} />
                  <div>
                    <div className="text-xs font-bold text-foreground">Internal Project</div>
                    <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                      Team collaboration &amp; internal tasks. No client dates.
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setProjectType("client")}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    projectType === "client"
                      ? "border-primary bg-primary/10 ring-1 ring-primary shadow-xs"
                      : "border-border hover:bg-accent/40"
                  }`}
                >
                  <UserCheck className={`h-5 w-5 shrink-0 mt-0.5 ${projectType === "client" ? "text-primary" : "text-muted-foreground"}`} />
                  <div>
                    <div className="text-xs font-bold text-foreground">Client Project</div>
                    <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                      Client-facing project with demo, review, and deadline dates.
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Workspace Name */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="workspace-name-field" className="text-xs font-semibold text-foreground">
                  Workspace Name <span className="text-destructive">*</span>
                </label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {trimmedName.length}/60
                </span>
              </div>

              <Input
                id="workspace-name-field"
                name="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!touched) setTouched(true);
                }}
                placeholder={randomPlaceholder}
                autoFocus
                maxLength={60}
                error={nameError ? nameError : undefined}
              />

              {isFormValid && (
                <p className="text-[10px] text-muted-foreground">
                  URL slug: <code className="font-mono text-primary">/{slugPreview}</code>
                </p>
              )}
            </div>

            {/* Icon & Color Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Icon</label>
                <div className="flex flex-wrap gap-1">
                  {ICON_OPTIONS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setIcon(item)}
                      className={`h-7 w-7 rounded-md text-xs flex items-center justify-center border transition-all cursor-pointer ${
                        icon === item ? "border-primary bg-primary/10 shadow-xs" : "border-border hover:bg-accent"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Color</label>
                <div className="flex items-center gap-1.5 pt-1">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-5 w-5 rounded-full border-2 transition-transform cursor-pointer ${
                        color === c ? "border-foreground scale-110 shadow-sm" : "border-transparent opacity-80"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label htmlFor="workspace-desc-field" className="text-xs font-semibold text-foreground">Description (Optional)</label>
              <textarea
                id="workspace-desc-field"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this workspace used for?"
                rows={2}
                maxLength={500}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>

            {/* Visibility Option */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Visibility</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVisibility("private")}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    visibility === "private" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-accent/40"
                  }`}
                >
                  <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-foreground">Private</div>
                    <div className="text-[10px] text-muted-foreground">Only invited members access</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setVisibility("team")}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    visibility === "team" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-accent/40"
                  }`}
                >
                  <Users className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-foreground">Team</div>
                    <div className="text-[10px] text-muted-foreground">Accessible by team</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Expandable Client Information Section (Only for Client Projects) */}
            <AnimatePresence initial={false}>
              {projectType === "client" && (
                <motion.div
                  key="client-info-section"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 border-t border-border space-y-3 bg-accent/20 p-4 rounded-xl border border-primary/20">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold text-foreground">Client Information &amp; Calendar Auto-Sync</span>
                    </div>

                    {/* Client Name * */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground">
                        Client Name <span className="text-destructive">*</span>
                      </label>
                      <Input
                        value={clientName}
                        onChange={(e) => {
                          setClientName(e.target.value);
                          if (!touched) setTouched(true);
                        }}
                        placeholder="e.g. Acme Corp / Global Tech"
                        className="h-8 text-xs"
                        error={clientNameError ? clientNameError : undefined}
                      />
                    </div>

                    {/* Dates Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {/* Client Demo Date * */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-foreground">
                          Client Demo Date <span className="text-destructive">*</span>
                        </label>
                        <Input
                          type="date"
                          value={clientDemoDate}
                          onChange={(e) => {
                            setClientDemoDate(e.target.value);
                            if (!touched) setTouched(true);
                          }}
                          className="h-8 text-xs font-mono"
                          error={clientDemoDateError ? clientDemoDateError : undefined}
                        />
                      </div>

                      {/* Internal Review Date */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-foreground">Internal Review</label>
                        <Input
                          type="date"
                          value={internalReviewDate}
                          onChange={(e) => setInternalReviewDate(e.target.value)}
                          className="h-8 text-xs font-mono"
                        />
                      </div>

                      {/* Final Deadline */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-foreground">Final Deadline</label>
                        <Input
                          type="date"
                          value={finalDeliveryDate}
                          onChange={(e) => setFinalDeliveryDate(e.target.value)}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Buttons Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreateModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              disabled={!isFormValid || isSubmitting}
              leftIcon={!isSubmitting && <FolderPlus className="h-4 w-4" />}
            >
              Create Workspace
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
