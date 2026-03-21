'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';

interface VenueOption {
  _id: string;
  name: string;
  city?: string;
}

interface TemplateItem {
  _id: string;
  name: string;
  description?: string;
  screenName?: string;
  screenType: string;
  totalCapacity: number;
  isActive: boolean;
  isDraft: boolean;
  version: number;
  createdAt: string;
  venueId?: {
    _id: string;
    name: string;
    city?: string;
  } | string;
}

interface TemplatesResponse {
  success: boolean;
  data: TemplateItem[];
  pagination?: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}

interface CreateTemplateForm {
  name: string;
  venueId: string;
  screenName: string;
  screenType: 'standard' | 'imax' | 'dolby' | '4dx' | 'screenx' | 'premium' | 'outdoor';
  layoutType: 'rectangular' | 'curved' | 'stadium';
  rows: number;
  seatsPerRow: number;
  basePrice: number;
}

const formatDate = (value?: string) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function TemplatesManager() {
  const { isAuthenticated, isLoading } = useAuth();

  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [venues, setVenues] = useState<VenueOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'inactive'>('all');
  const [search, setSearch] = useState('');

  const [createForm, setCreateForm] = useState<CreateTemplateForm>({
    name: '',
    venueId: '',
    screenName: '',
    screenType: 'standard',
    layoutType: 'rectangular',
    rows: 10,
    seatsPerRow: 12,
    basePrice: 250
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [templatesResponse, venuesResponse] = await Promise.all([
        api.get<TemplatesResponse>('/venue-templates?limit=200&includeInactive=true'),
        api.get<{ venues: VenueOption[] }>('/venues?active=true')
      ]);

      setTemplates(Array.isArray(templatesResponse.data) ? templatesResponse.data : []);
      setVenues(venuesResponse.venues || []);

      if (!createForm.venueId && venuesResponse.venues?.length) {
        setCreateForm((prev) => ({ ...prev, venueId: venuesResponse.venues[0]._id }));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    loadAll();
  }, [isLoading, isAuthenticated]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((item) => {
      const venueName = typeof item.venueId === 'object' ? item.venueId?.name || '' : '';
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.screenName || '').toLowerCase().includes(search.toLowerCase()) ||
        venueName.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        filter === 'all'
          ? true
          : filter === 'draft'
          ? item.isDraft
          : filter === 'published'
          ? !item.isDraft && item.isActive
          : !item.isActive;

      return matchesSearch && matchesFilter;
    });
  }, [templates, search, filter]);

  const summary = useMemo(
    () => ({
      total: templates.length,
      draft: templates.filter((template) => template.isDraft).length,
      published: templates.filter((template) => !template.isDraft && template.isActive).length,
      inactive: templates.filter((template) => !template.isActive).length
    }),
    [templates]
  );

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!createForm.venueId || !createForm.name.trim()) {
      setError('Template name and venue are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await api.post('/venue-templates/generate', {
        venueId: createForm.venueId,
        name: createForm.name.trim(),
        screenName: createForm.screenName.trim() || undefined,
        screenType: createForm.screenType,
        layoutType: createForm.layoutType,
        rows: createForm.rows,
        seatsPerRow: createForm.seatsPerRow,
        basePrice: createForm.basePrice
      });

      setCreateForm((prev) => ({ ...prev, name: '', screenName: '' }));
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Failed to create template');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (template: TemplateItem) => {
    setEditingId(template._id);
    setEditName(template.name || '');
    setEditDescription(template.description || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditDescription('');
  };

  const saveEdit = async (templateId: string) => {
    setSaving(true);
    setError(null);
    try {
      await api.put(`/venue-templates/${templateId}`, {
        name: editName.trim(),
        description: editDescription.trim() || undefined
      });
      cancelEdit();
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Failed to update template');
    } finally {
      setSaving(false);
    }
  };

  const publishTemplate = async (templateId: string) => {
    setSaving(true);
    setError(null);
    try {
      await api.post(`/venue-templates/${templateId}/publish`);
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Failed to publish template');
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (templateId: string, templateName: string) => {
    if (!window.confirm(`Delete template "${templateName}"?`)) return;

    setSaving(true);
    setError(null);
    try {
      await api.delete(`/venue-templates/${templateId}`);
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete template');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading) {
    return <div className="h-40 bg-surface-card rounded-xl border border-gray-800 animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Layout Templates</h1>
          <p className="text-gray-400">Real CRUD for venue layout templates.</p>
        </div>
        <button onClick={loadAll} className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
          Refresh
        </button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-card border border-gray-800 rounded-xl p-4"><p className="text-xs text-gray-500">Total</p><p className="text-2xl font-bold text-white">{summary.total}</p></div>
        <div className="bg-surface-card border border-gray-800 rounded-xl p-4"><p className="text-xs text-gray-500">Drafts</p><p className="text-2xl font-bold text-yellow-400">{summary.draft}</p></div>
        <div className="bg-surface-card border border-gray-800 rounded-xl p-4"><p className="text-xs text-gray-500">Published</p><p className="text-2xl font-bold text-green-400">{summary.published}</p></div>
        <div className="bg-surface-card border border-gray-800 rounded-xl p-4"><p className="text-xs text-gray-500">Inactive</p><p className="text-2xl font-bold text-gray-300">{summary.inactive}</p></div>
      </div>

      <form onSubmit={handleCreate} className="bg-surface-card border border-gray-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <input
          value={createForm.name}
          onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
          placeholder="Template name"
          className="px-3 py-2 bg-surface-active border border-gray-700 rounded-lg text-white placeholder-gray-500"
        />

        <select
          value={createForm.venueId}
          onChange={(event) => setCreateForm((prev) => ({ ...prev, venueId: event.target.value }))}
          className="px-3 py-2 bg-surface-active border border-gray-700 rounded-lg text-white"
        >
          {venues.map((venue) => (
            <option key={venue._id} value={venue._id}>
              {venue.name} {venue.city ? `(${venue.city})` : ''}
            </option>
          ))}
        </select>

        <input
          value={createForm.screenName}
          onChange={(event) => setCreateForm((prev) => ({ ...prev, screenName: event.target.value }))}
          placeholder="Screen name (optional)"
          className="px-3 py-2 bg-surface-active border border-gray-700 rounded-lg text-white placeholder-gray-500"
        />

        <select
          value={createForm.screenType}
          onChange={(event) =>
            setCreateForm((prev) => ({
              ...prev,
              screenType: event.target.value as CreateTemplateForm['screenType']
            }))
          }
          className="px-3 py-2 bg-surface-active border border-gray-700 rounded-lg text-white"
        >
          <option value="standard">Standard</option>
          <option value="imax">IMAX</option>
          <option value="dolby">Dolby</option>
          <option value="4dx">4DX</option>
          <option value="screenx">ScreenX</option>
          <option value="premium">Premium</option>
          <option value="outdoor">Outdoor</option>
        </select>

        <select
          value={createForm.layoutType}
          onChange={(event) =>
            setCreateForm((prev) => ({
              ...prev,
              layoutType: event.target.value as CreateTemplateForm['layoutType']
            }))
          }
          className="px-3 py-2 bg-surface-active border border-gray-700 rounded-lg text-white"
        >
          <option value="rectangular">Rectangular</option>
          <option value="curved">Curved</option>
          <option value="stadium">Stadium</option>
        </select>

        <input
          type="number"
          min={1}
          max={50}
          value={createForm.rows}
          onChange={(event) => setCreateForm((prev) => ({ ...prev, rows: Number(event.target.value) || 1 }))}
          placeholder="Rows"
          className="px-3 py-2 bg-surface-active border border-gray-700 rounded-lg text-white"
        />

        <input
          type="number"
          min={1}
          max={60}
          value={createForm.seatsPerRow}
          onChange={(event) => setCreateForm((prev) => ({ ...prev, seatsPerRow: Number(event.target.value) || 1 }))}
          placeholder="Seats per row"
          className="px-3 py-2 bg-surface-active border border-gray-700 rounded-lg text-white"
        />

        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            value={createForm.basePrice}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, basePrice: Number(event.target.value) || 0 }))}
            placeholder="Base price"
            className="flex-1 px-3 py-2 bg-surface-active border border-gray-700 rounded-lg text-white"
          />
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50">
            {saving ? 'Saving...' : 'Create'}
          </button>
        </div>
      </form>

      <div className="flex flex-col md:flex-row gap-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search templates"
          className="flex-1 px-3 py-2 bg-surface-active border border-gray-700 rounded-lg text-white placeholder-gray-500"
        />
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as 'all' | 'draft' | 'published' | 'inactive')}
          className="px-4 py-2 bg-surface-active border border-gray-700 rounded-lg text-white"
        >
          <option value="all">All</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="space-y-3">
        {filteredTemplates.length === 0 && (
          <div className="bg-surface-card border border-gray-800 rounded-xl p-6 text-center text-gray-500">
            No templates found.
          </div>
        )}

        {filteredTemplates.map((template) => {
          const venueName = typeof template.venueId === 'object' ? template.venueId?.name : 'Unknown venue';
          const isEditing = editingId === template._id;

          return (
            <div key={template._id} className="bg-surface-card border border-gray-800 rounded-xl p-4">
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    className="px-3 py-2 bg-surface-active border border-gray-700 rounded-lg text-white"
                  />
                  <input
                    value={editDescription}
                    onChange={(event) => setEditDescription(event.target.value)}
                    placeholder="Description"
                    className="px-3 py-2 bg-surface-active border border-gray-700 rounded-lg text-white"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(template._id)} disabled={saving} className="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50">Save</button>
                    <button onClick={cancelEdit} className="px-3 py-2 bg-surface-active border border-gray-700 text-gray-300 rounded-lg">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div>
                    <h3 className="text-white font-semibold">{template.name}</h3>
                    <p className="text-gray-400 text-sm">{venueName} • {template.screenName || 'No screen name'} • {template.screenType}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      Capacity {template.totalCapacity} • Version {template.version} • Updated {formatDate(template.createdAt)}
                    </p>
                    {template.description && <p className="text-gray-500 text-sm mt-1">{template.description}</p>}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${template.isDraft ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-400'}`}>
                      {template.isDraft ? 'Draft' : 'Published'}
                    </span>
                    {!template.isActive && <span className="px-2 py-1 rounded text-xs bg-gray-700 text-gray-300">Inactive</span>}

                    <button onClick={() => startEdit(template)} className="px-3 py-1.5 text-xs bg-surface-active border border-gray-700 text-gray-200 rounded-lg hover:bg-gray-700">Edit</button>

                    {template.isDraft && template.isActive && (
                      <button onClick={() => publishTemplate(template._id)} disabled={saving} className="px-3 py-1.5 text-xs bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 disabled:opacity-50">
                        Publish
                      </button>
                    )}

                    <button
                      onClick={() => deleteTemplate(template._id, template.name)}
                      disabled={saving}
                      className="px-3 py-1.5 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
