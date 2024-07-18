import { ChangeEvent, FormEvent, InvalidEvent, useRef, useState } from 'react';
import ModalWrapper from '../../modal/ModalWrapper';
import useGetFeeds from '../../../hooks/api/feeds/useGetFeeds';
import { IFeedNew, IFeedsList } from '../../../utils/interfaces/feed';
import { CircleLoader } from 'react-spinners';
import useAppContext from '../../../hooks/contexts/useAppContext';
import { useSearchParams } from 'react-router-dom';
import useGetFeedDetail from '../../../hooks/api/feeds/useGetFeedDetail';
import { uuid } from '../../../utils/func/functions';
import useUploadFeed from '../../../hooks/api/feeds/useUploadFeed';
import useEditFeed from '../../../hooks/api/feeds/useEditFeed';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import useCustomEffect from '../../../hooks/useCustomEffect';
import ElviraInput from '../../common/ElviraInput';

interface IFeedForm {
  setOpen: (open: boolean) => void;
  feedId?: string | null;
  reloadPage: boolean;
  setReloadPage: (reloadPage: boolean) => void;
}
const FeedForm = ({
  setOpen,
  feedId = null,
  reloadPage,
  setReloadPage,
}: IFeedForm) => {
  const { STUColor } = useAppContext();
  const { t } = useTranslation();
  const [form, setForm] = useState<IFeedNew>({
    catalog_id: import.meta.env.ELVIRA_CATALOG_ID,
    url_name: uuid(),
    title: '',
    content: '',
    kind: 'acquisition',
  });
  const [feeds, setFeeds] = useState<IFeedsList | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [parentFeedId, setParentFeedId] = useState<string>('');
  const [searchParams] = useSearchParams();
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const getFeeds = useGetFeeds();
  const uploadFeed = useUploadFeed();
  const editFeed = useEditFeed();
  const getFeedDetail = useGetFeedDetail();

  // set title
  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.target.setCustomValidity('');
    setForm((prevForm) => ({
      ...prevForm, // Preserve existing properties of feedForm
      title: e.target.value,
    }));
  };
  // set conent
  const handleContentChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.target.setCustomValidity('');
    setForm((prevForm) => ({
      ...prevForm, // Preserve existing properties of feedForm
      content: e.target.value,
    }));
  };
  // set kind
  const handleKindChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setForm((prevForm) => ({
      ...prevForm, // Preserve existing properties of feedForm
      kind: e.target.value,
    }));
  };
  // set parent
  const handleParentChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setForm((prevForm) => ({
      ...prevForm, // Preserve existing properties of feedForm
      parents: e.target.value === 'none' ? [] : [e.target.value],
    }));
  };

  useCustomEffect(() => {
    const parentId = searchParams.get('parent-id') ?? '';
    if (parentId) {
      setParentFeedId(parentId);
      setForm((prevForm) => ({
        ...prevForm,
        parents: [parentId],
      }));
    }

    try {
      (async () => {
        setIsLoading(true);
        const parentFeeds = await getFeeds({
          paginate: false,
          parentId: 'null',
        });
        setFeeds(parentFeeds);
        setIsLoading(false);
      })();

      const loadFeedDetail = async () => {
        const { response } = await getFeedDetail(feedId!);

        setForm({
          catalog_id: response.catalog_id,
          url_name: response.url_name,
          title: response.title,
          content: response.content,
          parents: response.parents,
          kind: response.kind,
        });
      };

      if (feedId) loadFeedDetail();
    } catch {
      setOpen(false);
    }
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (feedId) {
        await editFeed(feedId, form);
        toast.success(t('notifications.feed.edit.success'));
      } else {
        await uploadFeed(form);
        toast.success(t('notifications.feed.add.success'));
      }

      setReloadPage(!reloadPage); // trigger refresh
    } catch {
      if (feedId) toast.error(t('notifications.feed.edit.error'));
      else toast.error(t('notifications.feed.add.error'));
    } finally {
      setOpen(false);
    }
  };

  return (
    <ModalWrapper
      title={
        feedId ? t('modal.feedForm.editFeed') : t('modal.feedForm.addFeed')
      }
      close={setOpen}
      buttonLabel={feedId ? t('modal.feedForm.edit') : t('modal.feedForm.add')}
      yes={() => {
        buttonRef.current?.click();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className='w-full h-full flex flex-col gap-5 items-start justify-start'
      >
        {/* Title */}
        <ElviraInput
          onChange={handleTitleChange}
          placeholder={t('modal.feedForm.title')}
          value={form.title}
          invalidMessage={t('modal.feedForm.requiredMessages.title')}
          required
        />
        {/* Content */}
        <ElviraInput
          onChange={handleContentChange}
          placeholder={t('modal.feedForm.content')}
          value={form.content}
          required
          invalidMessage={t('modal.feedForm.requiredMessages.content')}
        />
        {/* Kind */}
        <div className='flex w-full flex-col text-left'>
          <label htmlFor='selection-kind' className='text-sm pl-1'>
            {t('modal.feedForm.kind')}
          </label>
          <select
            id='selection-kind'
            defaultValue='acquistion'
            className='w-full rounded-md outline-none bg-transparent mt-2 cursor-pointer border p-2'
            onChange={handleKindChange}
          >
            <option value='acquisition'>
              {t('modal.feedForm.acquistion')}
            </option>
            <option value='navigation'>{t('modal.feedForm.navigation')}</option>
          </select>
        </div>
        {/* Parent */}
        {isLoading ? (
          <div className='w-full flex justify-center'>
            <CircleLoader color={STUColor} size={50} />
          </div>
        ) : (
          <div className='flex w-full flex-col text-left cursor-pointer'>
            <label htmlFor='selection-parent' className='text-sm pl-1'>
              {t('modal.feedForm.parent')}
            </label>
            <select
              id='selection-parent'
              defaultValue={parentFeedId ? parentFeedId : 'none'}
              className='w-full bg-transparent rounded-md outline-none mt-2 cursor-pointer border p-2'
              onChange={handleParentChange}
            >
              <option value='none'>{t('modal.feedForm.none')}</option>
              {feeds &&
                feeds.items.map((feed, index) => (
                  <option key={index} value={feed.id}>
                    {feed.title}
                  </option>
                ))}
            </select>
          </div>
        )}
        <button ref={buttonRef} type='submit' className='hidden'></button>
      </form>
    </ModalWrapper>
  );
};

export default FeedForm;
