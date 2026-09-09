# DocuMate RiseAgain — AI-Powered Medical Document Classifier

> **For:** IDF disabled veterans and PTSD patients  
> **Vision:** A personal medical memory — automatically organized, searchable, and AI-enhanced  
> **Status:** MVP with OCR ✓ | Keyword classifier + confidence + correction loop ✓ | Labeling tool ✓ | ML model (LaBSE) → Next

---

## 📌 About the Naming

**This repo is `DocuMate-RiseAgain`** — one vertical of a broader product family called **DocuMate**.

### Product hierarchy

- **DocuMate** — umbrella product name. What users see as the brand in the app's home screen top bar (`app/(tabs)/home.tsx:45`).
- **DocuMate RiseAgain** — this vertical (for IDF disabled veterans and PTSD patients). The full name for repo-level identifiers.
- **DocuMate Family** *(planned, separate repo)* — household use case: family medical, school forms, insurance.
- **DocuMate Business** *(planned, separate repo)* — business use case: invoices, contracts, HR.

### Technical identifiers (all follow the `documate.<vertical>` pattern)

| Identifier | Value |
|---|---|
| GitHub repo | `SharoniiS/DocuMate-RiseAgain` |
| `app.json` name | `DocuMate RiseAgain` |
| `app.json` slug | `documate-riseagain` |
| `app.json` scheme | `documateriseagain://` (deep links) |
| Android package | `com.sharon43533.documate.riseagain` |
| npm name | `documate-riseagain` |

### Legacy names in git history only

- **Documately** — early working title, dropped in favor of DocuMate. Only appears in older commits.
- **RiseAgain** (bare, no "DocuMate" prefix) — the technical identifiers used to be just `RiseAgain` / `riseagain` / `com.sharon43533.riseagain`. Fully renamed in the technical-identifier cleanup commit. Only appears in older commits and any old EAS build history.

### Rules for anyone touching the codebase

- **User-facing UI brand:** `DocuMate` (short, umbrella name). Do not put "RiseAgain" in day-to-day UI copy.
- **Documentation, PR titles, memory files, repo/package identifiers:** `DocuMate RiseAgain`.
- **New vertical (Family, Business):** spin up a fresh repo with the same pattern (`SharoniiS/DocuMate-Family`, `com.sharon43533.documate.family`, etc.). Do not reuse this repo.
- **Never introduce** the names `Documately` or bare `RiseAgain` in new code, docs, or commit messages — they are legacy.

---

## 🎯 Project Overview

**DocuMate RiseAgain** is a React Native app that lets users:
1. **Scan** physical medical documents (photos/PDFs)
2. **Extract** text via OCR (on-device, private)
3. **Classify** documents automatically using ML (keyword rules → LaBSE embeddings → logistic regression)
4. **Organize** into smart categories
5. **Remember** with human feedback (corrections train the model)

**Key design principle:** AI suggests, user confirms. Always.

---

## 📊 System Architecture

### Current State (MVP — Phase 1)
- ✅ React Native + Expo (SDK 54, TypeScript)
- ✅ OCR: @react-native-ml-kit/text-recognition (on-device, free, Hebrew)
- ✅ Classification: **Generic** keyword classifier (takes rules as input — see Phase 1.5)
- ✅ Storage: AsyncStorage (on-device, persistent) with auto-migration on schema changes
- ✅ UI: Tab-based navigation (home, folders, scan FAB, documents, **review**, profile)
- ✅ File handling: Permanent `documentDirectory` storage, temp cache cleanup

### Current State (Phase 1.5 — Labeling & Feedback Infrastructure)
- ✅ **Confidence scoring** — every prediction returns `{categoryId, confidence: 0..1, matched: string[]}`
- ✅ **Prediction provenance** — every saved doc permanently records what the AI guessed (`predictedCategoryId`, `predictedConfidence`, `matchedKeywords`, `wasCorrected`, full `ocrText`)
- ✅ **Re-classification post-save** — `moveDocument` primitive keeps the prediction frozen while updating the actual category, so corrections are never lost
- ✅ **Review tab** — counters (total / corrected / low-confidence), filters (all / corrected / low-confidence / unlabeled), per-row move action, JSON export to disk
- ✅ **Category-agnostic classifier** — keywords live on the `Category` object itself; adding a new category = one entry in `constants/defaultCategories.ts`, zero classifier changes

### Planned ML System (Phase 2-7 — Multi-month rollout)

```
┌─────────────────────────────────────────────────────────────────┐
│                     PHASE 2: Data Collection                    │
│  50-80 real medical documents (Hebrew) → manual labels → dataset│
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   PHASE 3: Train ML Model                       │
│  LaBSE embeddings (768D) → PCA (256D) → LogisticRegression      │
│  Validation gates: 85% F1 overall, 70% F1 per-category minimum  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 PHASE 4: Integrate to App                       │
│  Replace keyword → ONNX runtime inference (on-device)           │
│  Confidence threshold (0.65) → auto-open category picker        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              PHASE 5: Human-in-the-Loop Feedback                │
│  User corrections stored → export → retrain pipeline            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│           PHASE 6: Performance Testing & Rollout                │
│  Latency <200ms avg, <500ms P99 | Accuracy ≥80%                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│        PHASE 7: Deployment with Monitoring & Versioning         │
│  Model versioning (timestamps), runtime metrics, alerts         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏷️ Phase 1.5 — Labeling & Feedback Infrastructure

This phase bridges the MVP and Phase 2 (Data Collection). Before feeding real medical documents into a future ML pipeline, the app needs to (a) make the keyword classifier honest about its uncertainty, (b) capture every disagreement between AI and human as labeled data, and (c) make it easy for the developer and a small group of colleagues to upload documents and correct mistakes in-app.

### What changed architecturally

| Before | After |
|---|---|
| `classifyToCategoryId(text)` returned `string \| null` with no confidence | `classify(text, rules)` returns `{categoryId, confidence: 0..1, matched: string[]}` |
| Keywords lived inside `keywordClassifier.ts`, glued to category IDs via a hardcoded `idMap` | Keywords live on the `Category` object in `constants/defaultCategories.ts`. The classifier knows nothing about specific category IDs. |
| First rule that matched won | Best rule wins (most distinct keywords matched). |
| Confidence was binary (1 or 0) and meaningless | `confidence = min(1, matched.length / 3)`: 1 match = 0.33, 2 = 0.67, 3+ = 1.0. Tune once real correction data exists. |
| User could override the AI's guess in the preview screen, but the prediction was discarded on save | Every saved doc permanently records `predictedCategoryId`, `predictedConfidence`, `matchedKeywords`, `wasCorrected`, and full `ocrText`. The prediction is never mutated — it's the historical truth. |
| No way to fix a wrong classification post-save without deleting | `moveDocument(fromCatId, idx, toCatId)` in `CategoriesContext`. Updates `wasCorrected` based on prediction vs. new actual category. |
| Multi-word keywords like `"עמוד שדרה"` or `"לחץ דם"` silently never matched | Classifier matches against the joined normalized text, so multi-word keywords work. |

### The correction loop

```
User scans document
   ↓
OCR (ML Kit, on-device, Hebrew-aware)
   ↓
Generic keyword classifier — input: text + rules built from categories
   ↓
{categoryId, confidence, matched} returned to ScanModal
   ↓
   confidence ≥ 0.67 → trust silently, pre-select category
   0 < conf < 0.67 → pre-select + auto-open picker for confirmation
   confidence = 0   → fall back to generalMed + open picker
   ↓
User saves (with or without overriding)
   ↓
addDocument() persists: uri, title, keywords, predictedCategoryId,
              predictedConfidence, matchedKeywords, wasCorrected, ocrText
   ↓
Review tab shows AI prediction vs actual location for every doc
   ↓
User taps folder icon on a wrong row → moveDocument()
   → predictedCategoryId stays frozen; only actual location + wasCorrected update
   ↓
User taps Export FAB → exportFeedbackData() writes feedback_<ts>.json
              to FileSystem.documentDirectory
   ↓
Developer pulls file via Xcode / `adb pull` → seeds Phase 2 dataset
```

### Key files and primitives

| Path | What it does |
|---|---|
| `keywordClassifier.ts` | Pure function `classify(text, rules)`. No knowledge of specific categories. |
| `constants/classifier.ts` | `CONFIDENCE_THRESHOLD = 0.67`, `FALLBACK_CATEGORY_ID = 'generalMed'`. Single source of truth — never inline these literals elsewhere. |
| `constants/defaultCategories.ts` | Seed data with `keywords?: string[]` per category. **To add a category: add one entry here. Done. Zero classifier changes.** |
| `context/CategoriesContext.tsx` | `Category` and `CategoryItem` types (with prediction fields). `addDocument` / `deleteDocument` / `moveDocument`. AsyncStorage hydration with auto-migration (fills in missing `keywords` from `DEFAULT_CATEGORIES` for categories saved before this refactor). |
| `components/ScanModal.tsx` | Scan UX. Stores predictions in component state (never mutated after `processFile`) and passes them to `addDocument` at save time. |
| `components/CategoryPickerModal.tsx` | Reusable bottom-sheet picker. Used by the Review tab and document detail screen. |
| `app/(tabs)/review.tsx` | The labeling tool. Counters + filters + per-row move + JSON export. |
| `app/document.tsx` | "AI suggestion" card showing predicted category, confidence %, matched keywords, and a "שנה תיקייה" button that calls `moveDocument` and rewrites the route. |
| `utils/feedback.ts` | `exportFeedbackData(categories)` → `FeedbackRecord[]`. Shape: `{predicted, actual, confidence, matched, wasCorrected, ocrText, createdAt}`. Only includes items where `predictedCategoryId !== undefined`. |

### Export format

```json
[
  {
    "predicted": "medicalDocs",
    "actual": "cardiology",
    "confidence": 0.33,
    "matched": ["טיפול"],
    "wasCorrected": true,
    "ocrText": "תאריך: 15/05/2026\nאבחון: לחץ דם גבוה\nטיפול: ...",
    "createdAt": "2026-05-15T14:30:22.000Z"
  }
]
```

This is the seed format for Phase 2 (`dataset.json`). The shape intentionally separates `predicted` from `actual` and keeps the raw OCR text — both pieces matter for retraining and for analyzing where the rule classifier was systematically wrong.

### Where the export file goes

Tapping the export FAB writes `feedback_<timestamp>.json` to `FileSystem.documentDirectory`, which is sandboxed per platform:
- **iOS sim:** `~/Library/Developer/CoreSimulator/Devices/<device>/data/Containers/Data/Application/<app>/Documents/`
- **iOS device:** Pull via Xcode → Devices → app → Container
- **Android:** `adb shell run-as <pkg> ls files/` or via Android Studio's Device File Explorer

For nicer "AirDrop / email to colleague" UX, add `expo-sharing` and call `Sharing.shareAsync(path)` after the write. Intentionally not done yet — adds a dep that isn't needed for the developer workflow today.

### Privacy note for this phase

We **do** persist the full OCR text on every saved document (`ocrText`), and it leaves the device only when the developer manually exports + pulls the JSON file. The data stays in AsyncStorage (unencrypted; iOS sandbox + file protection, Android private dir) for now. Before any cloud sync or pilot beyond the developer's circle, add an explicit consent flow and encryption — see `.claude/memory/security_deferred.md`.

---

## 🧠 ML Pipeline Details

### Why This Architecture?

| Component | Choice | Why |
|-----------|--------|-----|
| **Embedding** | LaBSE (768D) | Multilingual, Hebrew-aware, pre-trained on billions |
| **Dimensionality** | PCA → 256D | Prevents overfitting on small datasets (50-100 samples) |
| **Classifier** | LogisticRegression | Interpretable, fast, handles imbalanced classes with `class_weight='balanced'` |
| **Export** | ONNX | Industry standard, runs on iOS/Android/Web without TensorFlow/PyTorch |
| **Inference** | On-device | Privacy (medical data never leaves phone) + works offline |
| **Validation** | Stratified K-fold | Preserves class distribution, prevents data leakage |

### Document Categories (6 target classes)

```
1. receipts (קבלות) — medical receipts/invoices
2. orthopedic (אורטופדיה) — orthopedic reports
3. cardiology (קרדיולוגיה) — cardiac/heart docs
4. ophthalmology (עיניים) — eye/ophthalmology docs
5. generalMed (כללי רפואי) — general medical reports
6. medicalDocs (מסמך רפואי כללי) — catch-all medical document
```

**Target:** ≥8 examples per category (50-100 total) for Phase 2 dataset.

### Training Pipeline

```python
# Phase 3: scripts/train.py
1. load_dataset()              → Load dataset.json, log distribution
2. embed_texts()               → LaBSE embeddings (768D)
3. reduce_dimensionality()     → PCA to 256D
4. train_classifier()          → LogisticRegression + stratified K-fold
5. compute_per_category_metrics() → F1, precision, recall, confusion matrix
6. analyze_confidence()        → Histogram at thresholds (0.50, 0.65, 0.80, 0.90)
7. export_onnx()              → Convert to ONNX + timestamp versioning

Output:
  model_v{YYYYMMDD_HHMMSS}.onnx      — Versioned model
  label_encoder.json                 — Class names
  model_metrics.json                 — Per-category F1 + stats
  training_log.json                  — Run metadata
```

### Validation Gates (must pass all)

```
✅ Overall F1 ≥ 85%
✅ Per-category F1 ≥ 70% (all categories)
✅ ≥60% of predictions have confidence ≥ 0.65
```

**If gates fail:** Review confusion matrix, collect more examples in weak categories, retrain.

---

## 📱 Mobile Integration (Phase 4)

### Current Flow (Keyword-based)
```
User picks image → OCR (ML Kit) → Keyword rules → Auto-assign category → Review/Edit → Save
```

### Phase 4 Flow (ML-based with Fallback)
```
User picks image → OCR (ML Kit) → ML model inference (ONNX) 
  ↓ Confidence ≥ 0.65 → Auto-assign + show confidence
  ↓ Confidence < 0.65 → Open category picker (user confirms)
  ↓ Save + record correction (if user overrides)
```

### Key Components

**`app/utils/classifier.ts`** (to be created)
```typescript
classifyDocument(text: string) → category: string
classifyDocumentWithConfidence(text: string) → {category, confidence}
```
- Loads ONNX model + label_encoder.json from `app/assets/model/`
- Fallback to keyword classifier if ONNX fails
- Inference ~100-200ms per document

**`context/FeedbackContext.tsx`** (to be created)
```typescript
recordCorrection({text, predictedCategory, correctCategory, timestamp})
exportFeedback() → JSON for Phase 5 retraining
```
- Stores corrections in AsyncStorage
- Timestamp-based tracking for analytics

**`components/ScanModal.tsx`** (to be updated)
- Replace keyword classifier call with `classifyDocumentWithConfidence()`
- If confidence < 0.65 → auto-open category picker
- Wire correction recording to FeedbackContext

---

## 🔄 Human-in-the-Loop (Phase 5)

### Feedback Loop

```
1. User scans document (ML predicts category)
2. User overrides prediction (if wrong) → Correction recorded
3. Profile screen: "Export Corrections" button
4. Developer downloads corrections.json (contains all overrides)
5. Run: python scripts/export_feedback.py --retrain
   - Merge corrections into dataset.json
   - Run train.py automatically
   - New model_v{timestamp}.onnx generated
6. Update app with new model
```

**Key:** Every correction is labeled with {text, predicted, actual, timestamp}. This builds a growing, high-quality dataset.

---

## 📊 Data Collection Workflow (Phase 2)

### Recommended Approach: Batch Labeling Script

```bash
# Phase 2: scripts/batch_label.py
python scripts/batch_label.py --input /path/to/photos --output dataset.json

Workflow:
1. Scan folder for images
2. For each image:
   - Run OCR (Google Vision API)
   - Show preview text to user
   - User picks category (1-6) from CLI menu
   - Append {text, category, timestamp} to dataset.json
3. Resume mid-session (skips already-labeled files)
4. Summary: Show distribution, warn if unbalanced
```

**Deliverable:** `dataset.json`
```json
[
  {"text": "תאריך: 15/05/2025 אבחון: דלקת מפרקים...", "category": "orthopedic", "timestamp": "..."},
  {"text": "קבלה מהתרופיה...", "category": "receipts", "timestamp": "..."},
  ...
]
```

**Target:** 50-100 documents, ≥8 per category, balanced distribution.

---

## 🎛️ Validation & Testing (Phase 6)

### Validation Script (Phase 3)

```bash
python scripts/validate_model.py

Output:
  ✅ Overall F1: 87% (PASS ≥85%)
  ✅ Orthopedic F1: 82% (PASS ≥70%)
  ⚠️  Receipts F1: 71% (MARGINAL ≥70%)
  ❌ Cardiology F1: 68% (FAIL <70%) → Collect more examples
  
Confusion Matrix: Which categories are confused with each other?
Recommendation: "Collect 5 more cardiology examples, focus on government letterheads"
```

### Performance Testing Checklist (Phase 6)

```
Latency:
  ✅ Average inference: <200ms
  ✅ P99 (worst case): <500ms
  
Accuracy:
  ✅ Manual test on 10 new documents: ≥80% accuracy
  ✅ Fallback when ONNX fails: Works smoothly
  
Edge Cases:
  ✅ Blurry/rotated images → Category picker opens
  ✅ Handwritten text → Graceful fallback
  ✅ PDF documents → Manual category entry works
```

---

## 🚀 Deployment (Phase 7)

### Model Versioning

```
model_v20260515_143022.onnx  ← Timestamp = YYYYMMDD_HHMMSS
model_v20260515_120000.onnx  ← Previous version (kept for rollback)
model_v20260514_180000.onnx  ← Even older (if needed)
```

**Strategy:** Keep last 3 models. If new model performs poorly, rollback to previous via app config.

### Runtime Metrics (Phase 7)

```typescript
// app/utils/classifierMetrics.ts
Track over 7-day rolling window:
  - Inference latency (avg, P95, P99)
  - Per-category accuracy (user corrections)
  - Confidence distribution
  - Fallback rate (when confidence < 0.65)
  
Alerts:
  ⚠️  If accuracy drops >5% from baseline
  ⚠️  If latency exceeds 500ms consistently
  🔔 If fallback rate >30% (model degrading)
```

---

## 📁 File Structure (Current + Planned)

```
DocuMate-RiseAgain/
  ├── app/
  │   ├── (tabs)/
  │   │   ├── _layout.tsx           # Tab bar + FAB
  │   │   ├── home.tsx              # Home screen (greeting, recent docs)
  │   │   ├── documents.tsx         # Vault with filters
  │   │   ├── folders.tsx           # Category hierarchy
  │   │   ├── scan.tsx              # FAB hook (modal lives in _layout)
  │   │   ├── review.tsx            # ✅ Labeling tool — counters, filters, per-row move, export
  │   │   └── profile.tsx           # User profile (placeholder)
  │   ├── _layout.tsx               # Root with RTL + CategoriesProvider
  │   ├── index.tsx                 # → home
  │   ├── document.tsx              # Document detail (now shows AI suggestion + change-category btn)
  │   └── manage-categories.tsx     # Category CRUD
  │
  ├── components/
  │   ├── ScanModal.tsx             # Scan UX (OCR → classify → save w/ prediction capture)
  │   ├── CategoryPickerModal.tsx   # ✅ Reusable bottom-sheet picker
  │   ├── DocRow.tsx                # Document row
  │   ├── CategoryList.tsx          # Category listing
  │   ├── CategoryManager.tsx       # Add/delete categories
  │   └── ConfirmDeleteDialog.tsx   # Delete confirmation
  │
  ├── constants/
  │   ├── Colors.ts                 # Theme palette
  │   ├── classifier.ts             # ✅ CONFIDENCE_THRESHOLD, FALLBACK_CATEGORY_ID
  │   └── defaultCategories.ts      # ✅ Seed categories with keywords[] — single source of truth
  │
  ├── context/
  │   └── CategoriesContext.tsx     # Global state, moveDocument, AsyncStorage + migration
  │
  ├── utils/
  │   └── feedback.ts               # ✅ exportFeedbackData() → FeedbackRecord[]
  │
  ├── keywordClassifier.ts          # ✅ Generic classify(text, rules) — category-agnostic
  │
  ├── app/utils/ (to be created — Phase 4+)
  │   ├── classifier.ts             # ← ONNX model wrapper (Phase 4)
  │   ├── classifierMetrics.ts      # ← Runtime metrics (Phase 7)
  │   └── classifierConfig.ts       # ← MODEL_VERSION etc.
  │
  ├── scripts/ (to be created — Phase 2+)
  │   ├── train.py                  # ← ML training pipeline (Phase 3)
  │   ├── batch_label.py            # ← Batch OCR labeling (Phase 2)
  │   ├── validate_model.py         # ← Validation gates (Phase 3)
  │   └── export_feedback.py        # ← Consume feedback_*.json + retrain (Phase 5)
  │
  ├── app/assets/model/ (to be created — Phase 3+)
  │   ├── model_v{timestamp}.onnx   # ← Versioned ONNX model
  │   └── label_encoder.json        # ← Class mapping
  │
  ├── data/ (to be created — Phase 2+)
  │   ├── dataset.json              # ← Training data
  │   ├── model_metrics.json        # ← Validation results
  │   └── training_log.json         # ← Run metadata
  │
  ├── .claude/
  │   └── memory/                   # Session memories for AI context
  │
  ├── package.json
  ├── tsconfig.json
  ├── eas.json                      # EAS build config
  └── README.md (this file)
```

✅ = built in Phase 1.5. The labeling tool produces the seed data for Phase 2's `dataset.json`.

---

## 🏃 Quick Start

### Environment Setup

```bash
# 1. Clone and install
git clone https://github.com/SharoniiS/DocuMate-RiseAgain.git
cd DocuMate-RiseAgain
npm install

# 2. Set up Google Vision API (for OCR)
# Create .env file:
GOOGLE_VISION_API_KEY=your_key_here

# 3. Run on Android device
npx expo start --dev-client
# Scan QR code with your phone
```

### Current MVP Flow

1. **Tap FAB** (blue circle, center bottom)
2. **Pick image** from gallery (or capture via camera)
3. **Wait for OCR** (ML Kit extracts text)
4. **Review preview** — AI suggestion + confidence + matched keywords shown in the "אנחנו חושבים" card. Picker auto-opens if confidence < 67%.
5. **Confirm or override** the category, optionally edit title / date / doctor / keywords
6. **Tap "כן, שמור"** to save — the AI's original prediction is captured permanently regardless of what you chose
7. **Check Documents tab** → Document persisted with thumbnail

### Labeling Flow (Phase 1.5 — use this to build the Phase 2 dataset)

1. Scan several documents through the normal flow above
2. Open the **סקירה (Review)** tab
3. See counters at top: total / corrected with % / low-confidence count
4. Filter to focus on what matters: **תוקנו** (where you overrode the AI) / **ביטחון נמוך** (where the AI was uncertain) / **ללא תיוג** (where OCR failed or no rule matched)
5. Tap the **folder icon** on any row → pick the right category. The doc moves; the AI's original guess stays recorded.
6. Tap the **ייצוא** FAB → JSON file is written to the app's document directory. Pull it via Xcode or `adb pull`.
7. Repeat. Aim for ≥8 examples per category for Phase 2.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Expo SDK 54 | Development + distribution |
| **Language** | TypeScript | Type safety |
| **Framework** | React Native | iOS + Android |
| **Routing** | expo-router | File-based routing (app/ folder) |
| **Storage** | AsyncStorage | On-device persistence |
| **OCR** | ML Kit (on-device) | Free, fast, Hebrew support |
| **ML Embedding** | LaBSE | Multilingual embeddings (768D) |
| **ML Classifier** | scikit-learn | Training + export to ONNX |
| **ML Runtime** | ONNX | On-device inference (iOS/Android/Web) |
| **Icons** | @expo/vector-icons | Ionicons |
| **RTL** | forceRTL | Hebrew right-to-left layout |

---

## ⚠️ Critical Notes for Developers

### 1. **expo-file-system v19 Breaking Change**
Import from `'expo-file-system/legacy'`, NOT `'expo-file-system'`:
```typescript
import * as FileSystem from 'expo-file-system/legacy';
const permanentUri = `${(FileSystem as any).documentDirectory}doc_${Date.now()}.jpg`;
```

### 2. **RTL Layout Rules**
- ❌ Never: `textAlign: 'right'` (flips to LEFT in RTL)
- ❌ Never: `flexDirection: 'row-reverse'` (double-reverses)
- ✅ Always: Let RTL handle alignment, reorder JSX children instead

### 3. **Security — Deferred Intentionally**
- AsyncStorage is plaintext (acceptable for on-device only)
- ⚠️ **STOP:** If adding cloud sync → must implement encryption first
- ⚠️ **STOP:** If adding backend → must do full security audit first
- See `.claude/memory/security_deferred.md` for details

### 4. **Google Vision API Key**
- Never commit API key to git
- Use `.env` + `.gitignore`
- Restrict key to Cloud Vision API only in Google Cloud Console

### 5. **ONNX Model Storage**
- Save models to `app/assets/model/` (bundled with app)
- Use timestamp versioning: `model_v{YYYYMMDD_HHMMSS}.onnx`
- Keep last 3 models for easy rollback

### 6. **Conventions Established in Phase 1.5 (DO NOT BREAK)**

These conventions protect the feedback data that will train the ML model. Breaking them silently corrupts the dataset.

- **Never mutate `predictedCategoryId` after `addDocument`.** It's the historical record of what the AI said. Only `wasCorrected` and the document's actual location change when a user re-classifies via `moveDocument`.
- **Never inline `0.67` or `'generalMed'`.** Import `CONFIDENCE_THRESHOLD` and `FALLBACK_CATEGORY_ID` from `constants/classifier.ts`. A future rename of `generalMed` shouldn't silently break saves.
- **`wasCorrected` requires `predictedCategoryId != null`.** Otherwise OCR-failed docs (where the AI made no prediction) get counted as "corrections," inflating the corrected-percent counter and corrupting `feedback_*.json`. Both `ScanModal.handleSave` and `CategoriesContext.moveDocument` enforce this — keep both in sync.
- **Adding a category is a one-file change.** Add an entry to `constants/defaultCategories.ts` with its `keywords?: string[]`. Do not edit `keywordClassifier.ts` — it's category-agnostic on purpose.
- **The classifier matches multi-word keywords.** It joins normalized words with spaces and does substring matching, so `"עמוד שדרה"`, `"לחץ דם"`, `"blood pressure"` etc. work. Don't go back to per-word matching.
- **AsyncStorage hydration includes a migration.** `reloadCategories` fills in missing `keywords` from `DEFAULT_CATEGORIES` for any category stored before the keywords-on-Category refactor. Keep this migration until you're certain no device in the wild has the old shape.
- **`utils/feedback.ts` is the export contract.** `FeedbackRecord` is the shape Phase 5's retrain pipeline will consume. Changing it means changing the Phase 5 ingestion code too.

---

## 📋 Phase Breakdown & Timelines

| Phase | Task | Input | Output | Est. Time | Gate |
|-------|------|-------|--------|-----------|------|
| **2** | Data Collection | OCR medical images | dataset.json (50-100 docs) | 1-2 weeks | ≥8 per category |
| **3** | Train & Validate | dataset.json | model_v{ts}.onnx + metrics | 2-3 days | F1 gates pass |
| **4** | App Integration | ONNX model | classifier.ts + updated ScanModal | 2-3 days | <200ms latency |
| **5** | Feedback Loop | User corrections | export_feedback.py wired | 1-2 days | Data flowing |
| **6** | Performance Test | ML-integrated app | Benchmarks + accuracy report | 3-5 days | ≥80% accuracy |
| **7** | Deployment | Versioned models | Metrics, alerts, rollback docs | 1-2 weeks | Production monitoring |

---

## 🎯 Success Criteria (Phase 7 — Production Ready)

- ✅ Model F1: ≥85% overall, ≥70% per-category
- ✅ Inference latency: <200ms avg, <500ms P99
- ✅ On-device accuracy: ≥80% on manually tested documents
- ✅ User feedback: Corrections are collected, exported, and retraining works
- ✅ Monitoring: Runtime metrics, alerts, and rollback procedures in place
- ✅ Documentation: Runbook for training, deployment, and troubleshooting

---

## 📞 Support

### For AI Assistants

If you're an AI resolving an issue on this project:

1. **Check the memories** in `.claude/memory/` — contains project context, security notes, and product philosophy
2. **Understand PTSD-informed design** — minimize cognitive load, no alert dialogs, one-tap paths, warm language
3. **Know the current state** — Phase 1 (MVP with OCR) and Phase 1.5 (labeling tool with confidence + correction loop + JSON export) are both shipped. The Review tab is the labeling/correction surface. ML model (Phase 2-7) is planned, not built.
4. **Read "Conventions Established in Phase 1.5" before touching the classifier, scan flow, or feedback path** — those conventions exist because of real bugs we hit
5. **Security first** — Any cloud/backend work requires stopping to address security. `ocrText` is now persisted per document; that data must not leave the device without explicit consent + encryption.
6. **Run the app first** — Test in Expo Dev Client before claiming success; memory management and RTL can be tricky. ML Kit OCR does NOT work in Expo Go — needs a native dev client build (`npx expo run:ios` / `run:android`).

### For Humans

- Check `PHASE_*.md` guides (to be created) for step-by-step Phase 2-7 implementation
- Review `.claude/memory/project_documate.md` for architectural decisions
- Test on a real device (emulators don't test RTL or file system behavior correctly)
