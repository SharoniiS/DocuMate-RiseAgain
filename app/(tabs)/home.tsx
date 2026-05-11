import { MenuButton } from '@/components/MenuButton';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, I18nManager, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useCategories } from '../../context/CategoriesContext';
import { useCategoryActions } from '../../hooks/useCategoryActions';
import { classify } from '../../keywordClassifier';

// הפעלת RTL לאפליקציה
I18nManager.allowRTL(true);
I18nManager.forceRTL?.(true);

/**
 * מסך הבית: העלאת מסמכים, צילום, מיון אוטומטי ושמירה לקטגוריה
 */
export default function HomeScreen() {
  const [lastPreview, setLastPreview] = useState<string | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const { loading, categories } = useCategories();
  const router = useRouter();
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  type CategoryOption = 'קבלה' | 'מסמכים רפואיים' | 'לא ידוע';
  type PendingCategory = CategoryOption | { options: Array<{ label: CategoryOption; score: number }> } | null;
  const [pendingCategory, setPendingCategory] = useState<PendingCategory>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const receiptsActions = useCategoryActions('receipts');
  const medicalDocsActions = useCategoryActions('medicalDocs');

  if (loading) {
    return (
      <LinearGradient colors={['#243B55', '#141E30']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#f3eae0', fontSize: 22, fontWeight: 'bold' }}>טוען נתונים...</Text>
      </LinearGradient>
    );
  }

  const onCapture = async () => {
    await Haptics.selectionAsync();
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('הרשאה נחסמה', 'צריך לאשר גישה למצלמה כדי לצלם מסמך.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1,
      exif: false,
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      setIsOcrLoading(true);
      try {
        const text = await getTextFromImage(res.assets[0].uri);
        setIsOcrLoading(false);
        setPendingText(text);
        setPendingCategory(classifyDocument(text));
        setLastPreview(res.assets[0].uri);
        setIsPreviewVisible(true);
      } catch (err) {
        setIsOcrLoading(false);
        Alert.alert('שגיאה בזיהוי המסמך', err?.toString() || '');
        setPendingText(null);
        setPendingCategory(null);
      }
    }
  };

  const onPick = async () => {
    await Haptics.selectionAsync();
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/jpeg', 'image/png', 'application/pdf'],
      multiple: false,
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const file = result.assets[0];
    try {
      setIsOcrLoading(true);
      const text = await getTextFromImage(file.uri);
      setIsOcrLoading(false);
      setPendingText(text);
      setPendingCategory(classifyDocument(text));
      setLastPreview(file.uri);
      setIsPreviewVisible(true);
    } catch (err) {
      setIsOcrLoading(false);
      Alert.alert('שגיאה בזיהוי המסמך', err?.toString() || '');
      setPendingText(null);
      setPendingCategory(null);
    }
  };

  const handleSave = () => {
    if (!lastPreview || !selectedCategoryId) {
      Alert.alert('לא ניתן לשמור', 'לא נבחרה קטגוריה');
      return;
    }
    let keywords: string[] = [];
    if (pendingText) {
      keywords = Array.from(new Set(
        pendingText
          .split(/\s+/)
          .map(w => w.replace(/[^\p{L}\p{N}]/gu, ''))
          .filter(w => w.length >= 3)
          .map(w => w.toLowerCase())
      ));
    }
    const cat = categories.find(c => c.id === selectedCategoryId);
    if (!cat) {
      Alert.alert('שגיאה', 'לא נמצאה קטגוריה מתאימה');
      return;
    }
    if (cat.id === 'receipts') {
      receiptsActions.addItem(lastPreview, keywords);
      Alert.alert('המסמך מוין לקטגוריית', cat.name);
      router.push('/credits');
    } else if (cat.id === 'medicalDocs') {
      medicalDocsActions.addItem(lastPreview, keywords);
      Alert.alert('המסמך מוין לקטגוריית', cat.name);
      router.push('/medical-docs');
    } else {
      // קטגוריה מותאמת אישית
      // אפשר להרחיב כאן להוספה לקטגוריות נוספות
      Alert.alert('המסמך מוין לקטגוריית', cat.name);
    }
    setIsPreviewVisible(false);
    setLastPreview(null);
    setPendingText(null);
    setPendingCategory(null);
    setSelectedCategoryId(null);
  };

  async function getTextFromImage(imageUri: string): Promise<string> {
    const API_KEY = 'AIzaSyDq9A_xhJ1QC2A-5ueJ01UVTBNSGZgObgg';
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onloadend = async () => {
        const base64data = reader.result?.toString().split(',')[1];
        if (!base64data) return reject('בעיה בהמרת תמונה');
        const visionRes = await fetch(
          `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requests: [
                {
                  image: { content: base64data },
                  features: [{ type: 'TEXT_DETECTION' }],
                },
              ],
            }),
          }
        );
        const visionJson = await visionRes.json();
        resolve(visionJson?.responses?.[0]?.fullTextAnnotation?.text || '');
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }


  // סיווג טקסט לקטגוריה (משוקלל) + החזרת שתי הקטגוריות המובילות
  function classifyDocument(text: string):
    | 'קבלה'
    | 'מסמכים רפואיים'
    | 'לא ידוע'
  | { options: Array<{ label: CategoryOption; score: number }> } {
    const results = classify(text);
    if (!results.length || results[0].score === 0) return 'לא ידוע';
    const top = results[0];
    const second = results[1];
    const labelMap: Record<string, CategoryOption> = {
      medical: 'מסמכים רפואיים',
      receipt: 'קבלה',
    };
    if (second && top.score - second.score < 0.2) {
      const toOption = (cat: typeof top | typeof second) => ({
        label: labelMap[cat.category] ?? 'לא ידוע',
        score: cat.score,
      });
      return { options: [toOption(top), toOption(second)] };
    }
    if (top.category === 'medical') return 'מסמכים רפואיים';
    if (top.category === 'receipt') return 'קבלה';
    return 'לא ידוע';
  }

  return (
    <>
      {/* Modal טעינה עבור OCR - תמיד בראש, מעל כל ה-UI */}
      <Modal visible={isOcrLoading} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#243B55', padding: 32, borderRadius: 20, alignItems: 'center' }}>
            <Text style={{ color: '#f3eae0', fontSize: 18, marginBottom: 16 }}>מזהה טקסט...</Text>
            <ActivityIndicator size="large" color="#facc15" />
          </View>
        </View>
      </Modal>
      <LinearGradient colors={['#243B55', '#141E30']} style={styles.safe}>
        <View style={styles.container}>
  <Text style={styles.sunEmoji}>☀️</Text>
  <Text style={styles.greeting}>בוקר טוב אסף</Text>

  <MenuButton />

  <View style={{ height: 40 }} />

  <Pressable onPress={loading ? undefined : onCapture} disabled={loading} style={({ pressed }: { pressed: boolean }) => [styles.primaryBtn, pressed && styles.pressed, loading && { opacity: 0.5 }]}>
          <Ionicons name="camera-outline" size={22} style={styles.btnIconLeft} />
          <Text style={styles.primaryText}>צילום מסמך</Text>
        </Pressable>

        <View style={{ height: 20 }} />

  <Pressable onPress={loading ? undefined : onPick} disabled={loading} style={({ pressed }: { pressed: boolean }) => [styles.primaryBtn, pressed && styles.pressed, loading && { opacity: 0.5 }]}>
          <Ionicons name="cloud-upload-outline" size={22} style={styles.btnIconLeft} />
          <Text style={styles.primaryText}>העלאת מסמך</Text>
        </Pressable>

        <Modal visible={isPreviewVisible} transparent={true} animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>תצוגה מוקדמת</Text>
              {lastPreview?.endsWith('.pdf') ? (
                <View style={styles.pdfBadge}>
                  <Ionicons name="document-text-outline" size={18} />
                  <Text style={styles.pdfText}>PDF</Text>
                </View>
              ) : (
                <Image source={{ uri: lastPreview ?? undefined }} style={styles.preview} resizeMode="cover" />
              )}
              {/* הצגת סיווג אוטומטי */}
              {pendingCategory === 'קבלה' && (
                <Text style={styles.modalSubtitle}>המערכת זיהתה: קבלה</Text>
              )}
              {pendingCategory === 'מסמכים רפואיים' && (
                <Text style={styles.modalSubtitle}>המערכת זיהתה: מסמכים רפואיים</Text>
              )}
              {pendingCategory === 'לא ידוע' && (
                <Text style={styles.modalSubtitle}>לא זוהה סיווג אוטומטי</Text>
              )}
              {typeof pendingCategory === 'object' && pendingCategory?.options && (
                <Text style={styles.modalSubtitle}>המערכת לא בטוחה, בחר קטגוריה:</Text>
              )}
              {/* בוחר קטגוריה אחיד */}
              <Text style={[styles.modalSubtitle, { marginTop: 16 }]}>בחר קטגוריה:</Text>
              <View style={{ width: '100%', marginTop: 8 }}>
                {categories.map(cat => (
                  <Pressable
                    key={cat.id}
                    onPress={() => setSelectedCategoryId(cat.id)}
                    style={{
                      backgroundColor: selectedCategoryId === cat.id ? '#facc15' : '#f3eae0',
                      marginVertical: 6,
                      padding: 12,
                      borderRadius: 16,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: selectedCategoryId === cat.id ? '#facc15' : '#243B55',
                    }}
                  >
                    <Text style={{ color: '#243B55', fontWeight: 'bold', fontSize: 16 }}>{cat.name}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.modalActions}>
                <Pressable onPress={handleSave} style={[styles.primaryBtn, styles.modalBtn]}>
                  <Text style={styles.primaryText}>אישור</Text>
                </Pressable>
                <Pressable onPress={() => {
                  setIsPreviewVisible(false);
                  setSelectedCategoryId(null);
                }} style={[styles.secondaryBtn, styles.modalBtn]}>
                  <Text style={styles.secondaryText}>ביטול</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  sunEmoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 8, // מרווח בין השמש לטקסט
  },
  greeting: {
    fontSize: 36,
    fontWeight: '700',
    color: '#f3eae0',
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: '#f3eae0',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '80%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  pressed: { opacity: 0.8 },
  btnIconLeft: { marginRight: 12 },
  primaryText: { color: '#243B55', fontSize: 18, fontWeight: '700' },
  secondaryText: { color: '#CBD5E1', fontSize: 18, fontWeight: '700' },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#243B55',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f3eae0',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#CBD5E1',
    textAlign: 'center',
    marginTop: 12,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  modalBtn: {
    flex: 1,
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '80%',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  preview: { width: '100%', height: 180, borderRadius: 12, borderWidth: 1, borderColor: '#475569' },
  pdfBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#475569',
  },
  pdfText: { color: '#f3eae0', fontSize: 13 },
});
