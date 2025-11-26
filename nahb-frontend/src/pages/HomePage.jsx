import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BookOpen, Sparkles, Users } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 sm:text-6xl md:text-7xl">
            <span className="block">Bienvenue sur</span>
            <span className="block text-indigo-600"> NAHB</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Narratives Aventureuses Hypertextuelles Branchées
          </p>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-600 sm:text-lg md:max-w-3xl">
            Plongez dans des histoires interactives où chaque choix compte.
            Lisez, créez et partagez vos aventures !
          </p>
        </div>

    <div className="min-h-screen bg-background">
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />

        {/* Content */}
        <div className="container relative z-10 px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span
                className="text-sm font-medium"
                style={{ color: "hsl(var(--primary))" }}
              >
                Plateforme d'histoires interactives
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              {user ? (
                <>
                  Bon retour {user.pseudo} ! <br />
                  Créez ou vivez des{" "}
                </>
              ) : (
                "Créez et vivez des "
              )}
              <span
                className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)))",
                }}
              >
                aventures narratives
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {user
                ? "Continuez votre aventure ou découvrez de nouvelles histoires interactives."
                : "Plongez dans des histoires à choix multiples ou créez vos propres récits interactifs. Chaque décision compte, chaque chemin est unique."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {user ? (
                <>
                  <Link
                    to="/stories"
                    className="inline-flex items-center justify-center gap-2 h-11 rounded-md px-8 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    <BookOpen className="h-5 w-5" />
                    Explorer les histoires
                  </Link>
                  {(user.role === "auteur" || user.role === "admin") && (
                    <Link
                      to="/my-stories"
                      className="inline-flex items-center justify-center gap-2 h-11 rounded-md px-8 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      Mes histoires
                    </Link>
                  )}
                  {user.role === "admin" && (
                    <Link
                      to="/admin"
                      className="inline-flex items-center justify-center gap-2 h-11 rounded-md px-8 text-sm font-medium bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity"
                    >
                      Administration
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 h-11 rounded-md px-8 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    <BookOpen className="mr-2 h-5 w-5" />
                    Commencer l'aventure
                  </Link>
                  <Link
                    to="/stories"
                    className="inline-flex items-center justify-center gap-2 h-11 rounded-md px-8 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    Découvrir les histoires
                  </Link>
                </>
              )}
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
              <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border">
                <BookOpen
                  className="w-10 h-10"
                  style={{ color: "hsl(var(--primary))" }}
                />
                <h3 className="font-semibold">Lire</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Explorez des centaines d'histoires interactives
                </p>
              </div>

              <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border">
                <Sparkles
                  className="w-10 h-10"
                  style={{ color: "hsl(var(--accent))" }}
                />
                <h3 className="font-semibold">Créer</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Donnez vie à vos propres aventures narratives
                </p>
              </div>

              <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border">
                <Users
                  className="w-10 h-10"
                  style={{ color: "hsl(var(--primary))" }}
                />
                <h3 className="font-semibold">Partager</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Rejoignez une communauté de conteurs passionnés
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
