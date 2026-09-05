import Link from "next/link";

function TabSwitcher() {
  return (
    <div className="flex items-center p-1 bg-surface rounded-xl mb-6 border border-border">
      <Link
        href="/login"
        className="flex-1 text-center py-2 text-xs font-semibold rounded-lg bg-card text-text-primary shadow-xs transition-colors"
      >
        Sign In
      </Link>

      <Link
        href="/signup"
        className="flex-1 text-center py-2 text-xs font-semibold rounded-lg text-text-secondary hover:text-text-primary transition-colors"
      >
        Create Account
      </Link>
    </div>
  );
}

export default TabSwitcher;
