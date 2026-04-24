import { useRef } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useImportPydanticSchema } from "@/providers/pydantic";

export function ImportPydanticButton() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { importFile, isPending } = useImportPydanticSchema();
  return (
    <>
      <Button
        variant="outline"
        disabled={isPending}
        className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-700"
        onClick={() => inputRef.current?.click()}
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Upload className="size-4" />
        )}
        Импортировать схему Pydantic
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          await importFile(file);
          event.target.value = "";
        }}
      />
    </>
  );
}
