import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export function ForgotPasswordForm() {
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>ForgotPasswordForm</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input placeholder="Email" />
        <Button className="w-full">Продолжить</Button>
      </CardContent>
    </Card>
  );
}
