import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { ArrowLeft, Bell, Moon, Globe, Lock, Database, Smartphone, Palette, LogOut, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useLogout, useNotificationPreferences, useUpdateNotificationPreferences } from '@/hooks';
import { useState, useEffect } from 'react';
import { BlockedUsers } from './BlockedUsers';

interface SettingsProps {
  onBack: () => void;
}

export function Settings({ onBack }: SettingsProps) {
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const { data: preferences, isLoading: isLoadingPreferences } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();

  // Local state for notification preferences
  const [notificationSettings, setNotificationSettings] = useState({
    pushEnabled: true,
    emailEnabled: true,
    messageNotifications: true,
    mentionNotifications: true,
    callNotifications: true,
    groupNotifications: true,
    channelNotifications: true,
    storyNotifications: true,
    systemNotifications: true,
  });

  // Local state for blocked users section
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);

  // Initialize from backend preferences
  useEffect(() => {
    if (preferences) {
      setNotificationSettings({
        pushEnabled: preferences.pushEnabled ?? true,
        emailEnabled: preferences.emailEnabled ?? true,
        messageNotifications: preferences.messageNotifications ?? true,
        mentionNotifications: preferences.mentionNotifications ?? true,
        callNotifications: preferences.callNotifications ?? true,
        groupNotifications: preferences.groupNotifications ?? true,
        channelNotifications: preferences.channelNotifications ?? true,
        storyNotifications: preferences.storyNotifications ?? true,
        systemNotifications: preferences.systemNotifications ?? true,
      });
    }
  }, [preferences]);

  const handleLogout = () => {
    logout();
  };

  const handleNotificationToggle = async (key: keyof typeof notificationSettings, value: boolean) => {
    // Optimistic update
    setNotificationSettings((prev) => ({ ...prev, [key]: value }));

    // Update backend
    await updatePreferences.mutateAsync({ [key]: value });
  };

  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-semibold">Settings</h2>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Appearance */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Appearance</h3>
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
              <p className="text-xs text-muted-foreground">Stored locally in browser</p>
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
            <h3 className="text-lg font-semibold">Notifications</h3>
          </div>

          {isLoadingPreferences ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4 pl-7">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications on this device</p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={notificationSettings.pushEnabled}
                  onCheckedChange={(checked) => handleNotificationToggle('pushEnabled', checked)}
                  disabled={updatePreferences.isPending}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={notificationSettings.emailEnabled}
                  onCheckedChange={(checked) => handleNotificationToggle('emailEnabled', checked)}
                  disabled={updatePreferences.isPending}
                />
              </div>

              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-3">Notification Types</p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="message-notifications">Messages</Label>
                      <p className="text-sm text-muted-foreground">Direct messages</p>
                    </div>
                    <Switch
                      id="message-notifications"
                      checked={notificationSettings.messageNotifications}
                      onCheckedChange={(checked) =>
                        handleNotificationToggle('messageNotifications', checked)
                      }
                      disabled={updatePreferences.isPending}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="mention-notifications">Mentions</Label>
                      <p className="text-sm text-muted-foreground">When someone mentions you</p>
                    </div>
                    <Switch
                      id="mention-notifications"
                      checked={notificationSettings.mentionNotifications}
                      onCheckedChange={(checked) =>
                        handleNotificationToggle('mentionNotifications', checked)
                      }
                      disabled={updatePreferences.isPending}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="call-notifications">Calls</Label>
                      <p className="text-sm text-muted-foreground">Incoming calls</p>
                    </div>
                    <Switch
                      id="call-notifications"
                      checked={notificationSettings.callNotifications}
                      onCheckedChange={(checked) =>
                        handleNotificationToggle('callNotifications', checked)
                      }
                      disabled={updatePreferences.isPending}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="group-notifications">Groups</Label>
                      <p className="text-sm text-muted-foreground">Group messages and updates</p>
                    </div>
                    <Switch
                      id="group-notifications"
                      checked={notificationSettings.groupNotifications}
                      onCheckedChange={(checked) =>
                        handleNotificationToggle('groupNotifications', checked)
                      }
                      disabled={updatePreferences.isPending}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="channel-notifications">Channels</Label>
                      <p className="text-sm text-muted-foreground">Channel posts</p>
                    </div>
                    <Switch
                      id="channel-notifications"
                      checked={notificationSettings.channelNotifications}
                      onCheckedChange={(checked) =>
                        handleNotificationToggle('channelNotifications', checked)
                      }
                      disabled={updatePreferences.isPending}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="story-notifications">Stories</Label>
                      <p className="text-sm text-muted-foreground">New stories from contacts</p>
                    </div>
                    <Switch
                      id="story-notifications"
                      checked={notificationSettings.storyNotifications}
                      onCheckedChange={(checked) =>
                        handleNotificationToggle('storyNotifications', checked)
                      }
                      disabled={updatePreferences.isPending}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="system-notifications">System</Label>
                      <p className="text-sm text-muted-foreground">System announcements</p>
                    </div>
                    <Switch
                      id="system-notifications"
                      checked={notificationSettings.systemNotifications}
                      onCheckedChange={(checked) =>
                        handleNotificationToggle('systemNotifications', checked)
                      }
                      disabled={updatePreferences.isPending}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Language & Region */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Language & Region</h3>
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
              <p className="text-xs text-muted-foreground">Stored locally in browser</p>
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
            <h3 className="text-lg font-semibold">Privacy & Security</h3>
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

            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => setShowBlockedUsers(!showBlockedUsers)}
              >
                Manage Blocked Users
                {showBlockedUsers ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>

              {showBlockedUsers && (
                <div className="pl-4">
                  <BlockedUsers />
                </div>
              )}
            </div>

            <Button variant="outline" className="w-full">
              Two-Factor Authentication
            </Button>
          </div>
        </div>

        {/* Data & Storage */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Data & Storage</h3>
          </div>

          <div className="space-y-4 pl-7">
            <div className="flex items-center justify-between">
              <div>
                <Label>Storage Used</Label>
                <p className="text-sm text-muted-foreground">Local browser storage</p>
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
          <h3 className="text-lg font-semibold">About</h3>

          <div className="space-y-2 pl-7">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Build</span>
              <span className="font-medium">2025.01.18</span>
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

        {/* Logout */}
        <div className="pt-4 border-t border-border">
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Logging out...
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
