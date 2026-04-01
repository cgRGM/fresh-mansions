import { Button } from "@fresh-mansions/ui/components/button";
import { Link } from "@tanstack/react-router";

import type { AppSession } from "@/lib/session";

interface SuperUserViewSwitcherProps {
  className?: string;
  session: AppSession;
}

const superUserViews = [
  { href: "/app/dashboard", label: "View Customer" },
  { href: "/admin/quotes", label: "View Admin" },
  { href: "/contractor", label: "View Contractor" },
] as const;

export const SuperUserViewSwitcher = ({
  className,
  session,
}: SuperUserViewSwitcherProps) => {
  if (session.appUser.role !== "super_user") {
    return null;
  }

  return (
    <div className={className}>
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-current/50">
        Super user views
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {superUserViews.map((view) => (
          <Button
            key={view.href}
            asChild
            className="rounded-full"
            size="sm"
            variant="outline"
          >
            <Link to={view.href}>{view.label}</Link>
          </Button>
        ))}
      </div>
    </div>
  );
};
