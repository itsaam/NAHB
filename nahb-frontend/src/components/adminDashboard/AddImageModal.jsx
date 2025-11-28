import { useState } from "react";

export default function AddImageModal({ isOpen, onClose, onSubmit, theme }) {
  const [imageForm, setImageForm] = useState({ image_url: "", alt_text: "" });

  if (!isOpen || !theme) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(imageForm);
    setImageForm({ image_url: "", alt_text: "" });
  };

  const handleClose = () => {
    setImageForm({ image_url: "", alt_text: "" });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-coffee-bean-900">
          Ajouter une image à "{theme.name}"
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-coffee-bean-700">
                URL de l'image *
              </label>
              <input
                type="url"
                required
                value={imageForm.image_url}
                onChange={(e) =>
                  setImageForm({ ...imageForm, image_url: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-pale-sky-300 bg-white px-3 py-2 text-sm text-coffee-bean-900 focus:ring-2 focus:ring-cherry-rose-500 focus:border-transparent"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-coffee-bean-700">
                Texte alternatif
              </label>
              <input
                type="text"
                value={imageForm.alt_text}
                onChange={(e) =>
                  setImageForm({ ...imageForm, alt_text: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-pale-sky-300 bg-white px-3 py-2 text-sm text-coffee-bean-900 focus:ring-2 focus:ring-cherry-rose-500 focus:border-transparent"
                placeholder="Description de l'image"
              />
            </div>
            {imageForm.image_url && (
              <div className="rounded-lg overflow-hidden bg-pale-sky-100 aspect-video">
                <img
                  src={imageForm.image_url}
                  alt="Aperçu"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 h-10 px-4 rounded-md border border-pale-sky-300 bg-white text-coffee-bean-700 hover:bg-pale-sky-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 h-10 px-4 rounded-md bg-cherry-rose-500 text-white hover:bg-cherry-rose-600 transition-colors"
            >
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
