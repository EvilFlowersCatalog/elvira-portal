import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { FiTrash2, FiX, FiSearch, FiFolder } from 'react-icons/fi';
import Drawer from '../Drawer';
import ConfirmDialog from '../ConfirmDialog';
import { Field, TextInput } from '../Field';
import Select from '../../primitives/Select';
import Button from '../../buttons/Button';
import { IFeed } from '../../../utils/interfaces/feed';
import { uuid } from '../../../utils/func/functions';
import useFeedsQuery from '../../../hooks/api/feeds/useFeedsQuery';
import useGetFeedDetail from '../../../hooks/api/feeds/useGetFeedDetail';
import useUploadFeed from '../../../hooks/api/feeds/useUploadFeed';
import useEditFeed from '../../../hooks/api/feeds/useEditFeed';
import useDeleteFeed from '../../../hooks/api/feeds/useDeleteFeed';

interface FeedRef {
  id: string;
  title: string;
}

interface FeedDrawerProps {
  open: boolean;
  feed: IFeed | null;
  mode: 'create' | 'edit';
  catalogId: string | null;
  /** Pre-selected parent folder when creating inside a folder. */
  defaultParentId?: string | null;
  onClose: () => void;
  onSaved: () => void;
}

/** Inline picker over navigation (folder) feeds. */
function ParentPicker({
  folders,
  exclude,
  onSelect,
  placeholder,
  label,
}: {
  folders: FeedRef[];
  exclude: string[];
  onSelect: (f: FeedRef) => void;
  placeholder: string;
  label: string;
}) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const matches = useMemo(() => {
    const f = text.trim().toLowerCase();
    return folders
      .filter((fd) => !exclude.includes(fd.id))
      .filter((fd) => !f || fd.title.toLowerCase().includes(f))
      .slice(0, 8);
  }, [folders, exclude, text]);

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900/40 px-3 h-10 focus-within:border-primary">
        <FiSearch aria-hidden="true" size={16} className="text-zinc-400 shrink-0" />
        <input
          aria-label={label}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-transparent text-sm outline-none text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400"
        />
      </div>
      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg">
          {matches.length === 0 ? (
            <div className="px-3 py-2 text-sm text-zinc-400">—</div>
          ) : (
            matches.map((fd) => (
              <button
                key={fd.id}
                type="button"
                onClick={() => {
                  onSelect(fd);
                  setText('');
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700/60"
              >
                <FiFolder size={14} className="text-zinc-400 shrink-0" />
                <span className="truncate text-zinc-800 dark:text-zinc-100">{fd.title}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function FeedDrawer({ open, feed, mode, catalogId, defaultParentId, onClose, onSaved }: FeedDrawerProps) {
  const { t } = useTranslation();
  const getFeedDetail = useGetFeedDetail();
  const uploadFeed = useUploadFeed();
  const editFeed = useEditFeed();
  const deleteFeed = useDeleteFeed();

  const [title, setTitle] = useState('');
  const [urlName, setUrlName] = useState('');
  const [content, setContent] = useState('');
  const [kind, setKind] = useState('acquisition');
  const [parents, setParents] = useState<FeedRef[]>([]);
  const [errors, setErrors] = useState<{ title?: string }>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // All navigation folders (fetched once the drawer opens) — used for the parent
  // picker and to resolve parent ids to titles. Cached/deduped by React Query.
  const { data: foldersData } = useFeedsQuery(
    { paginate: false, kind: 'navigation' },
    { enabled: open }
  );
  const folders: FeedRef[] = useMemo(
    () => (foldersData?.items ?? []).map((f) => ({ id: f.id, title: f.title })),
    [foldersData]
  );

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (mode === 'edit' && feed) {
      setTitle(feed.title);
      setKind(feed.kind || 'acquisition');
      setUrlName(feed.url_name);
      setContent('');
      setParents([]);
      getFeedDetail(feed.id)
        .then((d) => {
          setContent(d.content ?? '');
          setUrlName(d.url_name);
          setKind(d.kind || 'acquisition');
          setParents((d.parents ?? []).map((id) => ({ id, title: id })));
        })
        .catch(() => {});
    } else {
      setTitle('');
      setUrlName('');
      setContent('');
      setKind('acquisition');
      setParents(defaultParentId ? [{ id: defaultParentId, title: defaultParentId }] : []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, feed, defaultParentId]);

  // Resolve parent ids -> titles once folders load.
  useEffect(() => {
    if (folders.length === 0) return;
    setParents((prev) =>
      prev.map((p) => {
        const match = folders.find((f) => f.id === p.id);
        return match ? { id: p.id, title: match.title } : p;
      })
    );
  }, [folders]);

  const addParent = (f: FeedRef) => setParents((prev) => (prev.some((p) => p.id === f.id) ? prev : [...prev, f]));
  const removeParent = (id: string) => setParents((prev) => prev.filter((p) => p.id !== id));

  const validate = () => {
    const e: typeof errors = {};
    if (!title.trim()) e.title = t('administration.collectionsPage.titleRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (mode === 'create' && !catalogId) return;
    setSaving(true);
    try {
      const payload = {
        catalog_id: catalogId ?? '',
        title: title.trim(),
        url_name: urlName.trim() || uuid(),
        content,
        kind,
        parents: parents.map((p) => p.id),
      };
      if (mode === 'create') {
        await uploadFeed(payload);
        toast.success(t('administration.collectionsPage.created'));
      } else if (feed) {
        await editFeed(feed.id, payload);
        toast.success(t('administration.collectionsPage.saved'));
      }
      onSaved();
      onClose();
    } catch {
      toast.error(t('administration.collectionsPage.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!feed) return;
    setDeleting(true);
    try {
      await deleteFeed(feed.id);
      toast.success(t('administration.collectionsPage.deleted'));
      setConfirmDelete(false);
      onSaved();
      onClose();
    } catch {
      toast.error(t('administration.collectionsPage.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title={mode === 'create' ? t('administration.collectionsPage.createTitle') : t('administration.collectionsPage.editTitle')}
        description={mode === 'edit' && feed ? feed.url_name : undefined}
        footer={
          <>
            {mode === 'edit' && feed && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="mr-auto inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-redText dark:text-red hover:bg-red/10"
              >
                <FiTrash2 size={15} />
                {t('administration.collectionsPage.delete')}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-300 dark:border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              {t('administration.collectionsPage.cancel')}
            </button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? '…' : mode === 'create' ? t('administration.collectionsPage.create') : t('administration.collectionsPage.save')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label={t('administration.collectionsPage.titleCol')} htmlFor="feed-title" required error={errors.title}>
            <TextInput id="feed-title" value={title} invalid={!!errors.title} onChange={(e) => setTitle(e.target.value)} />
          </Field>

          <Field label={t('administration.collectionsPage.kind')} htmlFor="feed-kind">
            <Select
              id="feed-kind"
              value={kind}
              onChange={setKind}
              options={[
                { value: 'acquisition', label: t('administration.collectionsPage.kindAcquisition') },
                { value: 'navigation', label: t('administration.collectionsPage.kindNavigation') },
              ]}
              triggerClassName="h-10 rounded-lg border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900/40"
            />
          </Field>

          {/* Graph structure: parent folders (a feed can have multiple parents) */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{t('administration.collectionsPage.parents')}</h3>
            <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">{t('administration.collectionsPage.parentsHint')}</p>
            <ParentPicker
              folders={folders}
              exclude={[...parents.map((p) => p.id), ...(feed ? [feed.id] : [])]}
              onSelect={addParent}
              label={t('administration.collectionsPage.addParent')}
              placeholder={t('administration.collectionsPage.addParent')}
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {parents.length === 0 ? (
                <span className="text-sm text-zinc-400">{t('administration.collectionsPage.noParents')}</span>
              ) : (
                parents.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 dark:bg-zinc-700/60 py-1 pl-2.5 pr-1.5 text-sm text-zinc-700 dark:text-zinc-200"
                  >
                    <FiFolder size={13} className="text-zinc-400" />
                    <span className="max-w-[180px] truncate">{p.title}</span>
                    <button
                      type="button"
                      aria-label={`${t('administration.collectionsPage.remove', { defaultValue: 'Remove' })} ${p.title}`}
                      onClick={() => removeParent(p.id)}
                      className="text-zinc-400 hover:text-redText dark:hover:text-red"
                    >
                      <FiX size={14} />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          <Field label={t('administration.collectionsPage.content')} htmlFor="feed-content">
            <textarea
              id="feed-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full resize-y rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900/40 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </Field>

          <Field label={t('administration.collectionsPage.urlName')} htmlFor="feed-url" hint={t('administration.collectionsPage.urlNameHint')}>
            <TextInput id="feed-url" value={urlName} onChange={(e) => setUrlName(e.target.value)} />
          </Field>
        </div>
      </Drawer>

      <ConfirmDialog
        open={confirmDelete}
        title={t('administration.collectionsPage.deleteConfirmTitle')}
        message={t('administration.collectionsPage.deleteConfirmBody', { name: feed?.title ?? '' })}
        confirmLabel={t('administration.collectionsPage.delete')}
        cancelLabel={t('administration.collectionsPage.cancel')}
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
