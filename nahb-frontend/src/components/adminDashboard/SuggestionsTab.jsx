import { ImagePlus, Check, X } from "lucide-react";

export default function SuggestionsTab({
  suggestions,
  onApproveSuggestion,
  onRejectSuggestion,
}) {
  return (
    <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
      <div className="p-6">
        <h3 className="text-2xl font-semibold leading-none tracking-tight">
          Suggestions d'images
        </h3>
        <p className="text-sm text-muted-foreground mt-1.5">
          Images proposées par les utilisateurs pour les thèmes
        </p>
      </div>
      <div className="p-6 pt-0">
        {suggestions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ImagePlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucune suggestion en attente</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="rounded-lg border border-border overflow-hidden bg-background"
              >
                <div className="aspect-video bg-muted">
                  <img
                    src={suggestion.image_url}
                    alt="Suggestion"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {suggestion.theme_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(suggestion.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Proposé par{" "}
                    <span className="font-medium text-foreground">
                      {suggestion.user_pseudo}
                    </span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onApproveSuggestion(suggestion.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1 h-9 px-3 rounded-md text-sm font-medium bg-seaweed-500 text-white hover:bg-seaweed-600 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Approuver
                    </button>
                    <button
                      onClick={() => onRejectSuggestion(suggestion.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1 h-9 px-3 rounded-md text-sm font-medium bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                      Refuser
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
