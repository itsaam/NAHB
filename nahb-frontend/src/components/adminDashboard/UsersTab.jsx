import { Ban, PenOff, MessageSquareOff } from "lucide-react";

export default function UsersTab({ users, onBanUser, onUnbanUser }) {
  return (
    <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
      <div className="p-6">
        <h3 className="text-2xl font-semibold leading-none tracking-tight">
          Gestion des utilisateurs
        </h3>
        <p className="text-sm text-muted-foreground mt-1.5">
          Modérez les comptes utilisateurs
        </p>
      </div>
      <div className="p-6 pt-0">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Nom d'utilisateur
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Email
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Rôle
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Statut
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <td className="p-4 align-middle font-medium">
                    {user.pseudo}
                  </td>
                  <td className="p-4 align-middle">{user.email}</td>
                  <td className="p-4 align-middle">
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 align-middle">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        user.is_banned
                          ? "bg-destructive/10 text-destructive"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {user.is_banned
                        ? user.ban_type === "full"
                          ? "Banni"
                          : user.ban_type === "author"
                          ? "Ban Auteur"
                          : "Ban Commentaire"
                        : "Actif"}
                    </span>
                  </td>
                  <td className="p-4 align-middle">
                    {user.role !== "admin" && (
                      <div className="flex gap-2 flex-wrap">
                        {user.is_banned ? (
                          <button
                            onClick={() => onUnbanUser(user.id)}
                            className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium h-9 rounded-md px-3 border border-input bg-background transition-colors hover:bg-accent hover:text-accent-foreground"
                          >
                            Débannir
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => onBanUser(user.id, "full")}
                              className="inline-flex items-center gap-1 justify-center whitespace-nowrap text-xs font-medium h-8 rounded-md px-2 border border-destructive text-destructive bg-background transition-colors hover:bg-destructive hover:text-white"
                              title="Ban complet"
                            >
                              <Ban className="h-3 w-3" />
                              Ban
                            </button>
                            {user.role === "auteur" && (
                              <button
                                onClick={() => onBanUser(user.id, "author")}
                                className="inline-flex items-center gap-1 justify-center whitespace-nowrap text-xs font-medium h-8 rounded-md px-2 border border-orange-500 text-orange-500 bg-background transition-colors hover:bg-orange-500 hover:text-white"
                                title="Interdit de créer des histoires"
                              >
                                <PenOff className="h-3 w-3" />
                                Auteur
                              </button>
                            )}
                            <button
                              onClick={() => onBanUser(user.id, "comment")}
                              className="inline-flex items-center gap-1 justify-center whitespace-nowrap text-xs font-medium h-8 rounded-md px-2 border border-yellow-500 text-yellow-500 bg-background transition-colors hover:bg-yellow-500 hover:text-white"
                              title="Interdit de commenter"
                            >
                              <MessageSquareOff className="h-3 w-3" />
                              Commentaire
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
