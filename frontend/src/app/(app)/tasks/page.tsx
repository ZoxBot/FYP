"use client";

import Link from "next/link";
import { PlusCircle, ListFilter, ShieldAlert, CheckCircle, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { tasks, getUserById } from "@/lib/mock-data";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { usePermission } from "@/hooks/usePermission";

export default function TasksPage() {
  const { can } = usePermission();

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

          // Permission Checks
          const canApprove = can('job.approve');
          const canSuspend = can('job.suspend');

          return (
            <Card key={task.id} className="flex flex-col relative">
              {/* Admin Indicator */}
              {(canApprove || canSuspend) && (
                <div className="absolute top-2 right-2">
                  <Badge variant="destructive" className="text-[10px] px-1 py-0 h-5">Admin View</Badge>
                </div>
              )}

              <CardHeader>
                <div className="flex justify-between items-start pr-12">
                  <CardTitle className="font-headline text-lg hover:text-primary line-clamp-1">
                    <Link href={`/tasks/${task.id}`}>{task.title}</Link>
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={task.status === 'Open' ? 'secondary' : 'outline'}>{task.status}</Badge>
                  <span className="text-xs text-muted-foreground">
                    by {client?.name}
                  </span>
                </div>
                <CardDescription className="text-xs mt-1">
                  Deadline: {new Date(task.deadline).toLocaleDateString()}
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
              <CardFooter className="flex flex-col gap-3 items-start">
                <div className="flex gap-2 flex-wrap w-full">
                  {task.tags.map(tag => <Badge key={tag} variant="outline" className="text-xs font-normal">{tag}</Badge>)}
                </div>

                <div className="flex justify-between w-full items-center mt-2">
                  <Button asChild size="sm">
                    <Link href={`/tasks/${task.id}`}>
                      {task.status === 'Open' ? 'View & Bid' : 'View Details'}
                    </Link>
                  </Button>

                  {/* Admin Actions */}
                  <div className="flex gap-1">
                    {canApprove && task.status === 'Open' && (
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" title="Approve Job">
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    {canSuspend && (
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" title="Suspend/Delete Job">
                        <Ban className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </>
  );
}
