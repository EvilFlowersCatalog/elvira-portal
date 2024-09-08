import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import {
  IUserAcquisition,
  IUserAcquisitionShare,
} from '../../utils/interfaces/acquisition';
import useCreateUserAcquisition from '../../hooks/api/acquisitiions/user-acquistions/useCreateUserAcquisition';
import {
  NAVIGATION_PATHS,
  THEME_TYPE,
} from '../../utils/interfaces/general/general';
import useGetEntryDetail from '../../hooks/api/entries/useGetEntryDetail';
import useGetUserAcquisition from '../../hooks/api/acquisitiions/user-acquistions/useGetUserAcquisition';
// @ts-ignore
import { renderViewer } from '@evilflowers/evilflowersviewer';
import useAppContext from '../../hooks/contexts/useAppContext';
import { toast } from 'react-toastify';
import { updateMetaTag } from '../../utils/func/functions';
import useCustomEffect from '../../hooks/useCustomEffect';
import useAuthContext from '../../hooks/contexts/useAuthContext';
import useGetAnotations from '../../hooks/api/anotations/useGetAnotations';
import useGetAnotationItem from '../../hooks/api/anotations/anotation-items/useGetAnotationItem';
import useCreateAnotation from '../../hooks/api/anotations/useCreateAnotation';
import useDeleteAnotation from '../../hooks/api/anotations/useDeleteAnotation';
import useUpdateAnotation from '../../hooks/api/anotations/useUpdateAnotation';
import useUpdateAnotationItem from '../../hooks/api/anotations/anotation-items/useUpdateAnotationItem';
import useCreateAnotationItem from '../../hooks/api/anotations/anotation-items/useCreateAnotationItem';
import useDeleteAnotationItem from '../../hooks/api/anotations/anotation-items/useDeleteAnotationItem';

const rootId = 'pdf-viewer-page';

const Viewer = () => {
  const { lang, theme, titleLogoDark, titleLogoLight } = useAppContext();
  const { auth } = useAuthContext();
  const { 'entry-id': id, index } = useParams();
  const { t } = useTranslation();
  const [loading, setLoading] = useState<boolean>(true);
  const [progressBar, setProgressBar] = useState<number>(0);

  const navigate = useNavigate();
  const createUserAcquisition = useCreateUserAcquisition();
  const getEntryDetail = useGetEntryDetail();
  const getUserAcquisition = useGetUserAcquisition();
  const getAnotations = useGetAnotations();
  const updateAnotation = useUpdateAnotation();
  const createAnotation = useCreateAnotation();
  const deleteAnotation = useDeleteAnotation();
  const getAnotationsItem = useGetAnotationItem();
  const updateAnotationItem = useUpdateAnotationItem();
  const createAnotationItem = useCreateAnotationItem();
  const deleteAnotationItem = useDeleteAnotationItem();

  let acquisition_id = '';
  let user_acquisition_id = '';

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
  const saveLayerFunc = async (
    svg: string,
    groupId: string,
    page: number
  ): Promise<{ id: string; svg: string } | null> => {
    try {
      const { response } = await createAnotationItem({
        annotation_id: groupId,
        page,
        content: svg,
      });
      toast.success(t('notifications.editPage.layer.save.success'));
      return { id: response.id, svg: response.content };
    } catch {
      toast.error(t('notifications.editPage.layer.save.error'));
      return null;
    }
  };
  const saveGroupFunc = async (name: string) => {
    try {
      await createAnotation({
        user_acquisition_id,
        title: name,
      });
      toast.success(t('notifications.editPage.group.add.success'));
    } catch {
      toast.error(t('notifications.editPage.group.add.error'));
    }
  };
  const updateLayerFunc = async (
    id: string,
    svg: string,
    groupId: string,
    page: number
  ) => {
    try {
      await updateAnotationItem(id, {
        annotation_id: groupId,
        page,
        content: svg,
      });
      toast.success(t('notifications.editPage.layer.edit.success'));
    } catch {
      toast.error(t('notifications.editPage.layer.edit.error'));
    }
  };
  const updateGroupFunc = async (id: string, name: string) => {
    try {
      await updateAnotation(id, { title: name });
      toast.success(t('notifications.editPage.group.edit.success'));
    } catch {
      toast.error(t('notifications.editPage.group.edit.error'));
    }
  };
  const deleteLayerFunc = async (id: string) => {
    try {
      await deleteAnotationItem(id);
      toast.success(t('notifications.editPage.layer.delete.success'));
    } catch {
      toast.error(t('notifications.editPage.layer.delete.error'));
    }
  };
  const deleteGroupFunc = async (id: string) => {
    try {
      await deleteAnotation(id);
      toast.success(t('notifications.editPage.group.remove.success'));
    } catch {
      toast.error(t('notifications.editPage.group.remove.error'));
    }
  };
  const getLayerFunc = async (
    page: number,
    groupId: string
  ): Promise<{ id: string; svg: string } | null> => {
    try {
      const { items } = await getAnotationsItem(groupId, page);

      if (items) return { id: items[0].id, svg: items[0].content };
      return null;
    } catch {
      return null;
    }
  };
  const getGroupsFunc = async (): Promise<{ id: string; name: string }[]> => {
    try {
      const { items } = await getAnotations(user_acquisition_id);
      if (items.length > 0)
        return items.map((item) => {
          return { id: item.id, name: item.title };
        });
      return [];
    } catch {
      return [];
    }
  };

  useCustomEffect(() => {
    if (!id) return;

    (async () => {
      try {
        setProgressBar(30);
        const { response: entryDetail } = await getEntryDetail(id!);
        const responseAcquisitionId =
          entryDetail.acquisitions[parseInt(index || '0')].id;

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

        user_acquisition_id = userAcquisition.id;

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
        renderViewer({
          rootId,
          data: pdf,
          options: {
            theme,
            lang,
            citationBib: entryDetail.citation,
            homeFunction,
            shareFunction,
            editPackage: {
              saveLayerFunc,
              saveGroupFunc,
              updateLayerFunc,
              updateGroupFunc,
              deleteLayerFunc,
              deleteGroupFunc,
              getLayerFunc,
              getGroupsFunc,
            },
          },
          config: {
            download: entryDetail.config.evilflowres_metadata_fetch,
            share: entryDetail.config.evilflowers_share_enabled,
            print: entryDetail.config.evilflowers_viewer_print,
            edit: entryDetail.config.evilflowers_annotations_create,
          },
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
