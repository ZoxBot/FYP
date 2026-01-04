import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function AdminPage() {
  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        description="Manage users, tasks, and system settings."
      />
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md text-center">
            <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center justify-center gap-2">
                    <Shield className="h-8 w-8 text-primary"/>
                    Admin Area
                </CardTitle>
                <CardDescription>This section is under construction.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    Features like student verification, dispute resolution, and task moderation will be available here soon.
                </p>
            </CardContent>
        </Card>
      </div>
    </>
  );
}
