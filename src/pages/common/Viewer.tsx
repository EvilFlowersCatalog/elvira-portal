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
import EntryDetail from "../../components/items/entry/details/EntryDetail";
import useGetUserAcquisition from "../../hooks/api/acquisitiions/user-acquistions/useGetUserAcquisition";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import renderViewer from "@evilflowers/evilflowersviewer";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import viewerStyles from "@evilflowers/evilflowersviewer/dist/style.css?inline";
import type {
  IChatContext,
  IChatMessage,
  IChatStreamHandlers,
  IChatSummary,
  IPageBookmark,
} from "@evilflowers/evilflowersviewer";
import useAppContext from "../../hooks/contexts/useAppContext";
import { toast } from "react-toastify";
import { updateMetaTag, withAccessToken } from "../../utils/func/functions";
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
import useExplainPassage from "../../hooks/api/assistant/useExplainPassage";
import useStartChat from "../../hooks/api/assistant/useStartChat";
import useSendChatMessage from "../../hooks/api/assistant/useSendChatMessage";
import useGetUserChats from "../../hooks/api/assistant/useGetUserChats";
import useGetChatHistory from "../../hooks/api/assistant/useGetChatHistory";
import useDeleteChat from "../../hooks/api/assistant/useDeleteChat";
import { formatRetryAfter, toAssistantError } from "../../hooks/api/assistant/assistantApi";
import { useQueryClient } from "@tanstack/react-query";


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

// Fields the viewer reads after 0.7.0; harmless for older versions.
type ChatHandlersWithPages = IChatStreamHandlers & { onPages?: (pages: number[]) => void };
type ChatMessageWithPages = IChatMessage & { pages?: number[] };

const rootId = "elvira-viewer-app";

// Title of the annotation that acts as the page-bookmark container.
const PAGE_BOOKMARKS_TITLE = "__page_bookmarks__";

const Viewer = () => {
  const { lang, theme, titleLogoDark, titleLogoLight, aiChatId, clearAiChat } = useAppContext();
  const { auth } = useAuthContext();
  const { "entry-id": id, index } = useParams();
  const { t } = useTranslation();
  const location = useLocation();
  const [loading, setLoading] = useState<boolean>(true);
  const [progressBar, setProgressBar] = useState<number>(0);
  // Where the reader was opened from. Kept from mount: opening a dialog here
  // rewrites the URL and drops the navigation state.
  const [origin] = useState(
    location.state as { from?: string; catalogId?: string; fromPath?: string } | null
  );
  const [entryCatalogId, setEntryCatalogId] = useState<string | null>(
    origin?.catalogId || null
  );

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const addToShelf = useAddToShelf();
  const removeFromShelf = useRemoveFromShelf();
  const createUserAcquisition = useCreateUserAcquisition();
  const { getEntryDetail } = useGetEntryDetail();
  const getUserAcquisition = useGetUserAcquisition();
  const explainPassage = useExplainPassage();
  const startChat = useStartChat();
  const sendChatMessage = useSendChatMessage();
  const getUserChats = useGetUserChats();
  const getChatHistory = useGetChatHistory();
  const deleteChat = useDeleteChat();
  const queryClient = useQueryClient();
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
    navigate(origin?.fromPath || NAVIGATION_PATHS.home);
  };
  const closeFunction = () => {
    const base = origin?.from === "shelf" ? NAVIGATION_PATHS.shelf : NAVIGATION_PATHS.library;
    // Reopen the detail on top of the search/filters the reader was opened from.
    const [fromPathname, fromSearch = ''] = origin?.fromPath?.split('?') ?? [];
    const params = new URLSearchParams(fromPathname === base ? fromSearch : '');
    if (id) params.set('entry-detail-id', id);
    if (entryCatalogId) params.set('entry-catalog-id', entryCatalogId);

    navigate(`${base}?${params.toString()}`);
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

  // No `suggestionsFunction`: the catalog has no recommendation backend yet,
  // and leaving it out hides the viewer's "Podobné" and suggestion popups.


  // Shipped feature — deliberately not behind ELVIRA_EXPERIMENTAL_FEATURES
  // (false on elvira.stuba.sk), which used to hide "Vysvetliť" in production.
  const explainFunction = async (
    selectedText: string,
    context?: { page?: number }
  ): Promise<IExplainResult> =>
    explainPassage({
      user_acquisition_id,
      text: selectedText,
      page: context?.page,
      language: lang,
    });

  // --- Reading chat ---------------------------------------------------------
  // The viewer's chat is stored as an ordinary assistant chat, bound to this
  // copy of the book, so it shows up in the portal's chat history too and can
  // be continued from there (and the other way round).

  // Recommended publications arrive as ids; the viewer renders full cards.
  const toSuggestedEntries = async (ids: string[]): Promise<ISuggestedEntry[]> => {
    const details = await Promise.all(
      ids.map((entryId) => getEntryDetail(entryId).catch(() => null))
    );
    return details
      .filter((detail): detail is NonNullable<typeof detail> => detail != null)
      .map((detail) => ({
        id: detail.id,
        catalog_id: detail.catalog_id,
        title: detail.title,
        authors: detail.authors.map((author) => ({ name: author.name, surname: author.surname })),
        thumbnail: withAccessToken(detail.thumbnail, auth?.token) ?? detail.thumbnail,
        shelf_record_id: detail.shelf_record_id ?? null,
      }));
  };

  const chatErrorText = (err: unknown) => {
    const { status, message: detail, retryAfter } = toAssistantError(err);
    switch (status) {
      case 429: {
        const wait = formatRetryAfter(retryAfter);
        return wait
          ? t("assistant.errors.rateLimited", { retryAfter: wait })
          : t("assistant.errors.rateLimitedNoWait");
      }
      case 403:
        return detail || t("assistant.errors.forbidden");
      case 404:
        return t("assistant.errors.chatNotFound");
      case 401:
        return t("assistant.errors.unauthorized");
      default:
        return t("assistant.errors.generic");
    }
  };

  const sendChatMessageFunc = async (
    message: string,
    contexts: IChatContext[],
    handlers: IChatStreamHandlers,
    meta: { page: number; chatId: string | null }
  ): Promise<{ chatId: string } | void> => {
    let chatId = meta.chatId;
    try {
      if (!chatId) {
        const chat = await startChat({
          entry_id: id,
          user_acquisition_id,
          catalog_id: entryCatalogId || import.meta.env.ELVIRA_CATALOG_ID || undefined,
        });
        chatId = chat.id;
      }

      const pending: Promise<void>[] = [];
      await sendChatMessage(
        chatId,
        message,
        {
          onChunk: handlers.onChunk,
          onMessage: handlers.onMessage,
          onEntries: (ids) => {
            if (ids.length) pending.push(toSuggestedEntries(ids).then(handlers.onEntries));
          },
          // `onPages` is new in the viewer after 0.7.0; older ones leave it out.
          onPages: (pages) => (handlers as ChatHandlersWithPages).onPages?.(pages),
          onError: (detail) => handlers.onError(detail || t("assistant.errors.generic")),
          onDone: () => {},
        },
        { contexts, page: meta.page, userAcquisitionId: user_acquisition_id }
      );
      await Promise.all(pending);
      queryClient.invalidateQueries({ queryKey: ["user-chats"] });
      return { chatId };
    } catch (err) {
      handlers.onError(chatErrorText(err));
      // A deleted chat cannot be continued; the next message starts a new one.
      if (toAssistantError(err).status !== 404 && chatId) return { chatId };
    }
  };

  const getChatsFunc = async (): Promise<IChatSummary[]> => {
    const { items } = await getUserChats({ limit: 50 });
    return items.map((chat) => ({
      id: chat.id,
      title: chat.title || t("assistant.untitledChat"),
      updatedAt: chat.last_message_at ?? chat.created_at,
      messageCount: chat.message_count,
      aboutThisBook: chat.entry_id === id,
    }));
  };

  const getChatFunc = async (chatId: string): Promise<IChatMessage[]> => {
    const chat = await getChatHistory(chatId);
    return Promise.all(
      chat.messages.map(async (msg): Promise<ChatMessageWithPages> => ({
        id: msg.id,
        role: msg.role,
        text: msg.text,
        contexts: msg.contexts ?? undefined,
        pages: msg.pages_read ?? undefined,
        entries: msg.displayed_entries?.length
          ? await toSuggestedEntries(msg.displayed_entries)
          : undefined,
        status: "done" as const,
      }))
    );
  };

  const deleteChatFunc = async (chatId: string) => {
    await deleteChat(chatId);
    // The portal assistant must not keep sending into a deleted chat.
    if (aiChatId === chatId) clearAiChat();
    queryClient.invalidateQueries({ queryKey: ["user-chats"] });
  };

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
          citation_pdf_url: withAccessToken(userAcquisition.url, auth?.token),
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

        const initialPageOption = { initialPage: Number(searchParams.get("page")) || undefined };

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
            explainFunction,
            chatPackage: {
              sendMessageFunc: sendChatMessageFunc,
              getChatsFunc,
              getChatFunc,
              deleteChatFunc,
            },
            // Opens at the page a chat citation pointed to. Spread because
            // `initialPage` is new in the viewer after 0.7.0, which ignores it.
            ...initialPageOption,
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
