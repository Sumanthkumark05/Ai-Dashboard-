"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Upload } from "lucide-react";
import { useSettingsStore } from "@/stores/settings-store";
import { Label } from "@/components/forms/label";
import { Input } from "@/components/forms/input";
import { Textarea } from "@/components/forms/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/display/avatar";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/feedback/toast";

const profileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  jobTitle: z.string().min(2, "Job title is required."),
  company: z.string().min(2, "Company name is required."),
  phone: z.string().min(5, "Valid phone number is required."),
  location: z.string().min(2, "Location is required."),
  bio: z.string().max(300, "Bio cannot exceed 300 characters.").optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileSettings() {
  const { profile, updateProfile } = useSettingsStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile.fullName,
      jobTitle: profile.jobTitle,
      company: profile.company,
      phone: profile.phone,
      location: profile.location,
      bio: profile.bio,
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    setIsSubmitting(true);
    setTimeout(() => {
      updateProfile(data);
      setIsSubmitting(false);
      toast.success("Profile updated", {
        description: "Your user profile changes have been saved locally.",
      });
    }, 400);
  };

  return (
    <Card className="p-6 space-y-6 select-none">
      <div className="border-b border-border pb-4">
        <h3 className="text-base font-bold text-foreground">User Profile Settings</h3>
        <p className="text-xs text-muted-foreground">Manage your personal identification, job title, and contact bio</p>
      </div>

      {/* Avatar Header */}
      <div className="flex items-center gap-4 pb-2">
        <Avatar size="lg">
          <AvatarImage src={profile.avatarUrl} alt={profile.fullName} />
          <AvatarFallback>{profile.fullName[0]}</AvatarFallback>
        </Avatar>

        <div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="xs" leftIcon={<Upload className="h-3.5 w-3.5" />}>
              Change Avatar
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">JPG, PNG or GIF. Max 2MB.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name & Read-Only Email Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label required>Full Name</Label>
            <Input {...register("fullName")} className="h-9 text-xs" />
            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Email Address (Read-Only)</Label>
            <Input value={profile.email} disabled readOnly className="h-9 text-xs bg-muted/40" />
          </div>
        </div>

        {/* Job Title & Company Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label required>Job Title</Label>
            <Input {...register("jobTitle")} className="h-9 text-xs" />
            {errors.jobTitle && <p className="text-xs text-destructive">{errors.jobTitle.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label required>Company / Organization</Label>
            <Input {...register("company")} className="h-9 text-xs" />
            {errors.company && <p className="text-xs text-destructive">{errors.company.message}</p>}
          </div>
        </div>

        {/* Phone & Location Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label required>Phone Number</Label>
            <Input {...register("phone")} className="h-9 text-xs" />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label required>Location</Label>
            <Input {...register("location")} className="h-9 text-xs" />
            {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <Label>Bio / Summary</Label>
          <Textarea {...register("bio")} rows={3} className="text-xs" />
          {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
        </div>

        {/* Form Submit Footer */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save Profile Changes
          </Button>
        </div>
      </form>
    </Card>
  );
}
