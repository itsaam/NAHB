import { X } from "lucide-react";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-md",
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-lg shadow-2xl ${maxWidth} w-full max-h-[90vh] overflow-y-auto`}
      >
        <div className="p-6">
          {title && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-coffee-bean-900">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="text-coffee-bean-400 hover:text-coffee-bean-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
