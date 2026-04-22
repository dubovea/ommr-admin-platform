import { UserAvatar } from "./user-avatar";
export function UserInfo() {
  return (
    <div className="flex items-center gap-3">
      <UserAvatar />
      <div>
        <div className="text-sm font-semibold">Алексей П.</div>
        <div className="text-xs text-muted-foreground">Администратор</div>
      </div>
    </div>
  );
}
