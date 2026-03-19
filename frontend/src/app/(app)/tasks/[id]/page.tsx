"use client";

import { useEffect, useState, use } from "react";
import DOMPurify from "dompurify";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Briefcase, Calendar, DollarSign, User, MessageSquare, Clock, CheckCircle, XCircle, Star, Paperclip, Truck, AlertTriangle } from "lucide-react";
import { BidDialog } from "@/components/bid-dialog";
import { EditJobDialog } from "@/components/edit-job-dialog";
import { DisputeDialog } from "@/components/dispute-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { ChatBox } from "@/components/chat-box";
import { ReviewForm } from "@/components/ReviewForm";

interface Job {
  id: number;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  status: string;
  created_at: string;
  client_id: number;
  client_first_name: string;
  client_last_name: string;
  client_avatar: string;
  client_is_verified: boolean;
  selected_freelancer_id?: number;
  final_price?: number;
  submission_message?: string;
  submission_attachment_url?: string;
}

interface Bid {
  id: number;
  amount: number;
  proposal: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string;
  freelancer_id: number;
  is_verified: boolean;
}

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [job, setJob] = useState<Job | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBidDialogOpen, setIsBidDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [submissionMsg, setSubmissionMsg] = useState("");
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser(payload);
      } catch (e) {
        console.error("Token decode error", e);
      }
    }
    fetchJobDetails();
  }, [id]);

  const fetchJobDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/jobs/${id}`);
      if (res.ok) {
        const data = await res.json();
        setJob(data);
        // If owner or admin or selected freelancer or freelancer, fetch bids
        const token = localStorage.getItem("token");
        const userRole = localStorage.getItem("userRole");
        if (token && (data.client_id === currentUser?.id || data.selected_freelancer_id === currentUser?.id || userRole === 'admin' || userRole === 'freelancer')) {
          fetchBids();
        }
        fetchReviews();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBids = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/jobs/${id}/bids`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBids(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_URL}/api/reviews/job/${id}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
        // Check if current user has already reviewed
        const userReview = data.find((r: any) => r.reviewer_id === currentUser?.id);
        if (userReview) setHasReviewed(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleBidAction = async (bidId: number, status: 'accepted' | 'rejected', amount?: number, title?: string) => {
    const token = localStorage.getItem("token");
    try {
      // If accepting, initiate payment first
      if (status === 'accepted' && amount) {
        const payRes = await fetch(`${API_URL}/api/payments/initiate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            bidId,
            amount,
            purchase_order_name: `Payment for ${title}`
          })
        });

        if (payRes.ok) {
          const { payment_url } = await payRes.json();
          window.location.href = payment_url; // Redirect to Khalti
          return;
        } else {
          const err = await payRes.json();
          toast({ title: "Payment Error", description: err.message, variant: "destructive" });
          return;
        }
      }

      const res = await fetch(`${API_URL}/api/jobs/bids/${bidId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast({ title: `Bid ${status}`, description: `The bid has been ${status}.` });
        fetchJobDetails();
        fetchBids();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleJobAction = async (action: 'complete' | 'confirm') => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/jobs/${id}/${action}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        toast({ title: "Success", description: `Task updated to ${action === 'complete' ? 'awaiting confirmation' : 'completed'}.` });
        fetchJobDetails();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteJob = async () => {
    if (!window.confirm("Are you sure you want to delete this job? This action cannot be undone and will remove all associated bids.")) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/jobs/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        toast({ title: "Job Deleted", description: "Your job posting has been successfully removed." });
        router.push("/client"); // Redirect to client dashboard
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to delete job", variant: "destructive" });
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading task details...</div>;
  if (!job) return <div className="p-8 text-center text-red-500">Task not found.</div>;

  const isOwner = currentUser?.id === job.client_id;
  const isFreelancer = (() => {
    const role = localStorage.getItem("userRole");
    if (role) return role === 'freelancer';
    // Fallback: read from user JSON
    try {
      const user = JSON.parse(localStorage.getItem("user") || '{}');
      return user.role === 'freelancer';
    } catch { return false; }
  })();
  const isSelectedFreelancer = currentUser?.id === job.selected_freelancer_id;
  const hasAlreadyBid = bids.some(b => b.freelancer_id === currentUser?.id);

  const handleDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionMsg && !submissionFile) {
      toast({ title: "Error", description: "Please provide a message or an attachment.", variant: "destructive" });
      return;
    }

    setIsSubmittingDelivery(true);
    const token = localStorage.getItem("token");
    const formData = new FormData();
    if (submissionMsg) formData.append('submission_message', submissionMsg);
    if (submissionFile) formData.append('attachment', submissionFile);

    try {
      const res = await fetch(`${API_URL}/api/jobs/${id}/complete`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        toast({ title: "Success", description: "Work submitted successfully! Awaiting client confirmation." });
        setSubmissionMsg("");
        setSubmissionFile(null);
        fetchJobDetails();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setIsSubmittingDelivery(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge variant="default" className="bg-blue-600">Open for Bids</Badge>;
      case 'pending_payment': return <Badge variant="outline" className="text-orange-600 border-orange-600">Pending Payment</Badge>;
      case 'in_progress': return <Badge variant="default" className="bg-green-600">In Progress</Badge>;
      case 'awaiting_confirmation': return <Badge variant="secondary" className="bg-yellow-500 text-white">Awaiting Confirmation</Badge>;
      case 'completed': return <Badge variant="secondary" className="bg-slate-700 text-white">Completed</Badge>;
      case 'disputed': return <Badge variant="destructive" className="bg-orange-600 flex items-center gap-1 animate-pulse">Disputed</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <PageHeader
        title={job.title}
        description={
          <div className="flex items-center gap-1">
            Posted by {job.client_first_name} {job.client_last_name}
            {job.client_is_verified && <span title="Verified Client"><CheckCircle className="h-3 w-3 text-blue-500 fill-blue-500/10" /></span>}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">Description</CardTitle>
                  <CardDescription>Full task details and requirements</CardDescription>
                </div>
                {getStatusBadge(job.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div 
                className="leading-relaxed text-slate-700 ql-editor p-0"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(job.description) }}
              />
            </CardContent>
          </Card>

          {/* Chat Integration */}
          {(isOwner || isSelectedFreelancer) && job.status === 'in_progress' && (
            <ChatBox taskId={job.id} currentUser={currentUser} apiUrl={API_URL} />
          )}

          {/* Client Bids Section (Visible to Owner/Admin/Freelancer) */}
          {(isOwner || localStorage.getItem("userRole") === 'admin' || isFreelancer) && job.status === 'open' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Received Bids ({bids.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {bids.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-dashed border-2 rounded-lg">
                    No bids received yet.
                  </div>
                ) : (
                  bids.map(bid => (
                    <div key={bid.id} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={bid.avatar_url?.startsWith('http') ? bid.avatar_url : `${API_URL}/uploads/${bid.avatar_url}`} />
                            <AvatarFallback>{bid.first_name[0]}{bid.last_name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-1">
                              <p className="font-bold">{bid.first_name} {bid.last_name}</p>
                              {bid.is_verified && <span title="Verified Freelancer"><CheckCircle className="h-3.5 w-3.5 text-blue-500 fill-blue-500/10" /></span>}
                            </div>
                            <p className="text-xs text-muted-foreground">{new Date(bid.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-primary">NPR {bid.amount}</p>
                          <Badge variant={bid.status === 'accepted' ? 'secondary' : (bid.status === 'rejected' ? 'destructive' : 'outline')}>
                            {bid.status}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm border-l-4 pl-4 py-2 italic bg-muted/20 mb-4 whitespace-pre-wrap">
                        {bid.proposal}
                      </p>

                      {isOwner && bid.status === 'pending' && (
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600" onClick={() => handleBidAction(bid.id, 'rejected')}>
                            <XCircle className="h-4 w-4 mr-1" /> Reject
                          </Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleBidAction(bid.id, 'accepted', bid.amount, job.title)}>
                            <CheckCircle className="h-4 w-4 mr-1" /> Pay & Hire
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* Selected Freelancer View (for Client) */}
          {isOwner && job.status !== 'open' && job.selected_freelancer_id && (
            <Card>
              <CardHeader>
                <CardTitle>Contract Management</CardTitle>
                <CardDescription>Status and actions for this hire</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between bg-muted/30 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                         <AvatarImage src={bids.find(b => b.freelancer_id === job.selected_freelancer_id)?.avatar_url} />
                        <AvatarFallback>FL</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold">Selected Freelancer</p>
                        <p className="text-sm text-muted-foreground">Contract Price: NPR {job.final_price}</p>
                      </div>
                    </div>
                  </div>

                  {job.status === 'pending_payment' && (
                    <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                      <p className="text-sm text-orange-800 font-medium mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" /> Payment Needed
                      </p>
                      <p className="text-xs text-orange-700 mb-4">
                        You have accepted the bid. Please fund the escrow to start the contract and allow the freelancer to begin work.
                      </p>
                      <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={() => {
                        const acceptedBid = bids.find(b => b.status === 'accepted' || b.freelancer_id === job.selected_freelancer_id);
                        if (acceptedBid) {
                          handleBidAction(acceptedBid.id, 'accepted', job.final_price, job.title);
                        } else {
                          toast({ title: "Error", description: "Could not find accepted bid details.", variant: "destructive" });
                        }
                      }}>
                        Fund Escrow (NPR {job.final_price})
                      </Button>
                    </div>
                  )}

                  {job.status === 'awaiting_confirmation' && (
                    <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleJobAction('confirm')}>
                      Approve Delivery & Release Payment
                    </Button>
                  )}
                  
                  {job.status === 'in_progress' && (
                    <div className="space-y-4">
                      <p className="text-sm text-center text-muted-foreground border-t pt-4">
                        Order in progress. Waiting for delivery.
                      </p>
                      <div className="flex justify-center">
                        <DisputeDialog jobId={job.id} onSuccess={fetchJobDetails} />
                      </div>
                    </div>
                  )}
                  
                  {job.status === 'disputed' && (
                    <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                      <p className="text-sm text-orange-800 font-bold mb-1 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" /> Contract Disputed
                      </p>
                      <p className="text-xs text-orange-700">
                        This contract has been frozen. An administrator is currently reviewing the case. No further actions can be taken until it is resolved.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Freelancer Progress Actions */}
          {isSelectedFreelancer && (
            <Card>
              <CardHeader>
                <CardTitle>Manage Task Progress</CardTitle>
                <CardDescription>Actions for your assigned task</CardDescription>
              </CardHeader>
              <CardContent>
                {job.status === 'in_progress' && (
                  <form onSubmit={handleDeliverySubmit} className="flex flex-col gap-4">
                    <div className="bg-muted/30 p-4 rounded-lg border-l-4 border-primary">
                      <p className="font-semibold flex items-center gap-2 mb-2"><Briefcase className="h-4 w-4"/> Workspace active</p>
                      <p className="text-sm text-slate-600 mb-4">Complete your work and deliver it below. Once approved, the funds will be released to your wallet.</p>
                      <div className="space-y-3">
                         <div className="space-y-1">
                           <label className="text-sm font-medium">Delivery Note <span className="text-red-500">*</span></label>
                           <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="E.g., Here is the final logo design as requested..." required value={submissionMsg} onChange={e => setSubmissionMsg(e.target.value)} />
                         </div>
                         <div className="space-y-1">
                           <label className="text-sm font-medium">Attachment (Optional)</label>
                           <input type="file" className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium" onChange={e => setSubmissionFile(e.target.files?.[0] || null)} />
                         </div>
                      </div>
                    </div>
                    <Button type="submit" disabled={isSubmittingDelivery} className="w-full sm:w-auto bg-primary">
                      <Truck className="h-4 w-4 mr-2" /> {isSubmittingDelivery ? 'Uploading Delivery...' : 'Deliver Finished Work'}
                    </Button>
                    <div className="mt-2 flex justify-center">
                      <DisputeDialog jobId={job.id} onSuccess={fetchJobDetails} />
                    </div>
                  </form>
                )}
                {job.status === 'awaiting_confirmation' && (
                  <p className="text-sm italic text-orange-600 bg-orange-50 p-4 rounded-lg flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Wait for client to confirm and release payment.
                  </p>
                )}
                {job.status === 'completed' && (
                  <p className="text-sm text-green-600 bg-green-50 p-4 rounded-lg flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" /> Payment has been released to your account.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Client Delivery Review Panel */}
          {isOwner && (job.status === 'awaiting_confirmation' || job.status === 'completed') && job.submission_message && (
             <Card className="border-blue-500 bg-blue-50/20 shadow-sm mt-6">
                <CardHeader>
                   <CardTitle className="text-blue-800 flex items-center gap-2">
                     <CheckCircle className="h-5 w-5" /> Freelancer Delivery
                   </CardTitle>
                   <CardDescription>Review the work submitted by the freelancer.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="bg-white p-4 rounded-md border shadow-sm">
                      <p className="whitespace-pre-wrap text-slate-700 text-sm">{job.submission_message}</p>
                      {job.submission_attachment_url && (
                          <a href={job.submission_attachment_url.startsWith('http') ? job.submission_attachment_url : `${API_URL}/uploads/${job.submission_attachment_url}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm flex items-center mt-4 font-medium hover:text-blue-800 transition-colors">
                              <Paperclip className="h-4 w-4 mr-1"/> Download Attached File
                          </a>
                      )}
                   </div>
                   {job.status === 'awaiting_confirmation' && (
                       <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700" onClick={() => handleJobAction('confirm')}>
                         Approve Delivery & Release Funds
                       </Button>
                   )}
                </CardContent>
             </Card>
          )}

          {/* Reviews Section */}
          {job.status === 'completed' && (isSelectedFreelancer || isOwner) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  Ratings & Feedback
                </CardTitle>
                <CardDescription>
                  {hasReviewed
                    ? "You have already submitted your feedback for this job."
                    : "Share your experience and help others on the platform."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!hasReviewed && (
                  <ReviewForm jobId={job.id} onSuccess={() => {
                    setHasReviewed(true);
                    fetchReviews();
                  }} />
                )}

                {reviews.length > 0 && (
                  <div className="space-y-4 pt-2">
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Submitted Reviews</h4>
                    {reviews.map((rev: any) => (
                      <div key={rev.id} className="p-4 border rounded-lg bg-slate-50/50">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={cn("h-4 w-4", rev.rating >= s ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">{new Date(rev.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-slate-700 italic">"{rev.comment}"</p>
                        <p className="text-[10px] mt-2 text-slate-400 font-medium">— by {rev.first_name} {rev.last_name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Task Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full text-primary">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Budget</p>
                  <p className="font-bold">NPR {job.budget}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-full text-orange-600">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Deadline</p>
                  <p className="font-bold">{job.deadline ? new Date(job.deadline).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Posted</p>
                  <p className="font-bold">{new Date(job.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <Separator />

              {isFreelancer && !isOwner && job.status === 'open' && (
                <div className="pt-2">
                  {hasAlreadyBid ? (
                    <Button disabled className="w-full">Bid Already Placed</Button>
                  ) : (
                    <Button className="w-full" size="lg" onClick={() => setIsBidDialogOpen(true)}>
                      Place a Bid
                    </Button>
                  )}
                </div>
              )}

              {isOwner && (
                <div className="flex flex-col gap-2 pt-2">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/client">Manage My Tasks</Link>
                  </Button>
                  
                  {job.status === 'open' && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <EditJobDialog job={job} onJobUpdated={fetchJobDetails} />
                      <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 flex items-center gap-2" onClick={handleDeleteJob}>
                        <Trash2 className="h-4 w-4" /> Delete
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About the Client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={job.client_avatar?.startsWith('http') ? job.client_avatar : `${API_URL}/uploads/${job.client_avatar}`} />
                  <AvatarFallback>{job.client_first_name[0]}{job.client_last_name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="font-bold">{job.client_first_name} {job.client_last_name}</p>
                    {job.client_is_verified && <span title="Verified Client"><CheckCircle className="h-3.5 w-3.5 text-blue-500 fill-blue-500/10" /></span>}
                  </div>
                  <p className="text-xs text-muted-foreground">Member since {new Date(job.created_at).getFullYear()}</p>
                </div>
              </div>
              <Button asChild variant="ghost" className="w-full justify-start text-xs h-8" size="sm">
                <Link href={`/user/${job.client_id}`}>
                  <User className="h-3 w-3 mr-2" /> View Client Profile
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <BidDialog
        jobId={job.id}
        jobTitle={job.title}
        isOpen={isBidDialogOpen}
        onOpenChange={setIsBidDialogOpen}
        onSuccess={() => {
          fetchJobDetails();
          fetchBids();
        }}
      />
    </>
  );
}
