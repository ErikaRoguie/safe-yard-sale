import { Badge, BadgeProps } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import type { SelectBadge } from "@db/schema";

const BADGE_COLORS = {
  bronze: "bg-amber-600",
  silver: "bg-slate-400",
  gold: "bg-yellow-400",
};

interface SellerBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  badge: SelectBadge;
  showTooltip?: boolean;
}

export function BadgeDisplay({
  badge,
  showTooltip = true,
  className,
  ...props
}: SellerBadgeProps) {
  const badgeContent = (
    <div
      className={cn(
        "inline-flex items-center justify-center",
        "w-8 h-8 rounded-full",
        BADGE_COLORS[badge.tier as keyof typeof BADGE_COLORS] || "bg-gray-200",
        className
      )}
      {...props}
    >
      <span className="sr-only">{badge.name}</span>
      {/* You can replace this with an actual SVG icon based on the badge type */}
      <span className="text-xs font-bold text-white">
        {badge.name.charAt(0).toUpperCase()}
      </span>
    </div>
  );

  if (!showTooltip) {
    return badgeContent;
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        {badgeContent}
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex justify-between space-x-4">
          <div>
            <h4 className="text-sm font-semibold">{badge.name}</h4>
            <p className="text-sm text-muted-foreground">
              {badge.description}
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
