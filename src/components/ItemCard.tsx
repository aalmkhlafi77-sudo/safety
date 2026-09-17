import React, { useState } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  Eye,
  EyeOff,
  Key,
  Award,
  Star,
  MoreVertical,
  Edit2,
  Trash2,
  CopyPlus,
  Maximize2,
  Lock,
  Globe,
} from 'lucide-react';
import { VaultItem, Category } from '../types';
import { sounds } from '../utils/audio';
import { copySensitiveText, copyPlainText } from '../utils/clipboard';
import { sanitizeAndOpenUrl } from '../utils/url';
import { safeString } from '../utils/searchSafety';

interface ItemCardProps {
  item: VaultItem;
  category?: Category;
  clipboardTimeout?: number;
  onView: (item: VaultItem) => void;
  onEdit: (item: VaultItem) => void;
  onDelete: (id: string) => void;
  onDuplicate: (item: VaultItem) => void;
  onToggleFavorite: (id: string) => void;
  onCopiedToast?: (msg: string) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  category,
  clipboardTimeout = 30,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFavorite,
  onCopiedToast,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const safeGlow = safeString(category?.glowColor);
  const glowStyle = safeGlow
    ? {
        boxShadow: `0 4px 20px ${safeGlow}`,
        borderColor: `${safeGlow.replace(/[\d\.]+\)$/, '0.3)')}`,
      }
    : {};

  const handleCopySensitive = async (text: string, fieldName: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!text) return;
    sounds.playKeypadClick();
    setCopiedField(fieldName);

    await copySensitiveText(
      text,
      clipboardTimeout,
      () => {
        if (onCopiedToast) {
          onCopiedToast(
            clipboardTimeout > 0
              ? `تم النسخ • سيتم مسح الحافظة تلقائياً بعد ${clipboardTimeout} ثانية`
              : 'تم النسخ إلى الحافظة'
          );
        }
      },
      () => {
        if (onCopiedToast) onCopiedToast('تم مسح القيمة السرية من الحافظة تلقائياً للأمان');
      }
    );

    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const handleCopyNormal = async (text: string, fieldName: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!text) return;
    sounds.playKeypadClick();
    setCopiedField(fieldName);
    await copyPlainText(text);
    if (onCopiedToast) onCopiedToast('تم النسخ إلى الحافظة');
    setTimeout(() => {
      setCopiedField(null);
    }, 1800);
  };

  const handleOpenUrl = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.url) return;
    sounds.playKeypadClick();
    await sanitizeAndOpenUrl(item.url);
  };

  return (
    <div
      onClick={() => onView(item)}
      style={glowStyle}
      className="group relative flex flex-col justify-between h-full rounded-2xl glass-panel-elevated p-4 sm:p-5 transition-all duration-300 hover:scale-[1.01] cursor-pointer border border-slate-800"
    >
      {/* Top Corner Rivets */}
      <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-slate-700" />
      <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-slate-700" />

      {/* Card Header */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-amber-300 truncate">
                {category?.name || 'عام'}
              </span>
              {item.isFavorite && (
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
              )}
            </div>
            <h3 className="text-base font-bold text-slate-100 truncate tracking-tight group-hover:text-amber-300 transition-colors">
              {item.title}
            </h3>
          </div>

          {/* Quick Actions (Favorite & Options) */}
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => onToggleFavorite(item.id)}
              title={item.isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 transition cursor-pointer"
            >
              <Star
                className={`w-4 h-4 ${
                  item.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-400'
                }`}
              />
            </button>

            {/* Menu Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute left-0 top-full mt-1 w-36 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 py-1 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onView(item);
                      }}
                      className="w-full px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>عرض كامل</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit(item);
                      }}
                      className="w-full px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>تعديل</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onDuplicate(item);
                      }}
                      className="w-full px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                    >
                      <CopyPlus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>تكرار كعنصر</span>
                    </button>
                    <div className="h-px bg-slate-800 my-1" />
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(item.id);
                      }}
                      className="w-full px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Short Description */}
        {item.description && (
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-2.5">
            {item.description}
          </p>
        )}

        {/* URL Link */}
        {item.url && (
          <div
            onClick={handleOpenUrl}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-slate-600 text-[11px] text-blue-400 hover:text-blue-300 max-w-full truncate mb-2.5 transition cursor-pointer"
            title="فتح الرابط في متصفح خارجي"
          >
            <ExternalLink className="w-3 h-3 shrink-0" />
            <span className="font-mono truncate">{safeString(item.url).replace(/^https?:\/\//, '')}</span>
          </div>
        )}
      </div>

      {/* Credentials */}
      <div className="mt-2 space-y-1.5 border-t border-slate-800/80 pt-2.5">
        {item.username && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800/70 text-xs"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-slate-400 text-[11px]">المستخدم:</span>
              <span className="font-mono text-slate-200 truncate select-all">{item.username}</span>
            </div>
            <button
              type="button"
              onClick={(e) => handleCopyNormal(item.username, 'username', e)}
              title="نسخ اسم المستخدم"
              className="p-1 rounded text-slate-400 hover:text-amber-400 transition shrink-0 cursor-pointer"
            >
              {copiedField === 'username' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        )}

        {item.password && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800/70 text-xs"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-slate-400 text-[11px]">كلمة المرور:</span>
              <span className="font-mono text-slate-200 tracking-wider truncate">
                {showPassword ? item.password : '••••••••••••'}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPassword(!showPassword);
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-200 transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={(e) => handleCopySensitive(item.password, 'password', e)}
                title="نسخ مشفر ومحمي بمؤقت الحافظة"
                className="p-1 rounded text-slate-400 hover:text-amber-400 transition cursor-pointer"
              >
                {copiedField === 'password' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Badges footer */}
        <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5">
            {item.apiKeys && item.apiKeys.length > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold">
                {item.apiKeys.length} مفاتيح API
              </span>
            )}
            {item.licenseKeys && item.licenseKeys.length > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold">
                {item.licenseKeys.length} تراخيص
              </span>
            )}
          </div>
          <span className="font-mono">
            {new Date(item.updatedAt || item.createdAt).toLocaleDateString('ar-EG')}
          </span>
        </div>
      </div>
    </div>
  );
};
