import { Users, BookOpen, PlayCircle, Star, Flag, Ban } from "lucide-react";

export default function StatsTab({ stats }) {
  const statCards = stats
    ? [
        {
          label: "Utilisateurs",
          value: stats.users.total_users,
          icon: Users,
          color: "text-primary",
        },
        {
          label: "Histoires",
          value: stats.stories.total,
          icon: BookOpen,
          color: "text-accent",
        },
        {
          label: "Parties jouées",
          value: stats.stories.totalPlays,
          icon: PlayCircle,
          color: "text-primary",
        },
        {
          label: "Avis",
          value: stats.reviews.total,
          icon: Star,
          color: "text-accent",
        },
        {
          label: "Signalements",
          value: stats.reports.total_reports,
          icon: Flag,
          color: "text-destructive",
        },
        {
          label: "Utilisateurs bannis",
          value: stats.users.banned_users,
          icon: Ban,
          color: "text-muted-foreground",
        },
      ]
    : [];

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="rounded-lg border border-border bg-card text-card-foreground shadow-sm"
          >
            <div className="p-6 flex flex-row items-center justify-between pb-2">
              <h3 className="tracking-tight text-sm font-medium text-muted-foreground">
                {stat.label}
              </h3>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <div className="p-6 pt-0">
              <div className="text-3xl font-bold">{stat.value}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
