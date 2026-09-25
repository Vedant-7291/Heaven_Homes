// app/properties/verify/page.js
'use client';

import { useAuth } from '@/lib/auth/useAuth';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  ShieldCheck,
  MapPin,
  IndianRupee,
  Home,
  Image as ImageIcon,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';

const SUBTYPE_LABEL = {
  apartment: 'Apartment / Flat',
  flat: 'Flat',
  house: 'House / Villa',
  villa: 'Villa',
  builder_floor: 'Builder Floor',
  studio: 'Studio',
  penthouse: 'Penthouse',
  farmhouse: 'Farmhouse',
  pg: 'PG',
  office: 'Office Space',
  shop: 'Shop / Retail',
  showroom: 'Showroom',
  warehouse: 'Warehouse / Godown',
  industrial: 'Industrial',
  coworking: 'Co-working Space',
  factory: 'Factory',
};

export default function VerifyPropertiesPage() {
  const { isOwner, loading: authLoading } = useAuth();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState(null); // property._id currently being approved/rejected
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    pages: 0,
  });

  const fetchPending = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      const res = await fetch(`/api/properties/pending?${params}`);
      const data = await res.json();

      if (data.success) {
        setProperties(Array.isArray(data.data) ? data.data : []);
        setPagination((p) => ({
          ...p,
          total: data.pagination?.total ?? 0,
          page: data.pagination?.page ?? 1,
          pages: data.pagination?.pages ?? 0,
        }));
      } else {
        toast.error('Failed to load pending properties');
        setProperties([]);
      }
    } catch (err) {
      console.error('[verify] fetch error', err);
      toast.error('Failed to load pending properties');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    if (!authLoading && isOwner) fetchPending();
  }, [authLoading, isOwner, fetchPending]);

  const handleDecision = async (property, decision) => {
    const newStatus = decision === 'approve' ? 'available' : 'rejected';
    const label = decision === 'approve' ? 'approve' : 'reject';

    if (decision === 'reject') {
      const ok = window.confirm(
        `Reject "${property.title}"? It will not appear in the property listing.`
      );
      if (!ok) return;
    }

    setActingOn(property._id);
    try {
      const res = await fetch(`/api/properties/${property._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || `Failed to ${label} property`);
        return;
      }

      toast.success(decision === 'approve' ? 'Property approved' : 'Property rejected');
      setProperties((prev) => prev.filter((p) => p._id !== property._id));
      setPagination((p) => ({ ...p, total: Math.max(0, p.total - 1) }));
    } catch (err) {
      console.error('[verify] decision error', err);
      toast.error(`Error trying to ${label} property`);
    } finally {
      setActingOn(null);
    }
  };

  const handleImageError = (propertyId) => {
    setImageErrors((prev) => ({ ...prev, [propertyId]: true }));
  };

  const formatPrice = (price, propertyType) => {
    const n = Number(price) || 0;
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(n);
    return propertyType === 'rent' || propertyType === 'commercial_rent'
      ? `${formatted}/mo`
      : formatted;
  };

  const getSubTypeLabel = (subType) =>
    subType ? SUBTYPE_LABEL[subType] || subType : 'Property';

  // ---------- Auth guard ----------
  if (authLoading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-[#2d7a3a] animate-spin" />
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="p-4 md:p-6 min-h-screen bg-[#f8faf7]">
        <div className="max-w-md mx-auto mt-24 bg-white rounded-2xl border border-[#e8f0e6] shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-[#fde8e8] rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-[#c0392b]" />
          </div>
          <h2 className="text-lg font-semibold text-[#1a2e1a] mb-2">Not Authorized</h2>
          <p className="text-sm text-[#6a7f6a] mb-4">
            Only owners can access the property verification page.
          </p>
          <Link
            href="/"
            className="inline-block text-sm text-[#2d7a3a] hover:text-[#23682e] underline"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ---------- Render ----------
  return (
    <div className="p-4 md:p-6 bg-[#f8faf7] min-h-screen">
      {/* Image preview */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-[#1a2e1a]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-[#e8f5e6] p-2"
              aria-label="Close preview"
            >
              <X className="w-8 h-8" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImage}
              alt="Property"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 mt-14 md:mt-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-[#1a2e1a] flex items-center gap-2">
              <span className="w-2 h-8 bg-[#2d7a3a] rounded-full mr-2" />
              Property Verification
            </h1>
            <p className="text-sm text-[#4f6b4f] mt-1 ml-4">
              Review properties submitted by channel partners and WhatsApp users before they go live.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-[#e8f5e6] border border-[#c9e5c3] rounded-xl text-sm text-[#2d7a3a] font-medium">
            <ShieldCheck className="w-4 h-4" />
            {pagination.total} pending
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#e8f0e6] shadow-sm p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-[#2d7a3a] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#6a7f6a]">Loading pending properties...</p>
          </div>
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e8f0e6] shadow-sm p-12 text-center">
          <div className="w-20 h-20 bg-[#f0f7ef] rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-10 h-10 text-[#2d7a3a]" />
          </div>
          <h3 className="text-lg font-medium text-[#1a2e1a] mb-2">
            All caught up!
          </h3>
          <p className="text-sm text-[#6a7f6a]">
            There are no properties waiting for verification right now.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
          {properties.map((property) => {
            const allFeatures = Array.isArray(property.features) ? property.features : [];
            const features = allFeatures.slice(0, 3);
            const extra = allFeatures.length - features.length;
            const showImage = property.imageUrl && !imageErrors[property._id];
            const isActing = actingOn === property._id;

            const IMAGE_HEIGHT = 260;
            const TITLE_MIN_HEIGHT = 44;
            const FEATURES_MIN_HEIGHT = 26;

            return (
              <div
                key={property._id}
                className="bg-white rounded-2xl border border-[#e8f0e6] overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full"
              >
                {/* Image */}
                <div
                  className="relative bg-[#f0f7ef] overflow-hidden flex-shrink-0"
                  style={{ height: `${IMAGE_HEIGHT}px`, width: '100%' }}
                >
                  {showImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={property.imageUrl}
                      alt={property.title || 'Property'}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={() => handleImageError(property._id)}
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-[#fafffa] to-[#f0f7ef]">
                      <ImageIcon className="w-10 h-10 text-[#6a7f6a]/40" />
                    </div>
                  )}

                  <span className="absolute top-2 right-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-semibold shadow-sm bg-[#fff5d6] text-[#a67c00]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#a67c00]" />
                    Pending Review
                  </span>

                  {showImage && (
                    <button
                      onClick={() => setSelectedImage(property.imageUrl)}
                      className="absolute bottom-2 right-2 p-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white transition-colors"
                      aria-label="Preview image"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-[#1a2e1a]" />
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className="p-3 flex-1 flex flex-col">
                  <p className="text-[10px] text-[#6a7f6a] uppercase tracking-wide font-medium mb-0.5 truncate">
                    {property.source === 'whatsapp_bot'
                      ? 'Submitted via WhatsApp'
                      : 'Submitted by channel partner'}
                  </p>

                  <h3
                    className="text-sm font-semibold text-[#1a2e1a] mb-1 leading-snug line-clamp-2"
                    style={{ minHeight: `${TITLE_MIN_HEIGHT}px` }}
                  >
                    {property.title || 'Untitled Property'}
                  </h3>

                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1 text-[11px] text-[#4f6b4f] min-w-0">
                      <MapPin className="w-3 h-3 text-[#6a7f6a] flex-shrink-0" />
                      <span className="truncate">
                        {[property.area, property.city].filter(Boolean).join(', ') || '—'}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-[#1a2e1a] whitespace-nowrap">
                      {formatPrice(property.price, property.propertyType)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-[#4f6b4f] mb-2">
                    <div className="flex items-center gap-1 min-w-0">
                      <Home className="w-3 h-3 text-[#6a7f6a]" />
                      <span className="truncate">{getSubTypeLabel(property.propertySubType)}</span>
                    </div>
                    {property.areaSqft ? (
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="text-[#6a7f6a]">📐</span>
                        <span className="truncate">{property.areaSqft} Sq Ft</span>
                      </div>
                    ) : (
                      <div className="invisible">—</div>
                    )}
                  </div>

                  {/* Owner / submitter info */}
                  {(property.ownerName || property.ownerPhone) && (
                    <div className="text-[11px] text-[#4f6b4f] mb-2 truncate">
                      {property.ownerName ? (
                        <span className="font-medium">{property.ownerName}</span>
                      ) : null}
                      {property.ownerName && property.ownerPhone ? ' · ' : ''}
                      {property.ownerPhone ? <span>{property.ownerPhone}</span> : null}
                    </div>
                  )}

                  {/* Features */}
                  <div
                    className="flex flex-wrap gap-1 mb-2 overflow-hidden"
                    style={{ minHeight: `${FEATURES_MIN_HEIGHT}px`, maxHeight: `${FEATURES_MIN_HEIGHT}px` }}
                  >
                    {features.length > 0 ? (
                      <>
                        {features.map((f, i) => (
                          <span
                            key={`${property._id}-feat-${i}`}
                            className="text-[10px] text-[#2d7a3a] bg-[#e8f5e6] px-1.5 py-0.5 rounded-full whitespace-nowrap"
                          >
                            {f}
                          </span>
                        ))}
                        {extra > 0 && (
                          <span className="text-[10px] text-[#6a7f6a] bg-[#f0f7ef] px-1.5 py-0.5 rounded-full whitespace-nowrap">
                            +{extra}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-[10px] text-transparent select-none">—</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 pt-2 mt-auto border-t border-[#eef5ec]">
                    <button
                      onClick={() => handleDecision(property, 'reject')}
                      disabled={isActing}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-[#c0392b] bg-[#fde8e8] hover:bg-[#fbd5d5] rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                      Reject
                    </button>
                    <button
                      onClick={() => handleDecision(property, 'approve')}
                      disabled={isActing}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-white bg-[#2d7a3a] hover:bg-[#23682e] rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white rounded-2xl border border-[#e8f0e6] px-4 py-3 shadow-sm">
          <div className="text-sm text-[#6a7f6a]">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} pending properties
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 text-sm border border-[#e8f0e6] rounded-xl disabled:opacity-50 hover:bg-[#fafffa] transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={() =>
                setPagination((p) => ({ ...p, page: Math.min(p.pages, p.page + 1) }))
              }
              disabled={pagination.page === pagination.pages}
              className="px-4 py-2 text-sm border border-[#e8f0e6] rounded-xl disabled:opacity-50 hover:bg-[#fafffa] transition-colors flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}