// src/components/settings/ProfileSection.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser, useUpdateUserProfile, useDeleteUserProfile, useStudent } from '@/hooks/useApi';
import { User, Trash2 } from 'lucide-react';

const ProfileSection: React.FC = () => {
  const { toast } = useToast();
  const { data: currentUser } = useCurrentUser();
  const updateProfileMutation = useUpdateUserProfile();
  const deleteProfileMutation = useDeleteUserProfile();

  const [profileForm, setProfileForm] = useState({
    username: '',
    full_name: '',
    email: '',
    grade_level: '',
    bio: '',
    preferred_topics: '', // comma-separated UI input
  });

  const { data: studentData } = useStudent();

  useEffect(() => {
    // Prefer authoritative data from the students table (studentData). Fall back to auth profile (currentUser).
    const src: any = studentData || currentUser || {};
    setProfileForm({
      username: (src.username || src.name || '') as string,
      full_name: src.full_name || src.name || '',
      email: src.email || '',
      grade_level: src.grade_level || '',
      bio: src.bio || '',
      preferred_topics: Array.isArray(src.learning_preferences)
        ? (src.learning_preferences as string[]).join(', ')
        : (src.learning_preferences && Array.isArray((src.learning_preferences as any).preferred_topics)
          ? (src.learning_preferences as any).preferred_topics.join(', ')
          : ''),
      // learning_style removed from UI; keep other preferences
    });
  }, [currentUser, studentData]);

  const handleProfileUpdate = async () => {
    try {
  // Build learning_preferences JSONB payload. We send an object with preferred_topics.
      const learningPreferences = {
        preferred_topics: profileForm.preferred_topics.split(',').map((s: string) => s.trim()).filter(Boolean),
      };

      const updateData = {
        full_name: profileForm.full_name,
        // email is readonly; omit unless backend should accept updates
        grade_level: profileForm.grade_level,
        bio: profileForm.bio,
        learning_preferences: learningPreferences,
      };
      const updated = await updateProfileMutation.mutateAsync(updateData);
      // updateProfileMutation now returns the StudentData object directly
      if (updated) {
        const src: any = updated;
        setProfileForm(prev => ({
          ...prev,
          full_name: src.full_name || prev.full_name,
          grade_level: src.grade_level || prev.grade_level,
          bio: src.bio || prev.bio,
          preferred_topics: Array.isArray(src.learning_preferences)
            ? (src.learning_preferences as string[]).join(', ')
            : (src.learning_preferences && Array.isArray((src.learning_preferences as any).preferred_topics)
              ? (src.learning_preferences as any).preferred_topics.join(', ')
              : prev.preferred_topics),
          // learning_style intentionally omitted from UI/state
        }));
      }
      toast({ title: "Profile updated", description: "Changes saved successfully." });
    } catch (error) {
      // @ts-ignore
      toast({ title: "Update failed", description: error?.message || String(error), variant: "destructive" });
    }
  };

  const handleProfileDelete = async () => {
    try {
      await deleteProfileMutation.mutateAsync();
      toast({ title: "Profile deleted", description: "Your profile has been removed." });
    } catch (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>Profile Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" value={profileForm.username} disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" value={profileForm.full_name} onChange={e => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={profileForm.email} onChange={e => setProfileForm(prev => ({ ...prev, email: e.target.value }))} disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="grade_level">Grade Level</Label>
          <Input id="grade_level" value={profileForm.grade_level} onChange={e => setProfileForm(prev => ({ ...prev, grade_level: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" value={profileForm.bio} onChange={e => setProfileForm(prev => ({ ...prev, bio: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="preferred_topics">Preferred topics (comma-separated)</Label>
          <Input id="preferred_topics" value={profileForm.preferred_topics} onChange={e => setProfileForm(prev => ({ ...prev, preferred_topics: e.target.value }))} />
        </div>

        {/* Learning style removed per request */}
        <div className="flex space-x-2">
          <Button onClick={handleProfileUpdate} disabled={updateProfileMutation.isPending}>
            {updateProfileMutation.isPending ? 'Updating...' : 'Update Profile'}
          </Button>
          <Button variant="destructive" onClick={handleProfileDelete} disabled={deleteProfileMutation.isPending}>
            <Trash2 className="h-4 w-4 mr-2" /> Delete Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileSection;