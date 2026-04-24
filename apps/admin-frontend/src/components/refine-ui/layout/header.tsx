import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserInfo } from "./user-info";
import { ImportPydanticButton } from "@/components/ImportPydanticButton";
import { ExportMetadataButton } from "@/components/ExportMetadataButton";

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
        <ExportMetadataButton/>
        <Button variant="ghost" size="icon">
          <Bell className="size-5" />
        </Button>
        <UserInfo />
      </div>
    </header>
  );
}
