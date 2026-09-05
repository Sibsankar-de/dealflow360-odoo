import { Card } from "@/components/ui/Card";
import LoginForm from "@/components/modules/auth/LoginForm";
import TabSwitcher from "@/components/modules/auth/TabSwitcher";

export default function LoginPage() {
  return (
    <Card className="w-full shadow-xl border-border bg-card p-6 sm:p-8 rounded-2xl">
      <TabSwitcher />

      <LoginForm />
    </Card>
  );
}
