import { useState } from "react";
import { imageSuggestionsAPI } from "../services/api";
import { Lightbulb, Send, X } from "lucide-react";

/**
 * Composant réutilisable pour suggérer une image pour un thème
 * @param {number} themeId - ID du thème
 * @param {string} themeName - Nom du thème (pour affichage)
 * @param {string} currentImageUrl - URL de l'image actuelle (pré-remplie)
 * @param {function} onSuccess - Callback appelé après une suggestion réussie
 * @param {string} className - Classes CSS additionnelles
 */
const SuggestImageButton = ({
  themeId,
  themeName = "ce thème",
  currentImageUrl = "",
  onSuccess,
  className = "",
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState(currentImageUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleOpen = () => {
    setImageUrl(currentImageUrl);
    setError("");
    setSuccessMessage("");
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setError("");
    setSuccessMessage("");
  };

  const handleSubmit = async () => {
    if (!imageUrl.trim()) {
      setError("Veuillez entrer une URL d'image");
      return;
    }

    if (!themeId) {
      setError("Aucun thème sélectionné");
      return;
    }

    // Validation basique de l'URL
    try {
      new URL(imageUrl);
    } catch {
      setError("URL invalide");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await imageSuggestionsAPI.suggest({
        themeId: themeId,
        imageUrl: imageUrl.trim(),
      });

      setSuccessMessage(
        response.data.message || "Image proposée avec succès !"
      );

      if (onSuccess) {
        onSuccess(response.data.data);
      }

      // Fermer après 2 secondes
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      console.error("Erreur suggestion:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Erreur lors de la proposition de l'image"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm transition-colors ${className}`}
        title="Proposer cette image pour le catalogue du thème"
      >
        {children || (
          <>
            <Lightbulb size={16} />
            Proposer cette image
          </>
        )}
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

          {/* Modal content */}
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-coffee-bean-800 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Proposer une image
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Proposez cette image pour le thème{" "}
                <strong>"{themeName}"</strong>. Un administrateur validera votre
                suggestion avant qu'elle soit ajoutée au catalogue.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL de l'image
                </label>
                <input
                  type="url"
                  placeholder="https://exemple.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  disabled={isSubmitting || successMessage}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-seaweed-500 focus:border-seaweed-500 disabled:bg-gray-100"
                />
              </div>

              {imageUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aperçu
                  </label>
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={imageUrl}
                      alt="Aperçu"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                  <span>✅</span>
                  {successMessage}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !imageUrl.trim() || successMessage}
                className="px-4 py-2 text-sm font-medium text-white bg-seaweed-600 rounded-lg hover:bg-seaweed-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Proposer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SuggestImageButton;
