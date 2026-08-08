# Manual Test: Keyboard-Only Navigation Through Admin Composer

**Requirement:** 15.7  
**Date:** ___________  
**Tester:** ___________  
**Browser:** ___________  
**Result:** ☐ Pass / ☐ Fail

## Prerequisites

- Admin user logged in to the CMS
- A page with at least 3 sections, each containing 2+ blocks
- Mouse disconnected or set aside (keyboard-only testing)
- Screen reader enabled (optional, for ARIA verification)

---

## 1. Page Load and Initial Focus

| # | Step | Expected Result | Pass |
| --- | ------ | ----------------- | ------ |
| 1.1 | Navigate to `/admin/pages/{id}/edit` using keyboard (Tab to nav link, Enter) | Composer Canvas loads with focus on first interactive element | ☐ |
| 1.2 | Press Tab once from the page top | Focus lands on the first focusable element in the admin layout (skip link or nav) | ☐ |
| 1.3 | If skip-to-content link exists, press Enter | Focus moves to the main Composer Canvas content area | ☐ |

---

## 2. Section Navigation

| # | Step | Expected Result | Pass |
| --- | ------ | ----------------- | ------ |
| 2.1 | Tab through the section list | Each section receives visible focus indicator (outline/ring) | ☐ |
| 2.2 | Press Enter/Space on a section | Section expands or becomes selected, revealing its blocks | ☐ |
| 2.3 | Continue tabbing within a section | Focus moves through section toolbar buttons (edit, delete, move-up, move-down, toggle enabled) | ☐ |
| 2.4 | Tab past the last item in a section | Focus moves to the next section or next page region | ☐ |

---

## 3. Block Navigation

| # | Step | Expected Result | Pass |
| --- | ------ | ----------------- | ------ |
| 3.1 | Tab into a section's block list | First block in the section receives focus | ☐ |
| 3.2 | Continue tabbing through blocks | Each block receives a visible focus ring in sequence | ☐ |
| 3.3 | Press Enter/Space on a focused block | Block Inspector panel opens or block enters edit mode | ☐ |
| 3.4 | Press Escape while editing a block | Block exits edit mode, focus returns to the block in the canvas | ☐ |

---

## 4. Move Up / Move Down Buttons

| # | Step | Expected Result | Pass |
| --- | ------ | ----------------- | ------ |
| 4.1 | Focus a block's "Move Up" button and press Enter | Block moves up one position in the section; focus stays on the moved block or its move button | ☐ |
| 4.2 | Focus a block's "Move Down" button and press Enter | Block moves down one position; focus stays on the moved block or its move button | ☐ |
| 4.3 | Attempt "Move Up" on the first block | Button is disabled or no action occurs; no error | ☐ |
| 4.4 | Attempt "Move Down" on the last block | Button is disabled or no action occurs; no error | ☐ |
| 4.5 | Focus a section's "Move Up" button and press Enter | Section reorders correctly; focus remains on the section | ☐ |
| 4.6 | Focus a section's "Move Down" button and press Enter | Section reorders correctly; focus remains on the section | ☐ |

---

## 5. Slash Commands (Block Insertion)

| # | Step | Expected Result | Pass |
| --- | ------ | ----------------- | ------ |
| 5.1 | Focus the "Add Block" button or slash command trigger and press Enter | Slash command menu/popover appears | ☐ |
| 5.2 | Type to filter block types (e.g., "head") | List filters to show matching block types (e.g., "Heading") | ☐ |
| 5.3 | Use Arrow Down/Up to navigate the slash menu | Each menu item receives visible focus sequentially | ☐ |
| 5.4 | Press Enter on a menu item | New block of that type is inserted; menu closes; focus moves to the new block or its editor | ☐ |
| 5.5 | Press Escape while slash menu is open | Menu closes without inserting a block; focus returns to the trigger | ☐ |

---

## 6. Dialog Open/Close with Escape

| # | Step | Expected Result | Pass |
| --- | ------ | ----------------- | ------ |
| 6.1 | Tab to "Delete Block" button and press Enter | Confirmation dialog appears with focus trapped inside | ☐ |
| 6.2 | Press Tab inside the dialog | Focus cycles between dialog elements (Cancel, Confirm, Close) without escaping to background | ☐ |
| 6.3 | Press Escape | Dialog closes; focus returns to the element that triggered it | ☐ |
| 6.4 | Open the conflict (409) dialog (simulate by editing stale content) | Dialog appears, focus is trapped inside | ☐ |
| 6.5 | Press Escape on the conflict dialog | Dialog dismisses; user remains on the page | ☐ |
| 6.6 | Open MediaPicker dialog via keyboard (Tab to media field, Enter) | MediaPicker dialog appears with focus on search/first item | ☐ |
| 6.7 | Press Escape in MediaPicker | Dialog closes; focus returns to the media field trigger | ☐ |

---

## 7. Undo/Redo (Ctrl+Z / Ctrl+Shift+Z)

| # | Step | Expected Result | Pass |
| --- | ------ | ----------------- | ------ |
| 7.1 | Make a change (add a block or move a block), then press Ctrl+Z | Change is undone; canvas reflects previous state | ☐ |
| 7.2 | Press Ctrl+Z again | Previous change is undone (stack works correctly) | ☐ |
| 7.3 | Press Ctrl+Shift+Z (or Ctrl+Y) | Last undo is re-applied (redo) | ☐ |
| 7.4 | Press Ctrl+Z when undo stack is empty | No action; no error or crash | ☐ |
| 7.5 | Press Ctrl+Shift+Z when redo stack is empty | No action; no error or crash | ☐ |

---

## 8. Drag-and-Drop Alternative (Keyboard Reorder)

| # | Step | Expected Result | Pass |
| --- | ------ | ----------------- | ------ |
| 8.1 | Focus a block and activate keyboard reorder mode (Space or designated key) | Block enters "picked up" state; screen reader announces reorder mode | ☐ |
| 8.2 | Press Arrow Up/Down to reposition | Block moves position; live region announces new position | ☐ |
| 8.3 | Press Space/Enter to drop | Block is placed at new position; reorder mode exits | ☐ |
| 8.4 | Press Escape during reorder | Block returns to original position; reorder mode exits | ☐ |

---

## 9. Focus Indicators and Visibility

| # | Step | Expected Result | Pass |
| --- | ------ | ----------------- | ------ |
| 9.1 | Tab through all interactive elements on the page | Every focusable element has a visible focus indicator (ring, outline, or highlight) | ☐ |
| 9.2 | Verify focus is never lost (disappears to an invisible element) | Focus always visible; no "lost focus" situations | ☐ |
| 9.3 | Check focus order is logical (top-to-bottom, left-to-right for LTR; right-to-left for RTL) | Tab order matches visual layout | ☐ |
| 9.4 | Verify no focus traps outside of dialogs | User can Tab away from any non-dialog component | ☐ |

---

## 10. Autosave and Status Indicators

| # | Step | Expected Result | Pass |
|---|------|-----------------|------|
| 10.1 | Make changes and wait for autosave | Status indicator updates (e.g., "Saving..." → "Saved"); change announced via live region if screen reader enabled | ☐ |
| 10.2 | Navigate to the save status indicator with Tab | Indicator is reachable and its state is accessible (aria-live or role="status") | ☐ |

---

## 11. Preview and Device Switcher

| # | Step | Expected Result | Pass |
| --- | ------ | ----------------- | ------ |
| 11.1 | Tab to device preview switcher (Desktop/Tablet/Mobile) | Switcher buttons are focusable | ☐ |
| 11.2 | Press Enter/Space on a device option | Preview viewport changes to selected device size | ☐ |
| 11.3 | Tab to locale switcher (fa/en) | Locale buttons are focusable | ☐ |
| 11.4 | Press Enter/Space on locale option | Preview updates to selected locale | ☐ |

---

## Notes / Issues Found

| Issue # | Description | Severity | Screenshot/Recording |
| --------- | ------------- | ---------- | --------------------- |
| | | | |
| | | | |
| | | | |

---

## Summary

- **Total checks:** 42
- **Passed:** ___
- **Failed:** ___
- **Blocked/N/A:** ___

**Overall Result:** ☐ Pass / ☐ Fail

**Tester Signature:** ___________  
**Date:** ___________
