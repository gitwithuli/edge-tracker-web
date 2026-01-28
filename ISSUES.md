# Known Issues - Fixed

## 1. Edit Edge / Edit Log buttons unresponsive ✅ FIXED
- **Severity:** High
- **Symptom:** "Update Edge" button appears disabled (not clickable). "Edit Log" button stuck showing "Saving..." spinner without having been clicked.
- **Root cause:** Supabase queries could hang indefinitely without resolving or rejecting, leaving `loadingStates.updatingLogId` or `updatingEdgeId` in a non-null state.
- **Fix implemented:**
  - Added `withTimeout()` helper wrapping Supabase calls with 15s timeout (`src/hooks/use-edge-store.ts:110-118`)
  - Applied to `updateEdge` and `updateLog` functions
  - Timeout errors now clear loading state and show user-friendly message
  - `finally` block always clears loading state

## 2. Backtest mode resets to forwardtest after logging ✅ FIXED
- **Severity:** Medium
- **Symptom:** User clicks "Backtest" toggle on dashboard, all edges switch to backtest mode. After logging a backtest entry from an edge page, the mode resets to forwardtest.
- **Root cause:** Each page had its own local `useState` for `activeView`, defaulting to "FRONTTEST".
- **Fix implemented:**
  - Added `activeLogMode: LogType` to Zustand store (`src/hooks/use-edge-store.ts:40`)
  - Added `setActiveLogMode` action (`src/hooks/use-edge-store.ts:57`)
  - Updated dashboard, calendar, and edge pages to use store state
  - Log dialog now defaults to `activeLogMode` from store

## 3. Log dialog loses state on accidental dismiss ✅ FIXED
- **Severity:** Medium
- **Symptom:** Clicking outside the log dialog closes it and loses all entered data.
- **Fix implemented:**
  - Added `onInteractOutside={(e) => e.preventDefault()}` to prevent click-outside dismiss
  - Added `onEscapeKeyDown={(e) => e.preventDefault()}` to prevent Escape key dismiss
  - Applied to both `log-dialog.tsx` and `edge-form-dialog.tsx`
  - User must now explicitly click X button or submit to close dialogs
