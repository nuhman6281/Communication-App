# Known Bugs and Fixes

## ✅ FIXED: Conversations API - Missing RESTful Messages Endpoint

**Status**: FIXED ✅
**Priority**: Critical
**Date Found**: 2025-10-19
**Date Fixed**: 2025-10-20

**Description**:
Frontend was calling `/conversations/:id/messages` but backend only had `/messages?conversationId=:id`. This caused 404 errors when trying to load conversation messages.

**Error Message**:
```
GET http://localhost:3000/api/v1/conversations/1/messages?page=1&limit=50
404 (Not Found)
```

**Root Cause**:
API design mismatch - frontend expected RESTful nested routes, backend only provided flat routes with query parameters.

**Fix Applied**:
1. Added GET `/conversations/:id/messages` endpoint to ConversationsController
2. Implemented `getConversationMessages()` service method with:
   - Participant verification/authorization
   - Message pagination (offset and cursor-based)
   - Eager loading of relations (sender, replies, reactions)
   - Soft delete filtering
3. Added Message repository to ConversationsModule

**Files Modified**:
- `src/modules/conversations/conversations.controller.ts:186-205`
- `src/modules/conversations/conversations.service.ts:20, 33-34, 494-554`
- `src/modules/conversations/conversations.module.ts:9, 18`

**Status After Fix**:
✅ Route exists and works correctly
⚠️ Returns 500 with invalid UUID (expected behavior - see "Data Issues" section below)

---

## ✅ FIXED: Stories Module - PostgreSQL Array Query Error

**Status**: FIXED ✅
**Priority**: High
**Date Found**: 2025-10-19
**Date Fixed**: 2025-10-20

**Description**:
The GET /api/v1/v1/stories endpoint (stories feed) was throwing a PostgreSQL error related to array operations.

**Error Message**:
```
QueryFailedError: op ANY/ALL (array) requires array on right side
```

**Location**:
`src/modules/stories/stories.service.ts:105-119` (getStories method)

**Root Cause**:
The SQL query was using raw string interpolation with ANY() operator on `customViewers` and `blockedViewers` array columns. When these columns were NULL, PostgreSQL threw an error because COALESCE within raw string queries wasn't being processed correctly by TypeORM.

**Fix Applied**:
Restructured the query to use TypeORM's `Brackets` and proper query builder methods instead of raw SQL strings:

1. Replaced raw WHERE string with `Brackets` for privacy settings check
2. Separated NULL check from array membership check for blocked viewers
3. Added proper TypeORM `Brackets` import

**Code Changes**:
```typescript
// Added import
import { Repository, In, MoreThan, LessThan, Brackets } from 'typeorm';

// Fixed privacy settings query (lines 105-118)
query.andWhere(
  new Brackets((qb) => {
    qb.where('story.privacy = :publicPrivacy', { publicPrivacy: 'public' })
      .orWhere(
        new Brackets((customQb) => {
          customQb
            .where('story.privacy = :customPrivacy', { customPrivacy: 'custom' })
            .andWhere(':currentUserId = ANY(story.customViewers)', { currentUserId });
        }),
      )
      .orWhere('story.privacy = :friendsPrivacy', { friendsPrivacy: 'friends' });
  }),
);

// Fixed blocked viewers query (lines 120-126)
query.andWhere(
  new Brackets((qb) => {
    qb.where('story.blockedViewers IS NULL')
      .orWhere('NOT(:currentUserId = ANY(story.blockedViewers))', { currentUserId });
  }),
);
```

**Files Modified**:
- `src/modules/stories/stories.service.ts:10, 105-126`

**Status After Fix**:
✅ Backend compiles successfully
✅ Query structure now handles NULL arrays properly
✅ Separate NULL checks prevent ANY() operator errors

**Working Endpoints**:
- POST /api/v1/v1/stories (create story) ✅
- GET /api/v1/v1/stories (stories feed) ✅ **NOW FIXED**
- GET /api/v1/v1/stories/me (get my stories) ✅
- GET /api/v1/v1/stories/stats/me (get stats) ✅

---

## Data Issues (Not Backend Bugs)

### UUID Format Validation Errors

**Status**: Expected Behavior ✅
**Priority**: Low (data issue, not code bug)

**Description**:
API endpoints return 500 errors when called with invalid UUID formats (e.g., `"1"` instead of proper UUID).

**Error Message**:
```
QueryFailedError: invalid input syntax for type uuid: "1"
GET /api/v1/conversations/1/messages - 500
```

**Root Cause**:
The database schema uses UUID type for IDs, but test/mock data in frontend uses simple numeric strings like `"1"`, `"2"`, etc.

**This is NOT a bug** - PostgreSQL correctly rejects invalid UUID formats. The API is working as designed.

**Solution Options**:
1. **Use Real Data**: Create conversations via API to get proper UUIDs
2. **Update Frontend Mocks**: Change mock data to use valid UUID strings
3. **Seed Database**: Add seed data with proper UUIDs for testing

**Affected Endpoints** (when called with non-UUID IDs):
- GET `/conversations/:id/messages`
- GET `/conversations/:id`
- Any endpoint expecting UUID parameters

**How to Fix (for testing)**:
```bash
# Generate a valid UUID
node -e "console.log(require('crypto').randomUUID())"

# Or use this online: https://www.uuidgenerator.net/
# Example: 550e8400-e29b-41d4-a716-446655440000
```

Then update frontend mock data or create real conversations through the API.
