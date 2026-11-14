import { FiClock, FiPlus } from "react-icons/fi";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import useAppContext from "../../hooks/contexts/useAppContext";
import { Link, useNavigate } from "react-router-dom";
import AssistantChatPanel from "../../components/assistant/AssistantChatPanel";
import ChatSubjectBar from "../../components/assistant/ChatSubjectBar";
import { NAVIGATION_PATHS } from "../../utils/interfaces/general/general";
import EntryDetail from "../../components/items/entry/details/EntryDetail";

/** The assistant as a page; the conversation itself is `AssistantChatPanel`. */
export default function AiAssistantPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { umamiTrack, clearAiChat } = useAppContext();

    useEffect(() => {
        umamiTrack("AI Assistant Page Visit");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleNewChat(){
        umamiTrack("Start New AI Chat");
        clearAiChat();
        navigate(NAVIGATION_PATHS.aiAssistant);
    }

    return (
        <div className="flex flex-col h-full w-full ">
            {/* Header: one compact row so the conversation gets the height */}
            <div className="flex justify-between items-center gap-3 px-4 py-2 border-b border-gray-200 dark:border-zinc-700">
                <p className="text-lg font-semibold text-black dark:text-white">
                    Elvira AI
                </p>
                <div className="flex-1 min-w-0 max-w-3xl">
                    <ChatSubjectBar compact />
                </div>
                <div className="flex gap-1">
                    <Link
                        to={NAVIGATION_PATHS.aiChatHistory}
                        aria-label={t("assistant.chatHistory")}
                        className="inline-flex items-center justify-center rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                        <FiClock size={18} className="text-black dark:text-white" />
                    </Link>
                    <button
                        type="button"
                        aria-label={t("assistant.newChat")}
                        onClick={handleNewChat}
                        className="inline-flex items-center justify-center rounded-full p-1.5 bg-primary text-white hover:bg-primaryDark transition-colors"
                    >
                        <FiPlus size={18} />
                    </button>
                </div>
            </div>
            <EntryDetail  />
            <div className="flex-1 flex flex-col items-center w-full overflow-hidden">
                <AssistantChatPanel />
            </div>
        </div>
    );
}
