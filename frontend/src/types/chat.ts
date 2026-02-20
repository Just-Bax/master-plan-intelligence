/**
 * AI chat types: messages and context passed to the chat API.
 */

export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
}

/** Minimal object context sent to AI chat (id, name, area). */
export interface SelectedObjectContext {
  id: number;
  name: string;
  area: number;
}
