import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Scale, ShieldCheck, FileText } from "lucide-react";
import Logo from "@/components/logo";

export default function TermsPage() {
  const lastUpdated = "March 18, 2026";

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Logo />
          <Button variant="ghost" asChild>
            <Link href="/support" className="flex items-center gap-2 font-bold">
              <ArrowLeft className="h-4 w-4" /> Support Center
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-grow py-20 px-4">
        <div className="container mx-auto max-w-4xl space-y-12">
          {/* Header */}
          <div className="space-y-4">
            <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-6">
              <Scale className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tighter">Terms of <span className="text-primary italic">Service</span></h1>
            <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-xs">Last Updated: {lastUpdated}</p>
          </div>

          {/* Content */}
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10">
            <section className="space-y-4">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary" /> 1. Acceptance of Terms
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using Kaamko Kura, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not use our services. We provide a platform for connecting independent freelancers with clients in Nepal.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary" /> 2. User Eligibility
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Users must be at least 18 years old or have parental consent to use the platform. As we frequently serve the student community, certain tasks may be restricted to verified students only.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary" /> 3. Payments & Escrow
              </h2>
              <div className="bg-secondary/30 p-8 rounded-3xl border border-secondary flex flex-col md:flex-row gap-8 items-center">
                <ShieldCheck className="h-12 w-12 text-primary shrink-0" />
                <p className="text-sm font-medium leading-relaxed">
                  Kaamko Kura uses an escrow-style payment system. Funds must be deposited by the client before work begins. Payments are released only upon satisfactory completion of the task, verified by both parties. We utilize Khalti as our primary payment gateway in Nepal.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary" /> 4. Platform Fees
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Kaamko Kura charges a service fee of 5% on each successful transaction. This fee covers platform maintenance, hosting, and our local dispute resolution support. There are no registration or subscription fees.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary" /> 5. Dispute Resolution
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                In the event of a disagreement, users may open a case in our Dispute Resolution Center. Our administrators will act as neutral mediators to review project history, communication, and deliverables to reach a fair resolution.
              </p>
            </section>

            <div className="bg-foreground text-background p-10 rounded-[2.5rem] mt-20 space-y-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] -mr-16 -mt-16" />
               <h3 className="text-2xl font-black relative z-10">Questions about our Terms?</h3>
               <p className="opacity-70 relative z-10 max-w-xl">If you have any questions regarding these terms, please contact our legal support team via the Help Center.</p>
               <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-xs h-12 px-8 rounded-xl relative z-10">
                 <Link href="/support">Contact Legal Support</Link>
               </Button>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/40 py-10 opacity-60">
        <div className="container mx-auto px-4 text-center text-[10px] font-black uppercase tracking-[0.2em]">
          &copy; {new Date().getFullYear()} Kaamko Kura Legal • Crafted with ❤️ by Zox
        </div>
      </footer>
    </div>
  );
}
