"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Phone, MapPin, FolderKanban, ShieldCheck } from "lucide-react";
import { useTeamStore } from "@/stores/team-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/display/avatar";
import { Separator } from "@/components/ui/separator";
import { getInitials } from "@/constants";

export function ProfileDrawer() {
  const { selectedMember, isProfileOpen, closeProfileDrawer } = useTeamStore();

  if (!selectedMember) return null;

  const initials = getInitials(selectedMember.name);

  return (
    <AnimatePresence>
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden select-none">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeProfileDrawer}
            className="fixed inset-0 bg-background/80 backdrop-blur-xs"
          />

          {/* Slide-over Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md border-l border-border bg-card p-6 shadow-2xl flex flex-col justify-between overflow-y-auto"
          >
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="uppercase text-[10px]">
                    {selectedMember.department}
                  </Badge>
                  <span className="text-xs text-muted-foreground">Member Profile</span>
                </div>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={closeProfileDrawer}
                  className="h-8 w-8 p-0"
                  aria-label="Close drawer"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Profile Avatar Header */}
              <div className="flex flex-col items-center text-center mb-6">
                <Avatar size="xl" status={selectedMember.status} className="mb-3">
                  <AvatarImage src={selectedMember.avatarUrl} alt={selectedMember.name} />
                  <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                </Avatar>
                <h3 className="text-lg font-bold text-foreground">{selectedMember.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="success" size="sm" className="gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    <span>{selectedMember.role}</span>
                  </Badge>
                  <span className="text-xs text-muted-foreground">• Joined {selectedMember.joinedDate}</span>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Contact Information */}
              <div className="space-y-3 text-xs mb-6">
                <h4 className="font-semibold text-foreground text-sm">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-foreground font-medium">{selectedMember.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-foreground font-medium">{selectedMember.phone}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-foreground font-medium">{selectedMember.location}</span>
                  </div>
                </div>
              </div>

              {/* Bio & Skills */}
              <div className="space-y-3 text-xs mb-6">
                <h4 className="font-semibold text-foreground text-sm">About</h4>
                <p className="text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-md border border-border">
                  {selectedMember.bio}
                </p>

                <div>
                  <span className="font-semibold text-foreground block mb-2">Skills & Expertise</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedMember.skills.map((skill, idx) => (
                      <Badge key={idx} variant="outline" size="sm" className="text-[10px]">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Assigned Projects */}
              {selectedMember.projects && selectedMember.projects.length > 0 && (
                <div className="space-y-2 text-xs">
                  <h4 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                    <FolderKanban className="h-4 w-4 text-primary" />
                    <span>Assigned Projects</span>
                  </h4>
                  <div className="space-y-1.5">
                    {selectedMember.projects.map((proj, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border border-border bg-muted/20 flex items-center justify-between"
                      >
                        <span className="font-medium text-foreground">{proj}</span>
                        <Badge variant="success" size="sm" className="text-[10px]">
                          Active
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-border text-center text-xs text-muted-foreground">
              NeuroDesk RBAC Enterprise Identity
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
