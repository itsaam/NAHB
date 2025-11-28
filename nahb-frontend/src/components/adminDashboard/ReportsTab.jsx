export default function ReportsTab({ reports, onResolveReport }) {
  return (
    <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
      <div className="p-6">
        <h3 className="text-2xl font-semibold leading-none tracking-tight">
          Signalements
        </h3>
        <p className="text-sm text-muted-foreground mt-1.5">
          Traitez les signalements de contenu
        </p>
      </div>
      <div className="p-6 pt-0 space-y-4">
        {reports.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Aucun signalement
          </p>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              className="rounded-lg border border-border p-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Signalement #{report.id} -{" "}
                    {new Date(report.created_at).toLocaleDateString()}
                  </p>
                  <p className="mt-2">{report.reason}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Histoire ID: {report.story_mongo_id}
                  </p>
                  <span
                    className={`inline-flex items-center rounded-full mt-2 px-2.5 py-0.5 text-xs font-semibold ${
                      report.status === "pending"
                        ? "bg-coffee-bean-100 text-coffee-bean-700"
                        : report.status === "resolved"
                        ? "bg-seaweed-100 text-seaweed-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {report.status}
                  </span>
                </div>
                {report.status === "pending" && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => onResolveReport(report.id, "resolved")}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-3 bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                      Résoudre
                    </button>
                    <button
                      onClick={() => onResolveReport(report.id, "rejected")}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-3 bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity"
                    >
                      Rejeter
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
