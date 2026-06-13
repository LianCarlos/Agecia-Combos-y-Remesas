'use client';

import { useState, useEffect, useCallback } from 'react';
import { createEmployee, revokeEmployeeAccess, updateSuperadminProfile, resetEmployeePassword, getWhatsappPhone, updateWhatsappPhone } from '@/lib/actions/employees';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'superadmin' | 'empleado';
  is_active: boolean;
}

export default function EmployeesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', fullName: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showEditSuperadmin, setShowEditSuperadmin] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', password: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappSaving, setWhatsappSaving] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [resetTarget, setResetTarget] = useState<Profile | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetSaving, setResetSaving] = useState(false);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/employees');
      if (res.status === 403) { setIsSuperAdmin(false); setCheckingRole(false); setLoading(false); return; }
      if (!res.ok) throw new Error('Error al cargar');
      const data = await res.json();
      setProfiles(data);
      setIsSuperAdmin(true);
      const phone = await getWhatsappPhone();
      setWhatsappPhone(phone);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCheckingRole(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email.trim() || !form.password.trim()) return;
    setSaving(true);
    setActionMessage(null);
    try {
      const result = await createEmployee(form.email.trim(), form.password, form.fullName.trim());
      if (result.success) {
        setActionMessage({ type: 'success', text: 'Empleado creado exitosamente' });
        setShowForm(false);
        setForm({ email: '', fullName: '', password: '' });
        fetchProfiles();
      } else {
        setActionMessage({ type: 'error', text: result.error || 'Error al crear empleado' });
      }
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleRevoke(id: string, name: string) {
    if (!confirm(`¿Revocar acceso a ${name || 'este empleado'}?`)) return;
    setActionMessage(null);
    try {
      const result = await revokeEmployeeAccess(id);
      if (result.success) {
        setActionMessage({ type: 'success', text: 'Acceso revocado' });
        fetchProfiles();
      } else {
        setActionMessage({ type: 'error', text: result.error || 'Error al revocar acceso' });
      }
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e.message });
    }
  }

  function openEditSuperadmin(p: Profile) {
    setEditForm({ name: p.full_name || 'MrFactus', password: '' });
    setActionMessage(null);
    setShowEditSuperadmin(true);
  }

  async function handleEditSuperadmin(e: React.FormEvent) {
    e.preventDefault();
    if (!editForm.name.trim()) return;
    setEditSaving(true);
    setActionMessage(null);
    try {
      const result = await updateSuperadminProfile(
        editForm.name.trim(),
        editForm.password.trim() || undefined,
      );
      if (result.success) {
        setActionMessage({ type: 'success', text: editForm.password.trim() ? 'Perfil y contraseña actualizados' : 'Nombre actualizado' });
        setShowEditSuperadmin(false);
        fetchProfiles();
      } else {
        setActionMessage({ type: 'error', text: result.error || 'Error al actualizar' });
      }
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e.message });
    } finally {
      setEditSaving(false);
    }
  }

  async function handleWhatsappSave(e: React.FormEvent) {
    e.preventDefault();
    setWhatsappSaving(true);
    setWhatsappMessage(null);
    try {
      const result = await updateWhatsappPhone(whatsappPhone);
      if (result.success) {
        setWhatsappMessage({ type: 'success', text: 'Número de WhatsApp actualizado' });
      } else {
        setWhatsappMessage({ type: 'error', text: result.error || 'Error al guardar' });
      }
    } catch (e: any) {
      setWhatsappMessage({ type: 'error', text: e.message });
    } finally {
      setWhatsappSaving(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTarget || !resetPassword.trim()) return;
    setResetSaving(true);
    setActionMessage(null);
    try {
      const result = await resetEmployeePassword(resetTarget.id, resetPassword.trim());
      if (result.success) {
        setActionMessage({ type: 'success', text: `Contraseña de ${resetTarget.full_name || resetTarget.email} actualizada` });
        setResetTarget(null);
        setResetPassword('');
      } else {
        setActionMessage({ type: 'error', text: result.error || 'Error al actualizar contraseña' });
      }
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e.message });
    } finally {
      setResetSaving(false);
    }
  }

  function generatePassword() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    let pw = '';
    for (let i = 0; i < 12; i++) pw += chars.charAt(Math.floor(Math.random() * chars.length));
    setForm({ ...form, password: pw });
  }

  function generateResetPassword() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    let pw = '';
    for (let i = 0; i < 12; i++) pw += chars.charAt(Math.floor(Math.random() * chars.length));
    setResetPassword(pw);
  }

  const thClass = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500';
  const tdClass = 'px-4 py-3 text-sm text-slate-700';

  if (checkingRole || loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded bg-slate-200" />
        {[...Array(3)].map((_, i) => (<div key={i} className="h-12 rounded-xl bg-slate-100" />))}
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
        <span className="text-4xl">🔒</span>
        <p className="mt-3 text-slate-700 font-bold text-lg">Acceso Restringido</p>
        <p className="text-sm text-slate-500">Solo el superadmin puede gestionar empleados.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700 font-medium">⚠️ {error}</p>
        <button onClick={fetchProfiles} className="mt-3 text-sm text-brand-green font-semibold hover:underline">Reintentar</button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Empleados</h1>
          <p className="mt-1 text-sm text-slate-500">Gestiona el equipo con acceso al panel</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setActionMessage(null); }}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95"
        >
          <span className="text-lg leading-none">+</span> Nuevo Empleado
        </button>
      </div>

      {actionMessage && (
        <div className={`mb-4 rounded-xl p-4 text-sm font-medium ${actionMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {actionMessage.text}
        </div>
      )}

      {showEditSuperadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form onSubmit={handleEditSuperadmin} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-bold text-slate-900">Editar Superadmin</h2>
            <p className="mb-4 text-sm text-slate-500">Cambia el nombre o la contraseña. Deja la contraseña en blanco para no modificarla.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none transition"
                  placeholder="MrFactus"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nueva contraseña <span className="text-slate-400 font-normal">(opcional)</span></label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none transition"
                  placeholder="Dejar vacío para no cambiar"
                  autoComplete="new-password"
                />
              </div>
            </div>
            <div className="mt-5 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowEditSuperadmin(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition">Cancelar</button>
              <button type="submit" disabled={editSaving} className="rounded-xl bg-brand-green px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition">
                {editSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reset employee password modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form onSubmit={handleResetPassword} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-bold text-slate-900">Cambiar Contraseña</h2>
            <p className="mb-4 text-sm text-slate-500">
              Cambia la contraseña de <strong>{resetTarget.full_name || resetTarget.email}</strong>.
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nueva contraseña</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={resetPassword}
                  onChange={e => setResetPassword(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-mono focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none transition"
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
                <button type="button" onClick={generateResetPassword} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition whitespace-nowrap">
                  🎲 Generar
                </button>
              </div>
            </div>
            <div className="mt-5 flex gap-3 justify-end">
              <button type="button" onClick={() => { setResetTarget(null); setResetPassword(''); }} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition">
                Cancelar
              </button>
              <button type="submit" disabled={resetSaving || resetPassword.trim().length < 6} className="rounded-xl bg-brand-green px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition">
                {resetSaving ? 'Guardando...' : 'Actualizar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form onSubmit={handleCreate} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Nuevo Empleado</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none transition" placeholder="Nombre del empleado" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none transition" placeholder="empleado@ejemplo.com" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña Temporal</label>
                <div className="flex gap-2">
                  <input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none transition font-mono" placeholder="Contraseña" required />
                  <button type="button" onClick={generatePassword} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition whitespace-nowrap">🎲 Generar</button>
                </div>
              </div>
            </div>
            <div className="mt-5 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition">Cancelar</button>
              <button type="submit" disabled={saving} className="rounded-xl bg-brand-green px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition">
                {saving ? 'Creando...' : 'Crear Empleado'}
              </button>
            </div>
          </form>
        </div>
      )}

      {profiles.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <span className="text-4xl">👥</span>
          <p className="mt-3 text-slate-500 font-medium">No hay empleados registrados</p>
          <p className="text-sm text-slate-400">Agrega el primer empleado al equipo</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className={thClass}>Nombre</th>
                <th className={thClass}>Email</th>
                <th className={thClass}>Rol</th>
                <th className={thClass}>Estado</th>
                <th className={thClass + ' text-right'}>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {profiles.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className={tdClass + ' font-medium'}>{p.full_name || '—'}</td>
                  <td className={tdClass}>{p.email}</td>
                  <td className={tdClass}>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.role === 'superadmin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {p.role}
                    </span>
                  </td>
                  <td className={tdClass}>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${p.is_active ? 'text-emerald-600' : 'text-red-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${p.is_active ? 'bg-emerald-500' : 'bg-red-400'}`} />
                      {p.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className={tdClass + ' text-right'}>
                    <div className="flex items-center justify-end gap-1">
                      {p.role === 'superadmin' ? (
                        <button
                          onClick={() => openEditSuperadmin(p)}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                        >
                          Editar
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => { setResetTarget(p); setResetPassword(''); setActionMessage(null); }}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                          >
                            Contraseña
                          </button>
                          <button
                            onClick={() => handleRevoke(p.id, p.full_name || p.email)}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                          >
                            Revocar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* ─── Configuración de Contacto WhatsApp ─── */}
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
            <svg className="h-5 w-5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-slate-900">Contacto WhatsApp</h2>
            <p className="mt-0.5 text-sm text-slate-500">Número al que llegan todos los pedidos de remesas, combos y recargas.</p>
          </div>
        </div>

        <form onSubmit={handleWhatsappSave} className="mt-5">
          {whatsappMessage && (
            <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${whatsappMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {whatsappMessage.text}
            </div>
          )}
          <div className="flex gap-3">
            <div className="flex flex-1 overflow-hidden rounded-xl border border-slate-300 focus-within:border-brand-green focus-within:ring-2 focus-within:ring-brand-green/20 transition">
              <span className="flex items-center border-r border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-500">
                +
              </span>
              <input
                type="tel"
                value={whatsappPhone}
                onChange={e => setWhatsappPhone(e.target.value.replace(/\D/g, ''))}
                className="flex-1 bg-transparent px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                placeholder="5355555555 (solo números con código de país)"
              />
            </div>
            <button
              type="submit"
              disabled={whatsappSaving}
              className="rounded-xl bg-brand-green px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition active:scale-95"
            >
              {whatsappSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Ingresa el número completo con código de país sin el <code className="font-mono">+</code>. Ejemplo: <code className="font-mono">5355555555</code> para Cuba o <code className="font-mono">15551234567</code> para EE.UU.
          </p>
        </form>
      </div>
    </div>
  );
}
