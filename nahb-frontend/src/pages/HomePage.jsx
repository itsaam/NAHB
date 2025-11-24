import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 sm:text-6xl md:text-7xl">
            <span className="block">Bienvenue sur</span>
            <span className="block text-indigo-600">NAHB</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Narratives Aventureuses Hypertextuelles Branchées
          </p>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-600 sm:text-lg md:max-w-3xl">
            Plongez dans des histoires interactives où chaque choix compte.
            Lisez, créez et partagez vos aventures !
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="mt-10 flex justify-center gap-4 flex-wrap">
          {user ? (
            <>
              <Link
                to="/stories"
                className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
              >
                Explorer les histoires
              </Link>
              {user.role === 'auteur' || user.role === 'admin' ? (
                <Link
                  to="/my-stories"
                  className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 md:py-4 md:text-lg md:px-10"
                >
                  Mes histoires
                </Link>
              ) : null}
              {user.role === 'admin' ? (
                <Link
                  to="/admin"
                  className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 md:py-4 md:text-lg md:px-10"
                >
                  Administration
                </Link>
              ) : null}
            </>
          ) : (
            <>
              <Link
                to="/register"
                className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
              >
                Commencer
              </Link>
              <Link
                to="/login"
                className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 md:py-4 md:text-lg md:px-10"
              >
                Se connecter
              </Link>
            </>
          )}
        </div>

        {/* Features */}
        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-md bg-indigo-500 text-white mx-auto text-3xl">
                📖
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Lire</h3>
              <p className="mt-2 text-base text-gray-500">
                Découvrez des histoires captivantes avec des embranchements multiples
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-md bg-indigo-500 text-white mx-auto text-3xl">
                ✍️
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Créer</h3>
              <p className="mt-2 text-base text-gray-500">
                Écrivez vos propres aventures interactives et partagez-les
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-md bg-indigo-500 text-white mx-auto text-3xl">
                📊
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Suivre</h3>
              <p className="mt-2 text-base text-gray-500">
                Consultez vos statistiques et déverrouillez toutes les fins
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

