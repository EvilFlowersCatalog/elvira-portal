import {
    Box,
    Typography,
    TextField,
    InputAdornment,
    IconButton,
    CircularProgress,
} from "@mui/material";
import { FaPaperPlane } from "react-icons/fa6";
import { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslation } from "react-i18next";
import useAppContext from "../../hooks/contexts/useAppContext";
import EntryItem from "../../components/items/entry/display/EntryItem";
import useGetEntryDetail from "../../hooks/api/entries/useGetEntryDetail";
import { IEntry } from "../../utils/interfaces/entry";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import useAuth from "../../hooks/contexts/useAuthContext";
import { AiMessage } from "../../providers/AppProvider";
import { NAVIGATION_PATHS } from "../../utils/interfaces/general/general";
import EntryDetail from "../../components/items/entry/details/EntryDetail";

interface StreamEvent {
    type: 'chunk' | 'message' | 'entries' | 'done' | 'error';
    data?: string | string[];
    msg_id?: string;
}

function AiSuggestion({ suggestion, handleSuggestion }: { suggestion: string, handleSuggestion: (suggestion: string) => void }) {
    return (
        <Box
            className="flex items-center justify-center flex-1 rounded-lg p-3 cursor-pointer transition-colors duration-200 text-center text-sm bg-zinc-200 text-gray-500 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600"
            onClick={() => {
                handleSuggestion(suggestion);
            }}
        >
            {suggestion}
        </Box>
    );
}

function MessageElement({ msg }: { msg: AiMessage }) {
    const [books, setBooks] = useState<any[]>([]);
    const getEntryDetail = useGetEntryDetail();

    useEffect(() => {
        if (msg.content.type === "entries" && Array.isArray(msg.content.data)) {
            const entryIds = msg.content.data;
            setBooks([]);
            (async () => {
                const details = await Promise.all(
                    entryIds.map((id: string) => getEntryDetail(id, undefined))
                );
                const entries: IEntry[] = details.map(entryDetail => ({
                    ...entryDetail,
                    popularity: Number(entryDetail.popularity),
                }));
                setBooks(entries);
            })();
        }
    }, [msg.content.type, JSON.stringify(msg.content.data)])

    switch (msg.content.type) {
        case "message":
            return <Box className="mb-4 p-4 rounded-lg max-w-[70%]"
                sx={{
                    backgroundColor: msg.role === "user" ? "primary.main" : "grey.200",
                    color: msg.role === "user" ? "white" : "text.primary",
                    alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                    ".dark &": {
                        backgroundColor: msg.role === "user" ? "primary.main" : "#3f3f46",
                        color: msg.role === "user" ? "white" : "#e5e7eb",
                    }
                }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content.data as string}</ReactMarkdown>
            </Box>;
        case "entries":
            return <Box className="flex gap-3 mb-4 py-2 shrink-0 overflow-x-auto flex-nowrap"
            >
                {books.map((entry: IEntry) => (
                    <Box key={"ai-" + entry.id} className="flex-shrink-0">
                        <EntryItem entry={entry} id={'ai-' + entry.id} type="ai-recommendation" />
                    </Box>
                ))}
            </Box>
        case "loading":
            return <Box className="mb-4 p-4 rounded-lg max-w-[70%] flex items-center gap-2"
                sx={{
                    backgroundColor: "grey.200",
                    alignSelf: "flex-start",
                    ".dark &": {
                        backgroundColor: "#3f3f46",
                    }
                }}>
                <CircularProgress size={16} />
                <Typography variant="body2" className="text-gray-600 dark:text-gray-300">
                    {msg.content.data || "Generating response..."}
                </Typography>
            </Box>;
        default:
            return <Typography className="dark:text-white text-center">404</Typography>
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
        aiShowSuggestions,
        setAiShowSuggestions,
    } = useAppContext();
    const getEntryDetail = useGetEntryDetail();

    const [input, setInput] = useState("");
    const [isGeneratingResponse, setGeneratingResponse] = useState(false);
    const [assistantEntry, setAssistantEntry] = useState<any>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        umamiTrack("AI Assistant Page Visit");
        
        // Check if there's an entry-id in the URL params
        const entryId = searchParams.get('entry-id');
        if (entryId) {
            getEntryDetail(entryId, undefined).then((entry) => {
                setAssistantEntry(entry);
            });
        }
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
            var currentChatId = aiChatId;
            if (!currentChatId) {
                const response = await axios.post(`${import.meta.env.ELVIRA_ASSISTANT_URL}/api/startchat`, {
                    entryId: null,
                    apiKey: auth?.token || null,
                    catalogId: import.meta.env.ELVIRA_CATALOG_ID
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
                    entryId: null,
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

    return (
        <Box className="flex flex-col h-full w-full bg-white dark:bg-zinc-900">
            <EntryDetail  />
            {/* Main Chat Container */}
            <Box className="flex-1 flex flex-col items-center w-full overflow-hidden">
                {/* Chat Messages Area */}
                <Box className="flex-1 w-full max-w-4xl overflow-y-auto px-4 py-8">
                    <Box className="flex flex-col">
                        {aiMessages.length === 0 ? (
                            <Box className="flex flex-col items-center justify-center h-full py-20">
                                <Typography variant="h4" className="font-bold mb-4 text-black dark:text-white">
                                    {t("assistant.title")}
                                </Typography>
                                <Typography variant="body1" className="text-gray-600 dark:text-gray-400 mb-8 text-center max-w-md">
                                    {t("assistant.welcomeMessage")}
                                </Typography>
                            </Box>
                        ) : (
                            aiMessages.map((msg, index) => (
                                <MessageElement key={`msg-${index}-${msg.content.type}`} msg={msg} />
                            ))
                        )}
                        <div ref={chatEndRef} />
                    </Box>
                </Box>

                {/* Input Area */}
                <Box className="w-full max-w-4xl px-4 pb-8">
                    <Box component="form" onSubmit={handleSubmit}>
                        {aiShowSuggestions && aiMessages.length === 0 ? (
                            <Box className="flex gap-3 mb-4">
                                <AiSuggestion suggestion={t("assistant.suggestion1")} handleSuggestion={handleSuggestion} />
                                <AiSuggestion suggestion={t("assistant.suggestion2")} handleSuggestion={handleSuggestion} />
                            </Box>
                        ) : null}
                        <TextField
                            fullWidth
                            disabled={isGeneratingResponse}
                            placeholder={t("assistant.inputPlaceholder")}
                            sx={{
                                backgroundColor: "grey.100",
                                borderRadius: 3,
                                "&:hover": { backgroundColor: "grey.200" },
                                ".dark &": {
                                    backgroundColor: '#3f3f46',
                                    "&:hover": { backgroundColor: '#4b5563' },
                                    "& .MuiInputBase-input": {
                                        color: '#e5e7eb',
                                    }
                                },
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: 3,
                                }
                            }}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton type="submit" edge="end" disabled={isGeneratingResponse || !input.trim()}>
                                            <FaPaperPlane size={16} className="dark:text-white" />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
