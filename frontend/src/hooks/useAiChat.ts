import { useCallback, useState } from "react";
import { API_PATHS } from "@/constants";
import { apiPost } from "@/lib/api";
import i18n from "@/lib/i18n";
import type { MasterPlan } from "@/types/api";
import type { ChatMessage, SelectedObjectContext } from "@/types/chat";

export type { ChatMessage, SelectedObjectContext };

export function useAiChat(
  activeMasterPlan: MasterPlan | null,
  selectedObjects: SelectedObjectContext[],
  projectId: number | null = null
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      try {
        const history = [...messages, userMsg].map((message) => ({
          role: message.role,
          content: message.content,
        }));
        const response = await apiPost<{ message: string }>(API_PATHS.AI_CHAT, {
          messages: history,
          master_plan_id: activeMasterPlan?.id ?? null,
          object_id: selectedObjects.length > 0 ? selectedObjects[0].id : null,
          project_id: projectId ?? null,
        });

        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: "ai",
          content: response.message,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch {
        const errorMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: "ai",
          content: i18n.t("aiChat.errorMessage"),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsTyping(false);
      }
    },
    [activeMasterPlan?.id, messages, selectedObjects, projectId]
  );

  return { messages, sendMessage, isTyping };
}
