import { useApiUrl } from "@refinedev/core";
import { useCallback, useState } from "react";
import { toast } from "sonner";

export type ExportMetadataJsonResponse = {
  data?: unknown;
};

function getFilenameFromContentDisposition(header: string | null) {
  if (!header) {
    return null;
  }

  const utf8FilenameMatch = header.match(/filename\*=UTF-8''([^;]+)/i);

  if (utf8FilenameMatch?.[1]) {
    return decodeURIComponent(utf8FilenameMatch[1]);
  }

  const filenameMatch = header.match(/filename="?([^"]+)"?/i);

  return filenameMatch?.[1] ?? null;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

export function useExportMetadata() {
  const apiUrl = useApiUrl();

  const [previewData, setPreviewData] = useState<unknown>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const loadPreview = useCallback(async () => {
    if (isPreviewLoading) {
      return;
    }

    setIsPreviewLoading(true);

    try {
      const response = await fetch(`${apiUrl}/metadata`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        let message = "Не удалось получить metadata";

        try {
          const errorBody = (await response.json()) as {
            message?: string;
            error?: string;
          };

          message = errorBody.message || errorBody.error || message;
        } catch {
          // response может быть не JSON
        }

        throw new Error(message);
      }

      const json = (await response.json()) as ExportMetadataJsonResponse;

      setPreviewData(json.data ?? json);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Не удалось получить metadata",
      );

      setPreviewData(null);
    } finally {
      setIsPreviewLoading(false);
    }
  }, [apiUrl, isPreviewLoading]);

  const downloadMetadata = useCallback(async () => {
    if (isDownloading) {
      return;
    }

    setIsDownloading(true);

    try {
      const response = await fetch(`${apiUrl}/metadata?download=true`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        let message = "Не удалось скачать metadata";

        try {
          const errorBody = (await response.json()) as {
            message?: string;
            error?: string;
          };

          message = errorBody.message || errorBody.error || message;
        } catch {
          // response может быть не JSON
        }

        throw new Error(message);
      }

      const blob = await response.blob();

      const filename =
        getFilenameFromContentDisposition(
          response.headers.get("content-disposition"),
        ) ?? "metadata.json";

      downloadBlob(blob, filename);

      toast.success("Metadata экспортирована");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Не удалось скачать metadata",
      );
    } finally {
      setIsDownloading(false);
    }
  }, [apiUrl, isDownloading]);

  const resetPreview = useCallback(() => {
    setPreviewData(null);
  }, []);

  return {
    previewData,
    previewJson: previewData ? JSON.stringify(previewData, null, 2) : "",
    isPreviewLoading,
    isDownloading,
    loadPreview,
    downloadMetadata,
    resetPreview,
  };
}
