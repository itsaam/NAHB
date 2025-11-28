import { Star } from "lucide-react";

export default function StarRating({
  rating,
  size = 5,
  readonly = true,
  onChange,
}) {
  const stars = [1, 2, 3, 4, 5];

  if (readonly) {
    return (
      <div className="flex gap-0.5">
        {stars.map((star) => (
          <Star
            key={star}
            className={`w-${size} h-${size} ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-pale-sky-200 text-pale-sky-300"
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-8 h-8 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-pale-sky-200 text-pale-sky-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
