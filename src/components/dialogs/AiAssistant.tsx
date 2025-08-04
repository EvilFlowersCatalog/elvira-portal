import {
    Box,
    Drawer,
    Typography,
    IconButton,
    TextField,
    InputAdornment,
} from "@mui/material";
import { FaX, FaPaperPlane } from "react-icons/fa6";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import useAppContext from "../../hooks/contexts/useAppContext";
import EntryItem from "../items/entry/display/EntryItem";
import useGetEntryDetail from "../../hooks/api/entries/useGetEntryDetail";
import { IEntry, IEntryDetail } from "../../utils/interfaces/entry";
import { useSearchParams } from "react-router-dom";

interface MessageContent {
    type: "message" | 'entries'
    data: any
}

function AiSuggestion({ suggestion, handleSuggestion }: { suggestion: string, handleSuggestion: (suggestion: string) => void }) {
    return (
        <Box
            className="flex items-center justify-center flex-1 rounded-lg p-2 cursor-pointer transition-colors duration-200 text-center text-sm bg-zinc-200 text-gray hover:bg-zinc-300 dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600"
            onClick={() => {
                handleSuggestion(suggestion);
            }}
        >
            {suggestion}
        </Box>
    );
}


function MessageElement({ msg }: { msg: { role: string; content: MessageContent } }) {
    const [books, setBooks] = useState<any[]>([]);
    const getEntryDetail = useGetEntryDetail();

    useEffect(() => {
        if (msg.content.type === "entries") {
            const entryIds = msg.content.data.entryIds;
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
    }, [])

    switch (msg.content.type) {
        case "message":
            return <Box className="mb-2 p-2 rounded-lg max-w-[80%]"
                sx={{
                    backgroundColor: msg.role === "user" ? "primary.main" : "grey.200",
                    color: msg.role === "user" ? "white" : "text.primary",
                    alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                }}>
                {msg.content.data}
            </Box>;
        case "entries":
            return <Box className="flex gap-3 mb-2 py-2 shrink-0"
            >
                {books.map((entry: IEntry) => (
                    <EntryItem entry={entry} key={"ai-" + entry.id} id={'ai-' + entry.id} type="ai-recommendation" />
                ))}
            </Box>
        default:
            return <p className="dark:text-white text-center">404</p>
    }
}

export default function AiAssistant() {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const { showAiAssistant, setShowAiAssistant, umamiTrack } = useAppContext();
    const getEntryDetail = useGetEntryDetail();

    const [input, setInput] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(true);
    const [messages, setMessages] = useState<{ role: string; content: any }[]>([]);
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

    function sendMessage(message: string) {
        setMessages((prev) => [...prev, {
            role: "user", content: {
                type: "message",
                data: message
            }
        }]);
        // Simulate AI response
        setTimeout(() => {
            receiveMessage(`Tak to je crazy! Neviem, tu máš moje obľúbené knihy.`);
        }, 1000);
        setInput("");
    }

    /* todo: response: AiResponse interface  */
    function receiveMessage(response: string) {
        // Simulate AI response
        setMessages((prev) => [
            ...prev,
            {
                role: "assistant",
                content: {
                    type: "message",
                    data: response,
                },
            },
            {
                role: "assistant",
                content: {
                    type: "entries",
                    data: {
                        entryIds: ['ce40e042-1491-434f-a0b4-593c0a867b99', 'b623e984-a8e7-4d9d-ade0-15084faaccb5'],
                    },
                },
            },
        ]);
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
                        <MessageElement key={index} msg={msg} />
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
