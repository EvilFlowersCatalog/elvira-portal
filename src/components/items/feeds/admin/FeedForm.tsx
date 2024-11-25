import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import useAppContext from '../../../../hooks/contexts/useAppContext';
import { useTranslation } from 'react-i18next';
import { IFeedNew } from '../../../../utils/interfaces/feed';
import { uuid } from '../../../../utils/func/functions';
import { useSearchParams } from 'react-router-dom';
import useUploadFeed from '../../../../hooks/api/feeds/useUploadFeed';
import useEditFeed from '../../../../hooks/api/feeds/useEditFeed';
import useGetFeedDetail from '../../../../hooks/api/feeds/useGetFeedDetail';
import { toast } from 'react-toastify';
import ModalWrapper from '../../../../components/modal/ModalWrapper';
import ElviraInput from '../../../../components/inputs/ElviraInput';
import ElviraSelect from '../../../inputs/ElviraSelect';
import FeedAutofill from '../../../autofills/FeedAutofill';
import { MdRemoveCircle } from 'react-icons/md';

interface IFeedForm {
  setOpen: (open: boolean) => void;
  feedId?: string | null;
  reloadPage?: boolean;
  setReloadPage?: (reloadPage: boolean) => void;
}
const FeedForm = ({
  setOpen,
  feedId = null,
  reloadPage,
  setReloadPage,
}: IFeedForm) => {
  const { t } = useTranslation();
  const { stuBg, stuText, umamiTrack } = useAppContext();

  const [form, setForm] = useState<IFeedNew>({
    catalog_id: import.meta.env.ELVIRA_CATALOG_ID,
    url_name: uuid(),
    title: '',
    content: '',
    kind: 'acquisition',
    parents: [],
  });
  const [searchParams] = useSearchParams();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [parentFeeds, setParentFeeds] = useState<{
    feeds: { title: string; id: string }[];
  }>({ feeds: [] });

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

  // set parent feed
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      parents: parentFeeds.feeds.map((feed) => feed.id),
    }));
  }, [parentFeeds]);

  useEffect(() => {
    try {
      if (feedId) {
        (async () => {
          const { response } = await getFeedDetail(feedId);

          if (response.parents) {
            const details = await Promise.all(
              response.parents.map((id) => getFeedDetail(id))
            );

            const parents: { feeds: { title: string; id: string }[] } = {
              feeds: [],
            };
            details.map(({ response }) => {
              parents.feeds.push({ id: response.id, title: response.title });
            });

            setParentFeeds(parents);
          }

          setForm({
            catalog_id: response.catalog_id,
            url_name: response.url_name,
            title: response.title,
            content: response.content,
            kind: response.kind,
          });
        })();
      }
    } catch {
      setOpen(false);
    }
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (feedId) {
        umamiTrack('Upload Edited Feed Button', {
          feedId,
        });
        await editFeed(feedId, form);
        toast.success(t('notifications.feed.edit.success'));
      } else {
        umamiTrack('Upload Created Feed Button');
        await uploadFeed(form);
        toast.success(t('notifications.feed.add.success'));
      }

      setReloadPage && setReloadPage(!reloadPage); // trigger refresh
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
        className='w-full h-full min-h-80 flex flex-col gap-5 items-start justify-start'
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

        {/* Parent */}
        <FeedAutofill
          entryForm={parentFeeds}
          setEntryForm={setParentFeeds}
          placeholder='Parent feeds'
          kind='navigation'
        />
        <div className={`flex flex-wrap w-full`}>
          {parentFeeds.feeds.map((feed, index) => (
            <div className='w-full md:w-1/2 lg:w-1/3 flex p-1' key={index}>
              <button
                type='button'
                className={`${stuBg} p-2 text-sm hover:bg-red flex w-full gap-2 justify-between items-center text-white rounded-md`}
                onClick={() => {
                  setParentFeeds((prev) => ({
                    feeds: prev.feeds.filter(
                      (prevFeed) => prevFeed.id !== feed.id
                    ),
                  }));
                }}
              >
                {feed.title}
                <MdRemoveCircle size={15} />
              </button>
            </div>
          ))}
        </div>

        {/* Kind */}
        <div className='flex w-full flex-col text-left'>
          <label htmlFor='selection-kind' className={`text-sm pl-1 ${stuText}`}>
            {t('modal.feedForm.kind')}
          </label>
          <ElviraSelect
            name='selection-kind'
            value={form.kind}
            onChange={handleKindChange}
          >
            <option value='acquisition'>
              {t('modal.feedForm.acquistion')}
            </option>
            <option value='navigation'>{t('modal.feedForm.navigation')}</option>
          </ElviraSelect>
        </div>
        <button ref={buttonRef} type='submit' className='hidden'></button>
      </form>
    </ModalWrapper>
  );
};

export default FeedForm;
