export default function LoadingSpinner({ message = "Chargement..." }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
