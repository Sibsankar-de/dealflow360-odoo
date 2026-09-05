import { Card } from "@/components/ui/Card";
import SignupForm from "@/components/modules/auth/SignupForm";
import TabSwitcher from "@/components/modules/auth/TabSwitcher";

export default function SignupPage() {
  return (
    <Card className="w-full shadow-xl border-border bg-card p-6 sm:p-8 rounded-2xl">
      <TabSwitcher />

      <SignupForm />
    </Card>
  );
}
