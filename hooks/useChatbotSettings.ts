import { useSettings } from "@/hooks/useSettings";

export function useChatbotSettings() {
  const { data } = useSettings();
  return {
    chatbotAvatar: data?.chatbotAvatar || null,
    chatbotName: data?.chatbotName || "",
  };
}
