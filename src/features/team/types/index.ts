export type UserRole = "Owner" | "Admin" | "Manager" | "Member" | "Viewer";

export type UserStatus = "online" | "away" | "busy" | "offline";

export type Department = "Engineering" | "Design" | "Product" | "Growth" | "Finance";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: Department;
  status: UserStatus;
  phone: string;
  location: string;
  skills: string[];
  bio: string;
  joinedDate: string;
  lastActive: string;
  avatarUrl?: string;
  projects: string[];
}

export interface TeamActivity {
  id: string;
  user: string;
  avatarUrl?: string;
  description: string;
  timestamp: string;
  type: "member_joined" | "role_updated" | "workspace_created" | "file_uploaded" | "ai_chat" | "invite_accepted";
}

export interface AssignedProject {
  id: string;
  name: string;
  progress: number;
  memberCount: number;
  deadline: string;
  status: "In Progress" | "Completed" | "Planning";
}
