"use client";

import { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { generateTaskDescription } from "@/ai/flows/generate-task-description";

const taskSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long."),
  description: z.string().min(20, "Description must be at least 20 characters long."),
  category: z.string().min(1, "Please select a category."),
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
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  useEffect(() => {
    const checkVerification = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/verification/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setIsVerified(data.isVerified);
        } else {
          // Assume not verified if API call fails or returns non-200 (unless it's 401 which handles itself differently usually, but safetynet here)
          setIsVerified(false);
        }
      } catch (e) {
        console.error("Verification check failed", e);
        setIsVerified(false); // Default to blocking if we can't verify
      }
    };
    checkVerification();
  }, [router]);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      tags: "",
    },
  });

  // ... (generateTaskDescription logic) ...

  const handleGenerateDescription = async () => {
    // ... same code ...
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

  const onSubmit = async (data: TaskFormValues) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          category: data.category,
          budget: data.budget,
          deadline: data.deadline || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to post task');
      }

      toast({
        title: "Task Posted!",
        description: "Your new task is now live on the marketplace.",
      });
      router.push("/tasks");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to Post Task",
        description: error.message || "Something went wrong. Please try again.",
      });
    }
  };

  if (isVerified === null) {
    return <div className="p-8">Checking eligibility...</div>;
  }

  if (isVerified === false) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Verification Required</CardTitle>
            <CardDescription>
              To maintain quality and trust, only verified users can post new tasks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Please verify your identity by uploading a valid document (Citizenship/Passport) in your profile settings.
            </p>
            <Button onClick={() => router.push('/profile')}>
              Go to Profile Verification
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render Form if Verified ...

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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Web Development">Web Development</SelectItem>
                        <SelectItem value="Graphic Design">Graphic Design</SelectItem>
                        <SelectItem value="Digital Marketing">Digital Marketing</SelectItem>
                        <SelectItem value="Writing & Translation">Writing & Translation</SelectItem>
                        <SelectItem value="Video & Animation">Video & Animation</SelectItem>
                        <SelectItem value="Data Entry">Data Entry</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
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
