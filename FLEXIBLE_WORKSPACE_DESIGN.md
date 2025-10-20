# Flexible Workspace Architecture - Implementation Design

**Project:** Communication App - Full Feature Set
**Target:** WhatsApp + Telegram + Slack + Teams + Zoho Cliq (All Features)
**Approach:** Maximum Flexibility with Permission-Based Access

---

## 🎯 Core Design Principles

### 1. **User Context Flexibility**

```
User can exist in:
├─ ✅ Personal Mode (no workspace)
├─ ✅ Single Workspace
├─ ✅ Multiple Workspaces simultaneously
└─ ✅ Mix of Personal + Workspace contexts
```

### 2. **Permission-Based Access**

- ✅ Users keep personal identity across all contexts
- ✅ Permissions determine what they can access
- ✅ No conflicts between personal/workspace data
- ✅ Groups can span across contexts (with permissions)

### 3. **No Forced Boundaries**

- ✅ Personal users can be invited to workspaces
- ✅ Workspace members can maintain personal spaces
- ✅ Groups can be personal OR workspace-owned
- ✅ Channels can be personal OR workspace-owned

---

## 🏗️ Database Architecture

### 1. Core Tables

#### Users Table (NO CHANGES NEEDED)

```sql
-- users table remains unchanged
-- Users are global entities, workspace membership is separate
CREATE TABLE users (
    id UUID PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(255) UNIQUE,
    -- ... existing fields
);
```

**Key Point:** Users are NOT bound to workspaces - they exist globally!

---

#### Workspaces Table

```sql
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic Info
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,

    -- Visual
    logo_url TEXT,
    banner_url TEXT,

    -- Ownership
    owner_id UUID REFERENCES users(id) NOT NULL,

    -- Settings
    settings JSONB DEFAULT '{}'::jsonb,
    -- Example settings:
    -- {
    --   "allow_personal_dms": true,
    --   "allow_external_groups": false,
    --   "require_email_domain": ["company.com"],
    --   "sso_enabled": false,
    --   "default_member_permissions": ["read", "write"]
    -- }

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_workspaces_slug ON workspaces(slug);
CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX idx_workspaces_active ON workspaces(is_active);
```

---

#### Workspace Members Table (Many-to-Many with Roles)

```sql
CREATE TABLE workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relations
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Role & Permissions
    role VARCHAR(20) DEFAULT 'member',
    -- Roles: 'owner', 'admin', 'moderator', 'member', 'guest'

    custom_permissions JSONB DEFAULT '[]'::jsonb,
    -- Example: ["manage_channels", "invite_members", "manage_settings"]

    -- Status
    status VARCHAR(20) DEFAULT 'active',
    -- Status: 'active', 'invited', 'suspended', 'left'

    -- Invitation
    invited_by_id UUID REFERENCES users(id),
    invite_code VARCHAR(50) UNIQUE,
    invited_at TIMESTAMP,
    joined_at TIMESTAMP,

    -- Activity
    last_seen_at TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_role ON workspace_members(role);
CREATE INDEX idx_workspace_members_status ON workspace_members(status);
```

**Key Features:**
- ✅ One user can join multiple workspaces (different rows)
- ✅ Each membership has its own role
- ✅ Custom permissions per user per workspace
- ✅ Invitation tracking

---

### 2. Updated Existing Tables

#### Groups Table (Add Optional Workspace Context)

```sql
-- Add to existing groups table
ALTER TABLE groups
ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
ADD COLUMN is_workspace_owned BOOLEAN DEFAULT false;

CREATE INDEX idx_groups_workspace ON groups(workspace_id);

-- Migration note: Existing groups will have workspace_id = NULL (personal groups)
```

**Behavior:**
- `workspace_id = NULL` → Personal group (anyone can join based on privacy)
- `workspace_id = UUID` → Workspace group (only workspace members can join)
- `is_workspace_owned = true` → Managed by workspace admins

---

#### Channels Table (Add Optional Workspace Context)

```sql
-- Add to existing channels table
ALTER TABLE channels
ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
ADD COLUMN is_workspace_owned BOOLEAN DEFAULT false;

CREATE INDEX idx_channels_workspace ON channels(workspace_id);

-- Migration note: Existing channels will have workspace_id = NULL (personal channels)
```

**Behavior:**
- `workspace_id = NULL` → Personal channel (public discovery)
- `workspace_id = UUID` → Workspace channel (workspace members only)
- `is_workspace_owned = true` → Managed by workspace admins

---

#### Conversations Table (NO CHANGES NEEDED)

```sql
-- conversations table stays as-is
-- Conversations are context-free containers for messages
-- Workspace context comes from Groups/Channels, not Conversations
```

---

### 3. Permission Tables

#### Workspace Permissions Table (Optional - for fine-grained control)

```sql
CREATE TABLE workspace_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    resource_type VARCHAR(50) NOT NULL,
    -- Resource types: 'channel', 'group', 'member', 'settings', 'billing'

    resource_id UUID,
    -- NULL = workspace-level permission
    -- UUID = specific resource permission

    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    -- NULL = applies to role

    role VARCHAR(20),
    -- NULL = applies to specific user

    permissions JSONB NOT NULL,
    -- ["read", "write", "delete", "manage", "admin"]

    granted_by_id UUID REFERENCES users(id),
    granted_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(workspace_id, resource_type, resource_id, user_id, role)
);

CREATE INDEX idx_workspace_permissions_workspace ON workspace_permissions(workspace_id);
CREATE INDEX idx_workspace_permissions_user ON workspace_permissions(user_id);
```

---

## 🔐 Permission System Design

### Permission Hierarchy

```
1. Workspace Owner
   └─ Full control over workspace

2. Workspace Admin
   └─ Manage members, channels, groups, settings

3. Workspace Moderator
   └─ Moderate content, manage conflicts

4. Workspace Member
   └─ Participate in channels, create personal groups

5. Workspace Guest
   └─ Limited access, invite-only channels
```

### Permission Resolution Logic

```typescript
// Pseudo-code for permission check
function canUserAccessResource(
  userId: string,
  resourceType: 'channel' | 'group' | 'conversation',
  resourceId: string,
  action: 'read' | 'write' | 'delete' | 'manage'
): boolean {

  // 1. Check if resource is personal (no workspace)
  const resource = getResource(resourceType, resourceId);
  if (!resource.workspace_id) {
    // Personal resource - use existing group/channel permissions
    return checkPersonalResourcePermission(userId, resource, action);
  }

  // 2. Check workspace membership
  const membership = getWorkspaceMembership(resource.workspace_id, userId);
  if (!membership) {
    return false; // Not a workspace member
  }

  // 3. Check if suspended
  if (membership.status === 'suspended') {
    return false;
  }

  // 4. Owner and Admin have all permissions
  if (membership.role === 'owner' || membership.role === 'admin') {
    return true;
  }

  // 5. Check resource-specific permissions
  const resourcePermission = getResourcePermission(
    resource.workspace_id,
    resourceType,
    resourceId,
    userId
  );

  if (resourcePermission) {
    return resourcePermission.permissions.includes(action);
  }

  // 6. Check role-based permissions
  const rolePermission = getRolePermission(
    resource.workspace_id,
    resourceType,
    membership.role
  );

  if (rolePermission) {
    return rolePermission.permissions.includes(action);
  }

  // 7. Default workspace member permissions
  const defaultPermissions = workspace.settings.default_member_permissions || [];
  return defaultPermissions.includes(action);
}
```

---

## 🎨 User Experience Flows

### Flow 1: New User (Personal Mode)

```
User Signs Up
     ↓
✅ Exists in Personal Mode
     ├─ Can create groups (personal)
     ├─ Can create channels (personal)
     ├─ Can chat with anyone
     └─ Can be invited to workspaces
```

**No workspace required - app works perfectly!**

---

### Flow 2: User Creates Workspace

```
Personal User → "Create Workspace"
     ↓
Workspace Created
     ↓
User becomes Workspace Owner
     ↓
Can now:
     ├─ Create workspace channels
     ├─ Invite members
     ├─ Manage settings
     └─ STILL has personal mode access
```

**User now has both contexts:**
- 🏠 Personal: Personal groups, channels, DMs
- 🏢 Workspace: Workspace channels, members

---

### Flow 3: User Invited to Workspace

```
User A (Workspace Owner) → Invites User B
     ↓
User B receives invitation
     ↓
User B accepts
     ↓
User B joins workspace as Member
     ↓
User B can now:
     ├─ Access workspace channels
     ├─ Chat with workspace members
     ├─ Create workspace groups (if allowed)
     └─ STILL has personal mode access
```

---

### Flow 4: User in Multiple Workspaces

```
User Profile:
     │
     ├─ 🏠 Personal Space
     │   ├─ Groups: "Family", "Friends"
     │   └─ Channels: @PersonalChannel
     │
     ├─ 🏢 Workspace: "Company A"
     │   ├─ Role: Admin
     │   ├─ Channels: #general, #engineering
     │   └─ Groups: "Project Alpha"
     │
     └─ 🏢 Workspace: "Freelance B"
         ├─ Role: Member
         ├─ Channels: #updates
         └─ Groups: "Client Project"
```

**All accessible from one account!**

---

### Flow 5: Group Spanning Contexts

```
Scenario: User wants to create a group with both
          workspace members AND personal contacts

Option A: Personal Group with Workspace Members
     ├─ Create personal group (workspace_id = NULL)
     ├─ Add workspace members (allowed if they exist globally)
     └─ Workspace members can join (they exist as users)

Option B: Workspace Group with External Guests
     ├─ Create workspace group (workspace_id = UUID)
     ├─ Add workspace members (default)
     └─ Invite external users as "guests" (if workspace allows)
```

**Flexibility is key!**

---

## 🚀 Implementation Plan

### Phase 1: Backend Foundation (Week 1-2)

#### Step 1: Create Workspace Module Structure

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
│   ├── invite-member.dto.ts
│   ├── update-member-role.dto.ts
│   └── workspace-settings.dto.ts
└── guards/
    ├── workspace-member.guard.ts
    ├── workspace-admin.guard.ts
    └── workspace-owner.guard.ts
```

#### Step 2: Implement Core Entities

```typescript
// workspace.entity.ts
@Entity('workspaces')
export class Workspace extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @OneToMany(() => WorkspaceMember, member => member.workspace)
  members: WorkspaceMember[];

  @Column({ type: 'jsonb', default: {} })
  settings: WorkspaceSettings;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}

// workspace-member.entity.ts
@Entity('workspace_members')
export class WorkspaceMember extends BaseEntity {
  @Column({ type: 'uuid' })
  workspaceId: string;

  @ManyToOne(() => Workspace, workspace => workspace.members)
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: WorkspaceRole,
    default: WorkspaceRole.MEMBER
  })
  role: WorkspaceRole;

  @Column({ type: 'jsonb', default: [] })
  customPermissions: string[];

  @Column({
    type: 'enum',
    enum: MemberStatus,
    default: MemberStatus.ACTIVE
  })
  status: MemberStatus;

  @Column({ type: 'timestamp', nullable: true })
  joinedAt: Date;
}
```

#### Step 3: Update Existing Entities

```typescript
// Update Group entity
@Entity('groups')
export class Group extends BaseEntity {
  // ... existing fields

  @Column({ type: 'uuid', nullable: true })
  workspaceId?: string;

  @ManyToOne(() => Workspace, { nullable: true })
  @JoinColumn({ name: 'workspaceId' })
  workspace?: Workspace;

  @Column({ type: 'boolean', default: false })
  isWorkspaceOwned: boolean;
}

// Update Channel entity
@Entity('channels')
export class Channel extends BaseEntity {
  // ... existing fields

  @Column({ type: 'uuid', nullable: true })
  workspaceId?: string;

  @ManyToOne(() => Workspace, { nullable: true })
  @JoinColumn({ name: 'workspaceId' })
  workspace?: Workspace;

  @Column({ type: 'boolean', default: false })
  isWorkspaceOwned: boolean;
}
```

---

### Phase 2: API Implementation (Week 2-3)

#### Workspace Management Endpoints

```typescript
// POST /workspaces - Create workspace
// GET /workspaces - List user's workspaces
// GET /workspaces/:id - Get workspace details
// PATCH /workspaces/:id - Update workspace
// DELETE /workspaces/:id - Delete workspace (owner only)

// Member Management
// GET /workspaces/:id/members - List members
// POST /workspaces/:id/members/invite - Invite member
// POST /workspaces/:id/members/:userId - Add member directly (admin)
// PATCH /workspaces/:id/members/:userId - Update member role
// DELETE /workspaces/:id/members/:userId - Remove member
// POST /workspaces/:id/leave - Leave workspace

// Invitations
// POST /workspaces/:id/invite/generate - Generate invite link
// GET /workspaces/join/:inviteCode - Join via invite
// POST /workspaces/:id/invite/email - Send email invites

// Channels in Workspace
// GET /workspaces/:id/channels - List workspace channels
// POST /workspaces/:id/channels - Create workspace channel

// Groups in Workspace
// GET /workspaces/:id/groups - List workspace groups
// POST /workspaces/:id/groups - Create workspace group
```

---

### Phase 3: Permission System (Week 3-4)

#### Implement Guards

```typescript
// workspace-member.guard.ts
@Injectable()
export class WorkspaceMemberGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const workspaceId = request.params.workspaceId || request.params.id;

    const membership = await this.workspaceMemberRepository.findOne({
      where: { workspaceId, userId: user.id, status: 'active' }
    });

    return !!membership;
  }
}

// workspace-admin.guard.ts
@Injectable()
export class WorkspaceAdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const workspaceId = request.params.workspaceId || request.params.id;

    const membership = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId,
        userId: user.id,
        role: In(['owner', 'admin']),
        status: 'active'
      }
    });

    return !!membership;
  }
}
```

---

### Phase 4: Frontend Implementation (Week 4-5)

#### Step 1: Workspace API Service

```typescript
// src/lib/api/endpoints/workspaces.api.ts
export const workspacesApi = {
  // Workspaces
  getAll: () => client.get('/workspaces'),
  getById: (id: string) => client.get(`/workspaces/${id}`),
  create: (data: CreateWorkspaceDto) => client.post('/workspaces', data),
  update: (id: string, data: UpdateWorkspaceDto) =>
    client.patch(`/workspaces/${id}`, data),
  delete: (id: string) => client.delete(`/workspaces/${id}`),

  // Members
  getMembers: (id: string) => client.get(`/workspaces/${id}/members`),
  inviteMember: (id: string, email: string, role: string) =>
    client.post(`/workspaces/${id}/members/invite`, { email, role }),
  updateMemberRole: (id: string, userId: string, role: string) =>
    client.patch(`/workspaces/${id}/members/${userId}`, { role }),
  removeMember: (id: string, userId: string) =>
    client.delete(`/workspaces/${id}/members/${userId}`),
  leave: (id: string) => client.post(`/workspaces/${id}/leave`),

  // Invitations
  generateInvite: (id: string) => client.post(`/workspaces/${id}/invite/generate`),
  joinByInvite: (inviteCode: string) =>
    client.get(`/workspaces/join/${inviteCode}`),
};
```

#### Step 2: Workspace Hooks

```typescript
// src/hooks/useWorkspaces.ts
export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: () => workspacesApi.getAll(),
  });
}

export function useWorkspace(id: string) {
  return useQuery({
    queryKey: ['workspaces', id],
    queryFn: () => workspacesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workspacesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['workspaces']);
    },
  });
}
```

#### Step 3: Workspace Store

```typescript
// src/lib/stores/workspace.store.ts
interface WorkspaceStore {
  currentWorkspaceId: string | null;
  workspaces: Workspace[];
  setCurrentWorkspace: (id: string | null) => void;
  addWorkspace: (workspace: Workspace) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      currentWorkspaceId: null,
      workspaces: [],

      setCurrentWorkspace: (id) => set({ currentWorkspaceId: id }),

      addWorkspace: (workspace) =>
        set((state) => ({
          workspaces: [...state.workspaces, workspace],
        })),
    }),
    { name: 'workspace-storage' }
  )
);
```

#### Step 4: UI Components

```typescript
// WorkspaceSelector.tsx - Top navigation dropdown
// WorkspaceDashboard.tsx - Main workspace view
// CreateWorkspaceDialog.tsx - Creation wizard
// WorkspaceSettings.tsx - Settings panel
// WorkspaceMembersPanel.tsx - Member management
// InviteMembersDialog.tsx - Invitation flow
// JoinWorkspaceDialog.tsx - Join via link
```

---

## 📋 Migration Strategy

### For Existing Data

```sql
-- Step 1: Add new columns (already nullable)
ALTER TABLE groups ADD COLUMN workspace_id UUID;
ALTER TABLE groups ADD COLUMN is_workspace_owned BOOLEAN DEFAULT false;

ALTER TABLE channels ADD COLUMN workspace_id UUID;
ALTER TABLE channels ADD COLUMN is_workspace_owned BOOLEAN DEFAULT false;

-- Step 2: Existing data stays NULL (personal mode)
-- No migration needed - backward compatible!

-- Step 3: Add foreign key constraints
ALTER TABLE groups ADD CONSTRAINT fk_groups_workspace
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE channels ADD CONSTRAINT fk_channels_workspace
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
```

**Result:** Existing groups/channels remain personal - zero impact!

---

## ✅ Testing Checklist

### Backend Tests

- [ ] User can create workspace
- [ ] User can join multiple workspaces
- [ ] Workspace owner can manage members
- [ ] Workspace admin has correct permissions
- [ ] Personal groups work without workspace
- [ ] Workspace groups only accessible to members
- [ ] User can leave workspace
- [ ] Workspace deletion cascades correctly
- [ ] Invite links work correctly
- [ ] Permission checks enforce access control

### Frontend Tests

- [ ] Workspace selector shows all workspaces
- [ ] Can switch between personal and workspace contexts
- [ ] Create workspace wizard works
- [ ] Invite members flow works
- [ ] Join workspace via link works
- [ ] Workspace settings update correctly
- [ ] Member management UI works
- [ ] Groups show correct context (personal vs workspace)
- [ ] Channels show correct context

---

## 🎯 After Workspace Implementation

### Next Priority Features:

1. ✅ **Notifications System** (1 week)
   - Now with workspace-aware notifications
   - Separate notification settings per workspace

2. ✅ **File Upload & Media** (1-2 weeks)
   - Workspace-level storage quotas
   - Per-workspace file management

3. ✅ **Global Search** (1 week)
   - Search within workspace
   - Search across all contexts

4. ✅ **Groups UI Integration** (1 week)
   - Personal vs workspace group creation
   - Workspace group management

5. ✅ **User Profile & Settings** (1 week)
   - Per-workspace profile settings
   - Global user preferences

---

**Total Workspace Implementation Time:** 4-5 weeks

**Benefits:**
- ✅ Full feature parity with Slack, Teams, Zoho Cliq
- ✅ Flexible personal + enterprise model
- ✅ No breaking changes to existing code
- ✅ Permission-based access control
- ✅ Scalable multi-tenant architecture

---

**Last Updated:** October 20, 2025
**Status:** Ready for implementation
**Approach:** Careful, flexible, permission-based
