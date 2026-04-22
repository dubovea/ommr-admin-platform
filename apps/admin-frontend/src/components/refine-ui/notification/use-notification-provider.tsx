import type { NotificationProvider } from "@refinedev/core";
import { toast } from "sonner";
export function useNotificationProvider(): NotificationProvider {
  return {
    open: ({ key, message, description, type }) => {
      const text = description ? `${message}: ${description}` : message;
      if (type === "success") return toast.success(text, { id: key });
      if (type === "error") return toast.error(text, { id: key });
      return toast(text, { id: key });
    },
    close: (key) => toast.dismiss(key),
  };
}
