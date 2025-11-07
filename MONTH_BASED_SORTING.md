# 📅 Month-Based Cycle Sorting System

## Overview
Cycles are now stored and sorted by **monthKey** (YYYY-MM format) instead of actual dates. This ensures that when you edit a cycle's dates, it maintains its chronological month position.

## How It Works

### 1. **MonthKey Format**
- Format: `YYYY-MM` (e.g., `2024-05`, `2024-06`)
- Generated from the month you're viewing in the calendar
- Stored with each cycle in Firestore

### 2. **Storage in Firestore**
```javascript
{
  id: "abc123",
  startDate: Timestamp(2024-05-15),
  endDate: Timestamp(2024-05-20),
  monthKey: "2024-05",  // ← This determines sort order
  intensity: 3,
  symptoms: {...}
}
```

### 3. **Sorting Logic**

#### Frontend (firestore.js)
```javascript
// Sorts cycles by monthKey (YYYY-MM)
cycles.sort((a, b) => {
  const keyA = a.monthKey || '';
  const keyB = b.monthKey || '';
  return keyA.localeCompare(keyB);
});
```

#### Backend (app.py)
```python
# Sorts cycles by monthKey, fallback to startDate YYYY-MM
def get_sort_key(cycle):
    if 'monthKey' in cycle and cycle['monthKey']:
        return cycle['monthKey']
    else:
        return cycle['startDate'][:7]  # "2024-05-15" -> "2024-05"

valid_cycles.sort(key=get_sort_key)
```

---

## Example Scenarios

### ✅ Scenario 1: Normal Data Entry
You add cycles month by month:

```
2024-01: Jan 15 → Jan 20
2024-02: Feb 12 → Feb 17
2024-03: Mar 11 → Mar 16
```

**Result**: Sorted as Jan → Feb → Mar ✅

---

### ✅ Scenario 2: Editing May's Dates
You have:
```
2024-04: Apr 10 → Apr 15
2024-05: May 08 → May 13  ← Original
2024-06: Jun 05 → Jun 10
```

You edit May to:
```
2024-05: May 12 → May 17  ← Updated dates
```

**Result**: Still sorted as Apr → May → Jun ✅
- May's monthKey (`2024-05`) doesn't change
- Position in list stays the same
- Only the dates within May are updated

---

### ✅ Scenario 3: Out-of-Order Date Entry
You accidentally enter:
```
2024-06: Jun 05 → Jun 10  (entered first)
2024-04: Apr 10 → Apr 15  (entered second)
2024-05: May 08 → May 13  (entered third)
```

**Result**: Automatically sorted as Apr → May → Jun ✅
- System sorts by monthKey, not entry order
- Chronological order is maintained

---

## Benefits

### 1. **Predictable Sorting**
- Cycles always appear in month order
- Editing dates doesn't change position
- No confusion about cycle order

### 2. **Easy Updates**
- Edit May's dates anytime
- May stays in May's position
- No duplicate months created

### 3. **Correct Calculations**
- Backend uses month-sorted cycles
- Cycle lengths calculated correctly
- Models receive data in proper order

---

## Testing the System

### Step 1: Check Current Sort Order
1. Go to Analysis page
2. Click **"Debug Cycles"** button
3. Check console output:

```
=== 🔍 DEBUGGING CYCLES IN STATE ===
Total cycles: 12
Cycles are sorted by monthKey to maintain chronological order

2024-01: 2024-01-15 to 2024-01-20 (3 intensity) → 28 days to next cycle
2024-02: 2024-02-12 to 2024-02-17 (3 intensity) → 28 days to next cycle
2024-03: 2024-03-11 to 2024-03-16 (3 intensity) → 28 days to next cycle
...
```

### Step 2: Test Editing
1. Go to Analysis Form
2. Navigate to May 2024
3. Change dates from May 8-13 to May 12-17
4. Save
5. Go back to Analysis page
6. Click **"Debug Cycles"** again
7. Verify May is still between April and June ✅

### Step 3: Verify Backend
1. Click **"Run Analysis"**
2. Check backend terminal:

```
📅 Cycles sorted by month: ['2024-01', '2024-02', '2024-03', ..., '2024-12']
📊 Analyzing 12 cycles from 2024-01-15 to 2024-12-18
  Cycle 1: 2024-01-15 → 2024-02-12 = 28 days
  Cycle 2: 2024-02-12 → 2024-03-11 = 28 days
  ...
```

---

## Important Notes

### ⚠️ MonthKey Must Match Month
The monthKey should match the month you're viewing in the calendar:
- Viewing May 2024 → monthKey = `2024-05`
- Viewing June 2024 → monthKey = `2024-06`

### ⚠️ One Cycle Per Month
The system is designed for **one cycle per month**:
- Each month has one entry
- Editing updates that month's entry
- No duplicates created

### ⚠️ Cycle Length Calculation
Cycle length is calculated as:
- **Days from start of one cycle to start of next cycle**
- Example: Jan 15 → Feb 12 = 28 days
- NOT the period duration (Jan 15 → Jan 20 = 5 days)

---

## Code Changes Made

### 1. Frontend: `firestore.js`
- ✅ `getCycles()` now sorts by monthKey
- ✅ Logs sorted monthKeys for debugging

### 2. Frontend: `Analysis.jsx`
- ✅ `debugCycles()` shows monthKey and cycle lengths
- ✅ Better console output for debugging

### 3. Backend: `app.py`
- ✅ Sorts cycles by monthKey (with fallback)
- ✅ Logs sorted months for verification
- ✅ Takes most recent 12 months

### 4. Frontend: `AnalysisForm.jsx`
- ✅ Already sets monthKey correctly
- ✅ Uses `addCycleWithDeduplication` to update existing months

---

## Summary

✅ **Cycles sorted by month** (YYYY-MM format)  
✅ **Editing preserves month order**  
✅ **No duplicates created**  
✅ **Backend receives correctly sorted data**  
✅ **Models calculate with proper chronological order**

Now when you edit May's dates, it will update May's cycle while keeping it between April and June!
