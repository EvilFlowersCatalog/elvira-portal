import { createPortal } from "react-dom";
import { FaX } from "react-icons/fa6";
import { FiPlus } from "react-icons/fi";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import useAppContext from "../../hooks/contexts/useAppContext";
import useGetEntryDetail from "../../hooks/api/entries/useGetEntryDetail";
import { IEntryDetail } from "../../utils/interfaces/entry";
import { useSearchParams } from "react-router-dom";
import AssistantChatPanel from "../assistant/AssistantChatPanel";
import ChatSubjectBar from "../assistant/ChatSubjectBar";
import useEscapeLayer from '../../hooks/useEscapeLayer';

/** The assistant as a drawer over any page; the conversation itself is `AssistantChatPanel`. */
export default function AiAssistant() {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const { showAiAssistant, setShowAiAssistant, umamiTrack, clearAiChat } = useAppContext();
    const { getEntryDetail } = useGetEntryDetail();

    const [assistantEntry, setAssistantEntry] = useState<IEntryDetail | null>(null);
    const [currentCatalogId] = useState<string | undefined>(import.meta.env.ELVIRA_CATALOG_ID || undefined);
    // The id comes straight from the URL so a message sent before the book detail
    // has loaded still carries the reference; the detail only supplies the title.
    const assistantEntryId = searchParams.get('assistant-entry-id') || undefined;

    function clearAssistantEntry() {
        setAssistantEntry(null);
        const params = new URLSearchParams(searchParams);
        params.delete('assistant-entry-id');
        setSearchParams(params);
    }

    useEffect(() => {
        if (showAiAssistant) {
            umamiTrack("AI Assistant Button");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showAiAssistant]);

    useEffect(() => {
        if (!assistantEntryId) {
            // The reference was cleared (chip closed / drawer closed) — drop the stale chip.
            setAssistantEntry(null);
            return;
        }
        if (assistantEntry?.id === assistantEntryId) return;
        getEntryDetail(assistantEntryId, searchParams.get('entry-catalog-id') || currentCatalogId).then((entry) => {
            setAssistantEntry(entry);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assistantEntryId]);

    const closeDrawer = (fromBackdrop = false) => {
        const close = () => {
            setShowAiAssistant(false);
            const params = new URLSearchParams(searchParams);
            params.delete('dialog-priority');
            params.delete('assistant-entry-id');
            setSearchParams(params);
        };
        // A backdrop click lets the click finish before the drawer goes.
        if (fromBackdrop) setTimeout(close);
        else close();
    };

    useEscapeLayer(() => closeDrawer(), showAiAssistant);

    // Only yield to the entry detail while one is actually open; a stale
    // `dialog-priority=entry-detail` left over from a closed detail must not
    // push the assistant under the header / other overlays.
    const detailOpen = !!searchParams.get('entry-detail-id');
    const drawerZIndex = searchParams.get('dialog-priority') == 'entry-detail' && detailOpen ? 49 : 1200;

    // Render through a portal to document.body — the previous MUI <Drawer>
    // portaled out of the DOM, so this component is mounted inside HomeHeader's
    // search <form>/<button>; rendering the panel inline would nest a <form>
    // inside a <form> and a <button> inside a <button> (invalid HTML).
    return createPortal(
        <div
            className={`fixed inset-0 transition-opacity duration-300 ${showAiAssistant ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            style={{ zIndex: drawerZIndex }}
            aria-hidden={!showAiAssistant}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={() => closeDrawer(true)} />
            {/* Panel */}
            <div
                className={`absolute top-0 right-0 h-full w-full max-w-[800px] rounded-l-lg bg-[#F4F6F9] dark:bg-[#27272A] text-black dark:text-white shadow-2xl overflow-hidden transition-transform duration-300 ${showAiAssistant ? "translate-x-0" : "translate-x-full"}`}
            >
                <div className="p-3 h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xl font-semibold text-black dark:text-white">
                            {t("assistant.title")}
                        </p>
                        <div className="flex gap-1">
                            <button
                                type="button"
                                aria-label={t("assistant.newChat")}
                                onClick={clearAiChat}
                                className="inline-flex items-center justify-center rounded-full p-2 bg-primary text-white hover:bg-primaryDark transition-colors disabled:bg-zinc-300 disabled:text-zinc-400"
                            >
                                <FiPlus size={18} />
                            </button>
                            <button
                                type="button"
                                aria-label={t('common.close')}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    closeDrawer();
                                }}
                                className="inline-flex items-center justify-center rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                            >
                                <FaX size={14} className="text-black dark:text-white" />
                            </button>
                        </div>
                    </div>

                    <ChatSubjectBar onNavigate={() => closeDrawer()} />

                    <AssistantChatPanel
                        compact
                        onNavigate={() => closeDrawer()}
                        entry={
                            assistantEntryId
                                ? {
                                      id: assistantEntryId,
                                      title: assistantEntry?.title,
                                      catalogId: searchParams.get('entry-catalog-id') || assistantEntry?.catalog_id || null,
                                      readable: !assistantEntry?.config?.readium_enabled,
                                  }
                                : undefined
                        }
                        onClearEntry={clearAssistantEntry}
                    />
                </div>
            </div>
        </div>,
        document.body
    );
}
