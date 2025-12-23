# Recent Changes - December 22, 2025

## 🔧 Bug Fixes

### 1. Fixed Participant Count in Join Page

**Issue:** The participant count on the JoinRetro page was not showing the correct number of active participants.

**Root Cause:** The backend was returning participants from in-memory storage instead of active WebSocket connections.

**Solution:** Updated `backend/src/controllers/retroController.ts`:
- Import `wsManager` from websocket manager
- Modified `getRetroById` to fetch active participants from WebSocket room first
- Falls back to storage participants if no active connections
- Maps storage participants to include `isCreator` field for type compatibility

**Files Modified:**
- `backend/src/controllers/retroController.ts`

**Code Changes:**
```typescript
// Now gets ACTIVE participants from WebSocket room
let participants = wsManager.getRoomParticipants(id);
if (participants.length === 0) {
  // Fallback to storage if no active WebSocket connections
  const storageParticipants = getParticipantsByRetroId(id);
  participants = storageParticipants.map(p => ({
    id: p.id,
    name: p.name,
    joinedAt: p.joinedAt,
    isCreator: false
  }));
}
```

---

## ✨ New Feature

### 2. Added New Template: "What Went Well, What Went Less Well, What to Try Next, What Puzzles Us"

**Template Details:**
- **ID:** `0`
- **Name:** "What Went Well, What Went Less Well, What to Try Next, What Puzzles Us"
- **Description:** "Comprehensive reflection on successes, challenges, future experiments, and questions"
- **Position:** Top of the template list (appears first)

**Columns:**
1. **What Went Well** (Green #22c55e)
   - Placeholder: "What worked well in this sprint?"
   
2. **What Went Less Well** (Orange #f59e0b)
   - Placeholder: "What could have gone better?"
   
3. **What to Try Next** (Blue #3b82f6)
   - Placeholder: "What experiments should we try?"
   
4. **What Puzzles Us** (Purple #8b5cf6)
   - Placeholder: "What questions do we have?"

**Files Modified:**
- `backend/src/data/templates.ts`

**Why This Template:**
This is a popular and comprehensive retrospective format that:
- ✅ Encourages positive reflection (What Went Well)
- ✅ Identifies improvement areas (What Went Less Well)
- ✅ Promotes experimentation (What to Try Next)
- ✅ Surfaces blockers and questions (What Puzzles Us)
- ✅ Suitable for teams of all maturity levels

---

## 📋 Template Order

The new template appears at the **top** of the list. Current template order:

1. ⭐ **NEW**: What Went Well, What Went Less Well, What to Try Next, What Puzzles Us (4 columns)
2. Start, Stop, Continue (3 columns)
3. Mad, Sad, Glad (3 columns)
4. Liked, Learned, Lacked, Longed For (4 columns)
5. Sailboat (4 columns)

---

## 🧪 Testing Checklist

### Participant Count Fix:
- [ ] Create a new retro
- [ ] Open join page - should show "0 people already joined"
- [ ] Join the retro from another browser/tab
- [ ] Refresh join page - should show "1 person already joined"
- [ ] Add more participants - count should update correctly
- [ ] Check that WebSocket participants are counted, not storage

### New Template:
- [ ] Create new retro
- [ ] Open template dropdown
- [ ] Verify new template appears **first** in the list
- [ ] Select the new template
- [ ] Verify it creates retro with 4 columns
- [ ] Check column colors match design (Green, Orange, Blue, Purple)
- [ ] Verify placeholders are correct
- [ ] Test adding cards to each column

---

## 🚀 Deployment Notes

### Backend Changes:
- Restart backend server to load new template
- No database migrations needed (in-memory storage)

### Frontend Changes:
- No frontend changes required
- Template fetched from backend API

### Commands:
```bash
# Restart backend
cd backend
npm run dev  # or npm start for production

# No frontend rebuild needed
```

---

## 📝 Additional Notes

### Participant Count Logic:
The new logic prioritizes **active** participants (those with WebSocket connections) over storage participants. This ensures:
- More accurate real-time participant counts
- Better reflection of who's actually in the session
- Fallback to storage for cases where WebSocket hasn't initialized yet

### Template Design:
The 4-column layout provides a balanced view:
- Positives (What Went Well)
- Negatives (What Went Less Well)  
- Actions (What to Try Next)
- Questions (What Puzzles Us)

This encourages comprehensive team reflection without being overwhelming.

---

**Status:** ✅ Ready for Testing
**Date:** December 22, 2025
**Changes By:** GitHub Copilot
