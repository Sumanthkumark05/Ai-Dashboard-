"use client";

import * as React from "react";
import { MoreVertical, User, Trash2 } from "lucide-react";
import { TeamMember, UserRole } from "../types";
import { useTeamStore } from "@/stores/team-store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/display/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/display/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/forms/select";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/navigation/dropdown";
import { toast } from "@/components/feedback/toast";
import { getInitials } from "@/constants";

export interface MembersTableProps {
  members: TeamMember[];
}

export function MembersTable({ members }: MembersTableProps) {
  const { openProfileDrawer, updateMemberRole, removeMember } = useTeamStore();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member Name</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Last Active</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member: TeamMember) => {
          const initials = getInitials(member.name);

          return (
            <TableRow
              key={member.id}
              onClick={() => openProfileDrawer(member)}
              className="cursor-pointer group"
            >
              {/* Avatar, Name & Email */}
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  <Avatar size="sm" status={member.status}>
                    <AvatarImage src={member.avatarUrl} alt={member.name} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors block leading-tight">
                      {member.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{member.email}</span>
                  </div>
                </div>
              </TableCell>

              {/* Role Select Dropdown (Inline Role Management STEP 8) */}
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Select
                  value={member.role}
                  onValueChange={(val) => {
                    updateMemberRole(member.id, val as UserRole);
                    toast.success("Role updated", {
                      description: `Updated ${member.name}'s role to ${val}.`,
                    });
                  }}
                >
                  <SelectTrigger className="w-28 h-7 text-xs font-semibold">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value="Owner">Owner</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Member">Member</SelectItem>
                    <SelectItem value="Viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>

              {/* Department */}
              <TableCell className="text-xs text-muted-foreground">{member.department}</TableCell>

              {/* Status Indicator */}
              <TableCell>
                <Badge
                  variant={
                    member.status === "online"
                      ? "success"
                      : member.status === "busy"
                      ? "warning"
                      : "secondary"
                  }
                  size="sm"
                  className="capitalize text-[10px]"
                >
                  {member.status}
                </Badge>
              </TableCell>

              {/* Last Active */}
              <TableCell className="text-xs text-muted-foreground">{member.lastActive}</TableCell>

              {/* Dropdown Menu Actions */}
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      onClick={() => openProfileDrawer(member)}
                      className="cursor-pointer text-xs"
                    >
                      <User className="mr-2 h-3.5 w-3.5" />
                      <span>View Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        removeMember(member.id);
                        toast.info("Member removed", {
                          description: `${member.name} was removed from workspace.`,
                        });
                      }}
                      className="cursor-pointer text-xs text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      <span>Remove Member</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
