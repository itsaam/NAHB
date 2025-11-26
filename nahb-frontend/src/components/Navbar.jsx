import {Link, useLocation} from "react-router-dom";
import {useAuth} from "../context/AuthContext";
import {
    BookOpen,
    PenTool,
    LayoutDashboard,
    LogOut,
    Crown,
    User,
} from "lucide-react";

export default function Navbar() {
    const {user, logout} = useAuth();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <nav
            className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur shadow-sm"
            style={{borderColor: "hsl(240 6% 90%)"}}
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between relative">
                    {/* Logo à gauche */}
                    <Link to="/" className="flex items-center gap-2 font-bold text-xl">
                        <BookOpen className="h-6 w-6 text-blue-600"/>
                        <span>NAHB</span>
                    </Link>

                    {/* Navigation au centre */}
                    {user && (
                        <div className="hidden md:flex items-center gap-6 absolute left-1/2 transform -translate-x-1/2">
                            <Link
                                to="/stories"
                                className={`text-sm font-medium transition-colors ${
                                    isActive("/stories")
                                        ? "text-gray-900"
                                        : "text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                Histoires
                            </Link>

                            {(user.role === "auteur" || user.role === "admin") && (
                                <Link
                                    to="/my-stories"
                                    className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                                        isActive("/my-stories")
                                            ? "text-gray-900"
                                            : "text-gray-600 hover:text-gray-900"
                                    }`}
                                >
                                    <PenTool className="w-4 h-4"/>
                                    Mes histoires
                                </Link>
                            )}

                            <Link to="/my-activites"
                                  className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                                      isActive("/my-activites")
                                          ? "text-gray-900"
                                          : "text-gray-600 hover:text-gray-900"
                                  }`}
                            >
                                Mes activités
                            </Link>

                            {user.role === "admin" && (
                                <Link
                                    to="/admin"
                                    className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                                        isActive("/admin")
                                            ? "text-gray-900"
                                            : "text-gray-600 hover:text-gray-900"
                                    }`}
                                >
                                    <LayoutDashboard className="w-4 h-4"/>
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
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 transition-colors hover:bg-gray-100"
                                >
                                    Se connecter
                                </Link>
                                <Link
                                    to="/register"
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                >
                                    S'inscrire
                                </Link>
                            </>
                        ) : (
                            <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 hidden sm:flex items-center gap-1.5">
                  {user.pseudo}
                    {user.role === "admin" && (
                        <Crown className="w-4 h-4 text-yellow-500"/>
                    )}
                </span>
                                <Link
                                    to="/profile"
                                    className="inline-flex items-center justify-center rounded-full h-10 w-10 transition-colors hover:opacity-80 border-2 border-gray-200 overflow-hidden flex-shrink-0"
                                    aria-label="Mon profil"
                                >
                                    {user.avatar ? (
                                        <img
                                            src={user.avatar}
                                            alt="Avatar"
                                            className="w-10 h-10 object-cover"
                                        />
                                    ) : (
                                        <User className="h-5 w-5 text-gray-600"/>
                                    )}
                                </Link>
                                <button
                                    onClick={logout}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 w-10 transition-colors hover:bg-gray-100"
                                    aria-label="Se déconnecter"
                                >
                                    <LogOut className="h-5 w-5"/>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
