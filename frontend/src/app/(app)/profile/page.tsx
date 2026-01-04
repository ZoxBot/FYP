import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Edit, Mail, Star, Upload, XCircle } from "lucide-react";
import { users, reviews, getUserById } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function StudentVerificationCard({ user }: { user: typeof users[0] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Verification</CardTitle>
        <CardDescription>
          Verify your student status to get a badge and access exclusive tasks.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {user.studentVerified ? (
          <div className="flex items-center gap-2 p-4 rounded-md bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-5 w-5" />
            <p className="font-medium">Your student status is verified.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-4 rounded-md bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-800">
              <XCircle className="h-5 w-5" />
              <p className="font-medium">Your student status is not verified.</p>
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="document">Upload Student ID/Document</Label>
                <div className="flex gap-2">
                    <Input id="document" type="file" className="flex-grow"/>
                    <Button><Upload className="h-4 w-4 mr-2"/>Upload</Button>
                </div>
            </div>
            <p className="text-xs text-muted-foreground">Our team will review your document within 2-3 business days.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  // Using a mock user. In a real app, this would come from the session.
  const user = users[0];
  const userReviews = reviews.filter(r => r.revieweeId === user.id);

  return (
    <>
      <PageHeader
        title="My Profile"
        description="This is how other users will see you on the site."
        actions={<Button variant="outline"><Edit className="h-4 w-4 mr-2" /> Edit Profile</Button>}
      />
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <h2 className="font-headline text-2xl font-bold">{user.name}</h2>
              <p className="text-muted-foreground capitalize">{user.role}</p>
              {user.studentVerified && <Badge className="mt-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-100">Verified Student</Badge>}
              <Separator className="my-4" />
              <div className="flex items-center justify-center text-sm text-muted-foreground">
                <Mail className="mr-2 h-4 w-4" /> {user.email}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {user.skills.map(skill => (
                <Badge key={skill} variant="secondary">{skill}</Badge>
              ))}
            </CardContent>
          </Card>
          {user.role === 'freelancer' && <StudentVerificationCard user={user} />}
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Reviews & Ratings</CardTitle>
              <CardDescription>
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  <span className="font-bold text-lg">{user.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({user.reviews} reviews)</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {userReviews.length > 0 ? (
                userReviews.map(review => {
                  const reviewer = getUserById(review.reviewerId);
                  return (
                    <div key={review.id} className="flex gap-4">
                      <Avatar>
                        <AvatarImage src={reviewer?.avatar} />
                        <AvatarFallback>{reviewer?.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <p className="font-semibold">{reviewer?.name}</p>
                          <div className="flex items-center gap-1 text-sm">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                        <p className="text-xs text-muted-foreground mt-2">{new Date(review.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No reviews yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
