"use client";

import * as React from "react";
import { ShieldCheck, Smartphone, Key } from "lucide-react";
import { initialSecuritySessions } from "../mock/settings-mock-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/forms/input";
import { Label } from "@/components/forms/label";
import { toast } from "@/components/feedback/toast";

export function SecuritySettings() {
  const [twoFactor, setTwoFactor] = React.useState(true);

  return (
    <div className="space-y-6 select-none">
      {/* Password Update Form */}
      <Card className="p-6 space-y-4">
        <div className="border-b border-border pb-4">
          <h3 className="text-base font-bold text-foreground">Password & Authentication</h3>
          <p className="text-xs text-muted-foreground">Update your account password and security keys</p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Current Password</Label>
            <Input type="password" placeholder="••••••••••••" className="h-9 text-xs max-w-md" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <Input type="password" placeholder="••••••••••••" className="h-9 text-xs" />
            </div>

            <div className="space-y-1.5">
              <Label>Confirm New Password</Label>
              <Input type="password" placeholder="••••••••••••" className="h-9 text-xs" />
            </div>
          </div>

          <Button
            variant="outline"
            size="xs"
            leftIcon={<Key className="h-3.5 w-3.5" />}
            onClick={() => toast.success("Password update modal preview")}
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
              <p className="text-xs text-muted-foreground">Secure your account using TOTP Authenticator apps</p>
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
          <p className="text-xs text-muted-foreground">Devices currently authenticated to your NeuroDesk account</p>
        </div>

        <div className="space-y-3">
          {initialSecuritySessions.map((sess) => (
            <div
              key={sess.id}
              className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-muted/20 text-xs"
            >
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{sess.device}</span>
                    {sess.isCurrent && <Badge variant="info" size="sm" className="text-[9px]">This Device</Badge>}
                  </div>
                  <span className="text-muted-foreground block text-[11px]">
                    {sess.browser} • {sess.location} • {sess.ipAddress}
                  </span>
                </div>
              </div>

              <span className="text-[11px] font-mono text-muted-foreground shrink-0">{sess.lastActive}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
