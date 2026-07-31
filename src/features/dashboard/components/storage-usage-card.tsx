"use client";

import * as React from "react";
import { HardDrive, ArrowUpRight } from "lucide-react";
import { storageData } from "../mock/dashboard-mock-data";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/feedback/progress";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/feedback/toast";

export function StorageUsageCard() {
  const remainingGB = (storageData.totalGB - storageData.usedGB).toFixed(1);

  return (
    <Card className="p-5 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <HardDrive className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Storage Capacity</h4>
              <p className="text-xs text-muted-foreground">Enterprise cloud storage</p>
            </div>
          </div>
          <span className="text-xs font-bold text-foreground">
            {storageData.usedGB} GB / {storageData.totalGB} GB
          </span>
        </div>

        <Progress value={storageData.percentage} className="h-2.5 mb-3" />

        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <span>{storageData.percentage}% Capacity Used</span>
          <span className="font-semibold text-foreground">{remainingGB} GB Remaining</span>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full justify-between"
        rightIcon={<ArrowUpRight className="h-4 w-4" />}
        onClick={() =>
          toast.info("Upgrade Storage", {
            description: "Enterprise storage tier upgrade preview.",
          })
        }
      >
        <span>Upgrade Storage Tier</span>
      </Button>
    </Card>
  );
}
