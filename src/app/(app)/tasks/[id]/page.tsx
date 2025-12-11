import Image from "next/image";
import Link from "next/link";
import { getTaskById, getUserById, getBidsForTask } from "@/lib/mock-data";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Clock, DollarSign, FileText, MessageSquare, Users, Wand2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function BiddingForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Place Your Bid</CardTitle>
        <CardDescription>Submit your proposal and pricing for this task.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Your Bid (NPR)</Label>
            <Input id="amount" type="number" placeholder="5000" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Estimated Duration (days)</Label>
            <Input id="duration" type="number" placeholder="7" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="proposal">Your Proposal</Label>
          <Textarea id="proposal" placeholder="Explain why you are the best fit for this task..." className="min-h-[120px]" />
        </div>
        <Button>Submit Bid</Button>
      </CardContent>
    </Card>
  );
}

function BidsList({ taskId }: { taskId: string }) {
  const bids = getBidsForTask(taskId);
  if (bids.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="mx-auto h-12 w-12" />
        <p className="mt-4">No bids have been placed on this task yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-headline text-lg font-semibold">{bids.length} Proposal(s)</h3>
        <Button variant="outline" size="sm"><Wand2 className="mr-2 h-4 w-4"/>Summarize with AI</Button>
      </div>
      {bids.map(bid => {
        const freelancer = getUserById(bid.freelancerId);
        if (!freelancer) return null;
        return (
          <Card key={bid.id}>
            <CardHeader className="flex flex-row items-start gap-4 space-y-0">
              <Avatar>
                <AvatarImage src={freelancer.avatar} />
                <AvatarFallback>{freelancer.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex justify-between">
                  <Link href={`/profile/${freelancer.id}`} className="font-semibold hover:underline">{freelancer.name}</Link>
                  <span className="font-bold text-lg text-primary">NPR {bid.amount.toLocaleString()}</span>
                </div>
                <div className="text-sm text-muted-foreground">Rating: {freelancer.rating}/5 ({freelancer.reviews} reviews)</div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{bid.proposal}</p>
            </CardContent>
            <CardContent className="flex justify-end gap-2">
              <Button variant="outline">Message</Button>
              <Button>Award Task</Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}


export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const task = getTaskById(params.id);

  if (!task) {
    notFound();
  }

  const client = getUserById(task.clientId);

  return (
    <>
      <PageHeader
        title={task.title}
        description={`Posted by ${client?.name}`}
        actions={<Badge variant={task.status === 'Open' ? 'default' : 'secondary'} className="text-base">{task.status}</Badge>}
      />

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
            <Tabs defaultValue="details">
              <TabsList className="mb-4">
                <TabsTrigger value="details">
                  <FileText className="mr-2 h-4 w-4" /> Task Details
                </TabsTrigger>
                <TabsTrigger value="proposals">
                  <Users className="mr-2 h-4 w-4" /> Proposals
                </TabsTrigger>
                <TabsTrigger value="chat" disabled={task.status !== 'Assigned'}>
                  <MessageSquare className="mr-2 h-4 w-4" /> Chat
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{task.description}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="proposals">
                 {/* This should be conditional based on user role */}
                <BidsList taskId={task.id} />
                <Separator className="my-8" />
                <BiddingForm />
              </TabsContent>
              
              <TabsContent value="chat">
                <Card>
                    <CardHeader><CardTitle>Collaboration Space</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground">Chat interface will be available here once the task is assigned.</p></CardContent>
                </Card>
              </TabsContent>
            </Tabs>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Task Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 mr-3 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="font-semibold">NPR {task.budget.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-3 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Deadline</p>
                  <p className="font-semibold">{new Date(task.deadline).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About the Client</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={client?.avatar} />
                <AvatarFallback>{client?.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{client?.name}</p>
                <p className="text-sm text-muted-foreground">5.0/5 Rating ({client?.reviews} reviews)</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
                <CardTitle>Required Skills</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
                {task.tags.map(tag => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
