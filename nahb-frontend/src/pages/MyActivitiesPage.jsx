import React, {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {gameAPI} from "../services/api";

export default function MyActivitiesPage() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        gameAPI.getMyActivities()
            .then(res => {
                if (!mounted) return;
                setActivities(res.data.data || []);
            })
            .catch(err => {
                if (!mounted) return;
                setError(err?.response?.data?.error || err.message || 'Erreur réseau');
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => { mounted = false; };
    }, []);

    const finished = activities.filter(a => a.completed === true || (typeof a.progress === 'number' && a.progress >= 100));
    const inProgress = activities.filter(a => !(a.completed === true || (typeof a.progress === 'number' && a.progress >= 100)) && ((typeof a.progress === 'number' && a.progress > 0) || a.lastSessionId));

    if (loading) return <div className="p-6">Chargement de vos activités...</div>;
    if (error) return <div className="p-6 text-red-600">Erreur : {error}</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Mes activités</h1>

            <section className="mb-8">
                <h2 className="text-xl mb-2">Histoires terminées ({finished.length})</h2>
                {finished.length === 0 && <div className="text-gray-600">Aucune histoire terminée.</div>}
                <ul className="space-y-3 mt-3">
                    {finished.map(a => (
                        <li key={a.story.id} className="p-4 border rounded-md shadow-sm bg-white">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-semibold text-lg">{a.story.title}</div>
                                    <div className="text-sm text-gray-600">Fins atteintes : {a.endingsReached ?? 0}</div>
                                </div>
                                <div className="text-right">
                                    <Link to={`/story/${a.story.id}`} className="text-blue-600 hover:underline">Voir l'histoire</Link>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </section>

            <section>
                <h2 className="text-xl mb-2">En cours de lecture ({inProgress.length})</h2>
                {inProgress.length === 0 && <div className="text-gray-600">Aucune lecture en cours.</div>}
                <ul className="space-y-3 mt-3">
                    {inProgress.map(a => (
                        <li key={a.story.id} className="p-4 border rounded-md shadow-sm bg-white flex justify-between items-center">
                            <div>
                                <div className="font-semibold">{a.story.title}</div>
                                <div className="text-sm text-gray-600">Progression : {typeof a.progress === 'number' ? `${a.progress}%` : '—'}</div>
                                <div className="text-sm text-gray-600">Fins atteintes : {a.endingsReached ?? 0}</div>
                            </div>
                            <div>
                                <Link
                                    to={a.lastSessionId ? `/read/${a.lastSessionId}` : `/story/${a.story.id}`}
                                    className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                >
                                    Continuer
                                </Link>
                            </div>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}

