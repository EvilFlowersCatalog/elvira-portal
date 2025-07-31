import { Box, Drawer, Paper, Typography, IconButton } from "@mui/material";
import useAppContext from "../../hooks/contexts/useAppContext";
import { FaX } from "react-icons/fa6";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function AiAssistant() {
    var { t } = useTranslation();
    const { showAiAssistant, setShowAiAssistant, umamiTrack } = useAppContext();

    useEffect(() => {
        if (showAiAssistant) {
            umamiTrack('AI Assistant Button');
        }
    }, [showAiAssistant]);

    return (
        <Drawer
            anchor="right"
            open={showAiAssistant}
            onClose={() => setShowAiAssistant(false)}
            transitionDuration={300} // smoother animation
            PaperProps={{
                sx: {
                    width: 400,
                    borderTopLeftRadius: 8,
                    borderBottomLeftRadius: 8,
                    backgroundColor: "background.paper",
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
                <Box sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2,
                }}>
                    <Typography variant="h6" fontWeight={600}>
                        {t('assistant.title')}
                    </Typography>
                    <IconButton onClick={() => setShowAiAssistant(false)}>
                        <FaX size={16} />
                    </IconButton>
                </Box>

                {/* Content */}
                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body1" color="text.secondary">
                        Asistujem rychlo :)
                    </Typography>
                </Box>
            </Box>
        </Drawer>
    );
}
