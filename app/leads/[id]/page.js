"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ArrowLeft, User, Phone, MapPin, Calendar, MessageSquare,
  Star, Building2, FolderOpen, Clock, Image as ImageIcon,
  Briefcase, Bell, CheckCircle, ChevronDown,
} from 'lucide-react';

const TABS = [
  { id: 'enquiry', label: 'Property Enquiry', icon: Building2 },
  { id: 'interested', label: 'Interested Property', icon: Star },
  { id: 'conversation', label: 'WhatsApp Conversation', icon: MessageSquare },
  { id: 'followups', label: 'Follow Ups', icon: Bell },
  { id: 'visits', label: 'Site Visits', icon: Calendar },
];

const CRM_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'active', label: 'Active' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'interested', label: 'Interested' },
  { value: 'site_visit_scheduled', label: 'Site Visit Scheduled' },
  { value: 'site_visit_completed', label: 'Site Visit Completed' },
  { value: 'lost', label: 'Lost' },
  { value: 'converted', label: 'Converted' },
];

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('enquiry');
  const [subData, setSubData] = useState({ enquiry: [], interested: [], conversation: [], followUps: null, visits: [] });
  const [subLoading, setSubLoading] = useState(false);

  // Fetch lead
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/leads/${params.id}`);
        const json = await res.json();
        if (json.success) setLead(json.data);
        else { toast.error('Lead not found'); router.push('/leads'); }
      } catch { toast.error('Failed to fetch lead'); }
      finally { setLoading(false); }
    })();
  }, [params.id]);

  // Fetch sub-resources lazily based on tab
 useEffect(() => {
  if (!lead) return;
  (async () => {
    setSubLoading(true);
    try {
      const endpointMap = {
        enquiry: `/api/leads/${lead._id}/enquiries`,
        interested: `/api/leads/${lead._id}/interests`,
        conversation: `/api/leads/${lead._id}/conversation`,
        followups: `/api/leads/${lead._id}/follow-ups`,
        visits: `/api/leads/${lead._id}/site-visits`,
      };

      const key = activeTab;
      const url = endpointMap[key];
      console.log('[lead-detail] fetching', key, url);

      const res = await fetch(url);
      const json = await res.json();
      console.log('[lead-detail] response', key, json);

      if (json.success) {
        if (key === 'followups') {
          setSubData((p) => ({ ...p, followUps: json.data }));
        } else {
          setSubData((p) => ({ ...p, [key]: json.data }));
        }
      }
    } catch (e) {
      console.error('[lead-detail] fetch error', e);
    } finally {
      setSubLoading(false);
    }
  })();
}, [activeTab, lead]);

  const updateLead = async (patch) => {
    try {
      const res = await fetch(`/api/leads/${lead._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (json.success) {
        setLead(json.data);
        toast.success('Updated');
      } else toast.error(json.error || 'Failed to update');
    } catch { toast.error('Failed to update'); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8faf7]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-[#2d7a3a] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#4f6b4f] text-sm font-medium">Loading lead...</p>
        </div>
      </div>
    );
  }

  if (!lead) return null;

  return (
    <div className="p-4 md:p-6 bg-[#f8faf7] min-h-screen">
      {/* Header */}
      <div className="mb-6 mt-14 md:mt-0">
        <button
          onClick={() => router.push('/leads')}
          className="text-sm text-[#6a7f6a] hover:text-[#1a2e1a] mb-2 inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Leads
        </button>
        <h1 className="text-2xl md:text-3xl font-semibold text-[#1a2e1a]">{lead.name || 'Lead'}</h1>
        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-[#4f6b4f]">
          <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {lead.phone}</span>
          <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {lead.city || '—'}{lead.area ? `, ${lead.area}` : ''}</span>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-white rounded-2xl border border-[#e8f0e6] p-5 shadow-sm mb-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Field label="Name" value={lead.name} />
          <Field label="Contact Number" value={lead.phone} />
          <Field label="City / Area" value={`${lead.city || '—'}${lead.area ? ' / ' + lead.area : ''}`} />
          <Field label="Assigned To">
            <input
              type="text"
              defaultValue={lead.assignedTo || ''}
              onBlur={(e) => e.target.value !== lead.assignedTo && updateLead({ assignedTo: e.target.value })}
              placeholder="Unassigned"
              className="w-full px-2 py-1 border border-[#e8f0e6] rounded-lg text-sm bg-[#fafffa] focus:outline-none focus:border-[#2d7a3a]"
            />
          </Field>
          <Field label="Current Status">
            <select
              value={lead.currentStatus || 'new'}
              onChange={(e) => updateLead({ currentStatus: e.target.value })}
              className="w-full px-2 py-1 border border-[#e8f0e6] rounded-lg text-sm bg-[#fafffa] focus:outline-none focus:border-[#2d7a3a]"
            >
              {CRM_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-[#e8f0e6] mb-4 shadow-sm overflow-hidden">
        <div className="flex border-b border-[#e8f0e6] overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 md:px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === id ? 'text-[#2d7a3a] border-b-2 border-[#2d7a3a]' : 'text-[#6a7f6a] hover:text-[#1a2e1a]'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl border border-[#e8f0e6] shadow-sm p-4 md:p-6">
        {subLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-[#2d7a3a] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'enquiry' && <EnquiryTab enquiries={subData.enquiry} />}
            {activeTab === 'interested' && <InterestedTab interests={subData.interested} />}
            {activeTab === 'conversation' && <ConversationTab conversation={subData.conversation} />}
            {activeTab === 'followups' && <FollowUpsTab data={subData.followUps} />}
            {activeTab === 'visits' && <VisitsTab visits={subData.visits} />}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Sub components ---------- */

function Field({ label, value, children }) {
  return (
    <div>
      <p className="text-xs font-medium text-[#6a7f6a] uppercase tracking-wider mb-1">{label}</p>
      {children || <p className="text-sm font-medium text-[#1a2e1a]">{value || '—'}</p>}
    </div>
  );
}

function EnquiryTab({ enquiries }) {
  if (!enquiries?.length) return <Empty icon={Building2} text="No property enquiries yet" />;

  const sorted = [...enquiries].sort(
    (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
  );

  return (
    <div className="space-y-4">
      {sorted.map((e) => (
        <div key={e._id} className="border border-[#eef5ec] rounded-xl p-4 bg-[#fafffa]">
          <p className="text-xs text-[#6a7f6a] mb-3 font-medium">
            {new Date(e.submittedAt).toLocaleString('en-IN', {
              year: 'numeric', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Detail label="City" value={e.city} />
            <Detail label="Area" value={e.area} />
            <Detail label="Purpose" value={e.purpose} />
            <Detail label="Property Category" value={e.propertyCategory} />
            <Detail label="Property Type" value={e.propertyType} />
            <Detail label="Configuration / Size" value={e.configuration || e.size} />
            <Detail label="Budget" value={e.budgetLabel || e.budgetRange} />
            <Detail label="Timeline" value={e.timeline} />
            {e.buyingPlan && <Detail label="Buying Plan" value={e.buyingPlan === 'sell_then_buy' ? 'First sell then buy' : 'Directly buy'} />}
            {e.furnishing && <Detail label="Furnishing" value={e.furnishing.replace(/_/g, ' ')} />}
          </div>
        </div>
      ))}
    </div>
  );
}

function InterestedTab({ interests }) {
  const list = Array.isArray(interests) ? interests : [];
  if (list.length === 0) {
    return <Empty icon={Star} text="No interested properties yet" />;
  }

  return (
    <div className="space-y-3">
      {list.map((it, idx) => {
        const p = typeof it.property === 'object' && it.property !== null ? it.property : null;
        const publicTitle = p?.title || it.propertyTitle || 'Property';
        const internalName = p?.internalName || it.propertySnapshot?.internalName || '';
        const code = p?.propertyId || it.propertyCode || '';
        const city = p?.city || it.propertySnapshot?.city || '';
        const area = p?.area || it.propertySnapshot?.area || '';
        const price = p?.price || it.propertySnapshot?.price || 0;
        const image = p?.imageUrl || it.propertySnapshot?.imageUrl || null;

        return (
          <div
            key={it._id || `int-${idx}`}
            className="border border-[#eef5ec] rounded-xl p-3 flex items-center gap-3 hover:bg-[#fafffa] transition-colors"
          >
            {image ? (
              <img
                src={image}
                alt={publicTitle}
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-[#eef5ec]"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-[#f0f7ef] flex items-center justify-center flex-shrink-0 border border-[#eef5ec]">
                <ImageIcon className="w-6 h-6 text-[#6a7f6a]" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-3.5 h-3.5 text-[#f59e0b] fill-[#f59e0b]" />
                <span className="text-sm font-medium text-[#1a2e1a] truncate">
                  {publicTitle}
                </span>
              </div>

              {/* Internal name — only shown to admins */}
              {internalName && (
                <p className="text-xs text-[#7a3aa8] bg-[#f3e8ff] inline-flex items-center gap-1 px-2 py-0.5 rounded mb-1">
                  <span className="font-medium">Private:</span> {internalName}
                </p>
              )}

              <p className="text-xs text-[#6a7f6a]">
                {city}{city && area ? ' • ' : ''}{area}
              </p>
              <p className="text-xs text-[#6a7f6a] mt-1">
                Expressed interest on{' '}
                {it.expressedAt
                  ? new Date(it.expressedAt).toLocaleDateString('en-IN', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })
                  : '—'}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm font-semibold text-[#2d7a3a]">
                ₹{Number(price).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ConversationTab({ conversation }) {
  if (!conversation?.length) return <Empty icon={MessageSquare} text="No conversation yet" />;

  return (
    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
      {conversation.map((c) => (
        <div key={c._id} className={`flex ${c.direction === 'in' ? 'justify-start' : 'justify-end'}`}>
          <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
            c.direction === 'in'
              ? 'bg-[#f0f7ef] text-[#1a2e1a] border border-[#e8f0e6]'
              : 'bg-[#2d7a3a] text-white'
          }`}>
            {c.type === 'image' ? (
              c.imageUrl ? (
                <img src={c.imageUrl} alt="" className="rounded-lg max-w-full" />
              ) : (
                <p className="text-sm italic">📷 Image</p>
              )
            ) : (
              <p className="text-sm whitespace-pre-wrap">{c.text || '—'}</p>
            )}
            {c.payload?.buttons && (
              <div className="flex flex-wrap gap-1 mt-2">
                {c.payload.buttons.map((b, i) => (
                  <span
                    key={i}
                    className={`text-xs px-2 py-0.5 rounded ${
                      c.direction === 'in' ? 'bg-white/50' : 'bg-white/20'
                    }`}
                  >
                    {b.title}
                  </span>
                ))}
              </div>
            )}
            <p className={`text-[10px] mt-1 ${c.direction === 'in' ? 'text-[#6a7f6a]' : 'text-white/70'}`}>
              {new Date(c.at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function FollowUpsTab({ data }) {
  if (!data) return <Empty icon={Bell} text="No follow-up data" />;

  const statusMap = {
    pending: { label: 'Pending', tone: 'bg-[#fef7e0] text-[#b68b40]' },
    sent: { label: 'Sent', tone: 'bg-[#e6f0fb] text-[#2a6ba8]' },
    responded: { label: 'Responded', tone: 'bg-[#e8f5e6] text-[#2d7a3a]' },
    converted: { label: 'Converted', tone: 'bg-[#e8f5e6] text-[#2d7a3a]' },
    unsubscribed: { label: 'Unsubscribed', tone: 'bg-[#fde8e8] text-[#c0392b]' },
  };
  const s = statusMap[data.status] || statusMap.pending;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SmallStat label="Status" value={<span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${s.tone}`}>{s.label}</span>} />
        <SmallStat label="Follow-ups Sent" value={data.count || 0} />
        <SmallStat label="Last Sent" value={data.lastSentAt ? new Date(data.lastSentAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'} />
        <SmallStat label="Stuck At Step" value={data.stuckAtStep || '—'} />
      </div>

      {data.messages?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-[#6a7f6a] uppercase tracking-wider mb-2">Follow-up History</p>
          <div className="space-y-2">
            {data.messages.map((m) => (
              <div key={m._id} className="border border-[#eef5ec] rounded-xl p-3 bg-[#fafffa]">
                <p className="text-xs text-[#6a7f6a] mb-1">{new Date(m.at).toLocaleString('en-IN')}</p>
                <p className="text-sm text-[#1a2e1a] whitespace-pre-wrap">{m.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function VisitsTab({ visits }) {
  if (!visits?.length) return <Empty icon={Calendar} text="No site visits yet" />;

  return (
    <div className="space-y-3">
      {visits.map((v) => (
        <div key={v._id} className="border border-[#eef5ec] rounded-xl p-4 bg-[#fafffa]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#1a2e1a]">{v.property?.title || v.propertyTitle || 'Property'}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              v.status === 'completed' ? 'bg-[#e8f5e6] text-[#2d7a3a]'
              : v.status === 'scheduled' ? 'bg-[#e6f0fb] text-[#2a6ba8]'
              : v.status === 'rescheduled' ? 'bg-[#f3e8ff] text-[#7a3aa8]'
              : v.status === 'cancelled' ? 'bg-[#fde8e8] text-[#c0392b]'
              : 'bg-[#fef7e0] text-[#b68b40]'
            }`}>{v.status}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Detail label="Date" value={v.scheduledDate ? new Date(v.scheduledDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'} />
            <Detail label="Time" value={v.scheduledTime || '—'} />
            <Detail label="Preferred (raw)" value={v.rawPreferredDateTime || '—'} />
            <Detail label="Channel Partner" value={v.channelPartnerName || '—'} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-[#6a7f6a] uppercase tracking-wider">{label}</p>
      <p className="text-sm text-[#1a2e1a] mt-0.5">{value || '—'}</p>
    </div>
  );
}

function SmallStat({ label, value }) {
  return (
    <div className="bg-[#fafffa] border border-[#eef5ec] rounded-xl p-3">
      <p className="text-[10px] font-medium text-[#6a7f6a] uppercase tracking-wider mb-1">{label}</p>
      <div className="text-sm font-medium text-[#1a2e1a]">{value}</div>
    </div>
  );
}

function Empty({ icon: Icon, text }) {
  return (
    <div className="text-center py-12">
      <Icon className="w-10 h-10 text-[#6a7f6a]/40 mx-auto mb-3" />
      <p className="text-sm text-[#6a7f6a]">{text}</p>
    </div>
  );
}