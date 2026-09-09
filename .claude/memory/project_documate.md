---
name: DocuMate RiseAgain — Project Context
description: Medical document management app: stack, architecture, current state, what was built. Vertical of the DocuMate product family, focused on IDF disabled veterans and PTSD patients.
type: project
originSessionId: bf19311c-06e1-4d0e-ab24-f22f7f8be276
---
## What This Project Is
A smart medical document management platform. Users scan and upload medical documents; the system reads them via OCR, classifies, tags, and organizes them automatically.

Primary audience: IDF disabled veterans and PTSD patients.
Long-term vision: A searchable personal medical memory.

## Tech Stack
- Framework: React Native + Expo SDK 54
- Routing: expo-router (file-based routing)
- Storage: AsyncStorage via CategoriesContext
- OCR: **@react-native-ml-kit/text-recognition** (on-device, free, Hebrew support) — requires dev build
- Classification: keywordClassifier.ts
- Icons: @expo/vector-icons (Ionicons)
- Language: TypeScript
- Build: EAS Build (sharon43533 account) — project ID: e22cdd24-0c91-4e1a-928d-48288f2937d2

## Running the App
- Same network: `npx expo start --dev-client`
- Different networks: `npx expo start --dev-client --tunnel`
- Dev client APK already installed on Android device

## File Structure
```
app/
  (tabs)/
    _layout.tsx       — 5 tabs (RTL order in code): home, folders, scan (FAB), documents, profile
    home.tsx          — Home screen: greeting, AI suggestion card, recent docs
    documents.tsx     — Vault with month grouping + filter chips + grid/list view
    folders.tsx       — Hierarchical folders with drill-down navigation
    profile.tsx       — Placeholder only
    scan.tsx          — Placeholder (FAB in _layout handles scanning)
  _layout.tsx         — Root stack with document screen + I18nManager.forceRTL(true)
  index.tsx           — Redirect → home
  document.tsx        — Document view screen (breadcrumb + preview + AI summary)

components/
  ScanModal.tsx       — Scan flow: pick → OCR (ML Kit) → review → save
  DocRow.tsx          — Document row with paper thumbnail animation
  CategoryList.tsx
  CategoryManager.tsx
  ConfirmDeleteDialog.tsx
  ScrollableMenu.tsx

context/
  CategoriesContext.tsx — Global state + AsyncStorage + addDocument/deleteDocument

hooks/
  useCategoryActions.ts

keywordClassifier.ts  — classifyToCategoryId() with RULES array
constants/Colors.ts   — AppColors + SCREEN_TOP_PADDING=60
eas.json              — EAS build config (development/preview/production)
```

---

## expo-file-system v19 — CRITICAL

In Expo SDK 54, `expo-file-system` v19 broke the legacy API in the main import.
`copyAsync`, `cacheDirectory`, `documentDirectory` etc. **throw at runtime** when imported from `'expo-file-system'`.

**Fix:** Import from `'expo-file-system/legacy'`:
```typescript
import * as FileSystem from 'expo-file-system/legacy';
```
This is already done in ScanModal.tsx. Do NOT revert to `'expo-file-system'`.

`cacheDirectory` and `documentDirectory` still need `(FileSystem as any).xxx` due to missing TS types — this is expected.

---

## Persistence Fix (completed this session)

**Problem:** Files were saved as `content://` or cache URIs — these expire when the session ends or OS cleans cache. Documents disappeared on app restart.

**Fix in ScanModal.tsx `handleSave()`:**
On save, copy file from its current URI to `FileSystem.documentDirectory` (permanent, app-owned storage):
```typescript
const permanentUri = `${(FileSystem as any).documentDirectory}doc_${Date.now()}.${ext}`;
await FileSystem.copyAsync({ from: previewUri, to: permanentUri });
```
The stored URI is now a stable `file://` path that survives restarts.

Also: temp OCR file uses `scan_${Date.now()}.jpg` (not fixed `scan_temp.jpg`) to avoid collisions.

---

## ScanModal — Current UX Flow (redesigned this session)

### Design principle: PTSD-informed
- Minimize decisions at every step
- No Alert dialogs — inline feedback only
- Warm language, not error language
- One-tap save path always available

### Flow
**OCR classification succeeded:**
1. AI card: "זה נראה כמו [category] מתאריך [date]."
2. One button: "כן, שמור"
3. Success screen: ✓ "נשמר!" → auto-dismiss after 1.6s

**OCR classification failed:**
1. AI card: "לא הצלחנו לזהות — בחרי קטגוריה:"
2. Category picker auto-opens with "כללי" pre-selected
3. User taps a category → picker closes, AI card updates
4. One button: "כן, שמור" → success screen

**"פרטים נוספים" (collapsed by default):**
- Title, date, doctor (editable inline)
- "תיקייה" row → opens category picker (same picker, shared state)

### Key state variables in ScanModal
- `step`: 'pick' | 'loading' | 'preview' | 'success'
- `showCategoryPicker`: bool — auto-true when no classification
- `showDetails`: bool — false by default
- `selectedCategoryId`: null means defaults to 'generalMed' on save
- `saveError`: string | null — shown inline, with "נסה שוב" button (no Alert)

### Exit guard
`isDirty = step === 'preview'` — any exit from preview triggers confirmation dialog.
Success step bypasses this (auto-dismiss via setTimeout).

---

## OCR Pipeline
1. User picks file (camera or gallery)
2. If `content://` URI → copy to cache first (ML Kit requires file:// URI)
3. ML Kit `TextRecognition.recognize(uri)` — fully on-device, no internet needed
4. Extract: `extractTitle()`, `extractDate()` (regex DD/MM/YYYY → Hebrew), `extractDoctor()` (ד"ר / Dr. regex), `extractKeywords()`
5. `classifyToCategoryId()` → maps keywords to category ID
6. Show review screen

**Known limitation:** ML Kit Hebrew OCR quality is poor on formal government documents (IDF/Bitachon letterhead). It extracts numbers and garbled text instead of Hebrew words. Date extraction still works (numeric regex). This is a future improvement — current workaround is the category picker flow.

## Category Hierarchy
- receipts (זיכויים)
- medicalDocs (מסמכים רפואיים)
  - orthopedic (אורטופדיה)
  - cardiology (קרדיולוגיה)
  - ophthalmology (עיניים)
  - generalMed (כללי) ← default save target

---

## RTL Implementation — Rules and Pitfalls

### How forceRTL works
`I18nManager.forceRTL(true)` is called at module level in `app/_layout.tsx` (before any render).
`supportsRTL: true` is set in `app.json` under android.
Layout changes require a **full native restart** — not just `r` in terminal. JS-only changes work with `r`.

### Critical rule: textAlign
**Never use `textAlign: 'right'`** when forceRTL is active — React Native flips it to physical LEFT.
**Fix:** Remove `textAlign` entirely and let RTL handle alignment automatically.

### Critical rule: flexDirection
**Never use `flexDirection: 'row-reverse'`** in an RTL context — it double-reverses back to LTR.
**Fix:** Use `flexDirection: 'row'` (default) and reorder children in JSX instead.

### Critical rule: justifyContent and alignItems
In RTL context: `flex-start` = RIGHT side, `flex-end` = LEFT side.

### Tab bar order
Tabs in code: first child = rightmost on screen in RTL.
Current order: home → folders → scan → documents → profile
Renders as: home(right) | folders | scan(center) | documents | profile(left) ✓

---

## What's Working (as of this session)
- Scan → OCR → review → save ✓
- Files persist across app restarts ✓
- PTSD-informed UX: one-tap save, success screen, no alerts ✓
- Category picker auto-opens when classification fails ✓

## Open Issues / Next Up
- OCR Hebrew quality poor for formal documents — future improvement (Claude Vision API?)
- PDF OCR not implemented (throws PDF_NOT_SUPPORTED, falls back to manual)
- PDF viewer in document.tsx is fake (skeleton lines)
- document.tsx: AI summary is hardcoded
- home.tsx: AI suggestion card is hardcoded
- Profile screen — placeholder only
- Onboarding flow — not built yet

## Product Philosophy
- AI suggests, user confirms. Always.
- Reduce cognitive load — central design principle
- Audience: IDF veterans, PTSD patients — simple, Hebrew RTL, no pressure
- Simplicity > feature richness. Discuss before implementing complex proposals.
- Security hardening deferred until before any cloud/backend sync (see security_deferred.md)
