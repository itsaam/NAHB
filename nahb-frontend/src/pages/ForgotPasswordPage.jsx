import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import { useApiCall } from "../hooks/useApiCall";
import { Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { loading, execute } = useApiCall();
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      alert("Veuillez saisir votre adresse email");
      return;
    }

    await execute(
      () => authAPI.forgotPassword(email),
      () => {
        setEmailSent(true);
      }
    );
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-seaweed-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-seaweed-600" />
          </div>
          <h2 className="text-2xl font-bold text-coffee-bean-900 mb-4">
            Email envoyé ! 📧
          </h2>
          <p className="text-coffee-bean-600 mb-6">
            Si cette adresse email existe dans notre système, vous recevrez un
            lien de réinitialisation dans quelques instants.
          </p>
          <p className="text-sm text-coffee-bean-500 mb-6">
            Pensez à vérifier vos spams si vous ne le trouvez pas.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-cherry-rose-500 text-white py-3 rounded-lg hover:bg-cherry-rose-600 transition font-medium"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 text-coffee-bean-600 hover:text-coffee-bean-900 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-coffee-bean-900 mb-2">
            Mot de passe oublié ? 🔐
          </h1>
          <p className="text-coffee-bean-600">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-coffee-bean-700 mb-2">
              Adresse email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-coffee-bean-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full pl-10 pr-4 py-3 border border-pale-sky-300 rounded-lg focus:ring-2 focus:ring-cherry-rose-500 focus:border-transparent"
                disabled={loading}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cherry-rose-500 text-white py-3 rounded-lg hover:bg-cherry-rose-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Envoi en cours..." : "Envoyer le lien"}
          </button>
        </form>
      </div>
    </div>
  );
}
