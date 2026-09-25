"use client";
import { useAuth } from '@/lib/auth/useAuth';

// at top of component:

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Search, Users, UserCheck, UserPlus,
  Phone, MapPin, Eye, Trash2,
  ChevronLeft, ChevronRight, FolderOpen, Star,
} from 'lucide-react';

export default function LeadsPage() {
  const { isOwner } = useAuth();
  const router = useRouter();
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, converted: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 0 });

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/leads/stats');
      const json = await res.json();
      if (json.success) setStats(json.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filterStatus && { status: filterStatus }),
        ...(filterCity && { city: filterCity }),
      });
      const res = await fetch(`/api/leads?${params}`);
      const json = await res.json();
      if (json.success) {
        setLeads(json.data);
        setPagination((p) => ({ ...p, ...json.pagination }));
      } else {
        toast.error('Failed to fetch leads');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { fetchLeads(); /* eslint-disable-next-line */ }, [pagination.page, filterStatus, filterCity]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this lead?')) return;
    try {
      const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Lead deleted');
        setLeads((p) => p.filter((l) => l._id !== id));
        fetchStats();
      } else toast.error('Failed to delete');
    } catch { toast.error('Failed to delete'); }
  };

  const filteredLeads = leads.filter((lead) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      lead.name?.toLowerCase().includes(q) ||
      lead.phone?.includes(q) ||
      lead.city?.toLowerCase().includes(q) ||
      lead.area?.toLowerCase().includes(q)
    );
  });

  const statusMap = {
    new: { bg: 'bg-[#e6f0fb]', text: 'text-[#2a6ba8]', dot: 'bg-[#2a6ba8]', label: 'New' },
    active: { bg: 'bg-[#fef7e0]', text: 'text-[#b68b40]', dot: 'bg-[#b68b40]', label: 'Active' },
    contacted: { bg: 'bg-[#e0f2fe]', text: 'text-[#0284c7]', dot: 'bg-[#0284c7]', label: 'Contacted' },
    interested: { bg: 'bg-[#f3e8ff]', text: 'text-[#7a3aa8]', dot: 'bg-[#7a3aa8]', label: 'Interested' },
    site_visit_scheduled: { bg: 'bg-[#fef3c7]', text: 'text-[#b45309]', dot: 'bg-[#b45309]', label: 'Visit Scheduled' },
    site_visit_completed: { bg: 'bg-[#dcfce7]', text: 'text-[#15803d]', dot: 'bg-[#15803d]', label: 'Visit Done' },
    lost: { bg: 'bg-[#fde8e8]', text: 'text-[#c0392b]', dot: 'bg-[#c0392b]', label: 'Lost' },
    converted: { bg: 'bg-[#e8f5e6]', text: 'text-[#2d7a3a]', dot: 'bg-[#2d7a3a]', label: 'Converted' },
  };

  return (
    <div className="p-4 md:p-6 bg-[#f8faf7] min-h-screen">
      {/* Heading + sub-head */}
      <div className="mb-6 mt-14 md:mt-0">
        <h1 className="text-2xl md:text-3xl font-semibold text-[#1a2e1a] flex items-center gap-2">
          <span className="w-2 h-8 bg-[#2d7a3a] rounded-full mr-2" />
          Leads Management
        </h1>
        <p className="text-sm text-[#4f6b4f] mt-1 ml-4">
          Manage and track all your WhatsApp leads
        </p>
      </div>

      {/* 3 KPI Cards */}
      <div
        className="mb-6"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        <KpiCard icon={Users} label="Total Leads" value={stats.total} tone="blue" />
        <KpiCard icon={UserPlus} label="Active Leads" value={stats.active} tone="amber" />
        <KpiCard icon={UserCheck} label="Converted Leads" value={stats.converted} tone="green" />
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-[#e8f0e6] p-4 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6a7f6a]" />
            <input
              type="text"
              placeholder="Search by name, phone, city..."
              className="w-full pl-10 pr-3 py-2 border border-[#e8f0e6] rounded-xl text-sm bg-[#fafffa] focus:outline-none focus:ring-2 focus:ring-[#2d7a3a]/20 focus:border-[#2d7a3a]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 border border-[#e8f0e6] rounded-xl text-sm bg-[#fafffa] focus:outline-none focus:ring-2 focus:ring-[#2d7a3a]/20 focus:border-[#2d7a3a] md:w-44"
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
          >
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="active">Active</option>
          </select>
          <input
            type="text"
            placeholder="Filter by city..."
            className="px-3 py-2 border border-[#e8f0e6] rounded-xl text-sm bg-[#fafffa] focus:outline-none focus:ring-2 focus:ring-[#2d7a3a]/20 focus:border-[#2d7a3a] md:w-44"
            value={filterCity}
            onChange={(e) => { setFilterCity(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#e8f0e6] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="bg-[#fafffa]">
                <Th>Lead Name</Th>
                <Th>City / Area</Th>
                <Th>Budget</Th>
                <Th>Property Interest</Th>
                <Th>Source</Th>
                <Th>Assigned To</Th>
                <Th>Status</Th>
                <Th align="right">Action</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="border-t border-[#eef5ec]">
                  <td colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-3 border-[#2d7a3a] border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-[#6a7f6a]">Loading leads...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr className="border-t border-[#eef5ec]">
                  <td colSpan={8} className="text-center py-12 text-[#6a7f6a] text-sm">
                    <FolderOpen className="w-5 h-5 inline-block mr-2 mb-0.5" />
                    No leads found
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const s = statusMap[lead.currentStatus] || statusMap.new;
                  const interested = lead.interested;
                  return (
                    <tr key={lead._id} className="border-t border-[#eef5ec] hover:bg-[#fafffa] transition-colors">
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-[#1a2e1a]">{lead.name || 'N/A'}</p>
                        <p className="text-xs text-[#6a7f6a] flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" /> {lead.phone}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm text-[#4f6b4f] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#6a7f6a]" /> {lead.city || '—'}
                        </p>
                        {lead.area && <p className="text-xs text-[#6a7f6a] ml-4">{lead.area}</p>}
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm text-[#4f6b4f] flex items-center gap-1">
                          
                          {lead.rentBudgetLabel || lead.budgetRange || '—'}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        {interested ? (
                          <div className="flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5 text-[#f59e0b] fill-[#f59e0b]" />
                            <span className="text-sm text-[#1a2e1a] truncate max-w-[180px]">{interested.title}</span>
                          </div>
                        ) : lead.matchedProperties?.length > 0 ? (
                          <span className="text-xs text-[#6a7f6a]">{lead.matchedProperties.length} matched</span>
                        ) : (
                          <span className="text-xs text-[#6a7f6a]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          lead.leadType === 'lister' ? 'bg-[#f3e8ff] text-[#7a3aa8]' : 'bg-[#e8f5e6] text-[#2d7a3a]'
                        }`}>
                          {lead.leadType === 'lister' ? 'Lister' : 'WhatsApp'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-[#4f6b4f]">
                          {lead.assignedTo || <span className="text-[#6a7f6a]">Unassigned</span>}
                        </span>
                      </td>
                     <td className="px-5 py-3 align-middle">
  <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${s.bg} ${s.text}`}>
    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
    {s.label}
  </span>
</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => router.push(`/leads/${lead._id}`)}
                            title="View"
                            className="p-1.5 rounded-lg border border-[#e8f0e6] hover:bg-[#f0f7ef] hover:border-[#2d7a3a] transition-colors group"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#6a7f6a] group-hover:text-[#2d7a3a]" />
                          </button>
                         { isOwner && (
                            <button
                              onClick={() => handleDelete(lead._id)}
                              title="Delete"
                              className="p-1.5 rounded-lg border border-[#e8f0e6] hover:bg-[#fde8e8] hover:border-[#c0392b] transition-colors group"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-[#6a7f6a] group-hover:text-[#c0392b]" />
                          </button>)}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="px-5 py-4 border-t border-[#e8f0e6] bg-[#fafffa] flex items-center justify-between">
            <span className="text-xs text-[#6a7f6a]">Page {pagination.page} of {pagination.pages}</span>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="px-3 py-1.5 text-sm border border-[#e8f0e6] rounded-lg hover:bg-[#f0f7ef] disabled:opacity-40 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="px-3 py-1.5 text-sm border border-[#e8f0e6] rounded-lg hover:bg-[#f0f7ef] disabled:opacity-40 transition-colors flex items-center gap-1"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Th({ children, align = 'left' }) {
  const cls =
    align === 'right'
      ? 'text-right px-5 py-3 text-xs font-medium text-[#6a7f6a] uppercase tracking-wider'
      : 'text-left px-5 py-3 text-xs font-medium text-[#6a7f6a] uppercase tracking-wider';
  return <th className={cls}>{children}</th>;
}

function KpiCard({ icon: Icon, label, value, tone }) {
  const tones = {
    blue: { bg: 'bg-[#e6f0fb]', fg: 'text-[#2a6ba8]' },
    amber: { bg: 'bg-[#fef7e0]', fg: 'text-[#b68b40]' },
    green: { bg: 'bg-[#e8f5e6]', fg: 'text-[#2d7a3a]' },
  };
  const t = tones[tone] || tones.green;
  return (
    <div className="bg-white rounded-2xl border border-[#e8f0e6] p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 ${t.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${t.fg}`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#6a7f6a] uppercase tracking-wider truncate">{label}</p>
          <p className="text-2xl font-bold text-[#1a2e1a] leading-tight mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );
}