import {
    Box,
    Drawer,
    Typography,
    IconButton,
    TextField,
    InputAdornment,
    CircularProgress,
} from "@mui/material";
import { FaX, FaPaperPlane } from "react-icons/fa6";
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

interface MessageContent {
    type: "message" | 'entries' | 'loading'
    data: any
}

interface StreamEvent {
    type: 'chunk' | 'message' | 'entries' | 'done' | 'error';
    data?: string | string[];
    msg_id?: string;
}

function AiSuggestion({ suggestion, handleSuggestion }: { suggestion: string, handleSuggestion: (suggestion: string) => void }) {
    return (
        <Box
            className="flex items-center justify-center flex-1 rounded-lg p-2 cursor-pointer transition-colors duration-200 text-center text-sm bg-zinc-200 text-gray-500 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600"
            onClick={() => {
                handleSuggestion(suggestion);
            }}
        >
            {suggestion}
        </Box>
    );
}


function MessageElement({ msg, msgIndex }: { msg: { role: string; content: MessageContent }, msgIndex: number }) {
    const [books, setBooks] = useState<any[]>([]);
    const getEntryDetail = useGetEntryDetail();

    useEffect(() => {
        if (msg.content.type === "entries" && Array.isArray(msg.content.data)) {
            const entryIds = msg.content.data;
            setBooks([]); // Reset books first
            (async () => {
                const details = await Promise.all(
                    entryIds.map((id: string) => getEntryDetail(id))
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
            return <Box className="mb-2 p-2 rounded-lg max-w-[80%]"
                sx={{
                    backgroundColor: msg.role === "user" ? "primary.main" : "grey.200",
                    color: msg.role === "user" ? "white" : "text.primary",
                    alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content.data as string}</ReactMarkdown>
            </Box>;
        case "entries":
            return <Box className="flex gap-3 mb-2 py-2 shrink-0"
            >
                {books.map((entry: IEntry) => (
                    <EntryItem entry={entry} key={"ai-" + entry.id} id={'ai-' + entry.id} type="ai-recommendation" />
                ))}
            </Box>
        case "loading":
            return <Box className="mb-2 p-2 rounded-lg max-w-[80%] flex items-center gap-2"
                sx={{
                    backgroundColor: "grey.200",
                    alignSelf: "flex-start",
                }}>
                <CircularProgress size={16} />
                <Typography variant="body2" className="text-gray-600">
                    {msg.content.data || "Generating response..."}
                </Typography>
            </Box>;
        default:
            return <p className="dark:text-white text-center">404</p>
    }
}

export default function AiAssistant() {
    const { t } = useTranslation();
    const { auth } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const { showAiAssistant, setShowAiAssistant, umamiTrack } = useAppContext();
    const getEntryDetail = useGetEntryDetail();

    const [chatId, setChatId] = useState<string | null>(null);

    const [input, setInput] = useState("");
    const [isGeneratingResponse, setGeneratingResponse] = useState(false);

    const [showSuggestions, setShowSuggestions] = useState(true);
    const [messages, setMessages] = useState<{ role: string; content: any; id?: string }[]>([]);
    const [assistantEntry, setAssistantEntry] = useState<IEntryDetail | null>(null);


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
    }, [messages]);

    useEffect(() => {
        var assistantEntryId = searchParams.get('assistant-entry-id');
        if (assistantEntryId) {
            getEntryDetail(assistantEntryId).then((entry) => {
                setAssistantEntry(entry);
            });
        }

    }, [searchParams]);

    async function sendMessage(message: string) {
        setMessages((prev) => [...prev, {
            role: "user", content: {
                type: "message",
                data: message
            }
        }]);
        setGeneratingResponse(true);

        // Add loading indicator
        const loadingMsgId = `loading-${Date.now()}`;
        setMessages((prev) => [...prev, {
            role: "assistant",
            content: {
                type: "loading",
                data: "Generating response..."
            },
            id: loadingMsgId
        }]);

        try {
            var currentChatId = chatId;
            if (!currentChatId) {
                const response = await axios.post(`${import.meta.env.ELVIRA_ASSISTANT_URL}/api/startchat`, {
                    entryId: assistantEntry?.id || null,
                    apiKey: auth?.token || null
                });
                currentChatId = response.data.chatId;
                setChatId(currentChatId);
            }

            const response = await fetch(`${import.meta.env.ELVIRA_ASSISTANT_URL}/api/sendchat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatId: currentChatId,
                    message: message,
                    entryId: assistantEntry?.id || null,
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
                                    // Remove loading indicator and start streaming message
                                    hasReceivedFirstChunk = true;
                                    const streamingMsgId = `streaming-${Date.now()}`;
                                    setMessages((prev) => {
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
                                    setMessages((prev) => {
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
                                    setMessages((prev) => {
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
                                setMessages((prev) => [...prev, {
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
                                setMessages((prev) => {
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
            setMessages((prev) => {
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
        setShowSuggestions(false);
    };

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;
        setShowSuggestions(false);
        sendMessage(input);
        setInput("");
    };

    function handleCloseDrawer() {
        setShowAiAssistant(false);
        const params = new URLSearchParams(searchParams);
        params.delete('dialog-priority');
        params.delete('assistant-entry-id');
        setSearchParams(params);
    }

    return (
        <Drawer
            anchor="right"
            open={showAiAssistant}
            onClose={handleCloseDrawer}
            transitionDuration={300}
            sx={{
                zIndex: searchParams.get('dialog-priority') ?
                    (searchParams.get('dialog-priority') == 'ai-assistant' ? 1200 : 49)
                    : 1200
            }}
            PaperProps={{
                sx: {
                    maxWidth: 800,
                    width: "100%",
                    borderTopLeftRadius: 8,
                    borderBottomLeftRadius: 8,
                    backgroundColor: "#F4F6F9",
                    ".dark &": {
                        backgroundColor: '#27272A'
                    },
                    boxShadow: 6,
                    overflow: "hidden",
                },
            }}
        >
            <Box className="p-3 h-full flex flex-col">
                {/* Header */}
                <Box className="flex items-center justify-between mb-2">
                    <Typography variant="h6" fontWeight={600} className="text-black dark:text-white">
                        {t("assistant.title")}
                    </Typography>
                    <IconButton onClick={(e) => {
                        e.stopPropagation();
                        handleCloseDrawer();
                    }}>
                        <FaX size={16} className="text-black dark:text-white" />
                    </IconButton>
                </Box>

                {/* Body */}
                <Box id="chat" className="flex flex-col grow overflow-y-auto">
                    {messages.map((msg, index) => (
                        <MessageElement key={`msg-${index}-${msg.content.type}`} msg={msg} msgIndex={index} />
                    ))}
                </Box>

                {/* Input */}
                <Box component="form" onSubmit={handleSubmit}>
                    {!assistantEntry && showSuggestions ? <Box className="flex gap-2 mb-2">
                        <AiSuggestion suggestion={t("assistant.suggestion1")} handleSuggestion={handleSuggestion} />
                        <AiSuggestion suggestion={t("assistant.suggestion2")} handleSuggestion={handleSuggestion} />
                    </Box> : null}
                    {assistantEntry ?
                        <Box className="mb-0.5 p-0 rounded-lg bg-inherit dark:text-zinc-200 self-start flex w-full items-center">
                            <Typography className="whitespace-nowrap max-w-full overflow-hidden text-ellipsis text-xs pr-2">
                                {t("assistant.entryAssistant", { x: assistantEntry.title })}
                            </Typography>
                            <Box className="ml-auto" onClick={() => { clearAssistantEntry(); }}>
                                <FaX size={12} className="text-black dark:text-white cursor-pointer" />
                            </Box>
                        </Box> : null
                    }
                    <TextField
                        fullWidth
                        size="small"
                        disabled={isGeneratingResponse}
                        placeholder={t("assistant.inputPlaceholder")}
                        sx={{
                            backgroundColor: "grey.100",
                            borderRadius: 2,
                            "&:hover": { backgroundColor: "grey.200" },
                            ".dark &": {
                                backgroundColor: '#3f3f46',
                                "&:hover": { backgroundColor: '#4b5563' },
                                "& .MuiInputBase-input": {
                                    color: '#e5e7eb',
                                }
                            },
                        }}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton type="submit" edge="end">
                                        <FaPaperPlane size={14} className="dark:text-white" />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>
            </Box>
        </Drawer >
    );
}
