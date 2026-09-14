import * as XLSX from 'xlsx';
import { VaultItem, Category } from '../types';

export interface ExcelExportOptions {
  scope: 'all' | 'category' | 'favorites';
  categoryId?: string;
  categories: Category[];
}

export function exportVaultToExcel(
  items: VaultItem[],
  optionsOrCategories: ExcelExportOptions | Category[]
): void {
  const options: ExcelExportOptions = Array.isArray(optionsOrCategories)
    ? { scope: 'all', categories: optionsOrCategories }
    : optionsOrCategories;

  const categoriesList = options.categories || [];

  // Filter items based on selected scope
  let filtered = [...items];
  if (options.scope === 'category' && options.categoryId && options.categoryId !== 'all') {
    filtered = filtered.filter((i) => i.category === options.categoryId);
  } else if (options.scope === 'favorites') {
    filtered = filtered.filter((i) => i.isFavorite);
  }

  // Create Category lookup map
  const catMap = new Map<string, string>();
  categoriesList.forEach((c) => catMap.set(c.id, c.name));
  filtered.sort((a, b) => {
    const catA = catMap.get(a.category) || a.category;
    const catB = catMap.get(b.category) || b.category;
    const comp = catA.localeCompare(catB, 'ar');
    if (comp !== 0) return comp;
    return a.title.localeCompare(b.title, 'ar');
  });

  // Prepare table rows
  const rows = filtered.map((item) => {
    // Format multiple API keys
    const apiKeysStr = Array.isArray(item.apiKeys)
      ? item.apiKeys.map((k) => (k.label ? `${k.label}: ${k.value}` : k.value)).join(' | ')
      : '';

    // Format multiple Tokens
    const tokensStr = Array.isArray(item.tokens)
      ? item.tokens.map((t) => (t.label ? `${t.label}: ${t.value}` : t.value)).join(' | ')
      : '';

    // Format multiple Secret Keys
    const secretKeysStr = Array.isArray(item.secretKeys)
      ? item.secretKeys.map((s) => (s.label ? `${s.label}: ${s.value}` : s.value)).join(' | ')
      : '';

    // Format multiple Licenses
    const licensesStr = Array.isArray(item.licenseKeys)
      ? item.licenseKeys.map((l) => (l.label ? `${l.label}: ${l.value}` : l.value)).join(' | ')
      : '';

    // Format multiple Certificates
    const certsStr = Array.isArray(item.certificates)
      ? item.certificates.map((c) => (c.label ? `${c.label}: ${c.value}` : c.value)).join(' | ')
      : '';

    // Format all URLs
    const allUrls = [item.url, ...(item.urls?.map((u) => u.value) || [])].filter(Boolean).join(' | ');

    return {
      'التصنيف': catMap.get(item.category) || item.category,
      'اسم العنصر': item.title,
      'الوصف': item.description || '',
      'الموقع': item.website || '',
      'الرابط': allUrls,
      'اسم المستخدم': item.username || '',
      'البريد الإلكتروني': item.email || '',
      'كلمة المرور': item.password || '',
      'مفاتيح API': apiKeysStr,
      'التوكنات': tokensStr,
      'المفاتيح السرية': secretKeysStr,
      'رقم الترخيص': licensesStr,
      'الشهادة': certsStr,
      'الملاحظات': item.notes || '',
      'ملاحظات سرية': item.secretNotes || '',
      'المفضلة': item.isFavorite ? 'نعم' : 'لا',
      'تاريخ الإنشاء': item.createdAt ? new Date(item.createdAt).toLocaleString('ar-EG') : '',
      'آخر تعديل': item.updatedAt ? new Date(item.updatedAt).toLocaleString('ar-EG') : '',
    };
  });

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(rows);

  // Set Right-To-Left view for Arabic worksheet
  if (!ws['!views']) ws['!views'] = [];
  ws['!views'].push({ RTL: true });

  // Column widths
  ws['!cols'] = [
    { wch: 22 }, // التصنيف
    { wch: 30 }, // اسم العنصر
    { wch: 35 }, // الوصف
    { wch: 25 }, // الموقع
    { wch: 35 }, // الرابط
    { wch: 28 }, // اسم المستخدم
    { wch: 28 }, // البريد
    { wch: 24 }, // كلمة المرور
    { wch: 35 }, // مفاتيح API
    { wch: 25 }, // التوكنات
    { wch: 25 }, // المفاتيح السرية
    { wch: 30 }, // رقم الترخيص
    { wch: 25 }, // الشهادة
    { wch: 35 }, // الملاحظات
    { wch: 30 }, // ملاحظات سرية
    { wch: 10 }, // المفضلة
    { wch: 22 }, // تاريخ الإنشاء
    { wch: 22 }, // آخر تعديل
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'سجلات الخزنة');

  // Format date for filename: AMAN_Vault_YYYY-MM-DD.xlsx
  const today = new Date().toISOString().split('T')[0];
  const filename = `AMAN_Vault_${today}.xlsx`;

  // Write and download
  XLSX.writeFile(wb, filename);
}
