import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import { useApiCall } from "../hooks/useApiCall";
import { Crown, Mail, Lock, Upload, User, Camera } from "lucide-react";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const { loading, execute } = useApiCall();
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleImageUpload(file);
    } else {
      alert("Veuillez déposer une image valide");
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleImageUpload = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    const updates = {};
    if (email !== user.email) {
      updates.email = email;
    }
    if (avatar !== user.avatar) {
      updates.avatar = avatar;
    }

    if (Object.keys(updates).length > 0) {
      await execute(
        () => authAPI.updateProfile(updates),
        (response) => {
          const updatedUser = { ...user, ...response.data.data };
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
          alert("Profil mis à jour avec succès !");
        }
      );
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas");
      return;
    }

    if (newPassword.length < 6) {
      alert("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    await execute(
      () => authAPI.updatePassword({ currentPassword, newPassword }),
      () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        alert("Mot de passe mis à jour avec succès !");
      }
    );
  };

  return (
    <div className="min-h-screen bg-pale-sky-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-8 h-8 text-cherry-rose-500" />
            <h1 className="text-3xl font-bold text-coffee-bean-900">
              Mon Profil
            </h1>
          </div>
          <div className="flex items-center gap-2 text-coffee-bean-600">
            <span className="font-medium">{user?.pseudo}</span>
            {user?.role === "admin" && (
              <Crown className="w-5 h-5 text-yellow-500" />
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Photo de profil */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-coffee-bean-900 mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Photo de profil
            </h2>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? "border-cherry-rose-500 bg-cherry-rose-50"
                  : "border-pale-sky-300 hover:border-cherry-rose-400"
              }`}
            >
              {avatar ? (
                <div className="relative">
                  <img
                    src={avatar}
                    alt="Avatar"
                    className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-cherry-rose-500"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-1/2 translate-x-16 bg-cherry-rose-500 text-white p-2 rounded-full hover:bg-cherry-rose-600"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-32 h-32 rounded-full mx-auto bg-pale-sky-200 flex items-center justify-center">
                    <User className="w-16 h-16 text-coffee-bean-400" />
                  </div>
                  <div>
                    <Upload className="w-8 h-8 mx-auto text-coffee-bean-400 mb-2" />
                    <p className="text-sm text-coffee-bean-600">
                      Glissez-déposez une image ici
                    </p>
                    <p className="text-xs text-coffee-bean-500 mt-1">ou</p>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!avatar && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 px-4 py-2 bg-cherry-rose-500 text-white rounded-lg hover:bg-cherry-rose-600"
                >
                  Choisir une image
                </button>
              )}
            </div>

            <button
              onClick={handleUpdateProfile}
              disabled={loading || avatar === user?.avatar}
              className="w-full mt-4 bg-cherry-rose-500 text-white py-2 rounded-lg hover:bg-cherry-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Enregistrement..." : "Enregistrer la photo"}
            </button>
          </div>

          {/* Email */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-coffee-bean-900 mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Adresse email
            </h2>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-coffee-bean-700 mb-2">
                  Nouvelle adresse email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-pale-sky-300 rounded-lg focus:ring-2 focus:ring-cherry-rose-500"
                  placeholder="nouveau@email.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading || email === user?.email}
                className="w-full bg-cherry-rose-500 text-white py-2 rounded-lg hover:bg-cherry-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Mise à jour..." : "Mettre à jour l'email"}
              </button>
            </form>
          </div>
        </div>

        {/* Mot de passe */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-bold text-coffee-bean-900 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Changer le mot de passe
          </h2>

          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-coffee-bean-700 mb-2">
                Mot de passe actuel *
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-pale-sky-300 rounded-lg focus:ring-2 focus:ring-cherry-rose-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-coffee-bean-700 mb-2">
                Nouveau mot de passe * (min. 6 caractères)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-pale-sky-300 rounded-lg focus:ring-2 focus:ring-cherry-rose-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-coffee-bean-700 mb-2">
                Confirmer le nouveau mot de passe *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-pale-sky-300 rounded-lg focus:ring-2 focus:ring-cherry-rose-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cherry-rose-500 text-white py-2 rounded-lg hover:bg-cherry-rose-600 disabled:opacity-50"
            >
              {loading ? "Mise à jour..." : "Changer le mot de passe"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
