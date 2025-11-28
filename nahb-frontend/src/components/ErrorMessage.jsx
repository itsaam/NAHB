import { Link } from "react-router-dom";

export default function ErrorMessage({
  message,
  backLink = "/stories",
  backText = "Retour",
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-600 mb-4">{message}</p>
        <Link
          to={backLink}
          className="text-cherry-rose-500 hover:text-cherry-rose-700"
        >
          {backText}
        </Link>
      </div>
    </div>
  );
}
