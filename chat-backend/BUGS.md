# Known Bugs

## Stories Module

### GET /api/v1/v1/stories - Stories Feed Query Error

**Status**: Not Fixed
**Priority**: High
**Date Found**: 2025-10-19

**Description**:
The GET /api/v1/v1/stories endpoint (stories feed) throws a PostgreSQL error related to array operations.

**Error Message**:
```
QueryFailedError: op ANY/ALL (array) requires array on right side
```

**Location**:
`src/modules/stories/stories.service.ts:105-119` (getStories method)

**Root Cause**:
The SQL query uses ANY() operator on `customViewers` and `blockedViewers` array columns. When these columns are NULL, PostgreSQL throws an error even with COALESCE attempts.

**Attempted Fix**:
Used COALESCE to replace NULL arrays with empty arrays:
```typescript
COALESCE(story.customViewers, ARRAY[]::uuid[])
COALESCE(story.blockedViewers, ARRAY[]::uuid[])
```

**Next Steps**:
1. Check if the COALESCE syntax is correct for PostgreSQL + TypeORM
2. Consider restructuring the query to use separate WHERE clauses
3. May need to use QueryBuilder's `where()` with custom SQL or use CASE statements
4. Test with actual data that has customViewers and blockedViewers populated

**Workaround**:
None - endpoint is currently broken

**Affected Endpoints**:
- GET /api/v1/v1/stories (stories feed)

**Working Endpoints**:
- POST /api/v1/v1/stories (create story) ✅
- GET /api/v1/v1/stories/me (get my stories) ✅
- GET /api/v1/v1/stories/stats/me (get stats) ✅
