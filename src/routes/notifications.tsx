import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection } from "@/hooks/use-repository";
import { useSession } from "@/hooks/use-session";
import { notificationsFor } from "@/lib/services/notification-service";
import { notificationRepo } from "@/lib/data/repositories";
import { unreadCount } from "@/lib/data/selectors";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifikasi | Griya Huffazh Quran" },
      { name: "description", content: "Pemberitahuan aktivitas upgrading Anda." },
      { property: "og:title", content: "Notifikasi | Griya Huffazh Quran" },
      { property: "og:description", content: "Pemberitahuan aktivitas upgrading Anda." },
    ],
  }),
  component: Page,
});

function Page() {
  const { rows: allRows, ready, repo } = useCollection(notificationRepo);
  const { user } = useSession();
  const rows = notificationsFor(allRows, user?.id);

  return (
    <AppShell>
      <PageHeader
        title="Notifikasi"
        description={
          ready ? `${unreadCount(rows)} belum dibaca` : "Pemberitahuan aktivitas upgrading Anda."
        }
        actions={
          ready && rows.length > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => rows.forEach((n) => !n.read && repo.update(n.id, { read: true }))}
            >
              Tandai semua dibaca
            </Button>
          ) : undefined
        }
      />
      {!ready ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Tidak ada notifikasi.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((n) => (
            <Card key={n.id} className={n.read ? "opacity-70" : ""}>
              <CardContent className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium">{n.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                </div>
                {!n.read ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => repo.update(n.id, { read: true })}
                  >
                    Tandai
                  </Button>
                ) : (
                  <Badge variant="secondary">Dibaca</Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
