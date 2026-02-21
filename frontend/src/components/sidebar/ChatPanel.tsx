import { useRef, useState, useEffect } from "react";
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "react-i18next";
import { useAiChat } from "@/hooks/useAiChat";
import type { MasterPlan, PlanObject, Project } from "@/types/api";
import { cn, inputClassName } from "@/lib/utils";
import { CHAT_TYPING_DELAYS_MS } from "@/constants";
import { getPlanObjectName, getPlanObjectArea } from "@/lib/objectHelpers";

interface ChatPanelProps {
  activeMasterPlan: MasterPlan | null;
  activeProject?: Project | null;
  selectedObjects: PlanObject[];
  onClose: () => void;
}

export function ChatPanel({
  activeMasterPlan,
  activeProject = null,
  selectedObjects,
  onClose,
}: ChatPanelProps) {
  const { t } = useTranslation();
  const contextList = selectedObjects.map((o) => ({
    id: o.id,
    name: getPlanObjectName(o),
    area: getPlanObjectArea(o),
  }));
  const { messages, sendMessage, isTyping } = useAiChat(
    activeMasterPlan,
    contextList,
    activeProject?.id ?? null
  );
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isTyping) return;
    setInputValue("");
    sendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasContext =
    activeMasterPlan ||
    selectedObjects.length > 0 ||
    (activeProject != null && activeProject.id != null);

  const masterPlanLabel = activeMasterPlan
    ? activeMasterPlan.name
    : t("sidebar.allPlans");

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <SparklesIcon className="size-4" />
          </div>
          <span className="font-semibold">{t("aiChat.title")}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label={t("aiChat.close")}
        >
          <XMarkIcon className="size-5" />
        </button>
      </div>

      {hasContext && (
        <div className="mx-4 mt-3 shrink-0 rounded-lg border bg-muted/50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
            {t("aiChat.contextHeading")}
          </p>
          <ul className="space-y-1 text-sm">
            {activeProject && (
              <li className="font-medium">
                {activeProject.name} — {masterPlanLabel}
              </li>
            )}
            {!activeProject && activeMasterPlan && (
              <li className="font-medium">{activeMasterPlan.name}</li>
            )}
            {!activeProject && !activeMasterPlan && (
              <li className="font-medium">{masterPlanLabel}</li>
            )}
            {contextList.map((obj) => (
              <li
                key={obj.id}
                className="flex items-center gap-1.5 text-muted-foreground"
              >
                <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                {obj.name} — {obj.area.toLocaleString()}{" "}
                {t("objectCard.unitM2")}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-2",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "ai" && (
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-1">
                  <SparklesIcon className="size-3.5" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2.5 text-sm leading-relaxed",
                  msg.role === "ai"
                    ? "bg-muted text-foreground"
                    : "bg-primary text-primary-foreground"
                )}
              >
                {msg.role === "ai" ? (
                  <div className="chat-markdown [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:ml-4 [&_ol]:ml-4 [&_li]:my-0.5 [&_p]:my-1 [&_p:first]:mt-0 [&_p:last]:mb-0 [&_strong]:font-semibold [&_code]:rounded [&_code]:bg-muted-foreground/15 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-2 items-start">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <SparklesIcon className="size-3.5" />
              </div>
              <div className="flex gap-1 rounded-lg bg-muted px-4 py-3">
                {CHAT_TYPING_DELAYS_MS.map((delayMs) => (
                  <span
                    key={delayMs}
                    className="size-2 animate-bounce rounded-full bg-muted-foreground/50"
                    style={{ animationDelay: `${delayMs}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t p-4">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 text-muted-foreground"
            aria-label={t("aiChat.attachFile")}
            title={t("aiChat.attachFile")}
          >
            <PaperClipIcon className="size-4" />
          </Button>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("aiChat.placeholder")}
            className={inputClassName}
          />
          <Button
            type="button"
            size="icon"
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            className="shrink-0 rounded-full bg-primary text-primary-foreground hover:opacity-90"
            aria-label={t("aiChat.send")}
          >
            <PaperAirplaneIcon className="size-4" />
          </Button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mx-auto mt-3 flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3" />
          {t("aiChat.backToPanel")}
        </button>
      </div>
    </div>
  );
}
