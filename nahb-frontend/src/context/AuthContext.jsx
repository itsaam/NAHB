import { createContext, useState, useContext, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }

    setLoading(false);
  }, []);

  // Vérifier le statut de ban toutes les 30 secondes
  useEffect(() => {
    if (!user) return;

    const checkBanStatus = async () => {
      try {
        await authAPI.checkStatus();
      } catch (error) {
        if (error.response?.status === 403) {
          // Utilisateur banni
          logout();
          alert("Votre compte a été banni par un administrateur.");
          window.location.href = "/";
        }
      }
    };

    const interval = setInterval(checkBanStatus, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [user]);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { user: userData, token } = response.data.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Erreur de connexion",
      };
    }
  };

  const register = async (pseudo, email, password, role = "lecteur") => {
    try {
      console.log("📝 Tentative d'inscription...", { pseudo, email, role });
      const response = await authAPI.register({
        pseudo,
        email,
        password,
        role,
      });
      console.log("✅ Réponse API:", response.data);

      const { user: userData, token } = response.data.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      console.log("✅ Utilisateur inscrit:", userData);
      return { success: true };
    } catch (error) {
      console.error("❌ Erreur d'inscription:", error);
      console.error("❌ Détails:", error.response?.data);
      return {
        success: false,
        error: error.response?.data?.error || "Erreur d'inscription",
      };
    }
  };

  const getProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      const userData = response.data.data;

      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.error ||
          "Erreur lors de la récupération du profil",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const isAuthenticated = () => !!user;
  const isAuthor = () => user?.role === "auteur" || user?.role === "admin";
  const isAdmin = () => user?.role === "admin";

  const value = {
    user,
    setUser,
    loading,
    login,
    register,
    getProfile,
    logout,
    isAuthenticated,
    isAuthor,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
