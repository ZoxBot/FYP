"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { generateTaskDescription } from "@/ai/flows/generate-task-description";

const taskSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long."),
  description: z.string().min(20, "Description must be at least 20 characters long."),
  budget: z.coerce.number().min(100, "Budget must be at least NPR 100."),
  deadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format.",
  }),
  tags: z.string(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

export default function NewTaskPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      tags: "",
    },
  });

  const handleGenerateDescription = async () => {
    const title = form.getValues("title");
    if (!title) {
      form.setError("title", { message: "Please enter a title first to generate a description." });
      return;
    }
    
    setIsGenerating(true);
    try {
      const result = await generateTaskDescription({ prompt: title });
      if (result.description) {
        form.setValue("description", result.description, { shouldValidate: true });
        toast({
          title: "Description Generated",
          description: "AI has created a detailed task description for you.",
        });
      }
    } catch (error) {
      console.error("Failed to generate description:", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Could not generate description. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = (data: TaskFormValues) => {
    console.log(data);
    toast({
      title: "Task Posted!",
      description: "Your new task has been successfully posted to the marketplace.",
    });
    router.push("/tasks");
  };

  return (
    <>
      <PageHeader
        title="Post a New Task"
        description="Describe your project and get bids from talented freelancers."
      />
      <Card>
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
          <CardDescription>
            Provide as much detail as possible for the best results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Logo Design for a new Cafe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Description</FormLabel>
                      <Button type="button" variant="outline" size="sm" onClick={handleGenerateDescription} disabled={isGenerating}>
                        <Wand2 className="mr-2 h-4 w-4" />
                        {isGenerating ? "Generating..." : "Generate with AI"}
                      </Button>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the task in detail..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget (in NPR)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 5000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deadline</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags / Skills</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Graphic Design, Branding, Adobe Illustrator" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit">Post Task</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
