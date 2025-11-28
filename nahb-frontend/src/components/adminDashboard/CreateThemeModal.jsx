import { useState } from "react";

export default function CreateThemeModal({ isOpen, onClose, onSubmit }) {
  const [themeForm, setThemeForm] = useState({
    name: "",
    description: "",
    default_image: "",
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(themeForm);
    setThemeForm({ name: "", description: "", default_image: "" });
  };

  const handleClose = () => {
    setThemeForm({ name: "", description: "", default_image: "" });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">Nouveau thème</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Nom du thème *
              </label>
              <input
                type="text"
                required
                value={themeForm.name}
                onChange={(e) =>
                  setThemeForm({ ...themeForm, name: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Ex: fantastique"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <input
                type="text"
                value={themeForm.description}
                onChange={(e) =>
                  setThemeForm({
                    ...themeForm,
                    description: e.target.value,
                  })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Description du thème"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Image par défaut (URL)
              </label>
              <input
                type="url"
                value={themeForm.default_image}
                onChange={(e) =>
                  setThemeForm({
                    ...themeForm,
                    default_image: e.target.value,
                  })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 h-10 px-4 rounded-md border border-input bg-background hover:bg-accent transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 h-10 px-4 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
