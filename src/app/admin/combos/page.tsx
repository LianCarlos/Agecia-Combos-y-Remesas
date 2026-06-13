'use client';

import { useState, useEffect, useCallback } from 'react';

interface Combo {
  id: string;
  title: string;
  description: string;
  price_usd: number;
  image_url: string | null;
  available: boolean;
}

export default function CombosPage() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', price_usd: 0, image_url: '', available: true });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchCombos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/combos');
      if (!res.ok) throw new Error('Error al cargar');
      const data = await res.json();
      setCombos(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCombos(); }, [fetchCombos]);

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleBulkDelete() {
    if (!confirm(`¿Eliminar ${selectedIds.size} combo(s) seleccionado(s)?`)) return;
    setBulkDeleting(true);
    try {
      await Promise.all(Array.from(selectedIds).map(id =>
        fetch(`/api/admin/combos/${id}`, { method: 'DELETE' })
      ));
      setSelectedIds(new Set());
      fetchCombos();
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
  }

  async function uploadImage(): Promise<string | null> {
    if (!imageFile) return form.image_url || null;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', imageFile);
    const res = await fetch('/api/admin/combos/upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Error desconocido' }));
      alert('Error al subir imagen: ' + (errData.error || 'Error desconocido'));
      setUploading(false);
      return null;
    }
    const data = await res.json();
    setUploading(false);
    return data.url;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || form.price_usd <= 0) return;
    setSaving(true);
    try {
      const imageUrl = await uploadImage();
      if (imageUrl === null && imageFile) { setSaving(false); return; }
      const payload = { ...form, image_url: imageUrl || form.image_url };
      const url = editingId ? `/api/admin/combos/${editingId}` : '/api/admin/combos';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Error al guardar');
      setShowForm(false);
      setEditingId(null);
      setImageFile(null);
      setImagePreview(null);
      setForm({ title: '', description: '', price_usd: 0, image_url: '', available: true });
      fetchCombos();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleDisponible(c: Combo) {
    try {
      const res = await fetch(`/api/admin/combos/${c.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...c, available: !c.available }),
      });
      if (!res.ok) throw new Error('Error');
      fetchCombos();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este combo?')) return;
    try {
      const res = await fetch(`/api/admin/combos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      fetchCombos();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error');
    }
  }

  function openEdit(c: Combo) {
    setEditingId(c.id);
    setForm({ title: c.title, description: c.description || '', price_usd: c.price_usd, image_url: c.image_url || '', available: c.available });
    setImagePreview(c.image_url || null);
    setImageFile(null);
    setShowForm(true);
  }

  function openNew() {
    setEditingId(null);
    setForm({ title: '', description: '', price_usd: 0, image_url: '', available: true });
    setImageFile(null);
    setImagePreview(null);
    setShowForm(true);
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded bg-slate-200" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (<div key={i} className="h-64 rounded-2xl bg-slate-100" />))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700 font-medium">⚠️ {error}</p>
        <button onClick={fetchCombos} className="mt-3 text-sm text-brand-green font-semibold hover:underline">Reintentar</button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Combos</h1>
          <p className="mt-1 text-sm text-slate-500">Gestiona el catálogo de combos</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95"
        >
          <span className="text-lg leading-none">+</span> Nuevo Combo
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form onSubmit={handleSave} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="mb-4 text-lg font-bold text-slate-900">{editingId ? 'Editar Combo' : 'Nuevo Combo'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none transition" placeholder="Nombre del combo" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none transition" placeholder="Contenido del combo..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Precio (USD)</label>
                <input type="number" step="0.01" min="0.01" value={form.price_usd || ''} onChange={e => setForm({ ...form, price_usd: parseFloat(e.target.value) || 0 })} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none transition" placeholder="0.00" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Imagen</label>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageSelect} className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brand-green/10 file:text-brand-green hover:file:bg-brand-green/20 transition" />
                {imagePreview && (
                  <div className="mt-3 relative rounded-xl overflow-hidden bg-slate-100">
                    <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-700">Disponible</label>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, available: !form.available })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.available ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${form.available ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
            <div className="mt-5 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition">Cancelar</button>
              <button type="submit" disabled={saving || uploading} className="rounded-xl bg-brand-green px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition">
                {uploading ? 'Subiendo imagen...' : saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {combos.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <span className="text-4xl">📦</span>
          <p className="mt-3 text-slate-500 font-medium">No hay combos</p>
          <p className="text-sm text-slate-400">Agrega tu primer combo para el catálogo</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {combos.map((c) => (
            <div
              key={c.id}
              className={`group rounded-2xl bg-white shadow-sm overflow-hidden transition-all hover:shadow-md ${selectedIds.has(c.id) ? 'ring-2 ring-red-400' : ''}`}
            >
              <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(c.id)}
                    onChange={() => toggleSelect(c.id)}
                    onClick={e => e.stopPropagation()}
                    className="h-5 w-5 rounded border-2 border-white shadow text-brand-green focus:ring-brand-green cursor-pointer bg-white/90"
                  />
                </div>
                {c.image_url ? (
                  <img src={c.image_url} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="flex items-center justify-center h-full text-5xl text-slate-300">📦</div>
                )}
                {!c.available && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white font-bold text-sm uppercase tracking-wider bg-black/60 px-3 py-1 rounded-full">Agotado</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900 leading-tight">{c.title}</h3>
                  <span className="text-brand-green font-bold text-lg whitespace-nowrap">${c.price_usd.toFixed(2)}</span>
                </div>
                {c.description && <p className="mt-2 text-sm text-slate-500 line-clamp-2">{c.description}</p>}
                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => openEdit(c)} className="flex-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition">Editar</button>
                  <button onClick={() => toggleDisponible(c)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${c.available ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>{c.available ? 'Pausar' : 'Activar'}</button>
                  <button onClick={() => handleDelete(c.id)} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition">Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl bg-slate-900 px-5 py-3 shadow-2xl ring-1 ring-white/10">
          <span className="text-sm font-medium text-white">
            {selectedIds.size} seleccionado{selectedIds.size !== 1 ? 's' : ''}
          </span>
          <button
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition"
          >
            {bulkDeleting ? 'Eliminando...' : 'Eliminar seleccionados'}
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="rounded-xl px-3 py-2 text-sm font-medium text-slate-400 hover:text-white transition"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
