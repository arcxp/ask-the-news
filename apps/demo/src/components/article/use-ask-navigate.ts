import { useCallback } from "react";
import { useNavigate } from "react-router";

export function useAskNavigate() {
    const navigate = useNavigate();
    return useCallback(
        (question: string) => {
            const trimmed = question.trim();
            if (!trimmed) return;
            navigate(`/ask-the-news?q=${encodeURIComponent(trimmed)}`, { viewTransition: true });
        },
        [navigate]
    );
}
