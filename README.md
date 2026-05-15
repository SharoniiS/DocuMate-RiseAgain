# Documately — ניהול מסמכים רפואיים

אפליקציית React Native לניהול וסיווג מסמכים עבור נכי צה"ל וחולי PTSD.
המשתמש מצלם מסמך, המערכת מזהה טקסט דרך OCR ומסווגת את המסמך לתיקייה אוטומטית.

---

## Stack

| שכבה | טכנולוגיה |
|------|-----------|
| Framework | React Native + Expo (SDK 52) |
| Routing | expo-router (file-based) |
| Storage | AsyncStorage via CategoriesContext |
| OCR | Google Cloud Vision API |
| Classification | keywordClassifier.ts (keyword matching, עברית/אנגלית) |
| Icons | @expo/vector-icons (Ionicons) |
| Language | TypeScript |

---

## הרצה

```bash
npm install
npx expo start --clear
```

סרקי QR עם Expo Go על הטלפון.

---

## מבנה תיקיות

```
app/
  (tabs)/
    _layout.tsx       # Tab bar + FAB סריקה
    documents.tsx     # גריד 2 עמודות של כל המסמכים
    folders.tsx       # רשימת תיקיות
    scan.tsx          # placeholder (הלוגיקה ב-ScanModal)
  _layout.tsx         # Root layout
  index.tsx           # Redirect → documents

components/
  ScanModal.tsx       # כל לוגיקת הסריקה: בחירת תמונה, OCR, סיווג, שמירה
  CategoryList.tsx    # רשימת מסמכים בתוך קטגוריה
  CategoryManager.tsx # ניהול תיקיות (הוספה/מחיקה)

context/
  CategoriesContext.tsx  # State גלובלי + AsyncStorage persistence

constants/
  Colors.ts           # AppColors + SCREEN_TOP_PADDING

keywordClassifier.ts  # סיווג מסמכים לפי מילות מפתח
```

---

## קטגוריות ברירת מחדל

| ID | שם | הגנה |
|----|----|------|
| `medicalDocs` | מסמכים רפואיים | מוגנת — לא ניתן למחיקה |
| `receipts` | קבלות | מוגנת — לא ניתן למחיקה |

קטגוריות נוספות יוצר המשתמש דרך "ניהול תיקיות".

---

## נקודות שימת לב לפני שחרור

- **API Key**: מפתח Google Vision נמצא בתוך `ScanModal.tsx` — יש להעביר ל-`.env` ולהוסיף ל-`.gitignore`
- **`app/medical-docs.tsx`** — מסך רשימת מסמכים רפואיים, נגיש מתיקיות → "מסמכים רפואיים"

---

## Design System

כל הצבעים והמרווחים מוגדרים ב-`constants/Colors.ts`:
- `AppColors` — פלטת הצבעים המלאה
- `SCREEN_TOP_PADDING` — ריווח עליון אחיד לכל המסכים (ערך אחד לשינוי)
