# Documately — AI-Powered Medical Document Classifier

> **For:** IDF disabled veterans and PTSD patients  
> **Vision:** A personal medical memory — automatically organized, searchable, and AI-enhanced  
> **Status:** MVP with OCR ✓ | ML Classifier (7-phase plan) → In development

---

## 🎯 Project Overview

Documately is a React Native app that lets users:
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
- ✅ Classification: Keyword rules (fallback classifier)
- ✅ Storage: AsyncStorage (on-device, persistent)
- ✅ UI: Tab-based navigation (documents, folders, scan, profile)
- ✅ File handling: Permanent `documentDirectory` storage, temp cache cleanup

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
RiseAgain/
  ├── app/
  │   ├── (tabs)/
  │   │   ├── _layout.tsx           # Tab bar + FAB
  │   │   ├── home.tsx              # Home screen (greeting, recent docs)
  │   │   ├── documents.tsx         # Vault with filters
  │   │   ├── folders.tsx           # Category hierarchy
  │   │   ├── scan.tsx              # Placeholder
  │   │   └── profile.tsx           # User profile (TODO)
  │   ├── _layout.tsx               # Root with RTL
  │   ├── index.tsx                 # → home
  │   └── document.tsx              # Document detail view
  │
  ├── components/
  │   ├── ScanModal.tsx             # Scan UX (OCR → classify → save)
  │   ├── DocRow.tsx                # Document thumbnail
  │   ├── CategoryList.tsx          # Category listing
  │   └── CategoryManager.tsx       # Add/delete categories
  │
  ├── context/
  │   └── CategoriesContext.tsx     # Global state + persistence
  │
  ├── keywordClassifier.ts          # Current keyword rules
  │   
  ├── app/utils/ (to be created)
  │   ├── classifier.ts             # ← ONNX model wrapper (Phase 4)
  │   ├── classifierMetrics.ts      # ← Runtime metrics (Phase 7)
  │   └── classifierConfig.ts       # ← Config: MODEL_VERSION, CONFIDENCE_THRESHOLD
  │
  ├── context/ (to be created)
  │   └── FeedbackContext.tsx       # ← User corrections tracking (Phase 5)
  │
  ├── scripts/ (to be created)
  │   ├── train.py                  # ← ML training pipeline (Phase 3)
  │   ├── batch_label.py            # ← Batch OCR labeling (Phase 2)
  │   ├── validate_model.py         # ← Validation gates (Phase 3)
  │   └── export_feedback.py        # ← Merge corrections + retrain (Phase 5)
  │
  ├── app/assets/model/ (to be created)
  │   ├── model_v{timestamp}.onnx   # ← Versioned ONNX model (Phase 3+)
  │   └── label_encoder.json        # ← Class mapping
  │
  ├── data/ (to be created)
  │   ├── dataset.json              # ← Training data (Phase 2+)
  │   ├── model_metrics.json        # ← Validation results (Phase 3+)
  │   └── training_log.json         # ← Run metadata (Phase 3+)
  │
  ├── .claude/
  │   └── memory/                   # Session memories for AI context
  │
  ├── package.json
  ├── tsconfig.json
  ├── eas.json                      # EAS build config
  └── README.md (this file)
```

---

## 🏃 Quick Start

### Environment Setup

```bash
# 1. Clone and install
git clone https://github.com/SharoniiS/RiseAgain.git
cd RiseAgain
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
2. **Pick image** from gallery
3. **Wait for OCR** (ML Kit extracts text)
4. **Review text** in preview modal
5. **Pick category** from dropdown (currently keyword-classified)
6. **Tap "כן, שמור"** to save
7. **Check Documents tab** → Document persisted with thumbnail

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
3. **Know the MVP state** — OCR + keyword classifier work; ML system is planned, not built yet
4. **Security first** — Any cloud/backend work requires stopping to address security
5. **Run the app first** — Test in Expo Dev Client before claiming success; memory management and RTL can be tricky

### For Humans

- Check `PHASE_*.md` guides (to be created) for step-by-step Phase 2-7 implementation
- Review `.claude/memory/project_documately.md` for architectural decisions
- Test on a real device (emulators don't test RTL or file system behavior correctly)
