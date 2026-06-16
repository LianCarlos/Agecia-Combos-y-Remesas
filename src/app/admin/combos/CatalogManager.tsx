'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getCombosServerAction,
  createComboServerAction,
  updateComboServerAction,
  deleteComboServerAction,
} from '../actions';
import {
  getProductsAction,
  createProductAction,
  updateProductAction,
  deleteProductAction,
  uploadComboImageAction,
  uploadProductImageAction,
} from '@/lib/actions/admin';

export interface CatalogConfig {
  /** Etiqueta singular, ej "Combo" / "Producto" */
  singular: string;
  /** Tipo de catálogo: decide qué Server Actions se usan */
  kind: 'combo' | 'product';
  /** Nombre del campo booleano de visibilidad en la BD */
  activeField: 'available' | 'active';
  /** Emoji para el placeholder */
  emoji: string;
}

interface CatalogItem {
  id: string;
  title: string;
  description: string | null;
  price_usd: number;
  image_url: string | null;
  available?: boolean;
  active?: boolean;
}

export function CatalogManager({ config }: { config: CatalogConfig }) {
  const { singular, kind, activeField, emoji } = config;
  const isCombo = kind === 'combo';

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', price_usd: 0, image_url: '', on: true });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMode, setImageMode] = useState<'file' | 'url'>('file');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const isOn = useCallback((it: CatalogItem) => (activeField === 'available' ? !!it.available : !!it.active), [activeField]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = isCombo ? await getCombosServerAction() : await getProductsAction();
      setItems(data as CatalogItem[]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [isCombo]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleBulkDelete() {
    if (!confirm(`¿Eliminar ${selectedIds.size} elemento(s) seleccionado(s)?`)) return;
    setBulkDeleting(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map(id => (isCombo ? deleteComboServerAction(id) : deleteProductAction(id)))
      );
      setSelectedIds(new Set());
      fetchItems();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error al eliminar');
    } finally {
      setBulkDeleting(false);
    }
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('La imagen no puede superar 5MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setForm(f => ({ ...f, image_url: '' }));
  }

  function handleImageUrlChange(url: string) {
    setForm(f => ({ ...f, image_url: url }));
    setImagePreview(url || null);
    setImageFile(null);
  }

  async function uploadImage(): Promise<string | null> {
    if (!imageFile) return form.image_url || null;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', imageFile);
      const url = isCombo ? await uploadComboImageAction(fd) : await uploadProductImageAction(fd);
      return url;
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error al subir imagen');
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || form.price_usd <= 0) return;
    setSaving(true);
    try {
      const imageUrl = await uploadImage();
      if (imageUrl === null && imageFile) { setSaving(false); return; }
      const base = {
        title: form.title.trim(),
        description: form.description,
        price_usd: Number(form.price_usd),
        image_url: imageUrl || form.image_url,
      };

      if (isCombo) {
        if (editingId) {
          await updateComboServerAction(editingId, { ...base, available: form.on });
        } else {
          const created = await createComboServerAction(base);
          if (created && !form.on) await updateComboServerAction(created.id, { available: false });
        }
      } else {
        if (editingId) {
          await updateProductAction(editingId, { ...base, active: form.on });
        } else {
          await createProductAction({ ...base, active: form.on });
        }
      }
      closeForm();
      fetchItems();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleOn(it: CatalogItem) {
    try {
      if (isCombo) await updateComboServerAction(it.id, { available: !isOn(it) });
      else await updateProductAction(it.id, { active: !isOn(it) });
      fetchItems();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(`¿Eliminar este ${singular.toLowerCase()}?`)) return;
    try {
      if (isCombo) await deleteComboServerAction(id);
      else await deleteProductAction(id);
      fetchItems();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error');
    }
  }

  function openEdit(it: CatalogItem) {
    setEditingId(it.id);
    setForm({ title: it.title, description: it.description || '', price_usd: it.price_usd, image_url: it.image_url || '', on: isOn(it) });
    setImagePreview(it.image_url || null);
    setImageFile(null);
    setImageMode(it.image_url ? 'url' : 'file');
    setShowForm(true);
  }

  function openNew() {
    setEditingId(null);
    setForm({ title: '', description: '', price_usd: 0, image_url: '', on: true });
    setImageFile(null);
    setImagePreview(null);
    setImageMode('file');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({ title: '', description: '', price_usd: 0, image_url: '', on: true });
    setImageFile(null);
    setImagePreview(null);
    setImageMode('file');
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-64 rounded-2xl bg-slate-100" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700 font-medium">⚠️ {error}</p>
        <button onClick={fetchItems} className="mt-3 text-sm text-brand-green font-semibold hover:underline">Reintentar</button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-slate-400">{items.length} {singular.toLowerCase()}{items.length !== 1 ? 's' : ''}</span>
        <button onClick={openNew} className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95">
          <span className="text-lg leading-none">+</span> Nuevo {singular}
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form onSubmit={handleSave} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="mb-4 text-lg font-bold text-slate-900">{editingId ? `Editar ${singular}` : `Nuevo ${singular}`}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none transition" placeholder={`Nombre del ${singular.toLowerCase()}`} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none transition" placeholder="Descripción..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Precio (USD)</label>
                <input type="number" step="0.01" min="0.01" value={form.price_usd || ''} onChange={e => setForm({ ...form, price_usd: parseFloat(e.target.value) || 0 })} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none transition" placeholder="0.00" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Imagen</label>
                <div className="mb-3 flex overflow-hidden rounded-xl border border-slate-200">
                  <button type="button" onClick={() => { setImageMode('file'); setForm(f => ({ ...f, image_url: '' })); setImagePreview(null); setImageFile(null); }} className={`flex-1 py-2 text-xs font-semibold transition-colors ${imageMode === 'file' ? 'bg-brand-green text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                    Subir archivo
                  </button>
                  <button type="button" onClick={() => { setImageMode('url'); setImageFile(null); }} className={`flex-1 py-2 text-xs font-semibold transition-colors ${imageMode === 'url' ? 'bg-brand-green text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                    URL externa
                  </button>
                </div>
                {imageMode === 'file' ? (
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageSelect} className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brand-green/10 file:text-brand-green hover:file:bg-brand-green/20 transition" />
                ) : (
                  <input type="url" value={form.image_url} onChange={e => handleImageUrlChange(e.target.value)} placeholder="https://ejemplo.com/imagen.jpg" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none transition" />
                )}
                {imagePreview && (
                  <div className="mt-3 relative rounded-xl overflow-hidden bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                  </div>
                )}
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, on: !form.on })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.on ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${form.on ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm font-medium text-slate-700">Visible al público</span>
              </label>
            </div>
            <div className="mt-5 flex gap-3 justify-end">
              <button type="button" onClick={closeForm} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition">Cancelar</button>
              <button type="submit" disabled={saving || uploading} className="rounded-xl bg-brand-green px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition">
                {uploading ? 'Subiendo imagen...' : saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <span className="text-4xl">{emoji}</span>
          <p className="mt-3 text-slate-500 font-medium">No hay {singular.toLowerCase()}s</p>
          <p className="text-sm text-slate-400">Agrega el primero al catálogo</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((c) => {
            const on = isOn(c);
            return (
              <div key={c.id} className={`group rounded-xl bg-white shadow-sm overflow-hidden transition-all hover:shadow-md ${selectedIds.has(c.id) ? 'ring-2 ring-red-400' : ''} ${!on ? 'opacity-60' : ''}`}>
                <div className="h-32 bg-slate-50 relative overflow-hidden flex items-center justify-center">
                  <div className="absolute top-2 left-2 z-10">
                    <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleSelect(c.id)} onClick={e => e.stopPropagation()} className="h-4 w-4 rounded border-2 border-white shadow text-brand-green focus:ring-brand-green cursor-pointer bg-white/90" />
                  </div>
                  {c.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image_url} alt={c.title} className="w-full h-full object-contain p-1" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-4xl text-slate-300">{emoji}</div>
                  )}
                  {!on && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white font-bold text-xs uppercase tracking-wider bg-black/60 px-2 py-0.5 rounded-full">Oculto</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="text-sm font-bold text-slate-900 leading-tight line-clamp-1">{c.title}</h3>
                    <span className="text-brand-green font-bold text-sm whitespace-nowrap">${c.price_usd.toFixed(2)}</span>
                  </div>
                  {c.description && <p className="mt-1 text-xs text-slate-500 line-clamp-1">{c.description}</p>}
                  <div className="mt-2 flex items-center gap-1.5">
                    <button onClick={() => openEdit(c)} className="flex-1 rounded-lg bg-slate-100 px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition">Editar</button>
                    <button onClick={() => toggleOn(c)} className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition ${on ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>{on ? 'Pausar' : 'Activar'}</button>
                    <button onClick={() => handleDelete(c.id)} className="rounded-lg bg-red-50 px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition">Eliminar</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl bg-slate-900 px-5 py-3 shadow-2xl ring-1 ring-white/10">
          <span className="text-sm font-medium text-white">{selectedIds.size} seleccionado{selectedIds.size !== 1 ? 's' : ''}</span>
          <button onClick={handleBulkDelete} disabled={bulkDeleting} className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition">
            {bulkDeleting ? 'Eliminando...' : 'Eliminar seleccionados'}
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="rounded-xl px-3 py-2 text-sm font-medium text-slate-400 hover:text-white transition">Cancelar</button>
        </div>
      )}
    </div>
  );
}
