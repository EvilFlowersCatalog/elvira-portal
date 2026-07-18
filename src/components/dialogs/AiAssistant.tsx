import { createPortal } from "react-dom";
import { CircleLoader } from "react-spinners";
import { FaX, FaPaperPlane } from "react-icons/fa6";
import { FiPlus } from "react-icons/fi";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslation } from "react-i18next";
import useAppContext from "../../hooks/contexts/useAppContext";
import EntryItem from "../items/entry/display/EntryItem";
import useGetEntryDetail from "../../hooks/api/entries/useGetEntryDetail";
import { IEntry, IEntryDetail } from "../../utils/interfaces/entry";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import useAuth from "../../hooks/contexts/useAuthContext";
import { AiMessage, AiMessageContent } from "../../providers/AppProvider";

interface StreamEvent {
    type: 'chunk' | 'message' | 'entries' | 'done' | 'error';
    data?: string | string[];
    msg_id?: string;
    bookCatalogs?: Record<string, string>;  // bookId -> catalogId mapping
}

function AiSuggestion({ suggestion, handleSuggestion }: { suggestion: string, handleSuggestion: (suggestion: string) => void }) {
    return (
        <div
            className="flex items-center justify-center flex-1 rounded-lg p-2 cursor-pointer transition-colors duration-200 text-center text-sm bg-zinc-200 text-gray-500 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600"
            onClick={() => {
                handleSuggestion(suggestion);
            }}
        >
            {suggestion}
        </div>
    );
}


function MessageElement({ msg, msgIndex, bookCatalogs }: { msg: AiMessage, msgIndex: number, bookCatalogs: Record<string, string> }) {
    const [books, setBooks] = useState<any[]>([]);
    const { getEntryDetail } = useGetEntryDetail();

    useEffect(() => {
        if (msg.content.type === "entries" && Array.isArray(msg.content.data)) {
            const entryIds = msg.content.data;
            setBooks([]); // Reset books first
            (async () => {
                const details = await Promise.all(
                    entryIds.map((id: string) => {
                        const catalogId = bookCatalogs[id];
                        return getEntryDetail(id, catalogId || undefined);
                    })
                );
                const entries: IEntry[] = details.map(entryDetail => ({
                    ...entryDetail,
                    popularity: Number(entryDetail.popularity),
                }));
                setBooks(entries);
            })();
        }
    }, [msg.content.type, JSON.stringify(msg.content.data), JSON.stringify(bookCatalogs)])

    switch (msg.content.type) {
        case "message":
            return <div
                className={`mb-2 p-2 rounded-lg max-w-[80%] ${
                    msg.role === "user"
                        ? "bg-primary text-white self-end"
                        : "bg-zinc-200 text-black self-start"
                }`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content.data as string}</ReactMarkdown>
            </div>;
        case "entries":
            return <div className="flex gap-3 mb-2 py-2 shrink-0"
            >
                {books.map((entry: IEntry) => (
                    <EntryItem entry={entry} key={"ai-" + entry.id} id={'ai-' + entry.id} type="ai-recommendation" />
                ))}
            </div>
        case "loading":
            return <div className="mb-2 p-2 rounded-lg max-w-[80%] flex items-center gap-2 bg-zinc-200 self-start">
                <CircleLoader size={16} color={'var(--color-primary)'} />
                <p className="text-sm text-gray-600">
                    {msg.content.data || "Generating response..."}
                </p>
            </div>;
        default:
            return <p className="dark:text-white text-center">404</p>
    }
}

export default function AiAssistant() {
    const { t } = useTranslation();
    const { auth } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const { 
        showAiAssistant, 
        setShowAiAssistant, 
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
    const { getEntryDetail } = useGetEntryDetail();

    const [input, setInput] = useState("");
    const [isGeneratingResponse, setGeneratingResponse] = useState(false);
    const [assistantEntry, setAssistantEntry] = useState<IEntryDetail | null>(null);
    const [currentCatalogId] = useState<string | undefined>(selectedCatalogId || import.meta.env.ELVIRA_CATALOG_ID || undefined);


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
    }, [showAiAssistant]);

    useEffect(() => {
        document.getElementById("chat")?.scrollTo({
            top: document.getElementById("chat")?.scrollHeight,
            behavior: "smooth",
        });
    }, [aiMessages]);

    useEffect(() => {
        const assistantEntryId = searchParams.get('assistant-entry-id');
        if (assistantEntryId) {
            getEntryDetail(assistantEntryId, currentCatalogId).then((entry) => {
                setAssistantEntry(entry);
            });
        }

    }, [searchParams]);

    useEffect(() => {
        if (!showAiAssistant) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleCloseDrawer({}, "escapeKeyDown");
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showAiAssistant, searchParams]);

    async function sendMessage(message: string) {
        setAiMessages((prev) => [...prev, {
            role: "user", content: {
                type: "message",
                data: message
            }
        }]);
        setGeneratingResponse(true);

        // Add loading indicator
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
                    entryId: assistantEntry?.id || undefined
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
                    apiKey: auth?.token || null,
                    entryId: assistantEntry?.id || undefined
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
                                    // Remove loading indicator and start streaming message
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
                                    // Append chunk to existing message
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
                                // Final message received (if no chunks were sent)
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

    const newSession = () => {
        setAiChatId(null);
        setAiMessages([]);
        setAiBookCatalogs({});
    }

    const handleCloseDrawer = (event: object, reason: "backdropClick" | "escapeKeyDown") => {
        if (reason === "backdropClick") {
            setTimeout(() => {
                setShowAiAssistant(false);
                const params = new URLSearchParams(searchParams);
                params.delete('dialog-priority');
                params.delete('assistant-entry-id');
                setSearchParams(params);
            });
            return;
        }

        setShowAiAssistant(false);
        const params = new URLSearchParams(searchParams);
        params.delete('dialog-priority');
        params.delete('assistant-entry-id');
        setSearchParams(params);
    };

    const drawerZIndex = searchParams.get('dialog-priority') ?
        (searchParams.get('dialog-priority') == 'ai-assistant' ? 1200 : 49)
        : 1200;

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
            <div
                className="absolute inset-0 bg-black/50"
                onClick={() => handleCloseDrawer({}, "backdropClick")}
            />
            {/* Panel */}
            <div
                className={`absolute top-0 right-0 h-full w-full max-w-[800px] rounded-l-lg bg-[#F4F6F9] dark:bg-[#27272A] shadow-2xl overflow-hidden transition-transform duration-300 ${showAiAssistant ? "translate-x-0" : "translate-x-full"}`}
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
                                aria-label={t("assistant.title")}
                                onClick={newSession}
                                disabled={isGeneratingResponse}
                                className="inline-flex items-center justify-center rounded-full p-2 bg-primary text-white hover:bg-primaryDark transition-colors disabled:bg-zinc-300 disabled:text-zinc-400"
                            >
                                <FiPlus size={18} />
                            </button>
                            <button
                                type="button"
                                aria-label="Close"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCloseDrawer({}, "escapeKeyDown");
                                }}
                                className="inline-flex items-center justify-center rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                            >
                                <FaX size={14} className="text-black dark:text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div id="chat" className="flex flex-col grow overflow-y-auto">
                        {aiMessages.map((msg, index) => (
                            <MessageElement key={`msg-${index}-${msg.content.type}`} msg={msg} msgIndex={index} bookCatalogs={aiBookCatalogs} />
                        ))}
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit}>
                        {!assistantEntry && aiShowSuggestions ? <div className="flex gap-2 mb-2">
                            <AiSuggestion suggestion={t("assistant.suggestion1")} handleSuggestion={handleSuggestion} />
                            <AiSuggestion suggestion={t("assistant.suggestion2")} handleSuggestion={handleSuggestion} />
                        </div> : null}
                        {assistantEntry ?
                            <div className="mb-0.5 p-0 rounded-lg bg-inherit dark:text-zinc-200 self-start flex w-full items-center">
                                <p className="whitespace-nowrap max-w-full overflow-hidden text-ellipsis text-xs pr-2">
                                    {t("assistant.entryAssistant", { x: assistantEntry.title })}
                                </p>
                                <div className="ml-auto" onClick={() => { clearAssistantEntry(); }}>
                                    <FaX size={12} className="text-black dark:text-white cursor-pointer" />
                                </div>
                            </div> : null
                        }
                        <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-[#3f3f46] dark:hover:bg-[#4b5563]">
                            <input
                                type="text"
                                disabled={isGeneratingResponse}
                                placeholder={t("assistant.inputPlaceholder")}
                                className="flex-1 bg-transparent outline-none text-sm text-black dark:text-[#e5e7eb] disabled:opacity-60"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                            <button type="submit" aria-label="Send" className="inline-flex items-center justify-center p-1">
                                <FaPaperPlane size={14} className="dark:text-white" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
}
