import {
  Database,
  FileJson,
  GitBranch,
  Network,
  PencilRuler,
  Settings2,
  Table2,
  UploadCloud,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PROCESS_STEPS = [
  {
    title: "Импорт Pydantic-схемы",
    description:
      "Админка принимает JSON Schema, сформированную из Python Pydantic-моделей, и автоматически выделяет будущие таблицы, поля, типы и связи.",
    icon: <FileJson className="size-5" />,
  },
  {
    title: "Создание структуры таблиц",
    description:
      "После импорта система сохраняет таблицы и поля в metadata-слое. Это позволяет не менять frontend вручную при изменении Python-моделей.",
    icon: <Database className="size-5" />,
  },
  {
    title: "Настройка UX-свойств",
    description:
      "Для каждой таблицы и каждого поля можно настроить отображаемое название, видимость, редактируемость, обязательность, сортировку и фильтрацию.",
    icon: <PencilRuler className="size-5" />,
  },
  {
    title: "Настройка связей",
    description:
      "Поля могут быть связаны с другими таблицами через relation: целевая таблица, ключ связи, поле отображения и дополнительный текст.",
    icon: <Network className="size-5" />,
  },
];

const FEATURE_CARDS = [
  {
    title: "Таблицы",
    description:
      "Раздел для просмотра, поиска, группировки, ручного создания и редактирования таблиц.",
    icon: <Table2 className="size-5" />,
  },
  {
    title: "Поля",
    description:
      "Настройка полей таблицы: название, тип ввода, отображение, required/editable/visible-флаги и relation-настройки.",
    icon: <Settings2 className="size-5" />,
  },
  {
    title: "Граф связей",
    description:
      "Визуальный граф показывает, какие таблицы связаны между собой и через какие поля построены отношения.",
    icon: <GitBranch className="size-5" />,
  },
  {
    title: "Metadata export",
    description:
      "Экспорт итоговой metadata-структуры для дальнейшего использования в основном OMMR-приложении.",
    icon: <UploadCloud className="size-5" />,
  },
];

export function OverviewPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-gradient-to-br from-blue-50 via-background to-violet-50 p-6">
        <div className="max-w-4xl">
          <div className="mb-3 inline-flex rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            OMMR Admin Platform
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Админ-панель для управления metadata-структурой приложения
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            Это приложение предназначено для импорта Pydantic-схем из Python,
            автоматического построения структуры таблиц и последующей настройки
            UX-свойств: названий, видимости, редактируемости, обязательности,
            типов ввода и связей между таблицами.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {FEATURE_CARDS.map((item) => (
          <Card key={item.title} className="shadow-sm">
            <CardHeader className="space-y-3">
              <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                {item.icon}
              </div>

              <CardTitle className="text-base">{item.title}</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Основной процесс работы</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {PROCESS_STEPS.map((step, index) => (
              <div
                key={step.title}
                className="grid grid-cols-[40px_minmax(0,1fr)] gap-4"
              >
                <div className="flex flex-col items-center">
                  <div className="grid size-10 place-items-center rounded-full border bg-background text-primary shadow-sm">
                    {step.icon}
                  </div>

                  {index < PROCESS_STEPS.length - 1 && (
                    <div className="mt-2 h-10 w-px bg-border" />
                  )}
                </div>

                <div className="pb-4">
                  <h3 className="font-semibold">{step.title}</h3>

                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="h-fit shadow-sm">
          <CardHeader>
            <CardTitle>Что уже поддерживается</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">
            <FeatureLine text="Импорт таблиц и полей из Pydantic JSON Schema" />
            <FeatureLine text="Ручное добавление таблиц и полей" />
            <FeatureLine text="Редактирование UX-настроек таблиц" />
            <FeatureLine text="Настройка visible / editable / required" />
            <FeatureLine text="Настройка relation между таблицами" />
            <FeatureLine text="Группировка таблиц для меню" />
            <FeatureLine text="Просмотр графа связей таблиц" />
            <FeatureLine text="Экспорт metadata для основного приложения" />
          </CardContent>
        </Card>
      </section>

      <Card className="border-dashed shadow-sm">
        <CardContent className="p-5">
          <div className="text-sm leading-6 text-muted-foreground">
            В дальнейшем админка может быть расширена дополнительными сценариями:
            настройкой прав доступа, advanced validation, шаблонами отображения,
            предпросмотром форм, генерацией меню, экспортом конфигураций и
            интеграцией с основным OMMR-интерфейсом.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FeatureLine({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-1.5 size-2 rounded-full bg-primary" />
      <span className="leading-6 text-muted-foreground">{text}</span>
    </div>
  );
}