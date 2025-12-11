import Link from "next/link";
import { PlusCircle, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { tasks, getUserById } from "@/lib/mock-data";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";

export default function TasksPage() {
  return (
    <>
      <PageHeader
        title="Tasks Marketplace"
        description="Find your next project. Browse and bid on tasks."
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <ListFilter className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Filter
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked>
                  Open
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Assigned</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Completed</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" className="h-8 gap-1" asChild>
              <Link href="/tasks/new">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Post a Task
                </span>
              </Link>
            </Button>
          </>
        }
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tasks.map((task) => {
          const client = getUserById(task.clientId);
          return (
            <Card key={task.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="font-headline text-lg hover:text-primary">
                    <Link href={`/tasks/${task.id}`}>{task.title}</Link>
                  </CardTitle>
                  <Badge variant={task.status === 'Open' ? 'secondary' : 'outline'}>{task.status}</Badge>
                </div>
                <CardDescription>
                  by {client?.name} &middot; Deadline: {new Date(task.deadline).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {task.description}
                </p>
                <div className="mt-4 text-2xl font-bold">
                  NPR {task.budget.toLocaleString()}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                 <div className="flex gap-2 flex-wrap">
                    {task.tags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
                 </div>
                 <Button asChild size="sm">
                    <Link href={`/tasks/${task.id}`}>
                        {task.status === 'Open' ? 'View & Bid' : 'View Details'}
                    </Link>
                 </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </>
  );
}
