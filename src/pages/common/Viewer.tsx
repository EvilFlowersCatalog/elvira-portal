import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import {
  IUserAcquisition,
  IUserAcquisitionShare,
} from '../../utils/interfaces/acquisition';
import useCreateUserAcquisition from '../../hooks/api/acquisitiions/useCreateUserAcquisition';
import {
  NAVIGATION_PATHS,
  THEME_TYPE,
} from '../../utils/interfaces/general/general';
import useGetEntryDetail from '../../hooks/api/entries/useGetEntryDetail';
import useGetUserAcquisition from '../../hooks/api/acquisitiions/useGetUserAcquisition';
// @ts-ignore
import { renderViewer } from '@evilflowers/evilflowersviewer';
import useAppContext from '../../hooks/contexts/useAppContext';
import { toast } from 'react-toastify';
import { updateMetaTag } from '../../utils/func/functions';
import { CircleLoader } from 'react-spinners';
import useCustomEffect from '../../hooks/useCustomEffect';
import useAuthContext from '../../hooks/contexts/useAuthContext';

const rootId = 'pdf-viewer-page';

const Viewer = () => {
  const { lang, theme, titleLogoDark, titleLogoLight } = useAppContext();
  const { auth } = useAuthContext();
  const { 'entry-id': id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createUserAcquisition = useCreateUserAcquisition();
  const getEntryDetail = useGetEntryDetail();
  const getUserAcquisition = useGetUserAcquisition();
  const [loading, setLoading] = useState<boolean>(true);
  const [progressBar, setProgressBar] = useState<number>(0);

  let acquisition_id = '';

  const shareFunction = async (pages: string | null, expireDate: string) => {
    // creat share user acquistion object
    const userAcquisitionShare: IUserAcquisitionShare = {
      acquisition_id,
      range: pages ?? '',
      type: 'shared',
      expires_at: expireDate,
    };

    try {
      const { response: response } = await createUserAcquisition(
        userAcquisitionShare
      );

      // Return given url
      return response.url;
    } catch {
      // return empty string
      return '';
    }
  };

  // Home function for viewer to navigate home
  const homeFunction = () => {
    navigate(NAVIGATION_PATHS.home);
  };

  useCustomEffect(() => {
    if (!id) return;

    (async () => {
      try {
        setProgressBar(30);
        const { response: entryDetail } = await getEntryDetail(id!);
        const responseAcquisitionId = entryDetail.acquisitions[0].id;

        setProgressBar(50);

        // Set acquistion id for usage in share
        acquisition_id = responseAcquisitionId;

        // Create acquisiton
        const acquisition: IUserAcquisition = {
          acquisition_id: responseAcquisitionId,
          type: 'personal',
        };

        // Create user acquisition by given acquistion
        const { response: userAcquisition } = await createUserAcquisition(
          acquisition
        );

        // Update metatags
        if (entryDetail.published_at)
          updateMetaTag('citation_year', entryDetail.published_at);
        if (entryDetail.publisher)
          updateMetaTag('citation_publisher', entryDetail.publisher);
        if (entryDetail.identifiers.doi)
          updateMetaTag('citation_doi', entryDetail.identifiers.doi);
        if (entryDetail.identifiers.isbn)
          updateMetaTag('citation_isbn', entryDetail.identifiers.isbn);
        if (entryDetail.authors.length > 0)
          updateMetaTag(
            'citation_authors',
            entryDetail.authors
              .map((author) => author.name + ', ' + author.surname)
              .join('; ')
          );

        updateMetaTag('citation_title', entryDetail.title);
        updateMetaTag('citation_first_page', '1');
        updateMetaTag(
          'citation_pdf_url',
          userAcquisition.url + `?access_token=${auth?.token}`
        );

        setProgressBar(70);

        // Get pdf
        const { data } = await getUserAcquisition(userAcquisition.id);
        setProgressBar(90);

        const pdf = await data;

        // Render viewer and set options
        renderViewer(rootId, pdf, {
          citationBib: entryDetail.citation,
          lang,
          theme,
          homeFunction,
          shareFunction,
        });
      } catch {
        navigate(NAVIGATION_PATHS.home, { replace: true });
        toast.error(t('notifications.fileFailed'));
      } finally {
        setProgressBar(100);
      }
    })();

    return () => {
      const metaTags = [
        'citation_title',
        'citation_year',
        'citation_journal_title',
        'citation_first_page',
        'citation_last_page',
        'citation_publisher',
        'citation_doi',
        'citation_isbn',
        'citation_abstract',
        'citation_authors',
        'citation_pdf_url',
      ];

      metaTags.forEach((name) => {
        updateMetaTag(name, '');
      });
    };
  }, [id]);

  // If everything loaded set to false
  useCustomEffect(() => {
    if (progressBar === 100) {
      setTimeout(() => setLoading(false), 500);
    }
  }, [progressBar]);

  return (
    <>
      {loading && (
        <div
          className={
            'fixed top-0 bottom-0 left-0 right-0 bg-white dark:bg-gray bg-opacity-80 dark:bg-opacity-80 z-50 flex flex-col gap-10 justify-center items-center'
          }
        >
          <img
            className='w-96'
            src={theme === THEME_TYPE.dark ? titleLogoLight : titleLogoDark}
            alt='Elvira Logo'
          />
          <div className='w-[90%] max-w-96 h-4 bg-zinc-300 dark:bg-strongDarkGray rounded-md overflow-hidden'>
            <div
              className='h-full bg-STUColor duration-500 rounded-md'
              style={{ width: `${progressBar}%` }}
            ></div>
          </div>
        </div>
      )}
      <div id={rootId}></div>
    </>
  );
};

export default Viewer;
