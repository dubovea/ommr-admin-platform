export function Breadcrumb({ items = [] }: { items?: string[] }) {
  return (
    <div className="text-sm text-muted-foreground">{items.join(" / ")}</div>
  );
}
