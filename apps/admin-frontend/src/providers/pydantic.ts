import { useApiUrl, useCustomMutation, useInvalidate } from "@refinedev/core";
import { toast } from "sonner";

type ImportPydanticSchemaResponse = {
  importedTables: number;
  importedFields: number;
  tableIds: string[];
};

export function useImportPydanticSchema() {
  const apiUrl = useApiUrl();
  const invalidate = useInvalidate();
  const { mutate, mutation } = useCustomMutation<
    ImportPydanticSchemaResponse,
    Error,
    { schema: unknown }
  >();
  async function importFile(file: File) {
    try {
      const schema = JSON.parse(await file.text()) as unknown;
      mutate(
        {
          url: `${apiUrl}/schemas/parse-pydantic`,
          method: "post",
          values: { schema },
        },
        {
          onSuccess: async ({ data }) => {
            toast.success(
              `Импортировано: ${data.importedTables} таблиц, ${data.importedFields} полей`,
            );
            await invalidate({ resource: "tables", invalidates: ["list"] });
          },
          onError: (error) =>
            toast.error(error.message || "Не удалось импортировать схему"),
        },
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Некорректный JSON-файл",
      );
    }
  }
  return { importFile, isPending: mutation.isPending };
}
