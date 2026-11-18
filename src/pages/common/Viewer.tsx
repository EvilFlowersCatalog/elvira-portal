import { config, viewerLoading } from '@/lib/config';
import { EVENTS, measure, track, trackOutcome } from '@/lib/analytics';
import {
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { IUserAcquisitionShare } from "../../utils/interfaces/acquisition";
import useCreateUserAcquisition from "../../hooks/api/acquisitiions/user-acquistions/useCreateUserAcquisition";
import { NAVIGATION_PATHS } from "../../utils/interfaces/general/general";
import useGetEntryDetail from "../../hooks/api/entries/useGetEntryDetail";
import useEntryDialog from "../../hooks/useEntryDialog";
import { absoluteUrl, entryPath, readerPath, type ReaderPanel } from "@/lib/links/paths";
import { takeReaderSession } from "../../routes/readerSession";
import { notReadableHere, resolveReaderFile, type IReaderRouteData } from "../../routes/loaders";
import { cachedReaderBook } from "../../components/viewer/readerBook";
import { httpStatus } from "../../hooks/api/entries/entryQueries";
import { withRememberedSearch } from "../../utils/func/listSearch";
import useReaderUrlSync from "../../hooks/useReaderUrlSync";
import type { ILocator } from "../../utils/interfaces/locator";
import useGetUserAcquisition from "../../hooks/api/acquisitiions/user-acquistions/useGetUserAcquisition";
import useGetUserAcquisitionInfo from "../../hooks/api/acquisitiions/user-acquistions/useGetUserAcquisitionInfo";
import useGetRegions from "../../hooks/api/acquisitiions/user-acquistions/useGetRegions";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import renderViewer from "@evilflowers/evilflowersviewer";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import viewerStyles from "@evilflowers/evilflowersviewer/dist/style.css?inline";
import type { IAnotationQuad } from "../../utils/interfaces/anotations";
import type {
  IAgentAnnotation,
  IAgentHighlight,
  IChatContext,
  IChatMessage,
  IChatStreamHandlers,
  IChatSummary,
  IPageBookmark,
} from "@evilflowers/evilflowersviewer";
import useAppContext from "../../hooks/contexts/useAppContext";
import { toast } from "react-toastify";
import useAuthContext from "../../hooks/contexts/useAuthContext";
import { FALLBACK_SRC } from "../../components/items/entry/Thumbnail";
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
import useSimilarEntries from "../../hooks/api/entries/useSimilarEntries";
import { useEntriesByIdsFetcher } from "../../hooks/api/entries/useEntriesByIds";
import useAgentHighlights, { toViewer as toViewerAnnotation } from "../../hooks/api/assistant/useAgentHighlights";
import { formatRetryAfter, toAssistantError } from "../../hooks/api/assistant/assistantApi";
import { activityLabelKey, statusLabelKey } from "../../utils/func/assistantMessages";
import type { IAssistantCitation, IAssistantToolActivity } from "../../utils/interfaces/assistant";
import useOpenCitation from "../../hooks/api/assistant/useOpenCitation";
import type { IViewerLocationState } from "../../hooks/api/assistant/useOpenInViewer";
import { useQueryClient } from "@tanstack/react-query";
import useReaderPage from "../../hooks/useReaderPage";
import ExplainedElsewhere from "../../components/viewer/ExplainedElsewhere";
import ReaderLoader, { type IReaderLoaderBook } from "../../components/viewer/ReaderLoader";
import { useFeature } from "../../features/features";


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

/**
 * The viewer's `IChatCitation`, declared here so the build passes against a viewer that lacks it. The IP-030
 * fields (paragraph box, sentence quads, quote, figure crop) go along; a viewer that does not know them ignores them.
 */
type ViewerCitation = {
  label: string;
  entryId: string;
  title?: string;
  page?: number;
  section?: string;
  kind?: string;
  paragraphId?: string;
  regionId?: string;
  bbox?: IAssistantCitation["bbox"];
  quads?: IAssistantCitation["quads"];
  sentencePage?: number;
  quote?: string;
  caption?: string;
  imageUrl?: string;
  readable?: boolean;
  locatorKey?: string;
};

const toViewerCitation = (citation: IAssistantCitation): ViewerCitation => ({
  label: citation.label,
  entryId: citation.entry_id,
  title: citation.title,
  page: citation.page,
  section: citation.section,
  kind: citation.kind,
  paragraphId: citation.paragraph_id,
  regionId: citation.region_id,
  bbox: citation.bbox,
  quads: citation.quads,
  sentencePage: citation.sentence_page,
  quote: citation.quote,
  caption: citation.caption,
  imageUrl: citation.image_url,
  readable: citation.readable,
  locatorKey: citation.locator_key,
});

const fromViewerCitation = (citation: ViewerCitation): IAssistantCitation => ({
  label: citation.label,
  entry_id: citation.entryId,
  title: citation.title,
  page: citation.page,
  section: citation.section,
  kind: citation.kind,
  paragraph_id: citation.paragraphId,
  region_id: citation.regionId,
  bbox: citation.bbox,
  quads: citation.quads,
  sentence_page: citation.sentencePage,
  locator_key: citation.locatorKey,
});

/**
 * Where the viewer reads the PDF from (EvilFlowersViewer `IDocumentSource`), declared here so the build
 * passes against viewer 0.7.9, which has `url`/`httpHeaders`/`rangeChunkSize` but not `streaming`.
 * The viewer's `streaming` means range-only loading (no background fetch), i.e. the portal's `autoFetch` off.
 */
type ViewerSource = {
  data?: Uint8Array;
  url?: string;
  httpHeaders?: Record<string, string>;
  rangeChunkSize?: number;
  streaming?: boolean;
};

/**
 * The viewer's host controller (EvilFlowersViewer#153/#154, docs/host-integration.md), declared here with
 * the parts the portal uses so the build passes against viewers that lack some of them; each is optional.
 */
// Method syntax on purpose: its parameters are checked bivariantly, so the viewer's narrower types
// (`VIEWER_PANEL`, its typed event map) still satisfy this host-side view of the controller.
export type ViewerController = {
  open(source: ViewerSource, at?: { initialPage?: number | null }): void;
  getState(): { page: number; search?: { query?: string | null } | null };
  goToPage?(page: number): void;
  goToLabel?(label: string): Promise<number | null> | number | null;
  openPanel?(panel: ReaderPanel | null): void;
  search?(query: string, options?: { openPanel?: boolean }): unknown;
  on?<T = unknown>(event: string, listener: (payload: T) => void): () => void;
};

/** What `renderViewer` returns; `viewer` (the host controller) exists from EvilFlowersViewer#153 on. */
type ViewerApp = {
  unmount: () => void;
  viewer?: ViewerController;
};

type DocumentErrorInfo = {
  stage: "download" | "parse" | "render";
  reason?: string;
  status?: number | null;
  source?: string;
};

type FirstPageInfo = {
  page: number;
  durationMs: number;
  source?: string;
  bytesLoaded?: number | null;
  totalBytes?: number | null;
};

/** The longest the reader's loading screen waits for the first painted page before stepping aside. */
const READER_LOADER_MAX_MS = 45_000;

/** A signed content URL (`?exp=&sig=`, EvilFlowersCatalog#214): 403 once it has expired. */
const isSigned = (url?: string) => !!url && /[?&]sig=/.test(url);

/** React Router's index of the current history entry (0 = the first page of this tab). */
const historyIndex = () => (window.history.state as { idx?: number } | null)?.idx ?? 0;

/**
 * The reader (`/entries/:entryId/read`), mounted by routes/ReaderShell with the route loader's answer: one
 * per publication file.
 */
const Viewer = ({ route }: { route: IReaderRouteData }) => {
  const { lang, theme, aiChatId, clearAiChat } = useAppContext();
  const { auth } = useAuthContext();
  const id = route.entryId;
  const { t } = useTranslation();
  const location = useLocation();
  const queryClientForCover = useQueryClient();
  // One loading screen from the click to the first painted page (ReaderLoader); it also covers the
  // viewer's own spinner. `leaving` fades it out, `gone` unmounts it. The cover shows at once: the
  // route loader has put the publication in the cache.
  const [loaderBook, setLoaderBook] = useState<IReaderLoaderBook | null>(() => cachedReaderBook(queryClientForCover, id));
  const [loaderStage, setLoaderStage] = useState<"preparing" | "opening">("preparing");
  const [loaderPhase, setLoaderPhase] = useState<"shown" | "leaving" | "gone">("shown");
  const loading = loaderPhase !== "gone";
  const revealReader = () => setLoaderPhase((phase) => (phase === "shown" ? "leaving" : phase));
  // A chat citation without a locator may bring the sentence boxes as navigation state: an enrichment only.
  // Everything else is in the URL, so a refresh or a copied link opens the same place.
  const [origin] = useState(location.state as IViewerLocationState | null);
  const [entryCatalogId, setEntryCatalogId] = useState<string | null>(route.catalogId);
  // The history entry the reader was opened on: leaving goes back past the reader's own page jumps.
  const [enteredAt] = useState(historyIndex);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const entryDialog = useEntryDialog();
  const attachUrlSync = useReaderUrlSync();
  const addToShelf = useAddToShelf();
  const removeFromShelf = useRemoveFromShelf();
  const createUserAcquisition = useCreateUserAcquisition();
  const { getEntryDetail } = useGetEntryDetail();
  const { getSimilarToPassage } = useSimilarEntries();
  const fetchEntriesByIds = useEntriesByIdsFetcher();
  const getUserAcquisition = useGetUserAcquisition();
  const getUserAcquisitionInfo = useGetUserAcquisitionInfo();
  const explainPassage = useExplainPassage();
  const startChat = useStartChat();
  const sendChatMessage = useSendChatMessage();
  const getUserChats = useGetUserChats();
  const getChatHistory = useGetChatHistory();
  const deleteChat = useDeleteChat();
  const { getAgentAnnotations, waitForAgentAnnotation, requestAgentAnnotation } = useAgentHighlights();
  const getRegions = useGetRegions();
  const openCitation = useOpenCitation();
  const queryClient = useQueryClient();
  const getAnotations = useGetAnotations();
  const updateAnotation = useUpdateAnotation();
  const createAnotation = useCreateAnotation();
  const deleteAnotation = useDeleteAnotation();
  const getAnotationsItem = useGetAnotationItem();
  const updateAnotationItem = useUpdateAnotationItem();
  const createAnotationItem = useCreateAnotationItem();
  const deleteAnotationItem = useDeleteAnotationItem();
  // The library graph panels (#41, #43) follow the graph feature, like the Chapters tab.
  const graphPanels = useFeature("graph");
  // Explain and the in-reader chat need the assistant (Administration › Features).
  const assistantOn = useFeature("assistant");
  const { page: readerPage, onPageChange: onReaderPageChange } = useReaderPage(rootId);

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
  /**
   * Leave the reader for the page it was opened from, exactly as it was (list, filters, an open dialog),
   * by stepping back past the reader's own entries (page jumps). Opened from outside the portal (a shared
   * link, a new tab), there is nothing to go back to: `fallback` instead.
   */
  const leaveReader = (fallback: string) => {
    if (enteredAt > 0) navigate(-(historyIndex() - enteredAt + 1));
    else navigate(fallback, { replace: true });
  };
  // Home (the viewer's top-left): back where the reader came from, else the library as it was left.
  const homeFunction = () => leaveReader(withRememberedSearch(NAVIGATION_PATHS.library));
  // Close: back where the reader came from, else the publication's page.
  const closeFunction = () => leaveReader(entryPath(id, { catalogId: entryCatalogId }));

  // A recommended publication opens in the one publication dialog, over the reader.
  const openEntryDetailFunction = (entry: ISuggestedEntry) => entryDialog.open(entry.id, { catalogId: entry.catalog_id });

  /**
   * "Copy link" in the viewer (EvilFlowersViewer#155): an address, not a share. It grants nothing and opens
   * the same page for anyone who can already read the publication; giving access is Share (`shareFunction`).
   */
  const linkFunction = async (target: { page: number }) =>
    absoluteUrl(readerPath(id, { file: route.file, page: target.page, catalogId: entryCatalogId }));

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

  // "Podobné" (IP-018 Phase 8): publications whose paragraphs discuss the
  // selection, or the book as a whole without one. Only `similar` has a backend;
  // the other kinds stay empty.
  const suggestionsFunction = async (
    kind: string,
    context?: { selectedText?: string; page?: number }
  ): Promise<ISuggestedEntry[]> => {
    if (kind !== "similar") return [];
    try {
      const similar = await getSimilarToPassage(user_acquisition_id, context?.selectedText ?? "");
      return await toSuggestedEntries(similar.map((item) => item.entry_id));
    } catch {
      return [];
    }
  };


  // Shipped feature — deliberately not behind ELVIRA_EXPERIMENTAL_FEATURES
  // (false on elvira.stuba.sk), which used to hide "Vysvetliť" in production.
  const explainFunction = async (
    selectedText: string,
    context?: { page?: number }
  ): Promise<IExplainResult> => {
    // A reader action in Umami and Faro (#59); never the selected text.
    track('Reader Explain', { entry_id: id, page: context?.page });
    return explainPassage({
      user_acquisition_id,
      text: selectedText,
      page: context?.page,
      language: lang,
    });
  };

  // --- Reading chat ---------------------------------------------------------
  // The viewer's chat is stored as an ordinary assistant chat, bound to this
  // copy of the book, so it shows up in the portal's chat history too and can
  // be continued from there (and the other way round).

  // Recommended publications arrive as ids; the viewer renders full cards.
  // One `?id=` request for all of them (#14), not a detail call per id.
  const toSuggestedEntries = async (ids: string[]): Promise<ISuggestedEntry[]> => {
    const details = await fetchEntriesByIds(ids).catch(() => []);
    return details
      .map((detail) => ({
        id: detail.id,
        catalog_id: detail.catalog_id,
        title: detail.title,
        authors: detail.authors.map((author) => ({ name: author.name, surname: author.surname })),
        // Verbatim cover URL (public, cacheable). The viewer's <img> has no
        // fallback of its own, so an entry without a cover gets the placeholder.
        thumbnail: detail.thumbnail ?? FALLBACK_SRC,
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
          catalog_id: entryCatalogId || config.ELVIRA_CATALOG_ID || undefined,
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
          onPages: (pages) => handlers.onPages?.(pages),
          // Evidence labels `[E3]` (IP-024); viewers without `onCitations` ignore it.
          onCitations: (citations) =>
            (handlers as { onCitations?: (c: ViewerCitation[]) => void }).onCitations?.(
              citations.map(toViewerCitation)
            ),
          // Viewer 0.7.6+: AI highlights the assistant started from the chat.
          onAnnotation: (annotation) =>
            (handlers as { onAnnotation?: (a: IAgentAnnotation) => void }).onAnnotation?.(
              toViewerAnnotation(annotation)
            ),
          // Progress line until text streams (IP-022); the viewer shows it once its chat
          // panel takes `onStatus(label)`, older viewers ignore it.
          onStatus: (state, tool) =>
            (handlers as { onStatus?: (label: string) => void }).onStatus?.(t(statusLabelKey(state, tool))),
          // The tool-call log (viewer with `onActivity`); the label comes translated, ids never shown.
          onActivity: (call) =>
            (handlers as { onActivity?: (activity: IAssistantToolActivity & { label: string }) => void }).onActivity?.({
              ...call,
              label: t(activityLabelKey(call.tool)),
            }),
          onError: (detail) => handlers.onError(detail || t("assistant.errors.generic")),
          onDone: () => {},
        },
        { contexts, page: meta.page, userAcquisitionId: user_acquisition_id, language: lang }
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
      chat.messages.map(async (msg): Promise<IChatMessage> => ({
        id: msg.id,
        role: msg.role,
        text: msg.text,
        contexts: msg.contexts ?? undefined,
        pages: msg.pages_read ?? undefined,
        ...(msg.citations?.length ? { citations: msg.citations.map(toViewerCitation) } : {}),
        entries: msg.displayed_entries?.length
          ? await toSuggestedEntries(msg.displayed_entries)
          : undefined,
        ...(msg.annotations?.length ? { annotationIds: msg.annotations } : {}),
        // Viewer with an activity log reads it back from history; older viewers ignore it.
        ...(msg.activity?.length
          ? {
              activities: msg.activity.map((call) => ({
                ...call,
                label: t(activityLabelKey(call.tool)),
                done: true,
              })),
            }
          : {}),
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
  // --- Reader highlights ----------------------------------------------------
  // "Zvýrazniť" in the viewer's selection menu: one annotation of kind
  // `highlight` per user acquisition, an item per highlight with its text and
  // line boxes, listed beside the AI highlights (IP-018).
  let highlightsAnotationId: string | null = null;
  let highlightsAnotationRequest: Promise<string> | null = null;

  const findHighlightsAnotation = async (): Promise<string | null> => {
    if (highlightsAnotationId) return highlightsAnotationId;
    const { items } = await getAnotations(user_acquisition_id);
    highlightsAnotationId = items.find((item) => item.kind === "highlight")?.id ?? null;
    return highlightsAnotationId;
  };

  const ensureHighlightsAnotation = (): Promise<string> => {
    if (!highlightsAnotationRequest) {
      highlightsAnotationRequest = (async () => {
        const existing = await findHighlightsAnotation();
        if (existing) return existing;
        const created = await createAnotation({
          user_acquisition_id,
          title: t("assistant.myHighlights"),
          kind: "highlight",
        });
        highlightsAnotationId = created.id;
        return created.id;
      })().finally(() => {
        highlightsAnotationRequest = null;
      });
    }
    return highlightsAnotationRequest;
  };

  const toReaderHighlight = (item: {
    id: string;
    page?: number;
    text?: string | null;
    quads?: IAnotationQuad[] | null;
  }): IAgentHighlight => ({
    id: item.id,
    seq: 0,
    page: item.page ?? 1,
    quads: item.quads ?? [],
    text: item.text ?? "",
  });

  const getReaderHighlightsFunc = async (): Promise<IAgentHighlight[]> => {
    try {
      const anotationId = await findHighlightsAnotation();
      if (!anotationId) return [];
      const { items } = await getAnotationsItem(anotationId, null, { limit: 1000 });
      return items.filter((item) => item.quads?.length).map(toReaderHighlight);
    } catch {
      return [];
    }
  };

  const addReaderHighlightFunc = async (highlight: {
    page: number;
    text: string;
    quads: IAnotationQuad[];
  }): Promise<IAgentHighlight> => {
    const anotationId = await ensureHighlightsAnotation();
    // `content` keeps the item drawable by anything that only reads SVG.
    const rects = highlight.quads
      .map(
        (q) =>
          `<rect x="${q.x0}" y="${q.y0}" width="${q.x1 - q.x0}" height="${q.y1 - q.y0}"/>`
      )
      .join("");
    const created = await createAnotationItem({
      annotation_id: anotationId,
      page: highlight.page,
      content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><g fill="#eab308" fill-opacity="0.35">${rects}</g></svg>`,
      text: highlight.text,
      quads: highlight.quads,
    });
    return toReaderHighlight({ ...highlight, ...created });
  };

  const deleteReaderHighlightFunc = async (highlightId: string) => {
    await deleteAnotationItem(highlightId);
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
          kind: "bookmarks",
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
      // Only the drawing layer: agent annotations have their own layer and
      // bookmarks are a container, not a group.
      return items
        .filter((item) => (item.kind ?? "drawing") === "drawing")
        .filter((item) => item.title !== PAGE_BOOKMARKS_TITLE)
        .map((item) => {
          return { id: item.id, name: item.title };
        });
    } catch {
      return [];
    }
  };

  // Agent highlights (IP-018): the assistant marks passages in the reader's copy.
  const getAgentAnnotationsFunc = async (): Promise<IAgentAnnotation[]> => {
    try {
      return await getAgentAnnotations(user_acquisition_id);
    } catch {
      return [];
    }
  };

  const requestAgentAnnotationFunc = (prompt: string) => {
    // A reader action in Umami and Faro (#59); never the prompt.
    track('Reader Highlight', { entry_id: id, source: 'viewer' });
    return requestAgentAnnotation(user_acquisition_id, prompt, lang);
  };

  const waitForAgentAnnotationFunc = (annotationId: string) => waitForAgentAnnotation(annotationId);

  const deleteAgentHighlightFunc = async (_annotationId: string, highlightId: string) => {
    await deleteAnotationItem(highlightId);
  };

  const deleteAgentAnnotationFunc = async (annotationId: string) => {
    await deleteAnotation(annotationId);
  };

  // Extracted figures, tables and equations (IP-018); no extraction means no regions.
  const getRegionsFunc = async (page: number) => {
    try {
      return await getRegions(user_acquisition_id, page);
    } catch {
      return [];
    }
  };

  // Every region of the copy, for the viewer's contents "Figures" tab.
  const getAllRegionsFunc = async () => {
    try {
      return await getRegions(user_acquisition_id);
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
    // Appended last: the portal's own Tailwind emits utilities with the same
    // names (`.dark .dark:text-gray-300` on <body class="dark">) at the same
    // specificity as the viewer's scoped ones, and the later stylesheet wins.
    document.head.appendChild(styleElement);

    let viewerApp: ViewerApp | undefined;
    let detachUrlSync: () => void = () => {};
    let revealTimer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    // Start of the reader's wait for the first page (the `viewer` measurement).
    const openedAt = performance.now();

    // The address the reader was opened with (later changes are the reader's own, see useReaderUrlSync).
    const opened = {
      page: Number(searchParams.get("page")) || undefined,
      loc: searchParams.get("loc"),
      r: searchParams.get("r"),
      q: searchParams.get("q"),
      panel: searchParams.get("panel"),
      label: searchParams.get("label"),
    };

    (async () => {
      try {
        // The publication is in the cache (the route loader resolved the file from it); the personal copy
        // and the locator were started by the loader in parallel with this chunk (routes/readerSession).
        // With an expired token the loader left all of it to here, after the auth guard's refresh.
        const entryDetail = await getEntryDetail(id, entryCatalogId || undefined);
        const resolved = route.resolved ?? resolveReaderFile(entryDetail, route.file);
        if (!resolved) {
          if (cancelled) return;
          notReadableHere();
          navigate(entryPath(id, { catalogId: entryDetail.catalog_id }), { replace: true });
          return;
        }
        const session = takeReaderSession(id, resolved.acquisitionId, opened.loc);
        if (!cancelled) {
          setLoaderBook({
            title: entryDetail.title,
            authors: entryDetail.authors.map((author) => `${author.name} ${author.surname}`.trim()).join(", "),
            thumbnail: entryDetail.thumbnail,
          });
        }
        if (entryDetail.catalog_id && !entryCatalogId) {
          setEntryCatalogId(entryDetail.catalog_id);
        }

        // A passage link (`loc`, the durable citation of #46): re-resolved against the current extraction on
        // every open, so a refresh or a shared link highlights the same sentence even after reprocessing.
        let locator: ILocator | null = null;
        if (session.locator) {
          try {
            locator = await session.locator;
          } catch (error) {
            if (httpStatus(error) === 403) {
              // Not readable for this reader (IP range, content policy): the publication, where the reason is.
              if (!cancelled) navigate(entryPath(id, { catalogId: entryCatalogId }), { replace: true });
              return;
            }
            toast.error(t("cite.failed"));
          }
          if (locator?.resolution === "relocated") toast.info(t("cite.relocated"));
          else if (locator?.resolution === "page_only") toast.info(t("cite.pageOnly"));
        }

        const userAcquisition = await session.copy;
        if (cancelled) return;

        acquisition_id = resolved.acquisitionId;
        user_acquisition_id = userAcquisition.id;

        // Where the PDF comes from (#63). Streaming: the viewer range-loads a URL and paints the first
        // page before the last byte. Otherwise the whole file is downloaded here first, as before.
        const loading = viewerLoading();
        let source: ViewerSource;
        if (loading.streaming) {
          const signedUrl = userAcquisition.stream_url || undefined;
          source = signedUrl
            ? // Signed and reusable (EvilFlowersCatalog#214): no Authorization header, so no preflight
              // and no token expiring mid-book.
              { url: signedUrl, rangeChunkSize: loading.rangeChunkSize, streaming: !loading.autoFetch }
            : {
                // A catalog without stream_url: Bearer header. Auto-fetch stays on whatever the setting,
                // so the whole file is in before a long read outlives the token.
                url: new URL(`/data/v1/user-acquisitions/${userAcquisition.id}`, config.ELVIRA_BASE_URL).toString(),
                httpHeaders: auth?.token ? { Authorization: `Bearer ${auth.token}` } : undefined,
                rangeChunkSize: loading.rangeChunkSize,
                streaming: false,
              };
        } else {
          const { data } = await getUserAcquisition(userAcquisition.id);
          source = { data: (await data) as Uint8Array };
        }
        const sourceKind = source.url ? "url" : "data";

        // An expired signature (403) is renewed once per open: the acquisition hands out a fresh
        // stream_url and the viewer reopens at the reader's page.
        let renewed = false;
        const renewStreamUrl = async (status?: number | null) => {
          if (renewed || cancelled || status !== 403 || !isSigned(source.url) || !viewerApp?.viewer) return false;
          renewed = true;
          try {
            const fresh = await getUserAcquisitionInfo(user_acquisition_id);
            if (!fresh.stream_url || cancelled) return false;
            const page = viewerApp.viewer.getState().page;
            source = { ...source, url: fresh.stream_url };
            viewerApp.viewer.open(source, { initialPage: page || undefined });
            return true;
          } catch {
            return false;
          }
        };

        if (cancelled) return;
        setLoaderStage("opening");

        // Render viewer with the provided options and configurations. The result is read through the
        // host's own view of the controller (ViewerController): the parts used here, each optional, so the
        // portal builds against the npm release and the develop viewer alike.
        const rendered = renderViewer({
          rootId: `#${rootId}`,
          ...source,
          options: {
            theme,
            lang,
            citationBib: entryDetail.citation,
            closeFunction,
            homeFunction,
            shareFunction,
            // EvilFlowersViewer#155; a viewer without it ignores the key.
            ...{ linkFunction },
            openEntryDetailFunction,
            bookmarkToggleFunction,
            suggestionsFunction,
            // Without the assistant the viewer gets neither function and shows no "Explain" or chat
            // (Administration › Features). Spread so the build passes whichever keys the viewer marks required.
            ...(assistantOn
              ? {
                  explainFunction,
                  chatPackage: {
                    sendMessageFunc: sendChatMessageFunc,
                    getChatsFunc,
                    getChatFunc,
                    deleteChatFunc,
                    // Evidence citations (IP-024): this book jumps to the page, others open here.
                    // Spread so the build passes against a viewer whose IChatPackage lacks the keys.
                    ...{
                      entryId: id,
                      openCitationFunc: (citation: ViewerCitation) => openCitation(fromViewerCitation(citation)),
                    },
                  },
                }
              : {}),
            // Opens where the address says: a passage's page (`loc`), else `page`.
            initialPage: locator?.page || opened.page,
            // ...at the cited passage or figure (IP-030): outline `bbox`, flash `quads`, then fade. From the
            // locator when the link has one (survives refresh and re-extraction), else from a chat citation's
            // navigation state, else a region id (`r`) the viewer outlines by itself.
            ...(locator && locator.resolution !== "page_only" && (locator.bbox || locator.quads?.length)
              ? {
                  initialFocus: {
                    page: locator.page,
                    bbox: locator.bbox ?? undefined,
                    quads: locator.quads ?? undefined,
                  },
                }
              : origin?.target || opened.r
                ? {
                    initialFocus: {
                      page: opened.page,
                      paragraphId: origin?.target?.paragraphId,
                      regionId: origin?.target?.regionId ?? opened.r ?? undefined,
                      bbox: origin?.target?.bbox,
                      quads: origin?.target?.quads,
                      quadsPage: origin?.target?.quadsPage,
                    },
                  }
                : {}),
            editPackage: {
              saveLayerFunc,
              saveGroupFunc,
              updateLayerFunc,
              getLayerFunc,
              getGroupsFunc,
            },
          // AI highlight layers are the assistant's (`/assistant/v1/highlights`): none without it.
          ...(assistantOn
            ? {
                agentAnnotationPackage: {
                  getAnnotationsFunc: getAgentAnnotationsFunc,
                  requestAnnotationFunc: requestAgentAnnotationFunc,
                  waitForAnnotationFunc: waitForAgentAnnotationFunc,
                  deleteHighlightFunc: deleteAgentHighlightFunc,
                  deleteAnnotationFunc: deleteAgentAnnotationFunc,
                },
              }
            : {}),
          // Viewer 0.7.3+; older viewers ignore it. Spread so the build also
          // passes against a viewer whose IViewerOptions lacks the key.
          ...{
            readerHighlightPackage: {
              getHighlightsFunc: getReaderHighlightsFunc,
              addHighlightFunc: addReaderHighlightFunc,
              deleteHighlightFunc: deleteReaderHighlightFunc,
            },
          },
          // The reader's wait to the first page (#59, EvilFlowersViewer#150): from opening this screen
          // (entry detail, licence and, without streaming, the PDF download included) to the first painted
          // page; `render_ms` is the viewer's own load and paint. `streaming` (#63) is the portal setting
          // (url vs data), so the dashboards compare like with like. Viewer 0.7.9 lacks some keys; the spread
          // keeps the build passing and older viewers ignore them.
          ...{
            onFirstPageRendered: ({ durationMs, bytesLoaded, totalBytes }: FirstPageInfo) => {
              revealReader();
              measure(
                "viewer",
                {
                  first_page_ms: Math.round(performance.now() - openedAt),
                  render_ms: durationMs,
                  ...(typeof bytesLoaded === "number" ? { bytes_loaded: bytesLoaded } : {}),
                  ...(typeof totalBytes === "number" ? { total_bytes: totalBytes } : {}),
                },
                {
                  kind: "pdf",
                  streaming: String(loading.streaming),
                  source: sourceKind,
                  auto_fetch: String(source.streaming !== true),
                },
              );
            },
            onDocumentError: async ({ stage, reason, status }: DocumentErrorInfo) => {
              if (await renewStreamUrl(status)) return;
              // The viewer shows its own error and retry; the loader must not hide them.
              revealReader();
              trackOutcome(EVENTS.viewerError, {
                stage,
                reason: reason ?? "unknown",
                status: status ? String(status) : "none",
                source: sourceKind,
              });
            },
            // A Range request failed after the open; the viewer shows its own Reconnect notice.
            onStreamError: ({ status }: { status: number | null }) => {
              void renewStreamUrl(status);
            },
            onPageChange: onReaderPageChange,
            // pdf.js resources (wasm decoders for JPX/JBIG2 scans, CMaps, standard fonts, ICC profiles),
            // copied from the installed pdfjs-dist at build time (vite.config.ts).
            pdfAssetsUrl: `${import.meta.env.BASE_URL}pdfjs/`,
          },
          regionPackage: { getRegionsFunc, getAllRegionsFunc },
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
        viewerApp = rendered as unknown as ViewerApp;
        // A viewer before EvilFlowersViewer#153 (npm 0.7.9) reports no first paint: step aside now and let
        // its own spinner show. Otherwise wait for the paint, with a safety net should it never come.
        if (!viewerApp?.viewer) revealReader();
        else {
          revealTimer = setTimeout(revealReader, READER_LOADER_MAX_MS);
          // The address follows the reader (page, search, Navigator section) and Back / Forward move it.
          const openedPage = locator?.page || opened.page || null;
          detachUrlSync = attachUrlSync(viewerApp.viewer, {
            page: openedPage,
            // The passage (`loc`) or paragraph / region (`p`, `r`) the address points at, on this page.
            focusPage: opened.loc || searchParams.get("p") || opened.r ? openedPage : null,
            q: opened.q,
            panel: opened.panel,
            label: opened.label,
          });
        }
      } catch (error) {
        if (cancelled) return;
        // No personal copy (no access from here, a policy, a failure): the publication's page says why and
        // offers what is possible (borrow, other files), instead of dropping the reader on the home page.
        toast.error(t(httpStatus(error) === 403 ? "links.forbidden" : "links.openFailed"));
        navigate(entryPath(id, { catalogId: entryCatalogId }), { replace: true });
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(revealTimer);
      detachUrlSync();
      viewerApp?.unmount();

      // Remove the scoped styles
      const styleElement = document.getElementById("pdf-viewer-styles");
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, [id]);

  // The loader fades out (ReaderLoader's transition), then unmounts.
  useEffect(() => {
    if (loaderPhase !== "leaving") return;
    const timer = setTimeout(() => setLoaderPhase("gone"), 300);
    return () => clearTimeout(timer);
  }, [loaderPhase]);

  return (
    <>
      {loading && (
        <ReaderLoader
          book={loaderBook}
          stage={loaderStage}
          leaving={loaderPhase === "leaving"}
        />
      )}
      <div id={rootId}></div>
      {graphPanels && id && !loading && <ExplainedElsewhere entryId={id} page={readerPage} />}
      {/* The publication dialog (recommendation cards) is App's one EntryDialogHost. */}
    </>
  );
};

export default Viewer;
