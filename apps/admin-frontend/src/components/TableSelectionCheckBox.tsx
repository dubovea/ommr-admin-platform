import { Checkbox } from "@/components/ui/checkbox";

export type CheckedState = boolean | "indeterminate";

export const SELECTION_COLUMN_SIZE = 43;

export function getSelectionCheckboxState(
  isAllSelected: boolean,
  isSomeSelected: boolean,
): CheckedState {
  return isAllSelected || (isSomeSelected ? "indeterminate" : false);
}

export function TableSelectionCheckBox({
  checked,
  onCheckedChange,
  ariaLabel,
}: {
  checked: CheckedState;
  onCheckedChange: (checked: CheckedState) => void;
  ariaLabel: string;
}) {
  return (
    <div className="flex w-10 items-center justify-center">
      <Checkbox
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={ariaLabel}
        className="size-4 cursor-pointer"
      />
    </div>
  );
}
