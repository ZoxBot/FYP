import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences."
      />
       <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md text-center">
            <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center justify-center gap-2">
                    <Settings className="h-8 w-8 text-primary"/>
                    Under Construction
                </CardTitle>
                <CardDescription>We're currently building this section.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                   Soon you'll be able to manage your profile, notifications, and payment settings here.
                </p>
            </CardContent>
        </Card>
      </div>
    </>
  );
}
