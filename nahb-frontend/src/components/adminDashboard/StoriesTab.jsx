import { Gamepad2, Star } from "lucide-react";

export default function StoriesTab({ stories, onSuspendStory }) {
  return (
    <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
      <div className="p-6">
        <h3 className="text-2xl font-semibold leading-none tracking-tight">
          Gestion des histoires
        </h3>
        <p className="text-sm text-muted-foreground mt-1.5">
          Modérez le contenu publié
        </p>
      </div>
      <div className="p-6 pt-0 space-y-4">
        {stories.map((story) => (
          <div
            key={story._id}
            className="rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold text-lg">{story.title}</h4>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {story.description}
                </p>
                <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Gamepad2 className="w-4 h-4" />
                    {story.stats?.totalPlays || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    {story.rating?.average?.toFixed(1) || "N/A"}
                  </span>
                  <span
                    className={`font-semibold ${
                      story.status === "publié" ? "text-primary" : "text-accent"
                    }`}
                  >
                    {story.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onSuspendStory(story._id, story.isSuspended)}
                className={`ml-4 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 ${
                  story.isSuspended
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "bg-destructive text-destructive-foreground hover:opacity-90"
                } transition-opacity`}
              >
                {story.isSuspended ? "Réactiver" : "Suspendre"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
