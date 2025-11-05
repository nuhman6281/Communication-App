import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { ArrowLeft, Camera, Mail, Phone, MapPin, Calendar, Edit2, Check, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores';
import { useUpdateUserProfile, useUpdateAvatar } from '@/hooks';
import { formatDistanceToNow } from 'date-fns';

interface UserProfileProps {
  onBack: () => void;
}

export function UserProfile({ onBack }: UserProfileProps) {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    status: '',
  });

  // Initialize form data from user
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        status: user.status || '',
      });
    }
  }, [user]);

  const updateProfile = useUpdateUserProfile();
  const updateAvatar = useUpdateAvatar();

  const handleSave = async () => {
    await updateProfile.mutateAsync({
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      bio: formData.bio,
      status: formData.status,
    });
    setIsEditing(false);
  };

  const handleAvatarClick = () => {
    if (isEditing && avatarInputRef.current) {
      avatarInputRef.current.click();
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await updateAvatar.mutateAsync(file);
    }
  };

  const handleCancel = () => {
    // Reset form data to user data
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        status: user.status || '',
      });
    }
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const fullName = `${user.firstName} ${user.lastName}`.trim() || user.username;
  const timeAgo = formatDistanceToNow(new Date(user.createdAt), { addSuffix: true });

  // Get presence status badge
  const getPresenceBadge = () => {
    switch (user.presenceStatus) {
      case 'online':
        return <Badge className="mt-2 bg-green-500 hover:bg-green-600">Online</Badge>;
      case 'away':
        return <Badge className="mt-2 bg-yellow-500 hover:bg-yellow-600">Away</Badge>;
      case 'do_not_disturb':
        return <Badge className="mt-2 bg-red-500 hover:bg-red-600">Do Not Disturb</Badge>;
      default:
        return <Badge className="mt-2 bg-gray-500 hover:bg-gray-600">Offline</Badge>;
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl">Profile</h2>
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="ml-auto flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={updateProfile.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Profile Picture */}
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="relative">
            <Avatar className="w-32 h-32">
              <AvatarImage src={user.avatarUrl || undefined} />
              <AvatarFallback>
                {user.firstName?.charAt(0) || user.username.charAt(0)}
                {user.lastName?.charAt(0) || user.username.charAt(1)}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <Button
                size="icon"
                className="absolute bottom-0 right-0 rounded-full h-10 w-10"
                onClick={handleAvatarClick}
                disabled={updateAvatar.isPending}
              >
                {updateAvatar.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
              </Button>
            )}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div className="text-center">
            <h3 className="text-2xl mb-1">{fullName}</h3>
            <p className="text-muted-foreground">@{user.username}</p>
            {user.status && <p className="text-sm text-muted-foreground mt-1">{user.status}</p>}
            {getPresenceBadge()}
          </div>
        </div>

        {/* Profile Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Personal Information</h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-muted' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-muted' : ''}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="pl-10 bg-muted"
                />
              </div>
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  className={`pl-10 ${!isEditing ? 'bg-muted' : ''}`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Input
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                disabled={!isEditing}
                className={!isEditing ? 'bg-muted' : ''}
                placeholder="What's on your mind?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!isEditing}
                className={!isEditing ? 'bg-muted' : ''}
                rows={3}
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-lg font-semibold">Account Information</h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Username</span>
              <span className="text-sm font-medium">@{user.username}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Member Since</span>
              <span className="text-sm font-medium">{timeAgo}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Verified</span>
              <Badge variant={user.isVerified ? 'default' : 'secondary'}>
                {user.isVerified ? 'Verified' : 'Not Verified'}
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Subscription</span>
              <Badge variant="outline" className="capitalize">
                {user.subscriptionTier}
              </Badge>
            </div>

            {user.mfaEnabled && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Two-Factor Auth</span>
                <Badge variant="default" className="bg-green-500">
                  Enabled
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Privacy Settings - Placeholder for future implementation */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-lg font-semibold">Privacy Settings</h3>
          <p className="text-sm text-muted-foreground">
            Privacy settings can be configured in the Settings page
          </p>
        </div>

        {/* Danger Zone */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-lg font-semibold text-red-600">Danger Zone</h3>
          <div className="space-y-2">
            <Button variant="outline" className="w-full text-red-600 hover:text-red-700">
              Export Data
            </Button>
            <Button variant="outline" className="w-full text-red-600 hover:text-red-700">
              Deactivate Account
            </Button>
            <Button variant="destructive" className="w-full">
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
