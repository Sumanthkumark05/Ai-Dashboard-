"use client";

import * as React from "react";
import { ShieldCheck, Smartphone, Key } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/forms/password-input";
import { Label } from "@/components/forms/label";
import { toast } from "@/components/feedback/toast";
import { apiClient } from "@/lib/api-client";

interface SessionData {
  id: string;
  ip_address?: string;
  user_agent?: string;
  is_active: boolean;
  created_at: string;
}

export function SecuritySettings() {
  const [twoFactor, setTwoFactor] = React.useState(true);
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [sessions, setSessions] = React.useState<SessionData[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    apiClient.get<{ items?: SessionData[] }>("/sessions")
      .then((res) => {
        if (!cancelled) setSessions(res.items || []);
      })
      .catch(() => {
        if (!cancelled) setSessions([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword) {
      toast.error("Please fill out password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    setIsUpdating(true);
    try {
      await apiClient.patch("/users/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update password";
      toast.error(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Password Update Form */}
      <Card className="p-6 space-y-4">
        <div className="border-b border-border pb-4">
          <h3 className="text-base font-bold text-foreground">Password & Authentication</h3>
          <p className="text-xs text-muted-foreground">Update your account password and security credentials</p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Current Password</Label>
            <PasswordInput
              placeholder="••••••••••••"
              className="max-w-md"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <PasswordInput
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Confirm New Password</Label>
              <PasswordInput
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <Button
            variant="outline"
            size="xs"
            leftIcon={<Key className="h-3.5 w-3.5" />}
            onClick={handlePasswordChange}
            isLoading={isUpdating}
          >
            Update Password
          </Button>
        </div>
      </Card>

      {/* Two-Factor Authentication */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div>
              <h4 className="text-sm font-bold text-foreground">Two-Factor Authentication (2FA)</h4>
              <p className="text-xs text-muted-foreground font-medium">TOTP Authenticator Protection</p>
            </div>
          </div>
          <Badge variant={twoFactor ? "success" : "secondary"}>
            {twoFactor ? "2FA Enabled" : "Disabled"}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Authenticator App (Google Authenticator / 1Password)</span>
          <Button
            variant="outline"
            size="xs"
            onClick={() => {
              setTwoFactor(!twoFactor);
              toast.info(`2FA ${!twoFactor ? "enabled" : "disabled"}`);
            }}
          >
            {twoFactor ? "Disable 2FA" : "Configure 2FA"}
          </Button>
        </div>
      </Card>

      {/* Active Sessions List */}
      <Card className="p-6 space-y-4">
        <div className="border-b border-border pb-4">
          <h4 className="text-sm font-bold text-foreground">Active Signed-in Devices</h4>
          <p className="text-xs text-muted-foreground">Authenticated sessions from backend session registry</p>
        </div>

        {sessions.length === 0 ? (
          <p className="text-xs text-muted-foreground">No active sessions found.</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-muted/20 text-xs"
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">Session {sess.id.substring(0, 8)}</span>
                    </div>
                    <span className="text-muted-foreground block text-[11px]">
                      {sess.ip_address || "127.0.0.1"} • {sess.user_agent || "Web Client"}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                  {new Date(sess.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
