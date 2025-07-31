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
import { IEntry } from "../../utils/interfaces/entry";
import zIndex from "@mui/material/styles/zIndex";
import { useSearchParams } from "react-router-dom";

interface MessageContent {
    type: "message" | 'entries'
    data: any
}

/* CREATE COMPONENTS OUT OF PARTS ☠️ */
/* if entry detail is opened, it's always above, add check if popup was opened from the entry detail, or vice versa */

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
            return <Box
                sx={{
                    mb: 1,
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: msg.role === "user" ? "primary.main" : "grey.200",
                    color: msg.role === "user" ? "white" : "text.primary",
                    alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "80%",
                }}
            >
                {msg.content.data}
            </Box>;
        case "entries":
            return <Box
                sx={{
                    display: "flex",
                    overflowX: "auto",
                    gap: 1,
                    mb: 1,
                    py: 1,
                }}
            >
                {books.map((entry: IEntry) => (
                    <EntryItem entry={entry} id={'ai-' + entry.id} />
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

    const [input, setInput] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(true);
    const [messages, setMessages] = useState<{ role: string; content: any }[]>([]);

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

    function sendMessage(message: string) {
        setMessages((prev) => [...prev, {
            role: "user", content: {
                type: "message",
                data: message
            }
        }]);
        // Simulate AI response
        setTimeout(() => {
            receiveMessage(`Tak to je crazy! Neviem.`);
        }, 1000);
        setInput("");
    }

    function receiveMessage(response: string) {
        setMessages((prev) => [...prev, {
            role: "assistant", content: {
                type: "message",
                data: response
            }
        }]);
        setMessages((prev) => [...prev, {
            role: "assistant", content: {
                type: "entries",
                data: {
                    entryIds: ['ce40e042-1491-434f-a0b4-593c0a867b99', 'b623e984-a8e7-4d9d-ade0-15084faaccb5']
                }
            }
        }]);
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
    }

    return (
        <Drawer
            anchor="right"
            open={showAiAssistant}
            onClose={handleCloseDrawer}
            transitionDuration={300}
            sx={{
                zIndex: searchParams.get('entry-detail-id') ? 49 : 1200
            }}
            PaperProps={{
                sx: {
                    maxWidth: 400,
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
            <Box sx={{
                p: 3,
                height: "100%",
                display: "flex",
                flexDirection: "column",
            }}>
                {/* Header */}
                <Box sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2,
                }}>
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
                <Box
                    id="chat"
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        flexGrow: 1,
                        animation: "fadeIn 0.4s ease-in-out",
                        "@keyframes fadeIn": {
                            from: { opacity: 0 },
                            to: { opacity: 1 },
                        },
                        overflowY: "auto",
                    }}
                >
                    {messages.map((msg, index) => (
                        <MessageElement key={index} msg={msg} />
                    ))}
                </Box>

                {/* Input */}
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                    {showSuggestions ? <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                        <Box
                            sx={{
                                flex: 1,
                                backgroundColor: "grey.100",
                                borderRadius: 2,
                                px: 2,
                                py: 1,
                                cursor: "pointer",
                                transition: "background 0.2s",
                                "&:hover": { backgroundColor: "grey.200" },
                                ".dark &": {
                                    backgroundColor: '#3f3f46',
                                    color: '#e5e7eb',
                                    "&:hover": { backgroundColor: '#4b5563' }
                                },
                                fontSize: 14,
                                color: "text.secondary",
                                textAlign: "center",
                            }}
                            onClick={() => handleSuggestion(t("assistant.suggestion1"))}
                        >
                            {t("assistant.suggestion1")}
                        </Box>
                        <Box
                            sx={{
                                flex: 1,
                                backgroundColor: "grey.100",
                                borderRadius: 2,
                                px: 2,
                                py: 1,
                                cursor: "pointer",
                                transition: "background 0.2s",
                                "&:hover": { backgroundColor: "grey.200" },
                                ".dark &": {
                                    backgroundColor: '#3f3f46',
                                    color: '#e5e7eb',
                                    "&:hover": { backgroundColor: '#4b5563' }
                                },
                                fontSize: 14,
                                color: "text.secondary",
                                textAlign: "center",
                            }}
                            onClick={() => handleSuggestion(t("assistant.suggestion2"))}
                        >
                            {t("assistant.suggestion2")}
                        </Box>
                    </Box> : null}
                    <TextField
                        fullWidth
                        size="small"
                        placeholder={t("assistant.inputPlaceholder") || "Ask me anything..."}
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
        </Drawer>
    );
}
