import { useState } from "react";
import { Download, FileJson, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useExportMetadata } from "@/lib/export-metadata";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { ScrollArea } from "@/components/ui/scroll-area";

export function ExportMetadataButton() {
  const [open, setOpen] = useState(false);

  const {
    previewData,
    previewJson,
    isPreviewLoading,
    isDownloading,
    loadPreview,
    downloadMetadata,
    resetPreview,
  } = useExportMetadata();

  async function handleOpenPreview() {
    setOpen(true);
    await loadPreview();
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      resetPreview();
    }
  }

  return (
    <>
      <Button
        variant="outline"
        disabled={isPreviewLoading}
        className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-700"
        onClick={handleOpenPreview}
      >
        {isPreviewLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <FileJson className="size-4" />
        )}

        {isPreviewLoading ? "Загрузка..." : "Экспорт UX-настроек"}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="flex max-h-[90vh] w-[calc(100vw-2rem)] max-w-5xl flex-col overflow-hidden p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>Предпросмотр UX-настроек</DialogTitle>
            <DialogDescription>
              Проверьте JSON перед скачиванием файла.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 px-6 py-4">
            <div className="flex h-[min(60vh,560px)] min-h-80 overflow-hidden rounded-md border bg-muted/30">
              {isPreviewLoading ? (
                <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Загружаем metadata...
                </div>
              ) : previewData ? (
                <ScrollArea className="h-full w-full">
                  <pre className="min-w-max p-4 text-xs leading-relaxed">
                    <code>{previewJson}</code>
                  </pre>
                </ScrollArea>
              ) : (
                <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                  Нет данных для предпросмотра
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="border-t px-6 py-4">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isDownloading}
            >
              Закрыть
            </Button>

            <Button
              disabled={!previewData || isPreviewLoading || isDownloading}
              onClick={downloadMetadata}
            >
              {isDownloading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              Скачать JSON
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
