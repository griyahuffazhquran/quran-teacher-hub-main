import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpenText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Masuk | Griya Huffazh Quran Upgrading" },
      {
        name: "description",
        content: "Masuk ke sistem manajemen upgrading guru Griya Huffazh Quran.",
      },
      { property: "og:title", content: "Masuk | Griya Huffazh Quran Upgrading" },
      {
        property: "og:description",
        content: "Masuk ke sistem manajemen upgrading guru Griya Huffazh Quran.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mx-auto grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
            <BookOpenText className="size-5" />
          </div>
          <CardTitle className="mt-3 text-xl">Griya Huffazh Quran</CardTitle>
          <CardDescription>Teacher Upgrading Management System</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" placeholder="username" autoComplete="username" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" />
          </div>
          <Button className="w-full" asChild>
            <Link to="/">Masuk</Link>
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Autentikasi nyata akan aktif pada fase Data Layer.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
