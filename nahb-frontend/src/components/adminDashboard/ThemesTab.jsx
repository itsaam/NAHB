import { Palette, Plus, Trash2, Image } from "lucide-react";

export default function ThemesTab({
  themes,
  onCreateTheme,
  onDeleteTheme,
  onAddImage,
  onDeleteImage,
}) {
  return (
    <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
      <div className="p-6 flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-semibold leading-none tracking-tight">
            Gestion des thèmes
          </h3>
          <p className="text-sm text-muted-foreground mt-1.5">
            Gérez les thèmes et le catalogue d'images
          </p>
        </div>
        <button
          onClick={onCreateTheme}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Nouveau thème
        </button>
      </div>
      <div className="p-6 pt-0 space-y-6">
        {themes.map((theme) => (
          <div key={theme.id} className="rounded-lg border border-border p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary" />
                  {theme.name}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {theme.description || "Aucune description"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onAddImage(theme)}
                  className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-sm font-medium h-9 px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Image className="w-4 h-4" />
                  Ajouter image
                </button>
                <button
                  onClick={() => onDeleteTheme(theme.id)}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-3 bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Catalogue d'images du thème */}
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">
                Catalogue ({theme.images?.length || 0} images)
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {theme.images?.map((img) => (
                  <div
                    key={img.id}
                    className="relative group rounded-lg overflow-hidden aspect-video bg-muted"
                  >
                    <img
                      src={img.image_url}
                      alt={img.alt_text || "Image"}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => onDeleteImage(img.id)}
                      className="absolute top-1 right-1 p-1 rounded bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {(!theme.images || theme.images.length === 0) && (
                  <p className="col-span-full text-sm text-muted-foreground">
                    Aucune image dans ce thème
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
