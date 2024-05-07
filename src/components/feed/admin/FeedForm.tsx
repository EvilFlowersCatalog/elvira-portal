import {
  ChangeEvent,
  FormEvent,
  InvalidEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import CustomInput from '../../common/CustomInput';
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

interface IFeedForm {
  setOpen: (open: boolean) => void;
  feedId?: string | null;
}
const FeedForm = ({ setOpen, feedId = null }: IFeedForm) => {
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
      parents: e.target.value === 'none' ? undefined : [e.target.value],
    }));
  };

  // Validation
  const handleTitleInvalid = (e: InvalidEvent<HTMLInputElement>) => {
    e.target.setCustomValidity(t('modal.feedForm.requiredMessages.title'));
  };
  const handleContentInvalid = (e: InvalidEvent<HTMLInputElement>) => {
    e.target.setCustomValidity(t('modal.feedForm.requiredMessages.content'));
  };

  useEffect(() => {
    const parentId = searchParams.get('parent-id') ?? '';
    if (parentId) {
      setParentFeedId(parentId);
      setForm((prevForm) => ({
        ...prevForm,
        parents: [parentId],
      }));
    }

    const loadFeeds = async () => {
      setIsLoading(true);
      const parentFeeds = await getFeeds({
        page: 1,
        limit: 100,
        parentId: 'null',
      });
      setFeeds(parentFeeds);
      setIsLoading(false);
    };

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

    loadFeeds();
  }, []);

  const uploadOReditFeed = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (feedId) {
        await editFeed(feedId, form);
        toast.success(t('notifications.feed.edit.success'));
      } else {
        await uploadFeed(form);
        toast.success(t('notifications.feed.add.success'));
      }
    } catch {
      if (feedId) toast.error(t('notifications.feed.edit.error'));
      else console.log(t('notifications.feed.add.error'));
    } finally {
      // setRefreshPage(!refreshPage); // trigger refresh
    }
  };

  return (
    <ModalWrapper
      title={
        feedId ? t('modal.feedForm.editFeed') : t('modal.feedForm.addFeed')
      }
      setOpen={setOpen}
      buttonLabel={feedId ? t('modal.feedForm.edit') : t('modal.feedForm.add')}
      onClick={() => {
        buttonRef.current?.click();
      }}
    >
      <form
        onSubmit={uploadOReditFeed}
        className='w-[30vw] flex flex-col gap-5 items-start justify-start'
      >
        {/* Title */}
        <CustomInput
          onChange={handleTitleChange}
          placeholder={t('modal.feedForm.title')}
          value={form.title}
          onInvalid={handleTitleInvalid}
          required
        />
        {/* Content */}
        <CustomInput
          onChange={handleContentChange}
          placeholder={t('modal.feedForm.content')}
          value={form.content}
          required
          onInvalid={handleContentInvalid}
        />
        {/* Kind */}
        <div className='flex w-full flex-col text-left text-white'>
          <label htmlFor='selection-kind' className='text-sm pl-2'>
            {t('modal.feedForm.kind')}
          </label>
          <select
            id='selection-kind'
            defaultValue='acquistion'
            className='w-full border-gray border-2 bg-darkGray rounded-md outline-none p-2 cursor-pointer'
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
          <div className='flex w-full flex-col text-left text-white cursor-pointer'>
            <label htmlFor='selection-parent' className='text-sm pl-2'>
              {t('parent')}
            </label>
            <select
              id='selection-parent'
              defaultValue={parentFeedId ? parentFeedId : undefined}
              className='w-full border-gray border-2 bg-darkGray rounded-md outline-none p-2 cursor-pointer'
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
