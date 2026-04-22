export function LoadingOverlay({ text = "Загрузка..." }: { text?: string }) {
  return (
    <div className="grid min-h-[50vh] place-items-center text-muted-foreground">
      {text}
    </div>
  );
}
