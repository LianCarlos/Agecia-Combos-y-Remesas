'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DeliveryMethod } from '@/types';

/* ─── Props ─── */

interface DeliveryMethodsManagerProps {
  initialMethods: DeliveryMethod[] | null;
  initialError: string | null;
  adminToken: string;
}

/* ─── Skeleton ─── */

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 border-b border-slate-100 px-4 py-3.5 sm:px-6">
      <div className="h-5 w-32 animate-pulse rounded-md bg-slate-200" />
      <div className="h-5 w-16 animate-pulse rounded-full bg-slate-200" />
      <div className="ml-auto h-8 w-20 animate-pulse rounded-lg bg-slate-200" />
    </div>
  );
}

/* ─── Empty State ─── */

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
        🚚
      </div>
      <h3 className="mb-1 text-base font-semibold text-slate-700">
        Sin métodos de entrega
      </h3>
      <p className="mb-6 max-w-xs text-sm text-slate-400">
        No hay métodos de entrega registrados aún. Agrega el primero para comenzar.
      </p>
      <button onClick={onAdd} className="btn-primary">
        + Agregar Método
      </button>
    </div>
  );
}

/* ─── Error State ─── */

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <div className="mb-3 text-3xl">⚠️</div>
      <p className="mb-4 text-sm font-medium text-red-600">{message}</p>
      <button onClick={onRetry} className="btn-primary text-sm">
        Reintentar
      </button>
    </div>
  );
}

/* ─── Confirm Dialog ─── */

function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onCancel}
    >
      <div
        className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-2 text-lg font-bold text-slate-800">{title}</h3>
        <p className="mb-6 text-sm text-slate-500">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl bg-brand-red px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-red-dark disabled:opacity-50"
          >
            {loading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Toast ─── */

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-medium shadow-lg animate-fade-in-up sm:bottom-6 ${
        type === 'success'
          ? 'bg-brand-green text-white'
          : 'bg-brand-red text-white'
      }`}
      role="alert"
    >
      {message}
    </div>
  );
}

/* ─── Manager ─── */

export function DeliveryMethodsManager({
  initialMethods,
  initialError,
  adminToken,
}: DeliveryMethodsManagerProps) {
  const [methods, setMethods] = useState<DeliveryMethod[]>(initialMethods ?? []);
  const [loading, setLoading] = useState(!initialMethods && !initialError);
  const [error, setError] = useState<string | null>(initialError);
  const [saving, setSaving] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');

  // Confirm dialog
  const [deleteTarget, setDeleteTarget] = useState<DeliveryMethod | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  /* ─── Fetch methods ─── */

  const fetchMethods = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/delivery-methods', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) throw new Error('Error al cargar métodos de entrega');
      const data = await res.json();
      setMethods(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    if (!initialMethods && !initialError) {
      fetchMethods();
    }
  }, [initialMethods, initialError, fetchMethods]);

  /* ─── Open / Close Modal ─── */

  function openCreateModal() {
    setEditingId(null);
    setFormName('');
    setModalOpen(true);
  }

  function openEditModal(method: DeliveryMethod) {
    setEditingId(method.id);
    setFormName(method.name);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setFormName('');
  }

  /* ─── Save ─── */

  async function handleSave() {
    if (!formName.trim()) return;

    setSaving(true);
    try {
      const isEdit = !!editingId;
      const url = isEdit
        ? `/api/admin/delivery-methods/${editingId}`
        : '/api/admin/delivery-methods';
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit ? { name: formName.trim() } : { name: formName.trim() };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar');
      }

      const saved = await res.json();

      if (isEdit) {
        setMethods((prev) => prev.map((m) => (m.id === editingId ? saved : m)));
      } else {
        setMethods((prev) => [...prev, saved]);
      }

      setToast({ message: isEdit ? 'Método actualizado' : 'Método creado', type: 'success' });
      closeModal();
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Error al guardar',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  }

  /* ─── Toggle active ─── */

  async function handleToggle(method: DeliveryMethod) {
    try {
      const res = await fetch(`/api/admin/delivery-methods/${method.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ is_active: !method.active }),
      });

      if (!res.ok) throw new Error('Error al actualizar');

      const updated = await res.json();
      setMethods((prev) => prev.map((m) => (m.id === method.id ? updated : m)));
      setToast({
        message: updated.active ? 'Método activado' : 'Método desactivado',
        type: 'success',
      });
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Error al actualizar',
        type: 'error',
      });
    }
  }

  /* ─── Delete ─── */

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/delivery-methods/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (!res.ok) throw new Error('Error al eliminar');

      setMethods((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      setToast({ message: 'Método eliminado', type: 'success' });
      setDeleteTarget(null);
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Error al eliminar',
        type: 'error',
      });
    } finally {
      setDeleting(false);
    }
  }

  /* ─── Render ─── */

  if (loading) {
    return (
      <div className="card-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6">
          <div className="h-5 w-28 animate-pulse rounded-md bg-slate-200" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  if (error && methods.length === 0) {
    return <ErrorState message={error} onRetry={fetchMethods} />;
  }

  if (methods.length === 0) {
    return (
      <>
        <EmptyState onAdd={openCreateModal} />
        {modalOpen && (
          <MethodModal
            open={modalOpen}
            editing={!!editingId}
            name={formName}
            onNameChange={setFormName}
            onSave={handleSave}
            onClose={closeModal}
            saving={saving}
          />
        )}
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-slate-400">
          {methods.length} método{methods.length !== 1 ? 's' : ''}
        </span>
        <button onClick={openCreateModal} className="btn-primary text-sm">
          + Agregar Método
        </button>
      </div>

      {/* Table */}
      <div className="card-white overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden border-b border-slate-100 bg-slate-50/50 px-6 py-3 sm:grid sm:grid-cols-[1fr,auto,auto]">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Nombre
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Estado
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Acciones
          </span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-50">
          {methods.map((method) => (
            <div
              key={method.id}
              className="flex flex-col gap-2 px-4 py-3.5 sm:grid sm:grid-cols-[1fr,auto,auto] sm:items-center sm:gap-4 sm:px-6"
            >
              {/* Name */}
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-red/10 text-sm">
                  🚚
                </span>
                <span className="text-sm font-medium text-slate-700">
                  {method.name}
                </span>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center gap-2 sm:justify-center">
                <button
                  onClick={() => handleToggle(method)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-green/30 ${
                    method.active ? 'bg-brand-green' : 'bg-slate-300'
                  }`}
                  role="switch"
                  aria-checked={method.active}
                  aria-label={`${method.active ? 'Desactivar' : 'Activar'} ${method.name}`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      method.active ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span
                  className={`text-xs font-medium sm:hidden ${
                    method.active ? 'text-brand-green' : 'text-slate-400'
                  }`}
                >
                  {method.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 sm:justify-end">
                <button
                  onClick={() => openEditModal(method)}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                  aria-label={`Editar ${method.name}`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                  </svg>
                </button>
                <button
                  onClick={() => setDeleteTarget(method)}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/30"
                  aria-label={`Eliminar ${method.name}`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <MethodModal
          open={modalOpen}
          editing={!!editingId}
          name={formName}
          onNameChange={setFormName}
          onSave={handleSave}
          onClose={closeModal}
          saving={saving}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar método de entrega"
        message={`¿Estás seguro de eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}

/* ─── Modal Component ─── */

function MethodModal({
  open,
  editing,
  name,
  onNameChange,
  onSave,
  onClose,
  saving,
}: {
  open: boolean;
  editing: boolean;
  name: string;
  onNameChange: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={editing ? 'Editar método de entrega' : 'Nuevo método de entrega'}
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-bold text-slate-800">
          {editing ? 'Editar Método' : 'Nuevo Método de Entrega'}
        </h3>

        <label htmlFor="delivery-method-name" className="mb-1.5 block text-sm font-medium text-slate-600">
          Nombre
        </label>
        <input
          id="delivery-method-name"
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Ej: Efectivo, Recogida en tienda..."
          className="input-mr mb-6"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave();
            if (e.key === 'Escape') onClose();
          }}
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={saving || !name.trim()}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {saving ? 'Guardando...' : editing ? 'Guardar Cambios' : 'Crear Método'}
          </button>
        </div>
      </div>
    </div>
  );
}
