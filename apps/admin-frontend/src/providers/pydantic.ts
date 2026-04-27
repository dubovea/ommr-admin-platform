import { useApiUrl, useInvalidate } from "@refinedev/core";
import { useCallback, useState } from "react";
import { toast } from "sonner";

type ImportPydanticSchemaResponse = {
  importedTables: number;
  importedFields: number;
  mappedRelations: number;
  skippedRelations: number;
  tableIds: string[];
};

type ApiResponse<T> = {
  data: T;
};

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const errorBody = (await response.json()) as {
      message?: string;
      error?: string;
      data?: {
        message?: string;
      };
    };

    return (
      errorBody.message ||
      errorBody.error ||
      errorBody.data?.message ||
      fallback
    );
  } catch {
    try {
      const text = await response.text();

      return text || fallback;
    } catch {
      return fallback;
    }
  }
}

export function useImportPydanticSchema() {
  const apiUrl = useApiUrl();
  const invalidate = useInvalidate();

  const [isPending, setIsPending] = useState(false);

  const importFile = useCallback(
    async (file: File) => {
      if (isPending) {
        return;
      }

      setIsPending(true);

      try {
        const schema = JSON.parse(await file.text()) as unknown;

        const response = await fetch(`${apiUrl}/schemas/parse-pydantic`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ schema }),
        });

        if (!response.ok) {
          const message = await getErrorMessage(
            response,
            "Не удалось импортировать Pydantic schema",
          );

          throw new Error(message);
        }

        const json =
          (await response.json()) as ApiResponse<ImportPydanticSchemaResponse>;

        toast.success(
          `Импортировано: ${json.data.importedTables} таблиц, ${json.data.importedFields} полей`,
        );

        await invalidate({
          resource: "tables",
          invalidates: ["list"],
        });
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Некорректный JSON-файл",
        );
      } finally {
        setIsPending(false);
      }
    },
    [apiUrl, invalidate, isPending],
  );

  return {
    importFile,
    isPending,
  };
}