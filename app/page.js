"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
  Users, Building2, UserCheck, Calendar,
  UserCircle, ArrowRight, FolderOpen,
  Phone, BarChart3, Clock,
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function Dashboard() {
  const [stats, setStats] = useState({
    activeLeads: 0,
    pendingSiteVisits: 0,
    activeProperties: 0,
    convertedClients: 0,
  });
  const [recentLeads, setRecentLeads] = useState([]);
  const [pendingVisits, setPendingVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Site Visits',
        data: [8, 12, 15, 18, 22, 20],
        borderColor: '#2d7a3a',
        backgroundColor: 'rgba(45, 122, 58, 0.05)',
        borderWidth: 2.5, fill: true, tension: 0.3,
        pointBackgroundColor: '#2d7a3a', pointBorderColor: '#fff',
        pointBorderWidth: 2, pointRadius: 4,
      },
      {
        label: 'Conversions',
        data: [3, 5, 7, 9, 12, 11],
        borderColor: '#6fbf73',
        backgroundColor: 'rgba(111, 191, 115, 0.05)',
        borderWidth: 2.5, fill: true, tension: 0.3,
        pointBackgroundColor: '#6fbf73', pointBorderColor: '#fff',
        pointBorderWidth: 2, pointRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true, position: 'top',
        labels: {
          usePointStyle: true, pointStyle: 'circle', padding: 16,
          font: { size: 11, weight: '500', family: 'Inter' }, color: '#1e2a1e',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255,255,255,0.95)', titleColor: '#1e2a1e', bodyColor: '#2d4a2d',
        borderColor: '#e8f0e6', borderWidth: 1, padding: 12, cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
        ticks: { font: { size: 10, family: 'Inter' }, color: '#6a7f6a' },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 10, family: 'Inter' }, color: '#6a7f6a' },
      },
    },
    interaction: { intersect: false, mode: 'index' },
  };

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, leadsRes, visitsRes] = await Promise.all([
          fetch('/api/leads/stats').then((r) => r.json()).catch(() => ({})),
          fetch('/api/leads?limit=5').then((r) => r.json()).catch(() => ({})),
          fetch('/api/site-visits?limit=5').then((r) => r.json()).catch(() => ({})),
        ]);

        setStats({
          activeLeads: statsRes?.data?.active ?? 0,
          convertedClients: statsRes?.data?.completed ?? 0,
          activeProperties: statsRes?.data?.byCategory
            ? (statsRes.data.byCategory.purchase || 0) +
              (statsRes.data.byCategory.rent || 0) +
              (statsRes.data.byCategory.rentOut || 0)
            : 0,
          pendingSiteVisits: visitsRes?.data?.filter((v) => v.status === 'pending').length ?? 0,
        });

        setRecentLeads(leadsRes?.data || []);
        setPendingVisits((visitsRes?.data || []).filter((v) => v.status !== 'completed').slice(0, 5));
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getPropertyDisplay = (lead) => {
    if (lead?.interested?.title) return lead.interested.title;
    if (lead?.matchedProperties?.[0]?.title) return lead.matchedProperties[0].title;
    return 'Not assigned';
  };

  const renderVisitDate = (visit) => {
    if (visit.rawPreferredDateTime) return visit.rawPreferredDateTime;
    if (visit.scheduledDate)
      return new Date(visit.scheduledDate).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      });
    return 'N/A';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8faf7]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-[#2d7a3a] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#4f6b4f] text-sm font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-[#f8faf7] min-h-screen">
      <div className="mb-8 mt-16 md:mt-0">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#1a2e1a]">Dashboard</h1>
        <p className="text-sm text-[#4f6b4f] mt-1">Complete overview of your business</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <MiniStatCard icon={Users} label="Active Leads" value={stats.activeLeads} />
        <MiniStatCard icon={Calendar} label="Pending Site Visits" value={stats.pendingSiteVisits} />
        <MiniStatCard icon={Building2} label="Active Properties" value={stats.activeProperties} />
        <MiniStatCard icon={UserCheck} label="Converted Clients" value={stats.convertedClients} />
      </div>

      {/* Recent Leads */}
      <div className="bg-white rounded-2xl border border-[#e8f0e6] mb-8 overflow-hidden shadow-sm">
        <div className="px-3 sm:px-5 py-4 border-b border-[#e8f0e6] flex items-center justify-between bg-[#fafffa]">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <UserCircle className="w-4 h-4 text-[#2d7a3a] flex-shrink-0" />
            <h2 className="text-sm font-semibold text-[#1a2e1a] truncate">Recent New Leads</h2>
          </div>
          <Link href="/leads" className="text-xs font-medium text-[#2d7a3a] hover:text-[#23682e] transition-colors flex items-center gap-1 flex-shrink-0">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="bg-[#fafffa]">
                <th className="text-left px-5 py-3 text-xs font-medium text-[#6a7f6a] uppercase tracking-wider">Lead</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#6a7f6a] uppercase tracking-wider">Interested In</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#6a7f6a] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentLeads.length === 0 ? (
                <tr className="border-t border-[#eef5ec]">
                  <td colSpan="3" className="text-center py-8 text-[#6a7f6a] text-sm">
                    <FolderOpen className="w-4 h-4 inline-block mr-2" />
                    No leads found
                  </td>
                </tr>
              ) : (
                recentLeads.map((lead) => (
                  <tr key={lead._id} className="border-t border-[#eef5ec] hover:bg-[#fafffa] transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-[#1a2e1a]">{lead.name || 'N/A'}</p>
                      <p className="text-xs text-[#6a7f6a] flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {lead.phone}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-sm text-[#4f6b4f]">{getPropertyDisplay(lead)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full ${
                        lead.isCompleted ? 'bg-[#e8f5e6] text-[#2d7a3a]' : 'bg-[#fef7e0] text-[#b68b40]'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${lead.isCompleted ? 'bg-[#2d7a3a]' : 'bg-[#b68b40]'}`} />
                        {lead.isCompleted ? 'Completed' : 'In Progress'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-[#eef5ec]">
          {recentLeads.length === 0 ? (
            <div className="text-center py-8 text-[#6a7f6a] text-sm">
              <FolderOpen className="w-4 h-4 inline-block mr-2" />
              No leads found
            </div>
          ) : (
            recentLeads.map((lead) => (
              <div key={lead._id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1a2e1a] truncate">{lead.name || 'N/A'}</p>
                    <p className="text-xs text-[#6a7f6a] flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {lead.phone}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium rounded-full flex-shrink-0 ${
                    lead.isCompleted ? 'bg-[#e8f5e6] text-[#2d7a3a]' : 'bg-[#fef7e0] text-[#b68b40]'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${lead.isCompleted ? 'bg-[#2d7a3a]' : 'bg-[#b68b40]'}`} />
                    {lead.isCompleted ? 'Completed' : 'In Progress'}
                  </span>
                </div>
                <p className="text-xs text-[#6a7f6a]">
                  <span className="uppercase tracking-wider text-[10px]">Interested:</span>{' '}
                  <span className="text-[#1a2e1a]">{getPropertyDisplay(lead)}</span>
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pending Site Visits */}
      <div className="bg-white rounded-2xl border border-[#e8f0e6] overflow-hidden shadow-sm mb-8">
        <div className="px-3 sm:px-5 py-4 border-b border-[#e8f0e6] flex items-center justify-between bg-[#fafffa]">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Clock className="w-4 h-4 text-[#2d7a3a] flex-shrink-0" />
            <h2 className="text-sm font-semibold text-[#1a2e1a] truncate">Pending Site Visits</h2>
          </div>
          <Link href="/site-visits" className="text-xs font-medium text-[#2d7a3a] hover:text-[#23682e] transition-colors flex items-center gap-1 flex-shrink-0">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-[#fafffa]">
                <th className="text-left px-5 py-3 text-xs font-medium text-[#6a7f6a] uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#6a7f6a] uppercase tracking-wider">Property</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#6a7f6a] uppercase tracking-wider">Contact</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#6a7f6a] uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#6a7f6a] uppercase tracking-wider">Channel Partner</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#6a7f6a] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {pendingVisits.length === 0 ? (
                <tr className="border-t border-[#eef5ec]">
                  <td colSpan="6" className="text-center py-8 text-[#6a7f6a] text-sm">
                    <FolderOpen className="w-4 h-4 inline-block mr-2" />
                    No pending site visits
                  </td>
                </tr>
              ) : (
                pendingVisits.map((visit) => (
                  <tr key={visit._id} className="border-t border-[#eef5ec] hover:bg-[#fafffa] transition-colors">
                    <td className="px-5 py-3 text-sm font-medium text-[#1a2e1a]">{visit.leadName || 'N/A'}</td>
                    <td className="px-5 py-3 text-sm text-[#4f6b4f]">{visit.propertyTitle || 'N/A'}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[#6a7f6a]" />
                        <span className="text-sm text-[#4f6b4f]">{visit.leadPhone || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-[#4f6b4f]">{renderVisitDate(visit)}</td>
                    <td className="px-5 py-3 text-sm text-[#4f6b4f]">{visit.channelPartnerName || 'Not assigned'}</td>
                    <td className="px-5 py-3"><VisitStatusBadge status={visit.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-[#eef5ec]">
          {pendingVisits.length === 0 ? (
            <div className="text-center py-8 text-[#6a7f6a] text-sm">
              <FolderOpen className="w-4 h-4 inline-block mr-2" />
              No pending site visits
            </div>
          ) : (
            pendingVisits.map((visit) => (
              <div key={visit._id} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1a2e1a] truncate">{visit.leadName || 'N/A'}</p>
                    <p className="text-xs text-[#6a7f6a] flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {visit.leadPhone || 'N/A'}
                    </p>
                  </div>
                  <VisitStatusBadge status={visit.status} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="min-w-0">
                    <p className="text-[#6a7f6a] uppercase tracking-wider text-[10px]">Property</p>
                    <p className="text-[#1a2e1a] mt-0.5 truncate">{visit.propertyTitle || 'N/A'}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[#6a7f6a] uppercase tracking-wider text-[10px]">Date</p>
                    <p className="text-[#1a2e1a] mt-0.5 truncate">{renderVisitDate(visit)}</p>
                  </div>
                  <div className="col-span-2 min-w-0">
                    <p className="text-[#6a7f6a] uppercase tracking-wider text-[10px]">Channel Partner</p>
                    <p className="text-[#1a2e1a] mt-0.5 truncate">
                      {visit.channelPartnerName || 'Not assigned'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-[#e8f0e6] p-4 sm:p-5 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-4 gap-2">
          <h2 className="text-sm font-semibold text-[#1a2e1a] flex items-center gap-2 min-w-0">
            <BarChart3 className="w-4 h-4 text-[#2d7a3a] flex-shrink-0" />
            <span className="truncate">Site Visit Analytics</span>
          </h2>
          <span className="text-xs text-[#6a7f6a] bg-[#f0f7ef] px-3 py-1 rounded-full flex-shrink-0 whitespace-nowrap">
            Last 6 months
          </span>
        </div>
        <div className="h-[180px] sm:h-[220px] md:h-[260px]">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

function MiniStatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e8f0e6] p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#e8f5e6] rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-[#2d7a3a]" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-medium text-[#6a7f6a] uppercase tracking-wider truncate">{label}</p>
          <p className="text-lg sm:text-xl font-bold text-[#1a2e1a] leading-tight">{value}</p>
        </div>
      </div>
    </div>
  );
}

function VisitStatusBadge({ status }) {
  const map = {
    scheduled:   { bg: 'bg-[#e6f0fb]', text: 'text-[#2a6ba8]', dot: 'bg-[#2a6ba8]', label: 'Scheduled' },
    pending:     { bg: 'bg-[#fef7e0]', text: 'text-[#b68b40]', dot: 'bg-[#b68b40]', label: 'Pending' },
    completed:   { bg: 'bg-[#e8f5e6]', text: 'text-[#2d7a3a]', dot: 'bg-[#2d7a3a]', label: 'Completed' },
    rescheduled: { bg: 'bg-[#f3e8ff]', text: 'text-[#7a3aa8]', dot: 'bg-[#7a3aa8]', label: 'Rescheduled' },
    cancelled:   { bg: 'bg-[#fde8e8]', text: 'text-[#c0392b]', dot: 'bg-[#c0392b]', label: 'Cancelled' },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-medium rounded-full whitespace-nowrap flex-shrink-0 ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}