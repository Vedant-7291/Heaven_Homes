"use client";
import { useAuth } from '@/lib/auth/useAuth';

// at top of component:

import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import PropertyModal from '@/components/Properties/PropertyModal';
import {
  Search,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Edit,
  Trash2,
  Home,
  Image as ImageIcon,
  IndianRupee,
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'residential_buy', label: 'Residential Buy' },
  { value: 'commercial_buy', label: 'Commercial Buy' },
  { value: 'residential_rent', label: 'Residential Rent' },
  { value: 'commercial_rent', label: 'Commercial Rent' },
];

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'sold', label: 'Sold' },
  { value: 'all', label: 'All' },
];

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

export default function PropertiesPage() {
  const { isOwner } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);

  // Filters
  const [filterCity, setFilterCity] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('available');
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');

  const [selectedImage, setSelectedImage] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    pages: 0,
  });

  // ---------- Fetch ----------
  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      if (filterCity) params.set('city', filterCity);
      if (filterCategory) params.set('category', filterCategory);
      if (filterStatus) params.set('status', filterStatus);
      if (filterMinPrice) params.set('minPrice', filterMinPrice);
      if (filterMaxPrice) params.set('maxPrice', filterMaxPrice);

      const res = await fetch(`/api/properties?${params}`);
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
        toast.error('Failed to fetch properties');
        setProperties([]);
      }
    } catch (err) {
      console.error('[properties] fetch error', err);
      toast.error('Failed to fetch properties');
      setProperties([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pagination.page,
    pagination.limit,
    filterCity,
    filterCategory,
    filterStatus,
    filterMinPrice,
    filterMaxPrice,
  ]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // ---------- Handlers ----------
  const handleAddProperty = () => {
    setEditingProperty(null);
    setIsModalOpen(true);
  };

  const handleEditProperty = (property) => {
    setEditingProperty(property);
    setIsModalOpen(true);
  };

  const handleDeleteProperty = async (id) => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    try {
      const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Property deleted successfully');
        fetchProperties();
      } else {
        toast.error('Failed to delete property');
      }
    } catch (err) {
      console.error('[properties] delete error', err);
      toast.error('Error deleting property');
    }
  };

  const handleSaveProperty = async (propertyData) => {
    try {
      const url = editingProperty
        ? `/api/properties/${editingProperty._id}`
        : '/api/properties';
      const method = editingProperty ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(propertyData),
      });

      if (res.ok) {
        toast.success(editingProperty ? 'Property updated' : 'Property added');
        setIsModalOpen(false);
        fetchProperties();
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to save property');
      }
    } catch (err) {
      console.error('[properties] save error', err);
      toast.error('Error saving property');
    }
  };

  const clearFilters = () => {
    setFilterCity('');
    setFilterCategory('');
    setFilterStatus('available');
    setFilterMinPrice('');
    setFilterMaxPrice('');
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleImageError = (propertyId) => {
    setImageErrors((prev) => ({ ...prev, [propertyId]: true }));
  };

  // ---------- Derived ----------
  const anyFilterActive = useMemo(
    () =>
      Boolean(
        filterCity ||
          filterCategory ||
          filterStatus !== 'available' ||
          filterMinPrice ||
          filterMaxPrice
      ),
    [filterCity, filterCategory, filterStatus, filterMinPrice, filterMaxPrice]
  );

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

  const getCategoryLabel = (property) => {
    if (!property) return '—';
    if (property.categoryTab === 'residential_buy') return 'Residential Buy';
    if (property.categoryTab === 'commercial_buy') return 'Commercial Buy';
    if (property.categoryTab === 'residential_rent') return 'Residential Rent';
    if (property.categoryTab === 'commercial_rent') return 'Commercial Rent';
    if (property.propertyType === 'buy') return 'Residential Buy';
    if (property.propertyType === 'rent') return 'Residential Rent';
    if (property.propertyType === 'commercial') return 'Commercial';
    return property.propertyType || '—';
  };

  const getSubTypeLabel = (subType) => {
    if (!subType) return 'Property';
    return SUBTYPE_LABEL[subType] || subType;
  };

  // ---------- Render ----------
  return (
    <div className="p-4 md:p-6 bg-[#f8faf7] min-h-screen">
      {/* Image preview modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-[#1a2e1a]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-[#e8f5e6] transition-colors p-2"
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

      {/* Page Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-[#1a2e1a] flex items-center gap-2">
              <span className="w-2 h-8 bg-[#2d7a3a] rounded-full mr-2" />
              Property Management
            </h1>
            <p className="text-sm text-[#4f6b4f] mt-1 ml-4">
              Manage your property listings
            </p>
          </div>
          <button
            onClick={handleAddProperty}
            className="w-full sm:w-auto bg-[#2d7a3a] hover:bg-[#23682e] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Property</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-[#e8f0e6] p-4 mb-6 shadow-sm">
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}
        >
          {/* City */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6a7f6a]" />
            <input
              type="text"
              placeholder="City (e.g., Indore)"
              value={filterCity}
              onChange={(e) => {
                setFilterCity(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full pl-9 pr-3 py-2.5 border border-[#e8f0e6] rounded-xl text-sm bg-[#fafffa] focus:outline-none focus:ring-2 focus:ring-[#2d7a3a]/20 focus:border-[#2d7a3a]"
            />
          </div>

          {/* Category */}
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="px-3 py-2.5 border border-[#e8f0e6] rounded-xl text-sm bg-[#fafffa] focus:outline-none focus:ring-2 focus:ring-[#2d7a3a]/20 focus:border-[#2d7a3a]"
          >
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="px-3 py-2.5 border border-[#e8f0e6] rounded-xl text-sm bg-[#fafffa] focus:outline-none focus:ring-2 focus:ring-[#2d7a3a]/20 focus:border-[#2d7a3a]"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* Min price */}
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6a7f6a]" />
            <input
              type="number"
              placeholder="Min Price (₹)"
              value={filterMinPrice}
              onChange={(e) => {
                setFilterMinPrice(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full pl-9 pr-3 py-2.5 border border-[#e8f0e6] rounded-xl text-sm bg-[#fafffa] focus:outline-none focus:ring-2 focus:ring-[#2d7a3a]/20 focus:border-[#2d7a3a]"
            />
          </div>

          {/* Max price */}
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6a7f6a]" />
            <input
              type="number"
              placeholder="Max Price (₹)"
              value={filterMaxPrice}
              onChange={(e) => {
                setFilterMaxPrice(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full pl-9 pr-3 py-2.5 border border-[#e8f0e6] rounded-xl text-sm bg-[#fafffa] focus:outline-none focus:ring-2 focus:ring-[#2d7a3a]/20 focus:border-[#2d7a3a]"
            />
          </div>

          {/* Clear */}
          {anyFilterActive && (
            <button
              onClick={clearFilters}
              className="text-sm text-[#2d7a3a] hover:text-[#23682e] flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl hover:bg-[#f0f7ef] transition-colors"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#e8f0e6] shadow-sm p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-[#2d7a3a] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#6a7f6a]">Loading properties...</p>
          </div>
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e8f0e6] shadow-sm p-12 text-center">
          <div className="w-20 h-20 bg-[#f0f7ef] rounded-full flex items-center justify-center mx-auto mb-4">
            <Home className="w-10 h-10 text-[#6a7f6a]" />
          </div>
          <h3 className="text-lg font-medium text-[#1a2e1a] mb-2">
            No Properties Found
          </h3>
          <p className="text-sm text-[#6a7f6a]">
            Try adjusting your filters or add a new property
          </p>
        </div>
      ) : (
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-stretch">
{properties.map((property, index) => {
  const isSold = property.status === 'sold';
  const allFeatures = Array.isArray(property.features) ? property.features : [];
  const features = allFeatures.slice(0, 2);
  const extra = allFeatures.length - features.length;
  const showImage = property.imageUrl && !imageErrors[property._id];

  const propertyIdLabel =
    property.propertyId ||
    property.listingId ||
    property.code ||
    `P-${String((pagination.page - 1) * pagination.limit + index + 3021).padStart(4, '0')}`;

  // Spec pills — same simple outlined-pill style as the reference design,
  // only rendered when the data exists so the row never shows empty pills.
  const specPills = [
    getSubTypeLabel(property.propertySubType),
    property.configuration && property.configuration !== 'commercial'
      ? String(property.configuration).toUpperCase().replace('BHK', ' BHK')
      : null,
    property.areaSqft ? `${property.areaSqft} Sq Ft` : null,
  ].filter(Boolean);

  // Fixed heights — change these once and every card updates
  const IMAGE_HEIGHT = 200;        // px — image wrapper
  const TITLE_MIN_HEIGHT = 44;     // px — 2 lines of text-sm at leading-snug

  return (
    <div
      key={property._id}
      className="bg-white rounded-2xl border border-[#e8f0e6] overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col h-full"
    >
      {/* ---------- IMAGE — fixed height, no exceptions ---------- */}
      <div
        className="relative bg-[#f0f7ef] overflow-hidden flex-shrink-0 cursor-pointer"
        style={{ height: `${IMAGE_HEIGHT}px`, width: '100%' }}
        onClick={() => showImage && setSelectedImage(property.imageUrl)}
      >
        {showImage ? (
          <img
            src={property.imageUrl}
            alt={property.title || 'Property'}
            className="group-hover:scale-105 transition-transform duration-300"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
            onError={() => handleImageError(property._id)}
          />
        ) : (
          <div
            className="flex items-center justify-center bg-gradient-to-br from-[#fafffa] to-[#f0f7ef]"
            style={{ width: '100%', height: '100%' }}
          >
            <ImageIcon className="w-10 h-10 text-[#6a7f6a]/40" />
          </div>
        )}

        {/* Status badge — top-left */}
        <span
          className={`absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold shadow-sm ${
            isSold ? 'bg-[#fde8e8] text-[#c0392b]' : 'bg-[#e8f5e6] text-[#2d7a3a]'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isSold ? 'bg-[#c0392b]' : 'bg-[#2d7a3a]'
            }`}
          />
          {isSold ? 'Sold' : 'Available'}
        </span>

        {/* Edit pencil — always-visible circular overlay, top-right */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleEditProperty(property);
          }}
          className="absolute top-2.5 right-2.5 p-2 bg-white/95 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors"
          aria-label="Edit property"
        >
          <Edit className="w-3.5 h-3.5 text-[#1a2e1a]" />
        </button>
      </div>

      {/* ---------- CONTENT ---------- */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Property ID + category — same row */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs text-[#6a7f6a] font-medium truncate">{propertyIdLabel}</span>
          <span className="text-[11px] font-medium text-[#4f6b4f] bg-[#f0f7ef] border border-[#e8f0e6] px-2.5 py-1 rounded-full whitespace-nowrap">
            {getCategoryLabel(property)}
          </span>
        </div>

        {/* Title — reserved for 2 lines */}
        <h3
          className="text-base font-semibold text-[#1a2e1a] mb-1.5 leading-snug line-clamp-2"
          style={{ minHeight: `${TITLE_MIN_HEIGHT}px` }}
        >
          {property.title || 'Untitled Property'}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1 text-sm text-[#4f6b4f] mb-3 min-w-0">
          <MapPin className="w-3.5 h-3.5 text-[#6a7f6a] flex-shrink-0" />
          <span className="truncate">
            {[property.area, property.city].filter(Boolean).join(', ') || '—'}
          </span>
        </div>

        {/* Spec pills — type / configuration / area, plus any extra features */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {specPills.map((label, i) => (
            <span
              key={`${property._id}-spec-${i}`}
              className="text-[11px] text-[#4f6b4f] bg-[#fafffa] border border-[#e8f0e6] px-2.5 py-1 rounded-full whitespace-nowrap"
            >
              {label}
            </span>
          ))}
          {features.map((f, i) => (
            <span
              key={`${property._id}-feat-${i}`}
              className="text-[11px] text-[#2d7a3a] bg-[#e8f5e6] px-2.5 py-1 rounded-full whitespace-nowrap"
            >
              {f}
            </span>
          ))}
          {extra > 0 && (
            <span className="text-[11px] text-[#6a7f6a] bg-[#f0f7ef] px-2.5 py-1 rounded-full whitespace-nowrap">
              +{extra}
            </span>
          )}
        </div>

        {/* Price + Actions — pinned to bottom, same row */}
        <div className="flex items-center justify-between gap-3 pt-3 mt-auto border-t border-[#eef5ec]">
          <div className="min-w-0">
            <p className="text-lg font-bold text-[#1a2e1a] truncate">
              {formatPrice(property.price, property.propertyType)}
            </p>
            {property.facing && (
              <p className="text-xs text-[#6a7f6a] mt-0.5 truncate">{property.facing} facing</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => handleEditProperty(property)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-[#2d7a3a] border border-[#e8f0e6] hover:bg-[#f0f7ef] hover:border-[#2d7a3a] rounded-xl transition-colors"
              aria-label="Edit property"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit
            </button>
            {isOwner && (
              <button
                onClick={() => handleDeleteProperty(property._id)}
                className="p-2 text-[#6a7f6a] hover:text-red-600 hover:bg-red-50 rounded-xl transition-all flex-shrink-0"
                title="Delete Property"
                aria-label="Delete property"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
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
            {pagination.total} properties
          </div>
          <div className="flex gap-2">
            <button
              onClick={() =>
                setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))
              }
              disabled={pagination.page === 1}
              className="px-4 py-2 text-sm border border-[#e8f0e6] rounded-xl disabled:opacity-50 hover:bg-[#fafffa] transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={() =>
                setPagination((p) => ({
                  ...p,
                  page: Math.min(p.pages, p.page + 1),
                }))
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

      <PropertyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProperty}
        property={editingProperty}
        isOwner={isOwner}
      />
    </div>
  );
}