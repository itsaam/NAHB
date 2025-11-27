import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  BookOpen,
  PenTool,
  LayoutDashboard,
  LogOut,
  Crown,
  User,
  Lightbulb,
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-pale-sky-200 bg-white/95 backdrop-blur shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between relative">
          {/* Logo à gauche */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <BookOpen className="h-6 w-6 text-cherry-rose-500" />
            <span className="text-coffee-bean-900">NAHB</span>
          </Link>

          {/* Navigation au centre */}
          {user && (
            <div className="hidden md:flex items-center gap-6 absolute left-1/2 transform -translate-x-1/2">
              <Link
                to="/stories"
                className={`text-sm font-medium transition-colors ${
                  isActive("/stories")
                    ? "text-cherry-rose-500"
                    : "text-coffee-bean-600 hover:text-cherry-rose-500"
                }`}
              >
                Histoires
              </Link>

              {(user.role === "auteur" || user.role === "admin") && (
                <Link
                  to="/my-stories"
                  className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive("/my-stories")
                      ? "text-cherry-rose-500"
                      : "text-coffee-bean-600 hover:text-cherry-rose-500"
                  }`}
                >
                  <PenTool className="w-4 h-4" />
                  Mes histoires
                </Link>
              )}

              <Link
                to="/my-activites"
                className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive("/my-activites")
                    ? "text-cherry-rose-500"
                    : "text-coffee-bean-600 hover:text-cherry-rose-500"
                }`}
              >
                Mes activités
              </Link>

              <Link
                to="/my-suggestions"
                className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive("/my-suggestions")
                    ? "text-cherry-rose-500"
                    : "text-coffee-bean-600 hover:text-cherry-rose-500"
                }`}
              >
                <Lightbulb className="w-4 h-4" />
                Mes propositions
              </Link>

              {user.role === "admin" && (
                <Link
                  to="/admin"
                  className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive("/admin")
                      ? "text-cherry-rose-500"
                      : "text-coffee-bean-600 hover:text-cherry-rose-500"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Admin
                </Link>
              )}
            </div>
          )}

          {/* User info et logout à droite */}

          <div className="flex items-center gap-3">
            {!user ? (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 transition-colors text-coffee-bean-700 hover:bg-pale-sky-100"
                >
                  Se connecter
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-cherry-rose-500 text-white hover:bg-cherry-rose-600 transition-colors"
                >
                  S'inscrire
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm text-coffee-bean-600 hidden sm:flex items-center gap-1.5">
                  {user.pseudo}
                  {user.role === "admin" && (
                    <Crown className="w-4 h-4 text-neon-ice-500" />
                  )}
                </span>
                <Link
                  to="/profile"
                  className="inline-flex items-center justify-center rounded-full h-10 w-10 transition-colors hover:opacity-80 border-2 border-pale-sky-200 overflow-hidden shrink-0"
                  aria-label="Mon profil"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt="Avatar"
                      className="w-10 h-10 object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-coffee-bean-500" />
                  )}
                </Link>
                <button
                  onClick={logout}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 w-10 transition-colors hover:bg-pale-sky-100 text-coffee-bean-600"
                  aria-label="Se déconnecter"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
