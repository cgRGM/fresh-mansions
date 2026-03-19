import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@fresh-mansions/ui/components/card";
import { Label } from "@fresh-mansions/ui/components/label";
import { Separator } from "@fresh-mansions/ui/components/separator";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, User } from "lucide-react";

import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { data: session } = authClient.useSession();

  const userName = session?.user?.name ?? "User";
  const userEmail = session?.user?.email ?? "";

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">Profile</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700 text-2xl font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <CardTitle className="text-xl">{userName}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Separator />

          <div className="space-y-4">
            <div>
              <Label className="mb-1 flex items-center gap-2 text-sm text-gray-500">
                <User className="h-4 w-4" />
                Name
              </Label>
              <p className="text-gray-900">{userName}</p>
            </div>

            <div>
              <Label className="mb-1 flex items-center gap-2 text-sm text-gray-500">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <p className="text-gray-900">{userEmail}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
