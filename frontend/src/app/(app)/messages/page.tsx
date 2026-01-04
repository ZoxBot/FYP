import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function MessagesPage() {
  return (
    <>
      <PageHeader
        title="Messages"
        description="Your conversations with clients and freelancers."
      />
       <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md text-center">
            <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center justify-center gap-2">
                    <MessageSquare className="h-8 w-8 text-primary"/>
                    Coming Soon
                </CardTitle>
                <CardDescription>A dedicated messaging center is on its way.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    You will be able to manage all your conversations from this page. For now, please use the chat feature within each assigned task.
                </p>
            </CardContent>
        </Card>
      </div>
    </>
  );
}
