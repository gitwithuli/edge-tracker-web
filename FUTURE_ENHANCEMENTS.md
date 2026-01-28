# Future Enhancements

## Shareable Macro Stats Card

**Priority:** Nice to have
**Status:** Planned

### Description
Make the daily macro stats summary card shareable, similar to the Calendar P&L share functionality.

### Location
`src/app/macros/page.tsx` - The "Today's Summary" card showing:
- Logged count (e.g., "16 logged")
- Average points (e.g., "34 pts avg")
- Up/Down/Flat breakdown (e.g., "↑ 6  ↓ 1  — 8")

### Implementation Plan

1. **Create `ShareMacroStatsDialog` component** (`src/components/macros/share-macro-stats-dialog.tsx`)
   - Follow the pattern from `src/components/calendar-pnl/share-calendar-dialog.tsx`
   - Use `html-to-image` with `toPng()` at 3x pixel ratio

2. **Card Design**
   - Dark gradient background matching existing share cards
   - Edge of ICT branding (logo, name, URL in footer)
   - Session name prominently displayed (Asia/London/New York)
   - Date of the stats
   - Main stats: logged count, avg points, directional breakdown
   - Optional: Include time window breakdown if space permits

3. **Props Interface**
   ```tsx
   interface ShareMacroStatsDialogProps {
     session: "Asia" | "London" | "New York";
     date: string;
     stats: {
       logged: number;
       avgPoints: number;
       up: number;
       down: number;
       flat: number;
     };
     trigger: React.ReactNode;
   }
   ```

4. **Share Actions**
   - Download PNG
   - Copy to clipboard
   - Share on X (copy image + open tweet composer with pre-filled text)

5. **Integration**
   - Add share button to the Today's Summary card header
   - Use Share2 icon consistent with other share buttons

### Reference Files
- `src/components/calendar-pnl/share-calendar-dialog.tsx` - Pattern to follow
- `src/components/share-card-dialog.tsx` - Original share card implementation
