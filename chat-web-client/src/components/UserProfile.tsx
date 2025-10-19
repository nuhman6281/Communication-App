import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { ArrowLeft, Camera, Mail, Phone, MapPin, Calendar, Edit2, Check } from 'lucide-react';
import { useState } from 'react';

interface UserProfileProps {
  onBack: () => void;
}

export function UserProfile({ onBack }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl">Profile</h2>
          <Button
            variant={isEditing ? 'default' : 'outline'}
            size="sm"
            className="ml-auto"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Save
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Profile Picture */}
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="relative">
            <Avatar className="w-32 h-32">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=User" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            {isEditing && (
              <Button
                size="icon"
                className="absolute bottom-0 right-0 rounded-full h-10 w-10"
              >
                <Camera className="w-5 h-5" />
              </Button>
            )}
          </div>
          <div className="text-center">
            <h3 className="text-2xl mb-1">John Doe</h3>
            <p className="text-muted-foreground">Software Engineer</p>
            <Badge className="mt-2 bg-green-500 hover:bg-green-600">Online</Badge>
          </div>
        </div>

        {/* Profile Information */}
        <div className="space-y-4">
          <h3 className="text-lg">Personal Information</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                defaultValue="John Doe"
                disabled={!isEditing}
                className={!isEditing ? 'bg-muted' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  defaultValue="john.doe@example.com"
                  disabled={!isEditing}
                  className={`pl-10 ${!isEditing ? 'bg-muted' : ''}`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  defaultValue="+1 (555) 123-4567"
                  disabled={!isEditing}
                  className={`pl-10 ${!isEditing ? 'bg-muted' : ''}`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                defaultValue="Passionate about building great products and solving complex problems."
                disabled={!isEditing}
                className={!isEditing ? 'bg-muted' : ''}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  defaultValue="San Francisco, CA"
                  disabled={!isEditing}
                  className={`pl-10 ${!isEditing ? 'bg-muted' : ''}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-lg">Privacy Settings</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p>Last Seen</p>
                <p className="text-sm text-muted-foreground">Show when you were last online</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p>Profile Photo</p>
                <p className="text-sm text-muted-foreground">Who can see your profile photo</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p>Read Receipts</p>
                <p className="text-sm text-muted-foreground">Send read receipts to others</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p>Typing Indicator</p>
                <p className="text-sm text-muted-foreground">Show when you are typing</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        {/* Account Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-2xl mb-1">256</p>
            <p className="text-sm text-muted-foreground">Messages</p>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-2xl mb-1">42</p>
            <p className="text-sm text-muted-foreground">Groups</p>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-2xl mb-1">128</p>
            <p className="text-sm text-muted-foreground">Files</p>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-lg text-red-600">Danger Zone</h3>
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
