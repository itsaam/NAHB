import { useState } from "react";

/**
 * Hook personnalisé pour gérer les appels API avec loading et erreurs (DRY)
 * Évite de répéter try/catch/finally dans chaque composant
 *
 * @returns {Object} { loading, execute }
 */
export const useApiCall = () => {
  const [loading, setLoading] = useState(false);

  /**
   * Exécute un appel API avec gestion automatique du loading et des erreurs
   *
   * @param {Function} apiCall - Fonction async qui fait l'appel API
   * @param {Function} onSuccess - Callback appelé en cas de succès (optionnel)
   * @param {Function} onError - Callback appelé en cas d'erreur (optionnel)
   * @param {boolean} showAlert - Afficher une alerte en cas d'erreur (true par défaut)
   * @returns {Promise<any>} Résultat de l'appel API ou null en cas d'erreur
   */
  const execute = async (
    apiCall,
    onSuccess = null,
    onError = null,
    showAlert = true
  ) => {
    try {
      setLoading(true);
      const result = await apiCall();

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Une erreur est survenue";
      const errorDetails = err.response?.data?.details;

      if (onError) {
        onError(errorMessage, errorDetails);
      }

      if (showAlert) {
        alert(errorMessage);
      }

      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, execute };
};

/**
 * Hook pour gérer le chargement d'une ressource avec états loading/error/data (DRY)
 *
 * @returns {Object} { data, setData, loading, error, refetch }
 */
export const useResource = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Charge une ressource via un appel API
   * @param {Function} fetchFn - Fonction async qui récupère les données
   */
  const refetch = async (fetchFn) => {
    try {
      setLoading(true);
      setError("");
      const result = await fetchFn();
      setData(result);
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Erreur lors du chargement";
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { data, setData, loading, error, refetch };
};
