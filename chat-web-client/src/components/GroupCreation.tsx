import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Checkbox } from './ui/checkbox';
import { ArrowLeft, Camera, Search, X } from 'lucide-react';

interface GroupCreationProps {
  onBack: () => void;
}

const mockContacts = [
  { id: '1', name: 'Sarah Johnson', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
  { id: '2', name: 'Michael Chen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael' },
  { id: '3', name: 'Emma Wilson', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma' },
  { id: '4', name: 'James Brown', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James' },
  { id: '5', name: 'Olivia Davis', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia' },
  { id: '6', name: 'William Taylor', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=William' },
];

export function GroupCreation({ onBack }: GroupCreationProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const filteredContacts = mockContacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedContacts = mockContacts.filter((contact) =>
    selectedMembers.includes(contact.id)
  );

  const handleCreate = () => {
    console.log('Creating group:', { groupName, groupDescription, members: selectedMembers });
    onBack();
  };

  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={step === 2 ? () => setStep(1) : onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl">{step === 1 ? 'Add Members' : 'Group Details'}</h2>
          {step === 1 && selectedMembers.length > 0 && (
            <Button size="sm" className="ml-auto" onClick={() => setStep(2)}>
              Next ({selectedMembers.length})
            </Button>
          )}
        </div>
      </div>

      {step === 1 ? (
        <div className="p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Selected Members */}
          {selectedMembers.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {selectedContacts.map((contact) => (
                <div key={contact.id} className="flex flex-col items-center gap-1 shrink-0">
                  <div className="relative">
                    <Avatar className="w-14 h-14">
                      <AvatarImage src={contact.avatar} />
                      <AvatarFallback>{contact.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <button
                      onClick={() => toggleMember(contact.id)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-xs max-w-[60px] truncate">{contact.name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          )}

          {/* Contacts List */}
          <div className="space-y-1">
            {filteredContacts.map((contact) => {
              const isSelected = selectedMembers.includes(contact.id);
              return (
                <button
                  key={contact.id}
                  onClick={() => toggleMember(contact.id)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-muted rounded-lg transition-colors"
                >
                  <Checkbox checked={isSelected} />
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={contact.avatar} />
                    <AvatarFallback>{contact.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-left">{contact.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-6 max-w-2xl mx-auto space-y-6">
          {/* Group Photo */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                <Camera className="w-8 h-8 text-muted-foreground" />
              </div>
              <Button
                size="icon"
                className="absolute bottom-0 right-0 rounded-full h-8 w-8"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Add group photo</p>
          </div>

          {/* Group Name */}
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name *</Label>
            <Input
              id="group-name"
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          {/* Group Description */}
          <div className="space-y-2">
            <Label htmlFor="group-description">Description (Optional)</Label>
            <Textarea
              id="group-description"
              placeholder="What's this group about?"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Members Preview */}
          <div className="space-y-2">
            <Label>Members ({selectedMembers.length})</Label>
            <div className="border border-border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
              {selectedContacts.map((contact) => (
                <div key={contact.id} className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={contact.avatar} />
                    <AvatarFallback>{contact.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{contact.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Create Button */}
          <Button
            className="w-full"
            disabled={!groupName.trim()}
            onClick={handleCreate}
          >
            Create Group
          </Button>
        </div>
      )}
    </div>
  );
}
