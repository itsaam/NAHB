import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { storiesAPI, pagesAPI } from "../services/api";
import { Plus, Pencil, Trash2, X, Flag } from "lucide-react";

export default function StoryEditorPage() {
  const { storyId } = useParams();
  const navigate = useNavigate();

  const [story, setStory] = useState(null);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showCreatePageModal, setShowCreatePageModal] = useState(false);
  const [showEditPageModal, setShowEditPageModal] = useState(false);
  const [showAddChoiceModal, setShowAddChoiceModal] = useState(false);

  const [pageForm, setPageForm] = useState({
    content: "",
    illustration: "",
    isEnd: false,
    endLabel: "",
  });

  const [choiceForm, setChoiceForm] = useState({
    text: "",
    targetPageId: "",
  });

  useEffect(() => {
    loadStoryAndPages();
  }, [storyId]);

  const loadStoryAndPages = async () => {
    try {
      setLoading(true);
      const [storyRes, pagesRes] = await Promise.all([
        storiesAPI.getById(storyId),
        pagesAPI.getByStory(storyId),
      ]);
      setStory(storyRes.data.data);
      setPages(pagesRes.data.data);
    } catch (err) {
      alert("Erreur lors du chargement");
      navigate("/my-stories");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePage = async (e) => {
    e.preventDefault();
    try {
      await pagesAPI.create({
        storyId,
        ...pageForm,
      });
      setShowCreatePageModal(false);
      setPageForm({
        content: "",
        illustration: "",
        isEnd: false,
        endLabel: "",
      });
      loadStoryAndPages();
      alert("✅ Page créée avec succès !");
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || "Erreur lors de la création";
      const details = err.response?.data?.details?.join("\n") || "";
      alert("❌ " + errorMsg + (details ? "\n\n" + details : ""));
    }
  };

  const handleUpdatePage = async (e) => {
    e.preventDefault();
    try {
      await pagesAPI.update(selectedPage._id, pageForm);
      setShowEditPageModal(false);
      setSelectedPage(null);
      setPageForm({
        content: "",
        illustration: "",
        isEnd: false,
        endLabel: "",
      });
      loadStoryAndPages();
      alert("✅ Page modifiée avec succès !");
    } catch (err) {
      alert(
        "❌ " + (err.response?.data?.error || "Erreur lors de la modification")
      );
    }
  };

  const handleDeletePage = async (pageId) => {
    if (!confirm("Supprimer cette page ?")) return;
    try {
      await pagesAPI.delete(pageId);
      loadStoryAndPages();
      alert("✅ Page supprimée !");
    } catch (err) {
      alert("❌ " + (err.response?.data?.error || "Erreur"));
    }
  };

  const handleAddChoice = async (e) => {
    e.preventDefault();
    try {
      await pagesAPI.addChoice(selectedPage._id, choiceForm);
      setShowAddChoiceModal(false);
      setChoiceForm({ text: "", targetPageId: "" });
      loadStoryAndPages();
      alert("✅ Choix ajouté !");
    } catch (err) {
      alert("❌ " + (err.response?.data?.error || "Erreur"));
    }
  };

  const handleDeleteChoice = async (pageId, choiceId) => {
    if (!confirm("Supprimer ce choix ?")) return;
    try {
      await pagesAPI.deleteChoice(pageId, choiceId);
      loadStoryAndPages();
      alert("✅ Choix supprimé !");
    } catch (err) {
      alert("❌ " + (err.response?.data?.error || "Erreur"));
    }
  };

  const openEditPage = (page) => {
    setSelectedPage(page);
    setPageForm({
      content: page.content,
      illustration: page.illustration || "",
      isEnd: page.isEnd,
      endLabel: page.endLabel || "",
    });
    setShowEditPageModal(true);
  };

  const openAddChoice = (page) => {
    setSelectedPage(page);
    setShowAddChoiceModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {story?.title}
              </h1>
              <p className="text-gray-600 mt-1">Éditeur de pages</p>
            </div>
            <button
              onClick={() => setShowCreatePageModal(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-semibold flex items-center gap-2"
            >
              <Plus size={20} /> Nouvelle page
            </button>
          </div>
        </div>

        {/* Pages List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pages.map((page) => (
            <div
              key={page._id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow flex flex-col"
            >
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-4 gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-500 mb-2">
                      ID: {page._id.substring(0, 8)}...
                    </p>
                    {page.isEnd && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded max-w-full overflow-hidden">
                        <Flag size={14} className="flex-shrink-0" />
                        <span className="truncate">
                          Fin: {page.endLabel || "Fin"}
                        </span>
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeletePage(page._id)}
                    className="text-red-600 hover:text-red-800 flex-shrink-0"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <p className="text-gray-700 mb-4 line-clamp-3">
                  {page.content}
                </p>

                {page.illustration && (
                  <img
                    src={page.illustration}
                    alt="Illustration"
                    className="w-full h-32 object-cover rounded mb-4"
                  />
                )}

                {/* Choix */}
                <div className="border-t pt-4 flex-1">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Choix ({page.choices?.length || 0}) :
                  </p>
                  {page.choices?.map((choice) => (
                    <div
                      key={choice._id}
                      className="flex items-center justify-between bg-gray-50 p-2 rounded mb-2"
                    >
                      <span className="text-sm text-gray-700 flex-1">
                        {choice.text}
                      </span>
                      <button
                        onClick={() => handleDeleteChoice(page._id, choice._id)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {!page.isEnd && (
                    <button
                      onClick={() => openAddChoice(page)}
                      className="text-sm text-indigo-600 hover:text-indigo-800 mt-2 flex items-center gap-1"
                    >
                      <Plus size={16} /> Ajouter un choix
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => openEditPage(page)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200 flex items-center justify-center gap-2"
                  >
                    <Pencil size={16} /> Modifier
                  </button>
                </div>
              </div>
            </div>
          ))}

          {pages.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              Aucune page. Créez la première page de votre histoire !
            </div>
          )}
        </div>

        {/* Modal: Créer une page */}
        {showCreatePageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Nouvelle page</h2>
                <form onSubmit={handleCreatePage}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contenu de la page * (min 10, max 10 000 caractères)
                      </label>
                      <textarea
                        required
                        rows={6}
                        minLength={10}
                        maxLength={10000}
                        value={pageForm.content}
                        onChange={(e) =>
                          setPageForm({ ...pageForm, content: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="Racontez ce qui se passe..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {pageForm.content.length}/10 000 caractères
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        URL de l'illustration (optionnel)
                      </label>
                      <input
                        type="url"
                        value={pageForm.illustration}
                        onChange={(e) =>
                          setPageForm({
                            ...pageForm,
                            illustration: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="https://..."
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isEnd"
                        checked={pageForm.isEnd}
                        onChange={(e) =>
                          setPageForm({ ...pageForm, isEnd: e.target.checked })
                        }
                        className="rounded"
                      />
                      <label htmlFor="isEnd" className="text-sm text-gray-700">
                        Cette page est une fin
                      </label>
                    </div>

                    {pageForm.isEnd && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Label de la fin (max 100 caractères)
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={100}
                          value={pageForm.endLabel}
                          onChange={(e) =>
                            setPageForm({
                              ...pageForm,
                              endLabel: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Fin heureuse, Fin tragique..."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {pageForm.endLabel.length}/100 caractères
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowCreatePageModal(false)}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700"
                    >
                      Créer la page
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Modifier une page */}
        {showEditPageModal && selectedPage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Modifier la page</h2>
                <form onSubmit={handleUpdatePage}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contenu * (min 10, max 10 000 caractères)
                      </label>
                      <textarea
                        required
                        rows={6}
                        minLength={10}
                        maxLength={10000}
                        value={pageForm.content}
                        onChange={(e) =>
                          setPageForm({ ...pageForm, content: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {pageForm.content.length}/10 000 caractères
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Illustration
                      </label>
                      <input
                        type="url"
                        value={pageForm.illustration}
                        onChange={(e) =>
                          setPageForm({
                            ...pageForm,
                            illustration: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isEndEdit"
                        checked={pageForm.isEnd}
                        onChange={(e) =>
                          setPageForm({ ...pageForm, isEnd: e.target.checked })
                        }
                      />
                      <label htmlFor="isEndEdit">Page de fin</label>
                    </div>

                    {pageForm.isEnd && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Label de la fin (max 100 caractères)
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={100}
                          value={pageForm.endLabel}
                          onChange={(e) =>
                            setPageForm({
                              ...pageForm,
                              endLabel: e.target.value,
                            })
                          }
                          placeholder="Label de fin"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {pageForm.endLabel.length}/100 caractères
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowEditPageModal(false)}
                      className="flex-1 bg-gray-200 py-3 rounded-lg"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 text-white py-3 rounded-lg"
                    >
                      Enregistrer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Ajouter un choix */}
        {showAddChoiceModal && selectedPage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Ajouter un choix</h2>
                <form onSubmit={handleAddChoice}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Texte du choix *
                      </label>
                      <input
                        type="text"
                        required
                        value={choiceForm.text}
                        onChange={(e) =>
                          setChoiceForm({ ...choiceForm, text: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Aller à gauche, Parler au garde..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Page de destination *
                      </label>
                      <select
                        required
                        value={choiceForm.targetPageId}
                        onChange={(e) =>
                          setChoiceForm({
                            ...choiceForm,
                            targetPageId: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">-- Sélectionner une page --</option>
                        {pages
                          .filter((p) => p._id !== selectedPage._id)
                          .map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.content.substring(0, 50)}...{" "}
                              {p.isEnd ? "(FIN)" : ""}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowAddChoiceModal(false)}
                      className="flex-1 bg-gray-200 py-3 rounded-lg"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 text-white py-3 rounded-lg"
                    >
                      Ajouter
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
