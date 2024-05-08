import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import {
  IUserAcquisition,
  IUserAcquisitionShare,
} from '../../utils/interfaces/acquisition';
import useCreateUserAcquisition from '../../hooks/api/acquisitiions/useCreateUserAcquisition';
import {
  IZotero,
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

const rootId = 'pdf-viewer-page';

const Viewer = () => {
  const { lang, theme, STUColor, titleLogoDark, titleLogoLight } =
    useAppContext();
  const { 'entry-id': id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createUserAcquisition = useCreateUserAcquisition();
  const getEntryDetail = useGetEntryDetail();
  const getUserAcquisition = useGetUserAcquisition();
  const [loading, setLoading] = useState<boolean>(true);

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
    const readPdf = async () => {
      try {
        const { response: entryDetail } = await getEntryDetail(id!);
        const responseAcquisitionId = entryDetail.acquisitions[0].id;

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

        const zotero: IZotero = {
          title: entryDetail.title,
          authors: entryDetail.authors
            .map((author) => author.name + ', ' + author.surname)
            .join('; '),
          firstPage: 1,
          publisher: entryDetail.publisher,
          doi: entryDetail.identifiers.doi,
          isbn: entryDetail.identifiers.isbn,
          year: entryDetail.year,
          pdfUrl: userAcquisition.url,
        };

        // Get pdf
        const { response: pdf } = await getUserAcquisition(
          userAcquisition.id,
          'base64'
        );

        updateMetaTag('citation_title', zotero.title);
        if (zotero.year) updateMetaTag('citation_year', zotero.year);
        if (zotero.journalTitle)
          updateMetaTag('citation_journal_title', zotero.journalTitle);
        if (zotero.firstPage)
          updateMetaTag('citation_first_page', zotero.firstPage.toString());
        if (zotero.lastPage)
          updateMetaTag('citation_last_page', zotero.lastPage.toString());
        if (zotero.publisher)
          updateMetaTag('citation_publisher', zotero.publisher);
        if (zotero.doi) updateMetaTag('citation_doi', zotero.doi);
        if (zotero.isbn) updateMetaTag('citation_isbn', zotero.isbn);
        if (zotero.abstract)
          updateMetaTag('citation_abstract', zotero.abstract);
        updateMetaTag('citation_authors', zotero.authors);
        updateMetaTag('citation_pdf_url', zotero.pdfUrl);

        // Render viewer and set options
        renderViewer(rootId, pdf.data, {
          citationBib: entryDetail.citation,
          lang,
          theme,
          homeFunction,
          shareFunction,
          zotero: zotero,
        });
      } catch {
        navigate(NAVIGATION_PATHS.home, { replace: true });
        toast.error(t('notifications.fileFailed'));
      } finally {
        setLoading(false);
      }
    };

    if (id) readPdf();

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

  return (
    <>
      {loading && (
        <div
          className={
            'fixed top-0 bottom-0 left-0 right-0 bg-gray bg-opacity-80 z-50 flex flex-col gap-10 justify-center items-center'
          }
        >
          <img
            className='w-96'
            src={theme === THEME_TYPE.dark ? titleLogoLight : titleLogoDark}
          />
          <CircleLoader color={STUColor} size={100} />
        </div>
      )}
      <div id={rootId}></div>
    </>
  );
};

export default Viewer;
