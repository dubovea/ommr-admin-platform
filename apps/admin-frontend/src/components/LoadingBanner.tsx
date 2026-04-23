import { Loader2 } from "lucide-react";
import { Card, CardContent } from "./ui/card";

export function LoadingBanner() {
  return (
    <Card className="border-blue-200 bg-blue-50/40 shadow-none">
      <CardContent className="flex gap-4 p-4">
        <div className="flex items-center">
          <Loader2 className="size-7 animate-spin text-blue-600" />
        </div>

        <div>
          <div className="font-semibold">
           Загружаем данные.
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
           Пожалуйста, подождите, идёт получение и обработка информации...
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
