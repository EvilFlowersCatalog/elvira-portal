import { FaPaperPlane } from "react-icons/fa6";
import { FiClock, FiPlus } from "react-icons/fi";
import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import useAppContext from "../../hooks/contexts/useAppContext";
import { Link, useNavigate } from "react-router-dom";
import useAssistantChat from "../../hooks/api/assistant/useAssistantChat";
import useStickToBottom from "../../hooks/useStickToBottom";
import AssistantMessage from "../../components/assistant/AssistantMessage";
import ChatSubjectBar from "../../components/assistant/ChatSubjectBar";
import { NAVIGATION_PATHS } from "../../utils/interfaces/general/general";
import EntryDetail from "../../components/items/entry/details/EntryDetail";

function AiSuggestion({ suggestion, handleSuggestion }: { suggestion: string, handleSuggestion: (suggestion: string) => void }) {
    return (
        <div
            className="flex items-center justify-center flex-1 rounded-lg p-3 cursor-pointer transition-colors duration-200 text-center text-sm bg-zinc-200 text-gray-500 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600"
            onClick={() => {
                handleSuggestion(suggestion);
            }}
        >
            {suggestion}
        </div>
    );
}

export default function AiAssistantPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { 
        umamiTrack,
        clearAiChat,
        aiMessages,
        aiShowSuggestions,
        setAiShowSuggestions,
    } = useAppContext();

    const [input, setInput] = useState("");
    const { sendMessage, isGenerating: isGeneratingResponse } = useAssistantChat();
    const chatScrollRef = useRef<HTMLDivElement>(null);
    const chatContentRef = useRef<HTMLDivElement>(null);
    const followChat = useStickToBottom(chatScrollRef, chatContentRef);

    useEffect(() => {
        umamiTrack("AI Assistant Page Visit");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSuggestion = (suggestion: string) => {
        followChat();
        sendMessage(suggestion);
        setAiShowSuggestions(false);
    };

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;
        setAiShowSuggestions(false);
        followChat();
        sendMessage(input);
        setInput("");
    };

    function handleNewChat(){
        umamiTrack("Start New AI Chat");
        clearAiChat();
        navigate(NAVIGATION_PATHS.aiAssistant);
    }

    return (
        <div className="flex flex-col h-full w-full ">
            {/* Desktop Header */}
            <div className="hidden lg:flex justify-between items-center p-6">
                <h1 className="text-[2.125rem] leading-tight font-bold text-black dark:text-white">
                    Elvira AI
                </h1>
                <div className="flex gap-2">
                    <Link
                        to={NAVIGATION_PATHS.aiChatHistory}
                        aria-label="Chat history"
                        className="inline-flex items-center justify-center rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                        <FiClock size={20} className="text-black dark:text-white" />
                    </Link>
                    <button
                        type="button"
                        aria-label="New chat"
                        onClick={handleNewChat}
                        className="inline-flex items-center justify-center rounded-full p-2 bg-primary text-white hover:bg-primaryDark transition-colors"
                    >
                        <FiPlus size={20} />
                    </button>
                </div>
            </div>

            {/* Mobile Header */}
            <div className="flex lg:hidden justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-zinc-700">
                <p className="text-xl font-bold text-black dark:text-white">
                    Elvira AI
                </p>
                <div className="flex gap-1">
                    <Link
                        to={NAVIGATION_PATHS.aiChatHistory}
                        aria-label="Chat history"
                        className="inline-flex items-center justify-center rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                        <FiClock size={18} className="text-black dark:text-white" />
                    </Link>
                    <button
                        type="button"
                        aria-label="New chat"
                        onClick={handleNewChat}
                        className="inline-flex items-center justify-center rounded-full p-1.5 bg-primary text-white hover:bg-primaryDark transition-colors"
                    >
                        <FiPlus size={18} />
                    </button>
                </div>
            </div>
            <EntryDetail  />
            {/* Main Chat Container */}
            <div className="flex-1 flex flex-col items-center w-full overflow-hidden">
                <div className="w-full max-w-4xl px-4 pt-2">
                    <ChatSubjectBar />
                </div>
                {/* Chat Messages Area */}
                <div ref={chatScrollRef} className="flex-1 w-full max-w-4xl overflow-y-auto px-4 py-8">
                    <div ref={chatContentRef} className="flex flex-col">
                        {aiMessages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full py-20">
                                <h2 className="text-[2.125rem] leading-tight font-bold mb-4 text-black dark:text-white">
                                    {t("assistant.title")}
                                </h2>
                                <p className="text-base text-gray-600 dark:text-gray-400 mb-8 text-center max-w-md">
                                    {t("assistant.welcomeMessage")}
                                </p>
                            </div>
                        ) : (
                            aiMessages.map((msg) => (
                                <AssistantMessage key={msg.id} msg={msg} messages={aiMessages} />
                            ))
                        )}
                    </div>
                </div>

                {/* Input Area */}
                <div className="w-full max-w-4xl px-4 pb-8">
                    <form onSubmit={handleSubmit}>
                        {aiShowSuggestions && aiMessages.length === 0 ? (
                            <div className="flex gap-3 mb-4">
                                <AiSuggestion suggestion={t("assistant.suggestion1")} handleSuggestion={handleSuggestion} />
                                <AiSuggestion suggestion={t("assistant.suggestion2")} handleSuggestion={handleSuggestion} />
                            </div>
                        ) : null}
                        <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 bg-white hover:bg-zinc-100 drop-shadow-lg dark:bg-[#3f3f46] dark:hover:bg-[#4b5563]">
                            <input
                                type="text"
                                disabled={isGeneratingResponse}
                                placeholder={t("assistant.inputPlaceholder")}
                                className="flex-1 bg-transparent outline-none text-black dark:text-[#e5e7eb] disabled:opacity-60"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                            <button
                                type="submit"
                                aria-label="Send"
                                disabled={isGeneratingResponse || !input.trim()}
                                className="inline-flex items-center justify-center p-1 disabled:opacity-40"
                            >
                                <FaPaperPlane size={16} className="dark:text-white" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
