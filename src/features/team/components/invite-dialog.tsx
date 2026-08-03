"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, X } from "lucide-react";

import { useTeamStore } from "@/stores/team-store";
import { UserRole, Department } from "../types";
import { Label } from "@/components/forms/label";
import { Input } from "@/components/forms/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/forms/select";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/feedback/toast";

const inviteSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  role: z.enum(["Owner", "Admin", "Manager", "Member", "Viewer"]),
  department: z.enum(["Engineering", "Design", "Product", "Growth", "Finance"]),
});

type InviteFormData = z.infer<typeof inviteSchema>;

export function InviteDialog() {
  const { isInviteOpen, closeInviteDialog, inviteMember } = useTeamStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "Member",
      department: "Engineering",
    },
  });

  const selectedRole = watch("role");
  const selectedDepartment = watch("department");

  if (!isInviteOpen) return null;

  const onSubmit = async (data: InviteFormData) => {
    setIsSubmitting(true);
    try {
      await inviteMember(data.email, data.role as UserRole, "default");
      toast.success("Invitation sent", {
        description: `Workspace invite email delivered to ${data.email}.`,
      });
      reset();
      closeInviteDialog();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not deliver invite to specified email.";
      toast.error("Failed to send invitation", {
        description: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeInviteDialog}
          className="fixed inset-0 bg-background/80 backdrop-blur-xs"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl z-10 space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                <UserPlus className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Invite Workspace Member</h3>
                <p className="text-xs text-muted-foreground">Grant team permissions and role access</p>
              </div>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={closeInviteDialog} className="rounded-lg">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label required>Full Name</Label>
              <Input
                {...register("name")}
                placeholder="e.g. David Kim"
                className="h-9 text-xs"
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <Label required>Email Address</Label>
              <Input
                {...register("email")}
                type="email"
                placeholder="e.g. david.kim@neurodesk.ai"
                className="h-9 text-xs"
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            {/* Role & Department Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label required>Role (RBAC)</Label>
                <Select value={selectedRole} onValueChange={(val) => setValue("role", val as UserRole)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Owner">Owner</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Member">Member</SelectItem>
                    <SelectItem value="Viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label required>Department</Label>
                <Select
                  value={selectedDepartment}
                  onValueChange={(val) => setValue("department", val as Department)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Product">Product</SelectItem>
                    <SelectItem value="Growth">Growth</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
              <Button type="button" variant="outline" size="sm" onClick={closeInviteDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                leftIcon={<UserPlus className="h-4 w-4" />}
              >
                Send Invitation
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
