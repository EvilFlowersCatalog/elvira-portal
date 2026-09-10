import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { IUserAcquisitionShare } from "../../utils/interfaces/acquisition";
import useCreateUserAcquisition from "../../hooks/api/acquisitiions/user-acquistions/useCreateUserAcquisition";
import {
  NAVIGATION_PATHS,
  THEME_TYPE,
} from "../../utils/interfaces/general/general";
import useGetEntryDetail from "../../hooks/api/entries/useGetEntryDetail";
import useGetEntries from "../../hooks/api/entries/useGetEntries";
import EntryDetail from "../../components/items/entry/details/EntryDetail";
import useGetUserAcquisition from "../../hooks/api/acquisitiions/user-acquistions/useGetUserAcquisition";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import renderViewer from "@evilflowers/evilflowersviewer";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import viewerStyles from "@evilflowers/evilflowersviewer/dist/style.css?inline";
import type { IPageBookmark } from "@evilflowers/evilflowersviewer";
import useAppContext from "../../hooks/contexts/useAppContext";
import { toast } from "react-toastify";
import { updateMetaTag } from "../../utils/func/functions";
import useAuthContext from "../../hooks/contexts/useAuthContext";
import useGetAnotations from "../../hooks/api/anotations/useGetAnotations";
import useGetAnotationItem from "../../hooks/api/anotations/anotation-items/useGetAnotationItem";
import useCreateAnotation from "../../hooks/api/anotations/useCreateAnotation";
import useDeleteAnotation from "../../hooks/api/anotations/useDeleteAnotation";
import useUpdateAnotation from "../../hooks/api/anotations/useUpdateAnotation";
import useUpdateAnotationItem from "../../hooks/api/anotations/anotation-items/useUpdateAnotationItem";
import useCreateAnotationItem from "../../hooks/api/anotations/anotation-items/useCreateAnotationItem";
import useDeleteAnotationItem from "../../hooks/api/anotations/anotation-items/useDeleteAnotationItem";
import useAddToShelf from "../../hooks/api/my-shelf/useAddToShelf";
import useRemoveFromShelf from "../../hooks/api/my-shelf/useRemoveFromShelf";


interface ISuggestedEntry {
  id: string;
  catalog_id: string;
  title: string;
  authors: { name: string; surname: string }[];
  thumbnail: string;
  shelf_record_id?: string | null;
}
interface IExplainResult {
  simple: string;
  examples: { label: string; description: string }[];
}

const rootId = "elvira-viewer-app";

// Title of the annotation that acts as the page-bookmark container.
const PAGE_BOOKMARKS_TITLE = "__page_bookmarks__";

const Viewer = () => {
  const { lang, theme, titleLogoDark, titleLogoLight } = useAppContext();
  const { auth } = useAuthContext();
  const { "entry-id": id, index } = useParams();
  const { t } = useTranslation();
  const location = useLocation();
  const [loading, setLoading] = useState<boolean>(true);
  const [progressBar, setProgressBar] = useState<number>(0);
  const [entryCatalogId, setEntryCatalogId] = useState<string | null>(
    (location.state as { catalogId?: string })?.catalogId || null
  );

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const addToShelf = useAddToShelf();
  const removeFromShelf = useRemoveFromShelf();
  const createUserAcquisition = useCreateUserAcquisition();
  const { getEntryDetail } = useGetEntryDetail();
  const getEntries = useGetEntries();
  const getUserAcquisition = useGetUserAcquisition();
  const getAnotations = useGetAnotations();
  const updateAnotation = useUpdateAnotation();
  const createAnotation = useCreateAnotation();
  const deleteAnotation = useDeleteAnotation();
  const getAnotationsItem = useGetAnotationItem();
  const updateAnotationItem = useUpdateAnotationItem();
  const createAnotationItem = useCreateAnotationItem();
  const deleteAnotationItem = useDeleteAnotationItem();

  let acquisition_id = "";
  let user_acquisition_id = "";

  const shareFunction = async (pages: string | null, expireDate: string) => {
    // creat share user acquistion object
    const userAcquisitionShare: IUserAcquisitionShare = {
      acquisition_id,
      range: pages ?? "",
      type: "shared",
      expires_at: expireDate,
    };

    try {
      const response = await createUserAcquisition(userAcquisitionShare);

      // Return given url
      return response.url;
    } catch {
      // return empty string
      return "";
    }
  };
  // Home function for viewer to navigate back to where the reader was opened from, or home if unknown
  const homeFunction = () => {
    const fromPath = (location.state as { fromPath?: string })?.fromPath;
    navigate(fromPath || NAVIGATION_PATHS.home);
  };
  const closeFunction = () => {
    const catalogParam = entryCatalogId ? `&entry-catalog-id=${entryCatalogId}` : '';
    const path =
      location.state?.from === "shelf"
        ? `${NAVIGATION_PATHS.shelf}?entry-detail-id=${id}${catalogParam}`
        : `${NAVIGATION_PATHS.library}?entry-detail-id=${id}${catalogParam}`;

    navigate(path);
  };

  // Mirrors EntryItem.tsx's openEntryDetail — same modal, same query params.
  const openEntryDetailFunction = (entry: ISuggestedEntry) => {
    const params = new URLSearchParams(searchParams);
    params.set("entry-detail-id", entry.id);
    params.set("entry-catalog-id", entry.catalog_id);
    setSearchParams(params);
  };

  const bookmarkToggleFunction = async (entry: ISuggestedEntry) => {
    try {
      if (entry.shelf_record_id != null) {
        await removeFromShelf(entry.shelf_record_id);
        toast.success(t("notifications.myShelf.remove.success"));
        entry.shelf_record_id = null;
        document.dispatchEvent(
          new CustomEvent("shelf-updated", {
            detail: { id: entry.id, isOnShelf: false },
          })
        );
        return { isOnShelf: false, shelfRecordId: null };
      }

      const created = await addToShelf(entry.id);
      toast.success(t("notifications.myShelf.add.success"));
      entry.shelf_record_id = created.response.id;
      document.dispatchEvent(
        new CustomEvent("shelf-updated", {
          detail: {
            id: entry.id,
            isOnShelf: true,
            shelf_record_id: created.response.id,
          },
        })
      );
      return { isOnShelf: true, shelfRecordId: created.response.id };
    } catch {
      toast.error(
        t(
          entry.shelf_record_id != null
            ? "notifications.myShelf.remove.error"
            : "notifications.myShelf.add.error"
        )
      );
      throw new Error("bookmark-toggle-failed");
    }
  };

  const suggestionsFunction =
    import.meta.env.ELVIRA_EXPERIMENTAL_FEATURES === "true"
      ? async (kind: string): Promise<ISuggestedEntry[]> => {
          const pageByKind: Record<string, number> = {
            similar: 1,
            prerequisite: 2,
            advanced: 3,
          };
          const { items } = await getEntries({
            page: pageByKind[kind] ?? 1,
            limit: 4,
          });
          return items.map((entry) => ({
            id: entry.id,
            catalog_id: entry.catalog_id,
            title: entry.title,
            authors: entry.authors,
            thumbnail: `${entry.thumbnail}?access_token=${auth?.token}`,
            shelf_record_id: entry.shelf_record_id,
          }));
        }
      : undefined;


  const explainFunction =
    import.meta.env.ELVIRA_EXPERIMENTAL_FEATURES === "true"
      ? async (selectedText: string): Promise<IExplainResult> => ({
          simple: `Jednoducho: ${selectedText}`,
          examples: [
            { label: "Príklad", description: `Kontext pre: ${selectedText}` },
          ],
        })
      : undefined;

  const saveLayerFunc = async (
    svg: string,
    groupId: string,
    page: number
  ): Promise<{ id: string; svg: string } | null> => {
    try {
      const response = await createAnotationItem({
        annotation_id: groupId,
        page,
        content: svg,
      });
      // toast within editor only  notifications.editPage.layer.save.success
      return { id: response.id, svg: response.content };
    } catch {
      toast.error(t("notifications.editPage.layer.save.error"));
      return null;
    }
  };
  const saveGroupFunc = async (name: string): Promise<{ response: { id: string } }> => {
    try {
      const response = await createAnotation({
        user_acquisition_id,
        title: name,
      });
      // toast within editor only notifications.editPage.group.add.success
      return { response: { id: response.id } };
    } catch {
      toast.error(t("notifications.editPage.group.add.error"));
      return { response: { id: "" } };
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
      // toast within editor only notifications.editPage.layer.edit.error.success
    } catch {
      toast.error(t("notifications.editPage.layer.edit.error"));
    }
  };
  const updateGroupFunc = async (id: string, name: string) => {
    try {
      await updateAnotation(id, { title: name });
      // toast within editor only notifications.editPage.group.edit.success
    } catch {
      toast.error(t("notifications.editPage.group.edit.error"));
    }
  };
  const deleteLayerFunc = async (id: string) => {
    try {
      await deleteAnotationItem(id);
      // toast within editor only notifications.editPage.layer.delete.success
    } catch {
      toast.error(t("notifications.editPage.layer.delete.error"));
    }
  };
  const deleteGroupFunc = async (id: string) => {
    try {
      await deleteAnotation(id);
      // toast within editor only notifications.editPage.group.remove.success
    } catch {
      toast.error(t("notifications.editPage.group.remove.error"));
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
  // --- Page bookmarks -------------------------------------------------------
  // One dedicated annotation per user acquisition holds an item per bookmarked
  // page (`content: true`) — a page is bookmarked iff its item exists.
  let bookmarksAnotationId: string | null = null;
  let bookmarksAnotationRequest: Promise<string | null> | null = null;

  const findBookmarksAnotation = async (): Promise<string | null> => {
    if (bookmarksAnotationId) return bookmarksAnotationId;

    const { items } = await getAnotations(user_acquisition_id);
    bookmarksAnotationId =
      items.find((item) => item.title === PAGE_BOOKMARKS_TITLE)?.id ?? null;

    return bookmarksAnotationId;
  };

  const ensureBookmarksAnotation = async (): Promise<string | null> => {
    if (bookmarksAnotationId) return bookmarksAnotationId;

    if (!bookmarksAnotationRequest) {
      bookmarksAnotationRequest = (async () => {
        const existing = await findBookmarksAnotation();
        if (existing) return existing;

        const created = await createAnotation({
          user_acquisition_id,
          title: PAGE_BOOKMARKS_TITLE,
        });
        bookmarksAnotationId = created.id;
        return created.id;
      })().finally(() => {
        bookmarksAnotationRequest = null;
      });
    }

    return bookmarksAnotationRequest;
  };

  const getPageBookmarksFunc = async (): Promise<IPageBookmark[]> => {
    try {
      const anotationId = await findBookmarksAnotation();
      if (!anotationId) return [];

      const bookmarks: IPageBookmark[] = [];
      let apiPage = 1;
      let apiPages = 1;

      do {
        const { items, metadata } = await getAnotationsItem(anotationId, null, {
          page: apiPage,
          limit: 100,
        });
        items.forEach((item) => bookmarks.push({ page: item.page, id: item.id }));
        apiPages = metadata?.pages ?? 1;
        apiPage += 1;
      } while (apiPage <= apiPages);

      return bookmarks;
    } catch {
      return [];
    }
  };

  const addPageBookmarkFunc = async (
    page: number
  ): Promise<IPageBookmark | null> => {
    try {
      const anotationId = await ensureBookmarksAnotation();
      if (!anotationId) return null;

      const response = await createAnotationItem({
        annotation_id: anotationId,
        page,
        content: true,
      });

      return { page, id: response.id };
    } catch {
      return null;
    }
  };

  const removePageBookmarkFunc = async (page: number, id?: string | null) => {
    try {
      if (id) {
        await deleteAnotationItem(id);
        return;
      }

      const anotationId = await findBookmarksAnotation();
      if (!anotationId) return;

      const { items } = await getAnotationsItem(anotationId, page);
      await Promise.all(items.map((item) => deleteAnotationItem(item.id)));
    } catch {
      // Non-fatal: the viewer keeps its optimistic state either way.
    }
  };

  const getGroupsFunc = async (): Promise<{ id: string; name: string }[]> => {
    try {
      const { items } = await getAnotations(user_acquisition_id);
      // The page-bookmark container is an annotation too — keep it out of the
      // editor's group list.
      return items
        .filter((item) => item.title !== PAGE_BOOKMARKS_TITLE)
        .map((item) => {
          return { id: item.id, name: item.title };
        });
    } catch {
      return [];
    }
  };

  useEffect(() => {
    if (!id) return;

    // The viewer library now ships fully self-scoped styles — every rule lives
    // under its own `.efv-viewer` root class and its global preflight is
    // disabled — so we inject the stylesheet as-is. No manual `#rootId { … }`
    // wrapping (which broke @font-face/@tailwind at-rules) is needed anymore.
    const styleElement = document.createElement("style");
    styleElement.id = "pdf-viewer-styles";
    styleElement.textContent = viewerStyles;
    document.head.insertBefore(styleElement, document.head.firstChild);

    let viewerApp: { unmount: () => void } | undefined;
    let cancelled = false;

    (async () => {
      try {
        setProgressBar(30);

        // Fetch entry details and process acquisition
        console.log(entryCatalogId);
        const entryDetail = await getEntryDetail(id!, entryCatalogId || undefined);
        // Cache catalog_id from entry for subsequent operations
        if (entryDetail.catalog_id && !entryCatalogId) {
          setEntryCatalogId(entryDetail.catalog_id);
        }
        const userAcquisition = await createUserAcquisition({
          acquisition_id: entryDetail.acquisitions[parseInt(index || "0")].id,
          type: "personal",
        });

        acquisition_id = entryDetail.acquisitions[parseInt(index || "0")].id;
        user_acquisition_id = userAcquisition.id;
        setProgressBar(50);

        // Update metatags if properties exist
        const metaTagUpdates = {
          citation_year: entryDetail.published_at,
          citation_publisher: entryDetail.publisher,
          citation_doi: entryDetail.identifiers.doi,
          citation_isbn: entryDetail.identifiers.isbn,
          citation_authors: entryDetail.authors
            .map((author) => `${author.name}, ${author.surname}`)
            .join("; "),
          citation_title: entryDetail.title,
          citation_first_page: "1",
          citation_pdf_url: `${userAcquisition.url}?access_token=${auth?.token}`,
        };

        Object.entries(metaTagUpdates).forEach(([key, value]) => {
          if (value) updateMetaTag(key, value);
        });

        setProgressBar(70);

        // Fetch the PDF data
        const { data } = await getUserAcquisition(userAcquisition.id);
        const pdf = await data;

        setProgressBar(90);

        if (cancelled) return;

        // Render viewer with the provided options and configurations
        viewerApp = renderViewer({
          rootId: `#${rootId}`,
          data: pdf,
          options: {
            theme,
            lang,
            citationBib: entryDetail.citation,
            closeFunction,
            homeFunction,
            shareFunction,
            openEntryDetailFunction,
            bookmarkToggleFunction,
            suggestionsFunction,
            explainFunction,
            editPackage: {
              saveLayerFunc,
              saveGroupFunc,
              updateLayerFunc,
              getLayerFunc,
              getGroupsFunc,
            },
          pageBookmarkPackage: {
            getBookmarksFunc: getPageBookmarksFunc,
            addBookmarkFunc: addPageBookmarkFunc,
            removeBookmarkFunc: removePageBookmarkFunc,
          },
          },
          config: {
            download: entryDetail.config.evilflowers_metadata_fetch,
            share: entryDetail.config.evilflowers_share_enabled,
            print: entryDetail.config.evilflowers_viewer_print,
            edit: entryDetail.config.evilflowers_annotations_create,
          },
        });
      } catch (error) {
        navigate(NAVIGATION_PATHS.home, { replace: true });
        toast.error(t("notifications.fileFailed"));
      } finally {
        setProgressBar(100);
      }
    })();

    return () => {
      cancelled = true;
      viewerApp?.unmount();

      // Remove the scoped styles
      const styleElement = document.getElementById("pdf-viewer-styles");
      if (styleElement) {
        styleElement.remove();
      }

      const metaTags = [
        "citation_title",
        "citation_year",
        "citation_journal_title",
        "citation_first_page",
        "citation_last_page",
        "citation_publisher",
        "citation_doi",
        "citation_isbn",
        "citation_abstract",
        "citation_authors",
        "citation_pdf_url",
      ];

      metaTags.forEach((name) => {
        updateMetaTag(name, "");
      });
    };
  }, [id]);

  // If everything loaded set to false
  useEffect(() => {
    if (progressBar === 100) {
      setTimeout(() => setLoading(false), 500);
    }
  }, [progressBar]);

  return (
    <>
      {loading && (
        <div
          className={
            "fixed top-0 bottom-0 left-0 right-0 bg-white dark:bg-darkGray bg-opacity-80 dark:bg-opacity-80 z-50 flex flex-col gap-10 justify-center items-center"
          }
        >
          <img
            className="w-52 md:w-96"
            src={theme === THEME_TYPE.dark ? titleLogoLight : titleLogoDark}
            alt="Elvira Logo"
          />
          <div className="w-[80%] max-w-96 h-4 bg-zinc-300 dark:bg-strongDarkGray rounded-md overflow-hidden">
            <div
              className={`h-full bg-primary duration-500 rounded-md`}
              style={{ width: `${progressBar}%` }}
            ></div>
          </div>
        </div>
      )}
      <div id={rootId}></div>
      {/* ItemContainer (which normally hosts this) isn't rendered on this
          route, so entry-detail-id/entry-catalog-id search params set from
          the viewer's suggestion cards had nowhere to be picked up. */}
      <EntryDetail triggerReload={null} />
    </>
  );
};

export default Viewer;
