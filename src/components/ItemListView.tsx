import React from 'react';
import {
  Star,
  ExternalLink,
  Edit2,
  Trash2,
  Maximize2,
  CopyPlus,
  Key,
  Award,
} from 'lucide-react';
import { VaultItem, Category } from '../types';
import { sounds } from '../utils/audio';
import { sanitizeAndOpenUrl } from '../utils/url';

interface ItemListViewProps {
  items: VaultItem[];
  categories: Category[];
  onView: (item: VaultItem) => void;
  onEdit: (item: VaultItem) => void;
  onDelete: (id: string) => void;
  onDuplicate: (item: VaultItem) => void;
  onToggleFavorite: (id: string) => void;
}

export const ItemListView: React.FC<ItemListViewProps> = ({
  items,
  categories,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFavorite,
}) => {
  const getCategory = (catId: string) => categories.find((c) => c.id === catId);

  const handleOpenUrl = (url?: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!url) return;
    sounds.playKeypadClick();
    sanitizeAndOpenUrl(url);
  };

  return (
    <div className="w-full rounded-2xl glass-panel border border-slate-800 overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          {/* Table Header */}
          <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-3 w-10 text-center">المفضلة</th>
              <th className="py-3 px-4">اسم الموقع / العنصر</th>
              <th className="py-3 px-3">التصنيف</th>
              <th className="py-3 px-3">الموقع المزود</th>
              <th className="py-3 px-4">اسم المستخدم</th>
              <th className="py-3 px-3">المفاتيح والتراخيص</th>
              <th className="py-3 px-3">تاريخ التعديل</th>
              <th className="py-3 px-3 text-center">الإجراءات</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {items.map((item) => {
              const category = getCategory(item.category);
              const glowStyle = category?.glowColor
                ? { boxShadow: `inset 4px 0 0 ${category.glowColor}` }
                : {};

              return (
                <tr
                  key={item.id}
                  onClick={() => onView(item)}
                  style={glowStyle}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                >
                  {/* Favorite */}
                  <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(item.id)}
                      className="p-1 text-slate-500 hover:text-amber-400 transition cursor-pointer"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          item.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                        }`}
                      />
                    </button>
                  </td>

                  {/* Title & URL */}
                  <td className="py-2.5 px-4 font-bold text-slate-100">
                    <div className="flex flex-col">
                      <span className="group-hover:text-amber-300 transition-colors">
                        {item.title}
                      </span>
                      {item.url && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenUrl(item.url, e)}
                          className="text-[10px] text-blue-400 hover:text-blue-300 font-mono text-right flex items-center gap-1 mt-0.5"
                        >
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate max-w-[180px]">
                            {item.url.replace(/^https?:\/\//, '')}
                          </span>
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-amber-300 text-[10px] font-bold">
                      {category?.name || 'عام'}
                    </span>
                  </td>

                  {/* Website Provider */}
                  <td className="py-2.5 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                    {item.website || '—'}
                  </td>

                  {/* Username (Never shows password directly in list) */}
                  <td className="py-2.5 px-4 font-mono text-slate-300 text-[11px] whitespace-nowrap select-all">
                    {item.username || '—'}
                  </td>

                  {/* Keys & Badges */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {item.apiKeys && item.apiKeys.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                          <Key className="w-2.5 h-2.5" />
                          {item.apiKeys.length}
                        </span>
                      )}
                      {item.licenseKeys && item.licenseKeys.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                          <Award className="w-2.5 h-2.5" />
                          {item.licenseKeys.length}
                        </span>
                      )}
                      {(!item.apiKeys || item.apiKeys.length === 0) &&
                        (!item.licenseKeys || item.licenseKeys.length === 0) && (
                          <span className="text-slate-600 text-[10px]">—</span>
                        )}
                    </div>
                  </td>

                  {/* Updated At */}
                  <td className="py-2.5 px-3 text-slate-400 font-mono text-[10px] whitespace-nowrap">
                    {new Date(item.updatedAt || item.createdAt).toLocaleDateString('ar-EG')}
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => onView(item)}
                        title="عرض كامل"
                        className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-800 cursor-pointer"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        title="تعديل"
                        className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDuplicate(item)}
                        title="تكرار"
                        className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 cursor-pointer"
                      >
                        <CopyPlus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item.id)}
                        title="حذف"
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
