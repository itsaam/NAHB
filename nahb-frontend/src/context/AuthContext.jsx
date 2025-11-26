import { createContext, useState, useContext, useEffect, useRef } from "react";
import { toast } from "sonner";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

// Messages selon le type de ban
const BAN_MESSAGES = {
  full: "Votre compte a été banni par un administrateur.",
  author: "Vous n'êtes plus autorisé à créer ou modifier des histoires.",
  comment: "Vous n'êtes plus autorisé à poster des commentaires.",
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [banStatus, setBanStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const previousBanStatus = useRef(null);

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
        const response = await authAPI.checkStatus();
        const data = response.data.data;
        
        // Détecter un nouveau ban
        if (data.isBanned && !previousBanStatus.current?.isBanned) {
          const message = BAN_MESSAGES[data.banType] || BAN_MESSAGES.full;
          const reason = data.banReason ? ` Raison : ${data.banReason}` : "";
          
          // Si ban complet, déconnecter
          if (data.banType === "full") {
            toast.error(`${message}${reason}`, { duration: 10000 });
            logout();
            window.location.href = "/";
          } else {
            // Sinon, juste notifier
            toast.warning(`${message}${reason}`, { duration: 8000 });
          }
        }
        
        // Détecter un déban
        if (!data.isBanned && previousBanStatus.current?.isBanned) {
          toast.success("Votre compte a été rétabli !", { duration: 5000 });
        }
        
        previousBanStatus.current = data;
        setBanStatus(data);
      } catch (error) {
        if (error.response?.status === 403) {
          const banType = error.response?.data?.banType || "full";
          const banReason = error.response?.data?.banReason;
          const message = BAN_MESSAGES[banType];
          const reason = banReason ? ` Raison : ${banReason}` : "";
          
          toast.error(`${message}${reason}`, { duration: 10000 });
          logout();
          window.location.href = "/";
        }
      }
    };

    // Check immédiat au chargement
    checkBanStatus();

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
  
  // Helpers pour vérifier les restrictions de ban
  const canCreateStory = () => !banStatus?.isBanned || (banStatus?.banType !== "author" && banStatus?.banType !== "full");
  const canComment = () => !banStatus?.isBanned || (banStatus?.banType !== "comment" && banStatus?.banType !== "full");

  const value = {
    user,
    setUser,
    loading,
    banStatus,
    login,
    register,
    getProfile,
    logout,
    isAuthenticated,
    isAuthor,
    isAdmin,
    canCreateStory,
    canComment,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
