# Workspace Architecture & Implementation Guide

**Project:** Communication App
**Feature:** Workspace/Organization System
**Status:** ❌ Not Implemented (Backend & Frontend)
**Priority:** Medium (Enterprise Feature)

---

## 🏢 What Are Workspaces?

Workspaces are **organization-level containers** similar to Slack workspaces or Microsoft Teams organizations. They enable:

- **Multi-tenant architecture** - Multiple organizations in one app
- **Enterprise collaboration** - Departments, teams, hierarchies
- **Centralized management** - Admin controls, SSO, branding
- **Workspace-specific channels** - Public/private channels within org

### Workspace vs Personal Mode

The app supports **TWO operational modes**:

| Mode | Description | Use Case | Workspace Required? |
|------|-------------|----------|---------------------|
| **Personal Mode** | Like WhatsApp/Telegram | Individual users, direct chats, groups | ❌ No |
| **Workspace Mode** | Like Slack/Teams | Companies, organizations, enterprises | ✅ Yes |

---

## 🎯 User Flow Architecture

### Scenario 1: Personal Mode (Current Implementation) ✅

```
User Registration
     ↓
Email Verification
     ↓
User Profile Created
     ↓
🏠 Personal Dashboard
     ├── Direct Messages (1-on-1 chats)
     ├── Groups (personal groups, max 256 members)
     └── Stories (personal stories)

NO WORKSPACE NEEDED
```

**Current Status:** ✅ **This is what's currently working!**
- Users register → Create profile → Start chatting
- All conversations are personal (user-to-user or user-created groups)
- No workspace context needed

---

### Scenario 2: Workspace Mode (NOT IMPLEMENTED) ❌

```
User Registration
     ↓
Email Verification
     ↓
User Profile Created
     ↓
🔀 CHOOSE MODE:
     │
     ├─→ [Option A] Create New Workspace
     │        ↓
     │   🏢 Workspace Dashboard
     │        ├── Workspace Channels
     │        ├── Workspace Members
     │        ├── Direct Messages
     │        └── Workspace Settings
     │
     ├─→ [Option B] Join Existing Workspace
     │        ↓
     │   Enter Invite Link / Email Domain
     │        ↓
     │   🏢 Workspace Dashboard
     │
     └─→ [Option C] Stay in Personal Mode
              ↓
         🏠 Personal Dashboard
```

**Current Status:** ❌ **NOT IMPLEMENTED**

---

## 📊 Database Schema (From Spec)

### 1. Workspaces Table

```sql
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,                -- "Acme Corporation"
    slug VARCHAR(100) UNIQUE NOT NULL,         -- "acme-corp"
    description TEXT,
    logo_url TEXT,
    owner_id UUID REFERENCES users(id),        -- Workspace creator
    settings JSONB,                            -- Branding, SSO config, etc.
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Example Data:**
```json
{
  "id": "a1b2c3d4-...",
  "name": "Acme Corporation",
  "slug": "acme-corp",
  "owner_id": "user-uuid-123",
  "settings": {
    "theme": "corporate",
    "sso_enabled": true,
    "saml_config": {...},
    "email_domains": ["acme.com"],
    "allow_external_guests": false
  }
}
```

---

### 2. Workspace Members Table

```sql
CREATE TABLE workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',         -- 'owner', 'admin', 'member'
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)              -- User can join once per workspace
);
```

**Roles:**
- **owner**: Full control, billing, delete workspace
- **admin**: Manage members, channels, settings
- **member**: Regular user, participate in channels

---

### 3. Relationship with Channels

```sql
-- Channels become workspace-specific
ALTER TABLE channels
ADD COLUMN workspace_id UUID REFERENCES workspaces(id);

-- Index for workspace channel queries
CREATE INDEX idx_channels_workspace ON channels(workspace_id);
```

---

## 🔄 How Workspace Relationships Work

### User → Workspace (Many-to-Many)

```
User A
  ├── Workspace 1 (role: owner)
  ├── Workspace 2 (role: admin)
  └── Workspace 3 (role: member)

User B
  ├── Workspace 1 (role: member)
  └── Workspace 4 (role: owner)
```

**Key Points:**
- ✅ One user can belong to multiple workspaces
- ✅ Different roles in different workspaces
- ✅ Personal mode + workspace mode simultaneously

---

### Workspace → Channels (One-to-Many)

```
Workspace: "Acme Corp"
  ├── Channel: #general (public)
  ├── Channel: #engineering (private)
  ├── Channel: #marketing (public)
  └── Channel: #announcements (public, admin-only posts)
```

**Channel Types in Workspace:**
- **Public channels**: All workspace members can join
- **Private channels**: Invite-only
- **Broadcast channels**: Admins post, members read

---

### Workspace vs Personal Conversations

| Feature | Personal Mode | Workspace Mode |
|---------|---------------|----------------|
| **Direct Messages** | ✅ Any user | ✅ Workspace members only |
| **Groups** | ✅ User-created, any members | ✅ Workspace groups |
| **Channels** | ❌ Not available | ✅ Workspace channels |
| **Administration** | ❌ None | ✅ Workspace admins |
| **SSO** | ❌ N/A | ✅ SAML 2.0 |

---

## 🚀 Implementation Requirements

### Backend: Workspaces Module ❌ NOT STARTED

**Files to Create:**

```
src/modules/workspaces/
├── workspaces.module.ts
├── workspaces.controller.ts
├── workspaces.service.ts
├── entities/
│   ├── workspace.entity.ts
│   └── workspace-member.entity.ts
├── dto/
│   ├── create-workspace.dto.ts
│   ├── update-workspace.dto.ts
│   ├── add-member.dto.ts
│   └── update-member-role.dto.ts
└── guards/
    ├── workspace-owner.guard.ts
    └── workspace-admin.guard.ts
```

**Required API Endpoints:**

```typescript
// Workspace Management
POST   /workspaces                        // Create workspace
GET    /workspaces                        // List user's workspaces
GET    /workspaces/:id                    // Get workspace details
PATCH  /workspaces/:id                    // Update workspace (owner/admin)
DELETE /workspaces/:id                    // Delete workspace (owner only)

// Member Management
GET    /workspaces/:id/members            // List members
POST   /workspaces/:id/members            // Add member (admin)
PATCH  /workspaces/:id/members/:userId    // Update role (admin)
DELETE /workspaces/:id/members/:userId    // Remove member (admin)
POST   /workspaces/:id/leave              // Leave workspace

// Invitations
POST   /workspaces/:id/invite             // Generate invite link
GET    /workspaces/join/:inviteCode       // Join via invite
POST   /workspaces/:id/invite-by-email    // Send email invite

// Channels (workspace-specific)
GET    /workspaces/:id/channels           // List workspace channels
POST   /workspaces/:id/channels           // Create channel in workspace
```

---

### Frontend: Workspace UI ❌ NOT STARTED

**Components to Create:**

```
src/components/workspace/
├── WorkspaceSelector.tsx          // Switch between workspaces
├── WorkspaceDashboard.tsx         // Main workspace view
├── WorkspaceSettings.tsx          // Settings (admin)
├── CreateWorkspace.tsx            // Creation wizard
├── WorkspaceMembers.tsx           // Member management
├── WorkspaceChannels.tsx          // Channel list
├── InviteMembersDialog.tsx        // Invite flow
└── JoinWorkspaceDialog.tsx        // Join via link/email
```

**Hooks to Create:**

```typescript
// src/hooks/useWorkspaces.ts
export function useWorkspaces()                    // List user's workspaces
export function useWorkspace(id: string)           // Get workspace details
export function useCreateWorkspace()               // Create workspace
export function useUpdateWorkspace()               // Update workspace
export function useWorkspaceMembers(id: string)    // List members
export function useAddWorkspaceMember()            // Add member
export function useLeaveWorkspace()                // Leave workspace
```

**API Service:**

```typescript
// src/lib/api/endpoints/workspaces.api.ts
export const workspacesApi = {
  getAll: () => axios.get('/workspaces'),
  getById: (id: string) => axios.get(`/workspaces/${id}`),
  create: (data: CreateWorkspaceDto) => axios.post('/workspaces', data),
  update: (id: string, data: UpdateWorkspaceDto) =>
    axios.patch(`/workspaces/${id}`, data),
  delete: (id: string) => axios.delete(`/workspaces/${id}`),

  // Members
  getMembers: (id: string) => axios.get(`/workspaces/${id}/members`),
  addMember: (id: string, userId: string, role: string) =>
    axios.post(`/workspaces/${id}/members`, { userId, role }),
  removeMember: (id: string, userId: string) =>
    axios.delete(`/workspaces/${id}/members/${userId}`),
  leave: (id: string) => axios.post(`/workspaces/${id}/leave`),

  // Invitations
  generateInvite: (id: string) => axios.post(`/workspaces/${id}/invite`),
  joinByInvite: (inviteCode: string) =>
    axios.get(`/workspaces/join/${inviteCode}`),
};
```

---

## 🎨 UI/UX Flow

### 1. Workspace Selector (Top Left)

```
┌─────────────────────────┐
│ 🏢 Acme Corp        ▼  │  ← Current workspace
├─────────────────────────┤
│ 🏠 Personal             │
│ 🏢 Tech Startup         │
│ 🏢 Freelance Clients    │
├─────────────────────────┤
│ ➕ Create Workspace     │
│ 🔗 Join Workspace       │
└─────────────────────────┘
```

### 2. Workspace Dashboard

```
┌────────────────────────────────────────────────────┐
│ 🏢 Acme Corp                              Settings │
├────────────────────────────────────────────────────┤
│ Channels                                            │
│   📢 #announcements         (234 members)          │
│   💼 #general              (456 members)           │
│   🔒 #engineering          (34 members)    Private │
│                                                     │
│ Direct Messages                                     │
│   👤 John Doe              (Online)                │
│   👤 Jane Smith            (Away)                  │
│                                                     │
│ Members (456)              View All →              │
└────────────────────────────────────────────────────┘
```

### 3. Create Workspace Wizard

```
Step 1: Workspace Name
  ┌──────────────────────────┐
  │ Workspace Name           │
  │ [Acme Corporation    ]   │
  │                          │
  │ Workspace URL            │
  │ chat.app/acme-corp       │
  └──────────────────────────┘

Step 2: Invite Members (Optional)
  ┌──────────────────────────┐
  │ Email Addresses          │
  │ john@acme.com            │
  │ jane@acme.com            │
  │                          │
  │ [+ Add Email]            │
  └──────────────────────────┘

Step 3: Create Channels
  ┌──────────────────────────┐
  │ ☑ #general               │
  │ ☑ #announcements         │
  │ ☐ #random                │
  │ [+ Add Channel]          │
  └──────────────────────────┘
```

---

## ⚙️ Configuration & Feature Flags

### Environment Variables

```bash
# Backend .env
ENABLE_WORKSPACES=true                    # Enable/disable workspace features
WORKSPACE_MAX_MEMBERS=10000              # Max members per workspace
WORKSPACE_MAX_PER_USER=50                # Max workspaces per user
WORKSPACE_REQUIRE_EMAIL_DOMAIN=false     # Restrict by email domain
```

### Feature Detection

```typescript
// Frontend
const { data: config } = useAppConfig();

{config.workspacesEnabled && (
  <WorkspaceSelector />
)}
```

---

## 🔐 Permission System

### Workspace-Level Permissions

```typescript
enum WorkspaceRole {
  OWNER = 'owner',     // Full control
  ADMIN = 'admin',     // Manage members, channels
  MEMBER = 'member',   // Regular user
}

// Permission checks
@UseGuards(WorkspaceOwnerGuard)
async deleteWorkspace(@Param('id') id: string) {
  // Only owner can delete
}

@UseGuards(WorkspaceAdminGuard)
async addMember(@Param('id') id: string, @Body() dto: AddMemberDto) {
  // Admin or owner can add members
}
```

### Channel-Level Permissions (within workspace)

```typescript
enum ChannelRole {
  ADMIN = 'admin',       // Manage channel
  MODERATOR = 'moderator', // Moderate content
  MEMBER = 'member',     // Regular participant
}
```

---

## 🚦 Implementation Roadmap

### Phase 1: Backend Foundation (1 week)
1. ✅ Create workspace entities
2. ✅ Implement WorkspacesModule, Controller, Service
3. ✅ Add workspace CRUD endpoints
4. ✅ Implement member management
5. ✅ Add permission guards
6. ✅ Update channels to be workspace-aware

### Phase 2: Backend Advanced (1 week)
7. ✅ Invite link generation & validation
8. ✅ Email domain restrictions
9. ✅ Workspace settings management
10. ✅ SSO/SAML integration (optional)
11. ✅ Workspace-level analytics

### Phase 3: Frontend Core (1 week)
12. ✅ Create workspace API service
13. ✅ Implement workspace hooks
14. ✅ Build WorkspaceSelector component
15. ✅ Create WorkspaceDashboard
16. ✅ Implement CreateWorkspace wizard

### Phase 4: Frontend Advanced (1 week)
17. ✅ Member management UI
18. ✅ Invitation flow
19. ✅ Workspace settings UI
20. ✅ Channel management within workspaces
21. ✅ Role-based UI rendering

### Phase 5: Integration & Testing (1 week)
22. ✅ End-to-end workspace flow testing
23. ✅ Permission system testing
24. ✅ Multi-workspace switching
25. ✅ Performance optimization

---

## 🆚 Comparison: Personal vs Workspace

### Current Implementation (Personal Mode) ✅

```typescript
// User creates a conversation
POST /conversations
{
  "type": "direct",
  "participantIds": ["user-uuid-2"]
}

// No workspace context needed
```

### With Workspaces (Future) ❌

```typescript
// User creates a workspace channel
POST /workspaces/:workspaceId/channels
{
  "name": "engineering",
  "isPrivate": true,
  "description": "Engineering team discussions"
}

// Workspace context is required
```

---

## 🔄 Migration Strategy

### For Existing Users

When workspaces are implemented, existing users should:

**Option 1: Stay in Personal Mode**
- No changes required
- Continue using direct messages and groups
- Workspace features remain optional

**Option 2: Create/Join Workspace**
- User decides to create or join a workspace
- Personal conversations remain in personal mode
- Workspace conversations are separate

**Data Structure:**
```typescript
interface User {
  id: string;
  // Personal mode data
  conversations: Conversation[];  // Personal chats
  groups: Group[];                // Personal groups

  // Workspace mode data (optional)
  workspaces: WorkspaceMember[];  // Workspace memberships
}
```

---

## 📝 Key Decisions

### 1. **Workspaces are OPTIONAL** ✅
- App works perfectly without workspaces (current state)
- Workspaces are an **enterprise add-on feature**
- Personal mode is the default

### 2. **Users can be in BOTH modes simultaneously** ✅
- Personal conversations + workspace conversations
- Switch between modes via WorkspaceSelector
- Data is separated but user is the same

### 3. **Channels require workspaces** ⚠️
- **Current:** Channels module exists but not workspace-aware
- **Future:** Channels should be workspace-specific
- **Migration:** Add `workspace_id` column to channels table

### 4. **Groups vs Channels** 📊
- **Groups:** Personal, user-created, any members
- **Channels:** Workspace-owned, admin-created, workspace members only

---

## 🎯 Current Answer to Your Question

### Q: "Which workspace does a new user exist in by default?"

**Answer:** ❌ **NONE!**

New users are in **Personal Mode** by default:
- No workspace assignment
- Can use direct messages and groups immediately
- Workspaces are completely optional

### Q: "How can a new member be added to a workspace?"

**Answer (when implemented):**

**Method 1: Invite Link**
```
Admin → Generate Invite Link
     ↓
https://chat.app/workspaces/join/abc123def456
     ↓
New User Clicks Link
     ↓
Joins Workspace as "member"
```

**Method 2: Email Invite**
```
Admin → Enter Email → Send Invite
     ↓
User Receives Email with Link
     ↓
User Clicks → Auto-joins Workspace
```

**Method 3: Email Domain Auto-Join**
```
User registers with @acme.com email
     ↓
System checks: Workspace with domain "acme.com" exists?
     ↓
Auto-join user to workspace
```

**Method 4: Admin Adds Directly**
```
Admin → Workspace Settings → Members
     ↓
Search User by Username/Email
     ↓
Click "Add to Workspace" → Select Role
```

---

## 🚀 Next Steps

**Immediate (Current State):**
1. ✅ Continue using Personal Mode
2. ✅ Focus on core features (notifications, file upload, etc.)
3. ⏸️ Defer workspaces until enterprise need arises

**When to Implement Workspaces:**
- When targeting enterprise customers
- When SSO/SAML is required
- When department hierarchy is needed
- When you need centralized admin controls

**Priority:** **LOW/MEDIUM** - Not needed for MVP, but important for enterprise sales.

---

**Last Updated:** October 20, 2025
**Status:** Architectural design complete, awaiting implementation
**Dependencies:** Core features (auth, messages, channels) must be stable first
