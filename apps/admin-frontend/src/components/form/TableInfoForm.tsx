import { Control, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { type AdminTableMeta, type UpdateAdminTableInput } from "@ommr/shared";
import { MainInfoForm } from "./MainInfoForm";
import { ActionsForm } from "./ActionsForm";

type Mode = "create" | "edit" | "view";

type TableInfoFormProps = {
  mode: Mode;
  control: Control<UpdateAdminTableInput>;
  register: UseFormRegister<UpdateAdminTableInput>;
  setValue: UseFormSetValue<UpdateAdminTableInput>;
  tableId?: string;
  editTableData?: { data: AdminTableMeta };
};

export function TableInfoForm(props: TableInfoFormProps) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-5">
      <MainInfoForm {...props} />
      <ActionsForm {...props} />
    </div>
  );
}