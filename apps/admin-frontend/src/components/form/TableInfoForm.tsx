import type {
  Control,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
import type { AdminTableMeta } from "@ommr/shared";
import type { AdminTableFormValues } from "@ommr/shared/zod";
import { MainInfoForm } from "./MainInfoForm";
import { ActionsForm } from "./ActionsForm";

type Mode = "create" | "edit" | "view";

type TableInfoFormProps = {
  mode: Mode;
  control: Control<AdminTableFormValues>;
  register: UseFormRegister<AdminTableFormValues>;
  setValue: UseFormSetValue<AdminTableFormValues>;
  tableId?: string;
  editTableData?: { data: AdminTableMeta };
};

export function TableInfoForm(props: TableInfoFormProps) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-5">
      <MainInfoForm {...props} />
      <ActionsForm mode={props.mode} control={props.control} />
    </div>
  );
}
