"use client";
import { useAuth } from "@/lib/auth/useAuth";

// at top of component:

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Search,
  Users,
  UserCheck,
  UserPlus,
  Phone,
  MapPin,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Star,
} from "lucide-react";

export default function LeadsPage() {
  const { isOwner } = useAuth();
  const router = useRouter();
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, converted: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  });

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/leads/stats");
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
        toast.error("Failed to fetch leads");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);
  useEffect(() => {
    fetchLeads(); /* eslint-disable-next-line */
  }, [pagination.page, filterStatus, filterCity]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this lead?")) return;
    try {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Lead deleted");
        setLeads((p) => p.filter((l) => l._id !== id));
        fetchStats();
      } else toast.error("Failed to delete");
    } catch {
      toast.error("Failed to delete");
    }
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

// Every entry has the exact same shape (bg / text / dot / border / label) so
// the badge template below never has to branch on which status it's
// rendering — that's what guarantees New, Active, Visit Scheduled, etc. all
// come out looking like the same kind of pill, just in a different color.
// `border` matters as much as `bg` here: a few of these background tints
// (interested, contacted, site_visit_scheduled) are pale enough that
// without a matching border they can read as "no pill at all" against a
// white row, which is what made some statuses look styled and others look
// like plain text.
// Each entry is a single plain-CSS class (defined in globals.css, not a
// Tailwind arbitrary-value utility) plus the label. Using one static class
// name per status — rather than assembling bg-[#..]/text-[#..]/border-[#..]
// via Tailwind bracket syntax — means the pill's color no longer depends on
// Tailwind's JIT scanner picking up a dynamically-interpolated ${s.bg}
// class. Plain CSS always renders, regardless of dev-server cache state.
const statusMap = {
  new: { pillClass: 'status-new', label: 'New' },
  active: { pillClass: 'status-active', label: 'Active' },
  contacted: { pillClass: 'status-contacted', label: 'Contacted' },
  interested: { pillClass: 'status-interested', label: 'Interested' },
  site_visit_scheduled: {
    pillClass: 'status-site-visit-scheduled',
    label: 'Visit Scheduled',
  },
  site_visit_completed: {
    pillClass: 'status-site-visit-completed',
    label: 'Visit Done',
  },
  lost: { pillClass: 'status-lost', label: 'Lost' },
  converted: { pillClass: 'status-converted', label: 'Converted' },
};

// Fallback for any status value that doesn't match a known key, so an
// unrecognized status still renders as the same kind of pill instead of
// silently being mislabeled as something else (see normalizeStatus below).
const DEFAULT_STATUS_STYLE = {
  pillClass: 'status-unknown',
  label: 'Unknown',
};

// Turns a raw status value (however it was saved — snake_case, kebab-case,
// extra spaces, mixed case) into a readable "Title Case" label. This is
// what keeps the pill looking consistent even for a status that isn't in
// statusMap: instead of printing the raw db value verbatim (which is what
// made a status changed from the lead detail page look "inconsistent" next
// to the ones rendered from statusMap), it always gets the same clean,
// title-cased label treatment.
const titleCase = (str) =>
  String(str)
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

// Normalizes any raw status value (whatever casing/spacing/underscores it
// was saved with — including values written by the lead detail page) down
// to one of statusMap's known keys. Hoisted out of the per-row map below so
// it's defined once per render instead of once per lead.
const normalizeStatus = (status) => {
  if (!status) return 'new';

  const value = String(status)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  const aliases = {
    new: 'new',
    active: 'active',
    contacted: 'contacted',
    interested: 'interested',

    // Handle different possible values from database
    site_visit_scheduled: 'site_visit_scheduled',
    sitevisitscheduled: 'site_visit_scheduled',
    visit_scheduled: 'site_visit_scheduled',
    visitscheduled: 'site_visit_scheduled',

    site_visit_completed: 'site_visit_completed',
    sitevisitcompleted: 'site_visit_completed',
    visit_completed: 'site_visit_completed',
    visitcompleted: 'site_visit_completed',
    visit_done: 'site_visit_completed',

    not_interested: 'lost',
    notinterested: 'lost',
    lost: 'lost',

    converted: 'converted',
    closed: 'converted',
    closed_won: 'converted',
  };

  // Important: fall through to the raw normalized value instead of
  // defaulting to "new" here. Defaulting to "new" would silently relabel
  // any status we don't recognize (a typo, a new DB value, a value the
  // lead detail page saves that isn't in this alias list, etc.) as "New" —
  // wrong data dressed up as a valid status. Returning the raw value
  // instead means it falls through to DEFAULT_STATUS_STYLE below, which
  // still renders the same pill shape and a properly title-cased label.
  return aliases[value] || value;
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
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
        }}
      >
        <KpiCard
          icon={Users}
          label="Total Leads"
          value={stats.total}
          tone="blue"
        />
        <KpiCard
          icon={UserPlus}
          label="Active Leads"
          value={stats.active}
          tone="amber"
        />
        <KpiCard
          icon={UserCheck}
          label="Converted Leads"
          value={stats.converted}
          tone="green"
        />
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
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
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
            onChange={(e) => {
              setFilterCity(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
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
                  <td
                    colSpan={8}
                    className="text-center py-12 text-[#6a7f6a] text-sm"
                  >
                    <FolderOpen className="w-5 h-5 inline-block mr-2 mb-0.5" />
                    No leads found
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const statusKey = normalizeStatus(lead.currentStatus);
                  const s = statusMap[statusKey] || {
                    ...DEFAULT_STATUS_STYLE,
                    label: lead.currentStatus
                      ? titleCase(lead.currentStatus)
                      : DEFAULT_STATUS_STYLE.label,
                  };
                  const interested = lead.interested;
                  return (
                    <tr
                      key={lead._id}
                      className="border-t border-[#eef5ec] hover:bg-[#fafffa] transition-colors"
                    >
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-[#1a2e1a]">
                          {lead.name || "N/A"}
                        </p>
                        <p className="text-xs text-[#6a7f6a] flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" /> {lead.phone}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm text-[#4f6b4f] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#6a7f6a]" />{" "}
                          {lead.city || "—"}
                        </p>
                        {lead.area && (
                          <p className="text-xs text-[#6a7f6a] ml-4">
                            {lead.area}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm text-[#4f6b4f] flex items-center gap-1">
                          {lead.rentBudgetLabel || lead.budgetRange || "—"}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        {interested ? (
                          <div className="flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5 text-[#f59e0b] fill-[#f59e0b]" />
                            <span className="text-sm text-[#1a2e1a] truncate max-w-[180px]">
                              {interested.title}
                            </span>
                          </div>
                        ) : lead.matchedProperties?.length > 0 ? (
                          <span className="text-xs text-[#6a7f6a]">
                            {lead.matchedProperties.length} matched
                          </span>
                        ) : (
                          <span className="text-xs text-[#6a7f6a]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                            lead.leadType === "lister"
                              ? "bg-[#f3e8ff] text-[#7a3aa8]"
                              : "bg-[#e8f5e6] text-[#2d7a3a]"
                          }`}
                        >
                          {lead.leadType === "lister" ? "Lister" : "WhatsApp"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-[#4f6b4f]">
                          {lead.assignedTo || (
                            <span className="text-[#6a7f6a]">Unassigned</span>
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-3 align-middle">
                        <span
                          className={`
      status-pill
      inline-flex items-center justify-center
      gap-1.5
      min-w-[110px]
      h-7
      px-3
      text-xs
      font-semibold
      rounded-full
      border
      whitespace-nowrap
      ${s.pillClass}
    `}
                        >
                          <span
                            className={`
        status-dot
        w-1.5 h-1.5
        rounded-full
        flex-shrink-0
      `}
                          />
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
                          {isOwner && (
                            <button
                              onClick={() => handleDelete(lead._id)}
                              title="Delete"
                              className="p-1.5 rounded-lg border border-[#e8f0e6] hover:bg-[#fde8e8] hover:border-[#c0392b] transition-colors group"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-[#6a7f6a] group-hover:text-[#c0392b]" />
                            </button>
                          )}
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
            <span className="text-xs text-[#6a7f6a]">
              Page {pagination.page} of {pagination.pages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() =>
                  setPagination((p) => ({ ...p, page: p.page - 1 }))
                }
                className="px-3 py-1.5 text-sm border border-[#e8f0e6] rounded-lg hover:bg-[#f0f7ef] disabled:opacity-40 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() =>
                  setPagination((p) => ({ ...p, page: p.page + 1 }))
                }
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

function Th({ children, align = "left" }) {
  const cls =
    align === "right"
      ? "text-right px-5 py-3 text-xs font-medium text-[#6a7f6a] uppercase tracking-wider"
      : "text-left px-5 py-3 text-xs font-medium text-[#6a7f6a] uppercase tracking-wider";
  return <th className={cls}>{children}</th>;
}

function KpiCard({ icon: Icon, label, value, tone }) {
  const tones = {
    blue: { bg: "bg-[#e6f0fb]", fg: "text-[#2a6ba8]" },
    amber: { bg: "bg-[#fef7e0]", fg: "text-[#b68b40]" },
    green: { bg: "bg-[#e8f5e6]", fg: "text-[#2d7a3a]" },
  };
  const t = tones[tone] || tones.green;
  return (
    <div className="bg-white rounded-2xl border border-[#e8f0e6] p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div
          className={`w-11 h-11 ${t.bg} rounded-xl flex items-center justify-center flex-shrink-0`}
        >
          <Icon className={`w-5 h-5 ${t.fg}`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#6a7f6a] uppercase tracking-wider truncate">
            {label}
          </p>
          <p className="text-2xl font-bold text-[#1a2e1a] leading-tight mt-0.5">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}