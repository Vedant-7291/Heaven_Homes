"use client";
import { useAuth } from '@/lib/auth/useAuth';

// at top of component:

import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Search, Plus, Pencil, Trash2, X,
  Users, Shield, UserPlus, Eye, EyeOff,
} from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'channel_partner', label: 'Channel Partner' },
];

const ROLE_TONES = {
  owner: 'bg-[#f3e8ff] text-[#7a3aa8]',
  channel_partner: 'bg-[#e8f5e6] text-[#2d7a3a]',
};

const ROLE_LABELS = {
  owner: 'Owner',
  channel_partner: 'Channel Partner',
};

export default function ManageTeamPage() {
    const { isOwner } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = create, object = edit
  const [form, setForm] = useState({
    name: '',
    role: 'channel_partner',
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  // Row-level password visibility
  const [visiblePasswords, setVisiblePasswords] = useState({});

  // ---------- Fetch ----------
  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '100' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/team-members?${params}`);
      const json = await res.json();
      if (json.success) {
        setMembers(Array.isArray(json.data) ? json.data : []);
        setPagination(json.pagination || { total: 0, pages: 1 });
      } else {
        toast.error('Failed to load team members');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // ---------- Modal handlers ----------
  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', role: 'channel_partner', username: '', password: '' });
    setShowPassword(false);
    setModalOpen(true);
  };

  const openEdit = (member) => {
    setEditing(member);
    setForm({
      name: member.name || '',
      role: member.role || 'channel_partner',
      username: member.username || '',
      password: member.password || '',
    });
    setShowPassword(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm({ name: '', role: 'channel_partner', username: '', password: '' });
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.username.trim()) return toast.error('Username is required');
    if (!form.password.trim() || form.password.length < 4) {
      return toast.error('Password must be at least 4 characters');
    }

    setSaving(true);
    try {
      const url = editing
        ? `/api/team-members/${editing._id}`
        : '/api/team-members';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(editing ? 'Team member updated' : 'Team member added');
        closeModal();
        fetchMembers();
      } else {
        toast.error(json.error || 'Failed to save');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (member) => {
    if (!confirm(`Delete "${member.name}"? They will not be able to log in again.`)) return;
    try {
      const res = await fetch(`/api/team-members/${member._id}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success('Team member deleted');
        setMembers((prev) => prev.filter((m) => m._id !== member._id));
      } else {
        toast.error(json.error || 'Failed to delete');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete');
    }
  };

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ---------- Render ----------
  return (
    <div className="p-4 md:p-6 bg-[#f8faf7] min-h-screen">
      {/* Header */}
      <div className="mb-6 mt-14 md:mt-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-[#1a2e1a] flex items-center gap-2">
              <span className="w-2 h-8 bg-[#2d7a3a] rounded-full mr-2" />
              Manage Team
            </h1>
            <p className="text-sm text-[#4f6b4f] mt-1 ml-4">
              Create and manage login accounts for owners and channel partners
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 bg-[#2d7a3a] hover:bg-[#23682e] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md self-start lg:self-center"
          >
            <UserPlus className="w-4 h-4" />
            Add Team Member
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-2xl border border-[#e8f0e6] p-4 mb-6 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6a7f6a]" />
          <input
            type="text"
            placeholder="Search by name, username, or role..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-3 py-2 border border-[#e8f0e6] rounded-xl text-sm bg-[#fafffa] focus:outline-none focus:ring-2 focus:ring-[#2d7a3a]/20 focus:border-[#2d7a3a]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#e8f0e6] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-[#fafffa]">
                <th className="text-left px-5 py-3 text-xs font-medium text-[#6a7f6a] uppercase tracking-wider w-16">S.No.</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#6a7f6a] uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#6a7f6a] uppercase tracking-wider">Role</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#6a7f6a] uppercase tracking-wider">Username</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#6a7f6a] uppercase tracking-wider">Password</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-[#6a7f6a] uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="border-t border-[#eef5ec]">
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-3 border-[#2d7a3a] border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-[#6a7f6a]">Loading team members...</p>
                    </div>
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr className="border-t border-[#eef5ec]">
                  <td colSpan={6} className="text-center py-12 text-[#6a7f6a] text-sm">
                    <Users className="w-5 h-5 inline-block mr-2 mb-0.5" />
                    No team members yet — click "Add Team Member" to start
                  </td>
                </tr>
              ) : (
                members.map((m, idx) => (
                  <tr key={m._id} className="border-t border-[#eef5ec] hover:bg-[#fafffa] transition-colors">
                    <td className="px-5 py-3 text-sm text-[#6a7f6a]">{idx + 1}</td>
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-[#1a2e1a]">{m.name}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full ${ROLE_TONES[m.role] || ROLE_TONES.channel_partner}`}>
                        <Shield className="w-3 h-3" />
                        {ROLE_LABELS[m.role] || m.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <code className="text-xs font-mono text-[#4f6b4f] bg-[#f0f7ef] px-2 py-0.5 rounded">
                        {m.username}
                      </code>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-[#4f6b4f] bg-[#f0f7ef] px-2 py-0.5 rounded">
                          {visiblePasswords[m._id] ? m.password : '••••••'}
                        </code>
                        <button
                          onClick={() => togglePasswordVisibility(m._id)}
                          className="text-[#6a7f6a] hover:text-[#2d7a3a] transition-colors"
                          title={visiblePasswords[m._id] ? 'Hide password' : 'Show password'}
                        >
                          {visiblePasswords[m._id] ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(m)}
                          title="Edit"
                          className="p-1.5 rounded-lg border border-[#e8f0e6] hover:bg-[#f0f7ef] hover:border-[#2d7a3a] transition-colors group"
                        >
                          <Pencil className="w-3.5 h-3.5 text-[#6a7f6a] group-hover:text-[#2d7a3a]" />
                        </button>
                        { isOwner && (
                        <button
                          onClick={() => handleDelete(m)}
                          title="Delete"
                          className="p-1.5 rounded-lg border border-[#e8f0e6] hover:bg-[#fde8e8] hover:border-[#c0392b] transition-colors group"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-[#6a7f6a] group-hover:text-[#c0392b]" />
                        </button> )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="px-5 py-4 border-t border-[#e8f0e6] bg-[#fafffa] flex items-center justify-between">
            <span className="text-xs text-[#6a7f6a]">Page {page} of {pagination.pages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm border border-[#e8f0e6] rounded-lg hover:bg-[#f0f7ef] disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-sm border border-[#e8f0e6] rounded-lg hover:bg-[#f0f7ef] disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
       <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
    onClick={closeModal}
  >
    <div
      className="bg-white rounded-2xl shadow-xl mx-auto"
      style={{ width: '100%', maxWidth: '440px' }}
      onClick={(e) => e.stopPropagation()}
    >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8f0e6] bg-[#fafffa] rounded-t-2xl">
              <div>
                <h2 className="text-base font-semibold text-[#1a2e1a]">
                  {editing ? 'Edit Team Member' : 'Add Team Member'}
                </h2>
                <p className="text-xs text-[#6a7f6a] mt-0.5">
                  {editing ? 'Update login credentials and role' : 'Create a new login account'}
                </p>
              </div>
              <button onClick={closeModal} className="text-[#6a7f6a] hover:text-[#1a2e1a]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <Field label="Name" required>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., Ananya Rao"
                  className="w-full px-3 py-2 border border-[#e8f0e6] rounded-xl text-sm bg-[#fafffa] focus:outline-none focus:ring-2 focus:ring-[#2d7a3a]/20 focus:border-[#2d7a3a]"
                />
              </Field>

              <Field label="Role" required>
                <select
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#e8f0e6] rounded-xl text-sm bg-[#fafffa] focus:outline-none focus:ring-2 focus:ring-[#2d7a3a]/20 focus:border-[#2d7a3a]"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Username" required>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                  placeholder="e.g., ananya"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full px-3 py-2 border border-[#e8f0e6] rounded-xl text-sm bg-[#fafffa] focus:outline-none focus:ring-2 focus:ring-[#2d7a3a]/20 focus:border-[#2d7a3a]"
                />
              </Field>

              <Field label="Password" required>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    placeholder="At least 4 characters"
                    className="w-full px-3 py-2 pr-10 border border-[#e8f0e6] rounded-xl text-sm bg-[#fafffa] focus:outline-none focus:ring-2 focus:ring-[#2d7a3a]/20 focus:border-[#2d7a3a]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#6a7f6a] hover:text-[#2d7a3a]"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[#e8f0e6]">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm text-[#4f6b4f] hover:bg-[#f0f7ef] rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-[#2d7a3a] hover:bg-[#23682e] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-60"
              >
                {saving ? 'Saving…' : editing ? 'Update' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#6a7f6a] uppercase tracking-wider mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}