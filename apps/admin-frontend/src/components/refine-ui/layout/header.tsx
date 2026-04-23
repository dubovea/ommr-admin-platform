import { useRef } from "react";
import { Bell, Loader2, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useImportPydanticSchema } from "@/providers/pydantic";
import { UserInfo } from "./user-info";

export function Header() {
  return (
    <header className="flex h-20 items-center justify-between border-b bg-card px-7">
      <div className="relative w-130 max-w-[40vw]">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-11 pl-9 pr-14"
          placeholder="Поиск по таблицам, схемам, полям..."
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
          ⌘K
        </kbd>
      </div>
      <div className="flex items-center gap-3">
        <ImportPydanticButton />
        <Button variant="ghost" size="icon">
          <Bell className="size-5" />
        </Button>
        <UserInfo />
      </div>
    </header>
  );
}

function ImportPydanticButton() {
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
        {isPending ? "Импорт..." : "Импортировать схему Pydantic"}
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
