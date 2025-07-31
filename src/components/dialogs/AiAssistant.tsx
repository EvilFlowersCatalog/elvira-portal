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

/* Add support for custom elements, calendars, etc. */
function getMessageElement(msg: { role: string; content: any }, index: number) {
    return <Box
        key={index}
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
        {msg.content}
    </Box>
}

export default function AiAssistant() {
    const { t } = useTranslation();
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
        setMessages((prev) => [...prev, { role: "user", content: message }]);
        // Simulate AI response
        setTimeout(() => {
            receiveMessage(`Tak to je crazy! Neviem.`);
        }, 1000);
        setInput("");
    }

    function receiveMessage(response: string) {
        setMessages((prev) => [...prev, { role: "assistant", content: response }]);
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
            PaperProps={{
                sx: {
                    maxWidth: 400,
                    width: "100%",
                    borderTopLeftRadius: 8,
                    borderBottomLeftRadius: 8,
                    backgroundColor: "white",
                    ".dark &": {
                        backgroundColor: '#27272A'
                    },
                    boxShadow: 6,
                    overflow: "hidden",
                },
            }}
        >
            <Box
                sx={{
                    p: 3,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 2,
                    }}
                >
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
                        getMessageElement(msg, index)
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
