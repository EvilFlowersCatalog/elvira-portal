import { CircleLoader } from "react-spinners";
import { FaPaperPlane } from "react-icons/fa6";
import { FiClock, FiPlus } from "react-icons/fi";
import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslation } from "react-i18next";
import useAppContext from "../../hooks/contexts/useAppContext";
import EntryItem from "../../components/items/entry/display/EntryItem";
import useGetEntryDetail from "../../hooks/api/entries/useGetEntryDetail";
import { IEntry } from "../../utils/interfaces/entry";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import useAuth from "../../hooks/contexts/useAuthContext";
import { AiMessage } from "../../providers/AppProvider";
import { NAVIGATION_PATHS } from "../../utils/interfaces/general/general";
import EntryDetail from "../../components/items/entry/details/EntryDetail";

interface StreamEvent {
    type: 'chunk' | 'message' | 'entries' | 'done' | 'error';
    data?: string | string[];
    msg_id?: string;
    bookCatalogs?: Record<string, string>;  // bookId -> catalogId mapping
}

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

function MessageElement({ msg, bookCatalogs }: { msg: AiMessage, bookCatalogs: Record<string, string> }) {
    const { getEntryDetail } = useGetEntryDetail();

    const entryIds =
        msg.content.type === "entries" && Array.isArray(msg.content.data)
            ? (msg.content.data as string[])
            : [];

    // Recommended-book details for an "entries" message (cached/deduped by
    // React Query; keyed by the ids + their catalog map).
    const { data: books = [] } = useQuery({
        queryKey: ["ai-message-books", entryIds, bookCatalogs],
        queryFn: async () => {
            const details = await Promise.all(
                entryIds.map((id) => getEntryDetail(id, bookCatalogs[id] || undefined))
            );
            return details.map((entryDetail) => ({
                ...entryDetail,
                popularity: Number(entryDetail.popularity),
            })) as IEntry[];
        },
        enabled: entryIds.length > 0,
    });

    switch (msg.content.type) {
        case "message":
            return <div
                className={`mb-4 p-4 rounded-lg max-w-[70%] ${
                    msg.role === "user"
                        ? "bg-primary text-white self-end"
                        : "bg-zinc-200 text-black self-start dark:bg-[#3f3f46] dark:text-[#e5e7eb]"
                }`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content.data as string}</ReactMarkdown>
            </div>;
        case "entries":
            return <div className="flex gap-3 mb-4 py-2 shrink-0 overflow-x-auto flex-nowrap"
            >
                {books.map((entry: IEntry) => (
                    <div key={"ai-" + entry.id} className="flex-shrink-0">
                        <EntryItem entry={entry} id={'ai-' + entry.id} type="ai-recommendation" />
                    </div>
                ))}
            </div>
        case "loading":
            return <div className="mb-4 p-4 rounded-lg max-w-[70%] flex items-center gap-2 bg-zinc-200 self-start dark:bg-[#3f3f46]">
                <CircleLoader size={16} color={'var(--color-primary)'} />
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    {msg.content.data || "Generating response..."}
                </p>
            </div>;
        default:
            return <p className="dark:text-white text-center">404</p>
    }
}

export default function AiAssistantPage() {
    const { t } = useTranslation();
    const { auth } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { 
        umamiTrack,
        aiChatId,
        setAiChatId,
        aiMessages,
        setAiMessages,
        aiBookCatalogs,
        setAiBookCatalogs,
        aiShowSuggestions,
        setAiShowSuggestions,
        selectedCatalogId,
    } = useAppContext();

    const [input, setInput] = useState("");
    const [isGeneratingResponse, setGeneratingResponse] = useState(false);
    const [currentCatalogId] = useState<string | undefined>(selectedCatalogId || import.meta.env.ELVIRA_CATALOG_ID || undefined);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        umamiTrack("AI Assistant Page Visit");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [aiMessages]);

    async function sendMessage(message: string) {
        setAiMessages((prev) => [...prev, {
            role: "user", content: {
                type: "message",
                data: message
            }
        }]);
        setGeneratingResponse(true);

        const loadingMsgId = `loading-${Date.now()}`;
        setAiMessages((prev) => [...prev, {
            role: "assistant",
            content: {
                type: "loading",
                data: "Generating response..."
            },
            id: loadingMsgId
        }]);

        try {
            let currentChatId = aiChatId;
            if (!currentChatId) {
                const response = await axios.post(`${import.meta.env.ELVIRA_ASSISTANT_URL}/api/startchat`, {
                    apiKey: auth?.token || null,
                    catalogId: currentCatalogId,
                    entryId: undefined
                });
                currentChatId = response.data.chatId;
                setAiChatId(currentChatId);
            }

            const response = await fetch(`${import.meta.env.ELVIRA_ASSISTANT_URL}/api/sendchat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatId: currentChatId,
                    message: message,
                    apiKey: auth?.token || null
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Request failed');
            }

            const reader = response.body!.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let currentMessageText = '';
            let hasReceivedFirstChunk = false;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data: StreamEvent = JSON.parse(line.slice(6));

                        switch (data.type) {
                            case 'chunk':
                                if (!hasReceivedFirstChunk) {
                                    hasReceivedFirstChunk = true;
                                    const streamingMsgId = `streaming-${Date.now()}`;
                                    setAiMessages((prev) => {
                                        const filtered = prev.filter(m => m.id !== loadingMsgId);
                                        return [...filtered, {
                                            role: "assistant",
                                            content: {
                                                type: "message",
                                                data: data.data as string
                                            },
                                            id: streamingMsgId
                                        }];
                                    });
                                    currentMessageText = data.data as string;
                                } else {
                                    currentMessageText += data.data;
                                    setAiMessages((prev) => {
                                        const newMessages = [...prev];
                                        const lastMsgIndex = newMessages.length - 1;
                                        if (newMessages[lastMsgIndex] && newMessages[lastMsgIndex].content.type === 'message') {
                                            newMessages[lastMsgIndex] = {
                                                ...newMessages[lastMsgIndex],
                                                content: {
                                                    ...newMessages[lastMsgIndex].content,
                                                    data: currentMessageText
                                                }
                                            };
                                        }
                                        return newMessages;
                                    });
                                }
                                break;
                            case 'message':
                                if (!hasReceivedFirstChunk) {
                                    setAiMessages((prev) => {
                                        const filtered = prev.filter(m => m.id !== loadingMsgId);
                                        return [...filtered, {
                                            role: "assistant",
                                            content: {
                                                type: "message",
                                                data: data.data as string
                                            },
                                            id: `message-${Date.now()}`
                                        }];
                                    });
                                }
                                break;
                            case 'entries':
                                // Store book-to-catalog mapping
                                if (data.bookCatalogs) {
                                    setAiBookCatalogs(prev => ({
                                        ...prev,
                                        ...data.bookCatalogs
                                    }));
                                }
                                setAiMessages((prev) => [...prev, {
                                    role: "assistant",
                                    content: {
                                        type: "entries",
                                        data: data.data as string[]
                                    },
                                    id: `entries-${Date.now()}`
                                }]);
                                break;
                            case 'done':
                                setGeneratingResponse(false);
                                break;
                            case 'error':
                                setAiMessages((prev) => {
                                    const filtered = prev.filter(m => m.id !== loadingMsgId);
                                    return [...filtered, {
                                        role: "assistant",
                                        content: {
                                            type: "message",
                                            data: `Error: ${data.data}`
                                        },
                                        id: `error-${Date.now()}`
                                    }];
                                });
                                setGeneratingResponse(false);
                                break;
                        }
                    }
                }
            }
        } catch (err) {
            setAiMessages((prev) => {
                const filtered = prev.filter(m => m.id !== loadingMsgId);
                return [...filtered, {
                    role: "assistant",
                    content: {
                        type: 'message',
                        data: "An error occurred while processing your request."
                    },
                    id: `error-${Date.now()}`
                }];
            });
            setGeneratingResponse(false);
        }

        setInput("");
    }

    const handleSuggestion = (suggestion: string) => {
        sendMessage(suggestion);
        setAiShowSuggestions(false);
    };

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;
        setAiShowSuggestions(false);
        sendMessage(input);
        setInput("");
    };

    function handleNewChat(){
        umamiTrack("Start New AI Chat");
        setAiChatId(null);
        setAiMessages([]);
        setAiBookCatalogs({});
        setAiShowSuggestions(true);
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
                {/* Chat Messages Area */}
                <div className="flex-1 w-full max-w-4xl overflow-y-auto px-4 py-8">
                    <div className="flex flex-col">
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
                            aiMessages.map((msg, index) => (
                                <MessageElement key={`msg-${index}-${msg.content.type}`} msg={msg} bookCatalogs={aiBookCatalogs} />
                            ))
                        )}
                        <div ref={chatEndRef} />
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
