import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { ArrowLeft, Bell, Moon, Globe, Lock, Database, Smartphone, Palette } from 'lucide-react';

interface SettingsProps {
  onBack: () => void;
}

export function Settings({ onBack }: SettingsProps) {
  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl">Settings</h2>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Appearance */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            <h3 className="text-lg">Appearance</h3>
          </div>

          <div className="space-y-4 pl-7">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select defaultValue="system">
                <SelectTrigger id="theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="font-size">Font Size</Label>
              <Slider defaultValue={[14]} min={12} max={18} step={1} />
              <p className="text-xs text-muted-foreground">Adjust text size in messages</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="compact-mode">Compact Mode</Label>
                <p className="text-sm text-muted-foreground">Reduce spacing in conversations</p>
              </div>
              <Switch id="compact-mode" />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <h3 className="text-lg">Notifications</h3>
          </div>

          <div className="space-y-4 pl-7">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications on this device</p>
              </div>
              <Switch id="push-notifications" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sound">Notification Sound</Label>
                <p className="text-sm text-muted-foreground">Play sound for new messages</p>
              </div>
              <Switch id="sound" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="desktop-notifications">Desktop Notifications</Label>
                <p className="text-sm text-muted-foreground">Show browser notifications</p>
              </div>
              <Switch id="desktop-notifications" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="message-preview">Message Preview</Label>
                <p className="text-sm text-muted-foreground">Show message content in notifications</p>
              </div>
              <Switch id="message-preview" defaultChecked />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notification-sound">Notification Sound</Label>
              <Select defaultValue="default">
                <SelectTrigger id="notification-sound">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="chime">Chime</SelectItem>
                  <SelectItem value="ping">Ping</SelectItem>
                  <SelectItem value="bell">Bell</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Language & Region */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            <h3 className="text-lg">Language & Region</h3>
          </div>

          <div className="space-y-4 pl-7">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select defaultValue="en">
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Time Zone</Label>
              <Select defaultValue="utc-8">
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utc-8">Pacific Time (PT)</SelectItem>
                  <SelectItem value="utc-5">Eastern Time (ET)</SelectItem>
                  <SelectItem value="utc+0">UTC</SelectItem>
                  <SelectItem value="utc+1">Central European Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="24-hour">24-Hour Time</Label>
                <p className="text-sm text-muted-foreground">Use 24-hour time format</p>
              </div>
              <Switch id="24-hour" />
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            <h3 className="text-lg">Privacy & Security</h3>
          </div>

          <div className="space-y-4 pl-7">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="e2e-encryption">End-to-End Encryption</Label>
                <p className="text-sm text-muted-foreground">Enable for all conversations</p>
              </div>
              <Switch id="e2e-encryption" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="screenshot-detection">Screenshot Detection</Label>
                <p className="text-sm text-muted-foreground">Notify when screenshots are taken</p>
              </div>
              <Switch id="screenshot-detection" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-delete">Auto-Delete Messages</Label>
                <p className="text-sm text-muted-foreground">Delete messages after 30 days</p>
              </div>
              <Switch id="auto-delete" />
            </div>

            <Button variant="outline" className="w-full">
              Manage Blocked Users
            </Button>

            <Button variant="outline" className="w-full">
              Two-Factor Authentication
            </Button>
          </div>
        </div>

        {/* Data & Storage */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            <h3 className="text-lg">Data & Storage</h3>
          </div>

          <div className="space-y-4 pl-7">
            <div className="flex items-center justify-between">
              <div>
                <Label>Storage Used</Label>
                <p className="text-sm text-muted-foreground">2.4 GB of 10 GB used</p>
              </div>
              <Button variant="outline" size="sm">
                Manage
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-download">Auto-Download Media</Label>
                <p className="text-sm text-muted-foreground">Download photos and videos</p>
              </div>
              <Switch id="auto-download" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="compress-images">Compress Images</Label>
                <p className="text-sm text-muted-foreground">Reduce image quality to save data</p>
              </div>
              <Switch id="compress-images" />
            </div>

            <Button variant="outline" className="w-full">
              Clear Cache
            </Button>
          </div>
        </div>

        {/* About */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-lg">About</h3>

          <div className="space-y-2 pl-7">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Build</span>
              <span>2025.01.18</span>
            </div>

            <div className="pt-4 space-y-2">
              <Button variant="outline" className="w-full">
                Terms of Service
              </Button>
              <Button variant="outline" className="w-full">
                Privacy Policy
              </Button>
              <Button variant="outline" className="w-full">
                Help & Support
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
