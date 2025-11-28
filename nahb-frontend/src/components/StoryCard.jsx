import { BookOpen, Star } from "lucide-react";
import { Link } from "react-router-dom";

export default function StoryCard({ story, showStats = true, actions = null }) {
  return (
    <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
        {story.coverImage ? (
          <img
            src={story.coverImage}
            alt={story.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-primary/30" />
          </div>
        )}
        {story.status && (
          <div className="absolute top-3 right-3">
            <span
              className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                story.status === "publié"
                  ? "bg-seaweed-100 text-seaweed-800"
                  : "bg-coffee-bean-100 text-coffee-bean-700"
              }`}
            >
              {story.status}
            </span>
          </div>
        )}
      </div>

      <div className="p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-lg leading-none tracking-tight line-clamp-1 mb-2">
            {story.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {story.description || "Aucune description"}
          </p>
        </div>

        {showStats && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              <span>{story.stats?.totalPlays || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4" />
              <span>{story.rating?.average?.toFixed(1) || "N/A"}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>✅ {story.stats?.totalCompletions || 0}</span>
            </div>
          </div>
        )}

        {actions && <div className="pt-2">{actions}</div>}
      </div>
    </div>
  );
}
