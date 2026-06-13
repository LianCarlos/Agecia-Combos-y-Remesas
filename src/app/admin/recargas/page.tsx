'use client';

import { useState, useEffect, useCallback } from 'react';

interface Recarga {
  id: string;
  title: string;
  description: string | null;
  price_usd: number;
  image_url: string | null;
  active: boolean;
  created_at: string;
}

export default function RecargasPage() {
  const [recargas, setRecargas] = useState<Recarga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', price_usd: 0, image_url: '', active: true });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchRecargas = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/recargas');
      if (!res.ok) throw new Error('Error al cargar recargas');
      setRecargas(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecargas(); }, [fetchRecargas]);

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleBulkDelete() {
    if (!confirm(`¿Eliminar ${selectedIds.size} recarga(s) seleccionada(s)?`)) return;
    setBulkDeleting(true);
    try {
      await Promise.all(Array.from(selectedIds).map(id =>
        fetch(`/api/admin/recargas/${id}`, { method: 'DELETE' })
      ));
      setSelectedIds(new Set());
      fetchRecargas();
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
    try {
      const fd = new FormData();
      fd.append('file', imageFile);
      const res = await fetch('/api/admin/recargas/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data.url as string;
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
      const url = editingId ? `/api/admin/recargas/${editingId}` : '/api/admin/recargas';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, price_usd: Number(form.price_usd), image_url: imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
      setShowForm(false);
      setEditingId(null);
      setForm({ title: '', description: '', price_usd: 0, image_url: '', active: true });
      setImageFile(null);
      setImagePreview(null);
      fetchRecargas();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`¿Eliminar recarga "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/recargas/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      fetchRecargas();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error');
    }
  }

  async function toggleActive(r: Recarga) {
    try {
      const res = await fetch(`/api/admin/recargas/${r.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...r, active: !r.active }),
      });
      if (!res.ok) throw new Error('Error al actualizar');
      fetchRecargas();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error');
    }
  }

  function openEdit(r: Recarga) {
    setEditingId(r.id);
    setForm({ title: r.title, description: r.description ?? '', price_usd: r.price_usd, image_url: r.image_url ?? '', active: r.active });
    setImagePreview(r.image_url);
    setImageFile(null);
    setShowForm(true);
  }

  function openNew() {
    setEditingId(null);
    setForm({ title: '', description: '', price_usd: 0, image_url: '', active: true });
    setImageFile(null);
    setImagePreview(null);
    setShowForm(true);
  }

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded bg-slate-200" />
      {[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-xl bg-slate-100" />)}
    </div>
  );

  if (error) return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <p className="text-red-700 font-medium">⚠️ {error}</p>
      <button onClick={fetchRecargas} className="mt-3 text-sm text-brand-green font-semibold hover:underline">Reintentar</button>
    </div>
  );

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Recargas Móviles</h1>
          <p className="mt-1 text-sm text-slate-500">Gestiona los planes de recarga para Cuba</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95">
          <span className="text-lg leading-none">+</span> Nueva Recarga
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form onSubmit={handleSave} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="mb-4 text-lg font-bold text-slate-900">{editingId ? 'Editar Recarga' : 'Nueva Recarga'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none transition"
                  placeholder="Ej: Recarga 1GB LTE" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none transition resize-none"
                  placeholder="Detalles del plan de recarga..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Precio (USD)</label>
                <input type="number" step="0.01" min="0.01" value={form.price_usd || ''}
                  onChange={e => setForm({ ...form, price_usd: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none transition"
                  placeholder="Ej: 5.00" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Imagen</label>
                <input type="file" accept="image/*" onChange={handleImageSelect}
                  className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-green/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-brand-green hover:file:bg-brand-green/20" />
                {imagePreview && (
                  <img src={imagePreview} alt="preview" className="mt-2 h-28 w-full rounded-xl object-cover" />
                )}
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-brand-green focus:ring-brand-green" />
                <span className="text-sm font-medium text-slate-700">Activa (visible al público)</span>
              </label>
            </div>
            <div className="mt-5 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition">Cancelar</button>
              <button type="submit" disabled={saving || uploading} className="rounded-xl bg-brand-green px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition">
                {uploading ? 'Subiendo...' : saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {recargas.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <span className="text-4xl">📱</span>
          <p className="mt-3 text-slate-500 font-medium">No hay recargas configuradas</p>
          <p className="text-sm text-slate-400">Agrega el primer plan de recarga</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recargas.map(r => (
            <div
              key={r.id}
              className={`rounded-2xl bg-white shadow-sm overflow-hidden border transition ${r.active ? 'border-transparent' : 'border-slate-200 opacity-60'} ${selectedIds.has(r.id) ? 'ring-2 ring-red-400' : ''}`}
            >
              <div className="relative">
                {r.image_url ? (
                  <img src={r.image_url} alt={r.title} className="h-36 w-full object-cover" />
                ) : (
                  <div className="h-24 w-full bg-gradient-to-br from-brand-green/10 to-emerald-50 flex items-center justify-center">
                    <span className="text-3xl">📱</span>
                  </div>
                )}
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(r.id)}
                    onChange={() => toggleSelect(r.id)}
                    onClick={e => e.stopPropagation()}
                    className="h-5 w-5 rounded border-2 border-white shadow text-brand-green focus:ring-brand-green cursor-pointer bg-white/90"
                  />
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-800 text-sm leading-tight">{r.title}</h3>
                  <span className="text-base font-extrabold text-brand-green whitespace-nowrap">${r.price_usd.toFixed(2)}</span>
                </div>
                {r.description && <p className="mt-1 text-xs text-slate-500 line-clamp-2">{r.description}</p>}
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <button onClick={() => toggleActive(r)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${r.active ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                    {r.active ? 'Pausar' : 'Activar'}
                  </button>
                  <button onClick={() => openEdit(r)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition">Editar</button>
                  <button onClick={() => handleDelete(r.id, r.title)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition">Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl bg-slate-900 px-5 py-3 shadow-2xl ring-1 ring-white/10">
          <span className="text-sm font-medium text-white">
            {selectedIds.size} seleccionada{selectedIds.size !== 1 ? 's' : ''}
          </span>
          <button
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition"
          >
            {bulkDeleting ? 'Eliminando...' : 'Eliminar seleccionadas'}
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
