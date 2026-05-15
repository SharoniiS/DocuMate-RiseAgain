import { Ionicons } from '@expo/vector-icons';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppColors } from '../constants/Colors';
import { CONFIDENCE_THRESHOLD, FALLBACK_CATEGORY_ID } from '../constants/classifier';
import { useCategories } from '../context/CategoriesContext';
import { classify } from '../keywordClassifier';

type ScanStep = 'pick' | 'loading' | 'preview' | 'success';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function ScanModal({ visible, onClose }: Props) {
  const [step, setStep] = useState<ScanStep>('pick');
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [predictedCategoryId, setPredictedCategoryId] = useState<string | null>(null);
  const [predictedConfidence, setPredictedConfidence] = useState<number>(0);
  const [predictedMatched, setPredictedMatched] = useState<string[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDate, setEditedDate] = useState('');
  const [editedDoctor, setEditedDoctor] = useState('');
  const [activeKeywords, setActiveKeywords] = useState<string[]>([]);
  const [editingField, setEditingField] = useState<'title' | 'date' | 'doctor' | null>(null);
  const [ocrFailed, setOcrFailed] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { categories, addDocument } = useCategories();

  const reset = () => {
    setStep('pick');
    setPreviewUri(null);
    setPendingText(null);
    setPredictedCategoryId(null);
    setPredictedConfidence(0);
    setPredictedMatched([]);
    setSelectedCategoryId(null);
    setEditedTitle('');
    setEditedDate('');
    setEditedDoctor('');
    setActiveKeywords([]);
    setEditingField(null);
    setOcrFailed(false);
    setShowCategoryPicker(false);
    setShowDetails(false);
    setSaveError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const isDirty = step === 'preview';

  const requestClose = () => {
    if (isDirty) {
      Alert.alert(
        'יש שינויים שלא נשמרו',
        'לצאת בלי לשמור?',
        [
          { text: 'המשך לערוך', style: 'cancel' },
          { text: 'צא בלי לשמור', style: 'destructive', onPress: handleClose },
        ]
      );
      return;
    }
    handleClose();
  };

  const processFile = async (uri: string) => {
    setStep('loading');
    let text = '';
    let failed = false;
    let resolvedUri = uri;

    try {
      const result = await getTextFromImage(uri);
      text = result.text;
      resolvedUri = result.fileUri;
    } catch (err) {
      // OCR נכשל — עדיין פותח מסך סקירה לעריכה ידנית
      failed = true;
      console.warn('OCR failed:', String(err));
    }

    const rules = categories
      .filter(c => c.keywords && c.keywords.length > 0)
      .map(c => ({ categoryId: c.id, keywords: c.keywords as string[] }));
    const { categoryId, confidence, matched } = text
      ? classify(text, rules)
      : { categoryId: null, confidence: 0, matched: [] as string[] };

    const extractedTitle = extractTitle(text);
    const extractedDate = extractDate(text);
    const extractedDoctor = extractDoctor(text);
    const extractedKeywords = extractKeywords(text).slice(0, 8);
    setPendingText(text || null);
    setPredictedCategoryId(categoryId);
    setPredictedConfidence(confidence);
    setPredictedMatched(matched);
    setEditedTitle(extractedTitle);
    setEditedDate(extractedDate);
    setEditedDoctor(extractedDoctor);
    setActiveKeywords(extractedKeywords);
    setOcrFailed(failed);

    if (categoryId && confidence >= CONFIDENCE_THRESHOLD) {
      setSelectedCategoryId(categoryId);
    } else if (categoryId) {
      setSelectedCategoryId(categoryId);
      setShowCategoryPicker(true);
    } else {
      setSelectedCategoryId(FALLBACK_CATEGORY_ID);
      setShowCategoryPicker(true);
    }

    setPreviewUri(resolvedUri);
    setStep('preview');
  };

  const onCapture = async () => {
    await Haptics.selectionAsync();
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('הרשאה נחסמה', 'יש לאשר גישה למצלמה.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 1, exif: false });
    if (!res.canceled && res.assets?.[0]?.uri) {
      await processFile(res.assets[0].uri);
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
    await processFile(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!previewUri) return;
    const targetCatId = selectedCategoryId ?? FALLBACK_CATEGORY_ID;
    const extraMeta = [editedDate, editedDoctor].filter(Boolean);
    const finalKeywords = [...new Set([...activeKeywords, ...extraMeta])];
    const finalTitle = editedTitle || editedDoctor || 'מסמך';

    const ext = previewUri.toLowerCase().includes('.pdf') ? 'pdf' : 'jpg';
    const docDir = FileSystem.documentDirectory;
    if (!docDir) {
      setSaveError('לא הצלחנו לשמור. כדאי לנסות שוב?');
      return;
    }
    const permanentUri = `${docDir}doc_${Date.now()}.${ext}`;
    try {
      await FileSystem.copyAsync({ from: previewUri, to: permanentUri });
    } catch (e) {
      console.error('copyAsync failed:', String(e), 'from:', previewUri, 'to:', permanentUri);
      setSaveError('לא הצלחנו לשמור. כדאי לנסות שוב?');
      return;
    }

    addDocument(targetCatId, {
      uri: permanentUri,
      keywords: finalKeywords,
      title: finalTitle,
      predictedCategoryId,
      predictedConfidence,
      matchedKeywords: predictedMatched,
      wasCorrected: predictedCategoryId !== targetCatId,
      ocrText: pendingText ?? undefined,
    });
    setStep('success');
    setTimeout(() => handleClose(), 1600);
  };

  const toggleKeyword = (kw: string) => {
    setActiveKeywords(prev =>
      prev.includes(kw) ? prev.filter(k => k !== kw) : [...prev, kw]
    );
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={requestClose}>
      <View style={styles.container}>
        {step === 'preview' ? (
          <View style={styles.header}>
            <Pressable onPress={requestClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={AppColors.textSub} />
            </Pressable>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.headerSub}>אפשר לשנות הכל</Text>
              <Text style={styles.title}>סקירה</Text>
            </View>
            <View style={{ width: 38 }} />
          </View>
        ) : step !== 'success' ? (
          <View style={styles.header}>
            <Text style={styles.title}>הוסף מסמך</Text>
            <Pressable onPress={requestClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={AppColors.textSub} />
            </Pressable>
          </View>
        ) : null}

        {step === 'success' && (
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={40} color="#fff" />
            </View>
            <Text style={styles.successTitle}>נשמר!</Text>
            <Text style={styles.successSub}>תמצא אותו תמיד בארכיון שלך.</Text>
          </View>
        )}

        {step === 'loading' && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={AppColors.brand} />
            <Text style={styles.loadingText}>מזהה טקסט...</Text>
          </View>
        )}

        {step === 'pick' && (
          <View style={styles.pickContainer}>
            <Pressable onPress={onCapture} style={styles.pickOption}>
              <View style={styles.pickIconWrap}>
                <Ionicons name="camera-outline" size={32} color={AppColors.brand} />
              </View>
              <Text style={styles.pickLabel}>צילום מסמך</Text>
              <Text style={styles.pickSub}>סרוק ישירות עם המצלמה</Text>
            </Pressable>

            <Pressable onPress={onPick} style={styles.pickOption}>
              <View style={styles.pickIconWrap}>
                <Ionicons name="folder-open-outline" size={32} color={AppColors.brand} />
              </View>
              <Text style={styles.pickLabel}>בחר מהגלריה</Text>
              <Text style={styles.pickSub}>תמונה או PDF מהמכשיר</Text>
            </Pressable>
          </View>
        )}

        {step === 'preview' && previewUri && (
          <>
            <ScrollView contentContainerStyle={styles.previewContainer} showsVerticalScrollIndicator={false}>

              {/* AI card */}
              <View style={styles.aiCard}>
                <View style={styles.aiCardHead}>
                  <View style={styles.aiDot}>
                    <Ionicons name="sparkles-outline" size={12} color={AppColors.brand} />
                  </View>
                  <Text style={styles.aiLabel}>אנחנו חושבים</Text>
                </View>
                <Text style={styles.aiText}>
                  {showCategoryPicker && predictedConfidence === 0
                    ? 'לא הצלחנו לזהות — בחרי קטגוריה:'
                    : `זה נראה כמו ${categories.find(c => c.id === selectedCategoryId)?.name ?? 'מסמך רפואי'}${editedDate ? `\nמתאריך ${editedDate}` : ''}.`}
                </Text>
                {selectedCategoryId === predictedCategoryId && predictedConfidence > 0 && (
                  <View style={styles.confidenceChip}>
                    <Text style={styles.confidenceChipText}>
                      ביטחון {Math.round(predictedConfidence * 100)}%
                    </Text>
                  </View>
                )}
              </View>

              {/* Category picker — מחוץ לפרטים נוספים */}
              {showCategoryPicker && (
                <View style={styles.folderPicker}>
                  {categories.map(cat => (
                    <Pressable
                      key={cat.id}
                      onPress={() => { setSelectedCategoryId(cat.id); setShowCategoryPicker(false); }}
                      style={[styles.catRow, selectedCategoryId === cat.id && styles.catRowSelected]}
                    >
                      <Text style={[styles.catName, selectedCategoryId === cat.id && styles.catNameSelected]}>
                        {cat.parentId
                          ? `${categories.find(c => c.id === cat.parentId)?.name ?? ''} › ${cat.name}`
                          : cat.name}
                      </Text>
                      {selectedCategoryId === cat.id && (
                        <Ionicons name="checkmark-circle" size={20} color={AppColors.brand} />
                      )}
                    </Pressable>
                  ))}
                </View>
              )}

              {/* שגיאת שמירה — inline, רכה */}
              {saveError && (
                <View style={styles.saveErrorRow}>
                  <Text style={styles.saveErrorText}>{saveError}</Text>
                  <Pressable onPress={handleSave}>
                    <Text style={styles.saveErrorRetry}>נסה שוב</Text>
                  </Pressable>
                </View>
              )}

              {/* פרטים נוספים — collapsed by default */}
              <Pressable onPress={() => setShowDetails(v => !v)} style={styles.detailsToggle}>
                <Ionicons name={showDetails ? 'chevron-up-outline' : 'chevron-down-outline'} size={16} color={AppColors.textSub} />
                <Text style={styles.detailsToggleText}>פרטים נוספים</Text>
              </Pressable>

              {showDetails && (
                <>
                  <Pressable
                    style={styles.fieldRow}
                    onPress={() => setEditingField(editingField === 'title' ? null : 'title')}
                  >
                    <Ionicons name="pencil-outline" size={16} color={AppColors.textSub} />
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                      <Text style={styles.fieldRowLabel}>כותרת</Text>
                      {editingField === 'title' ? (
                        <TextInput
                          value={editedTitle}
                          onChangeText={setEditedTitle}
                          placeholder="שם המסמך..."
                          placeholderTextColor={AppColors.textSub}
                          style={styles.fieldRowInput}
                          textAlign="right"
                          autoFocus
                        />
                      ) : (
                        <Text style={styles.fieldRowValue} numberOfLines={1}>
                          {editedTitle || 'הוסף כותרת...'}
                        </Text>
                      )}
                    </View>
                  </Pressable>

                  <Pressable
                    style={styles.fieldRow}
                    onPress={() => setEditingField(editingField === 'date' ? null : 'date')}
                  >
                    <Ionicons name="pencil-outline" size={16} color={AppColors.textSub} />
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                      <Text style={styles.fieldRowLabel}>תאריך</Text>
                      {editingField === 'date' ? (
                        <TextInput
                          value={editedDate}
                          onChangeText={setEditedDate}
                          placeholder="DD/MM/YYYY"
                          placeholderTextColor={AppColors.textSub}
                          style={styles.fieldRowInput}
                          textAlign="right"
                          autoFocus
                          keyboardType="numeric"
                        />
                      ) : (
                        <Text style={[styles.fieldRowValue, !editedDate && { color: AppColors.textSub }]}>
                          {editedDate || 'הוסף תאריך...'}
                        </Text>
                      )}
                    </View>
                  </Pressable>

                  <Pressable
                    style={styles.fieldRow}
                    onPress={() => setEditingField(editingField === 'doctor' ? null : 'doctor')}
                  >
                    <Ionicons name="pencil-outline" size={16} color={AppColors.textSub} />
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                      <Text style={styles.fieldRowLabel}>רופא</Text>
                      {editingField === 'doctor' ? (
                        <TextInput
                          value={editedDoctor}
                          onChangeText={setEditedDoctor}
                          placeholder="שם הרופא..."
                          placeholderTextColor={AppColors.textSub}
                          style={styles.fieldRowInput}
                          textAlign="right"
                          autoFocus
                        />
                      ) : (
                        <Text style={[styles.fieldRowValue, !editedDoctor && { color: AppColors.textSub }]}>
                          {editedDoctor || 'הוסף שם רופא...'}
                        </Text>
                      )}
                    </View>
                  </Pressable>

                  {/* שנה קטגוריה — בתוך הפרטים */}
                  <Pressable onPress={() => setShowCategoryPicker(v => !v)} style={styles.fieldRow}>
                    <Ionicons name="folder-outline" size={16} color={AppColors.textSub} />
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                      <Text style={styles.fieldRowLabel}>תיקייה</Text>
                      <Text style={styles.fieldRowValue}>
                        {selectedCategoryId
                          ? categories.find(c => c.id === selectedCategoryId)?.name ?? 'כללי'
                          : 'כללי'}
                      </Text>
                    </View>
                  </Pressable>

                </>
              )}

              <View style={{ height: 120 }} />
            </ScrollView>

            {/* CTA — כפתור אחד */}
            <View style={styles.cta}>
              <Pressable onPress={handleSave} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>כן, שמור</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const HE_STOP = new Set(['את','של','הוא','היא','הם','הן','זה','זו','כי','אל','על','עם','מה','כל','גם','אבל','רק','כך','שם','פה','לא','כן','אני','אתה','אתם','אנחנו','לו','לה','לנו','לכם','לי','בו','בה','בהם','בנו','בי','יש','אין','היה','הייה','היו','כבר','עוד','אחד','אחת','כמו','אם','או','כן','כן','בין','אחרי','לפני','תחת','מעל','ליד']);
const EN_STOP = new Set(['the','and','or','in','on','at','to','of','for','with','is','are','was','were','be','it','its','this','that','from','by','an','a','as','not','but','so']);

function extractKeywords(text: string | null): string[] {
  if (!text) return [];
  return Array.from(new Set(
    text
      .split(/\s+/)
      .map(w => w.replace(/[^\p{L}\p{N}]/gu, ''))
      .filter(w => w.length >= 3)
      .map(w => w.toLowerCase())
      .filter(w => !HE_STOP.has(w) && !EN_STOP.has(w))
  ));
}

function extractTitle(text: string | null): string {
  if (!text) return '';
  const line = text.split('\n').map(l => l.trim()).find(l => l.length >= 3);
  return line ? line.slice(0, 60) : '';
}

const MONTHS_HE = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];

function extractDate(text: string): string {
  if (!text) return '';
  const m = text.match(/(\d{1,2})[.\/\-](\d{1,2})[.\/\-](\d{2,4})/);
  if (!m) return '';
  const day = m[1];
  const monthIdx = parseInt(m[2], 10) - 1;
  const year = m[3].length === 2 ? `20${m[3]}` : m[3];
  const monthName = MONTHS_HE[monthIdx] ?? '';
  return monthName ? `${day} ב${monthName} ${year}` : '';
}

function extractDoctor(text: string): string {
  if (!text) return '';
  const he = text.match(/ד["׳']ר\s+[א-ת.]+(?:\s+[א-ת.]+)?/);
  if (he) return he[0].trim();
  const en = text.match(/Dr\.?\s+[A-Za-z]+(?:\s+[A-Za-z]+)?/i);
  if (en) return en[0].trim();
  return '';
}

async function getTextFromImage(imageUri: string): Promise<{ text: string; fileUri: string }> {
  if (imageUri.toLowerCase().includes('.pdf')) {
    throw new Error('PDF_NOT_SUPPORTED');
  }

  // ML Kit דורש file:// URI — content:// → cache
  let fileUri = imageUri;
  if (imageUri.startsWith('content://')) {
    const dest = `${FileSystem.cacheDirectory ?? ''}scan_${Date.now()}.jpg`;
    await FileSystem.copyAsync({ from: imageUri, to: dest });
    fileUri = dest;
  }

  const result = await TextRecognition.recognize(fileUri);
  return { text: result.text ?? '', fileUri };
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.text,
  },
  headerSub: {
    fontSize: 11,
    color: AppColors.textSub,
    fontWeight: '500',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: AppColors.chip,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: AppColors.textSub,
  },
  pickContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  pickOption: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  pickIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AppColors.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  pickLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: AppColors.text,
  },
  pickSub: {
    fontSize: 13,
    color: AppColors.textSub,
  },
  previewContainer: {
    paddingTop: 4,
    gap: 16,
  },

  // AI card
  aiCard: {
    backgroundColor: AppColors.accentLight,
    borderColor: AppColors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  aiCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiDot: {
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: AppColors.brand,
    letterSpacing: 0.4,
  },
  aiText: {
    fontSize: 16,
    color: AppColors.text,
    lineHeight: 22,
    textAlign: 'right',
  },
  confidenceChip: {
    alignSelf: 'flex-end',
    backgroundColor: AppColors.chip,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 2,
  },
  confidenceChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: AppColors.textSub,
    letterSpacing: 0.3,
  },

  // שדה
  fieldBlock: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textSub,
    textAlign: 'right',
    letterSpacing: 0.3,
  },
  tagsHint: {
    fontSize: 12,
    color: AppColors.textSub,
    textAlign: 'right',
  },

  // field rows (כמו screenshot 5)
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: AppColors.chip,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fieldRowLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: AppColors.textSub,
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  fieldRowValue: {
    fontSize: 15,
    fontWeight: '500',
    color: AppColors.text,
  },
  fieldRowInput: {
    fontSize: 15,
    fontWeight: '500',
    color: AppColors.text,
    padding: 0,
    minWidth: 160,
  },

  folderPicker: {
    gap: 6,
    marginTop: -4,
  },

  // תגיות
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
  tag: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagOn: {
    backgroundColor: AppColors.brand,
  },
  tagOff: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: AppColors.brand,
    borderStyle: 'dashed',
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // קטגוריות
  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  catRowSelected: {
    borderColor: AppColors.brand,
    backgroundColor: AppColors.accentLight,
  },
  catName: {
    fontSize: 15,
    color: AppColors.text,
    fontWeight: '500',
    textAlign: 'right',
  },
  catNameSelected: {
    color: AppColors.brand,
    fontWeight: '700',
  },

  // debug
  debugToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    alignSelf: 'flex-end',
  },
  debugToggleText: {
    fontSize: 12,
    color: AppColors.textSub,
  },
  debugBox: {
    backgroundColor: AppColors.chip,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  debugText: {
    fontSize: 12,
    color: AppColors.text,
    textAlign: 'right',
    lineHeight: 18,
    fontFamily: 'monospace',
  },

  // OCR fail banner
  ocrFailBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  ocrFailText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    textAlign: 'right',
    lineHeight: 18,
  },

  // CTA
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
    gap: 8,
  },
  saveBtn: {
    backgroundColor: AppColors.brand,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  saveErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  saveErrorText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    textAlign: 'right',
  },
  saveErrorRetry: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400e',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: AppColors.brand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: AppColors.text,
  },
  successSub: {
    fontSize: 15,
    color: AppColors.textSub,
    textAlign: 'center',
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  detailsToggleText: {
    fontSize: 13,
    color: AppColors.textSub,
    fontWeight: '500',
  },
  draftBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  draftBtnText: {
    fontSize: 14,
    color: AppColors.textSub,
    fontWeight: '500',
  },
});
