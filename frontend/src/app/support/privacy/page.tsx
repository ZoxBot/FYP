import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, Eye, Database, ShieldCheck } from "lucide-react";
import Logo from "@/components/logo";

export default function PrivacyPage() {
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
              <Lock className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tighter">Privacy <span className="text-primary italic">Policy</span></h1>
            <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-xs">Last Updated: {lastUpdated}</p>
          </div>

          {/* Content */}
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10">
            <section className="space-y-4">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary" /> 1. Overview
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Kaamko Kura is committed to protecting your personal information and your privacy. This Privacy Policy describes how we collect, use, and share your personal information when you use our platform.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary" /> 2. Information We Collect
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 glass-card rounded-2xl space-y-3">
                  <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Database className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold">Account Data</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">Name, email, phone number, and identity verification documents. We collect this to ensure a secure marketplace.</p>
                </div>
                <div className="p-6 glass-card rounded-2xl space-y-3">
                  <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Eye className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold">Usage Data</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">Browsing history on our platform, interaction with other users, and logs that help us improve user experience.</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary" /> 3. How We Use Information
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We use your information to facilitate transactions, verify identities, improve our services, and provide customer support. We do not sell your personal information to third parties.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary" /> 4. Data Security
              </h2>
              <div className="bg-primary/5 p-8 rounded-3xl border border-primary/20 flex flex-col md:flex-row gap-8 items-center">
                <ShieldCheck className="h-12 w-12 text-primary shrink-0" />
                <p className="text-sm font-medium leading-relaxed">
                  We implement a variety of security measures to maintain the safety of your personal information, including encrypted databases and secure communication protocols (HTTPS). All sensitive verification data is stored in high-security environments.
                </p>
              </div>
            </section>

            <div className="bg-foreground text-background p-10 rounded-[2.5rem] mt-20 space-y-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] -mr-16 -mt-16" />
               <h3 className="text-2xl font-black relative z-10">Privacy Concerns?</h3>
               <p className="opacity-70 relative z-10 max-w-xl">If you have any questions about how your data is handled, please reach out to our privacy officer via the Help Center.</p>
               <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-xs h-12 px-8 rounded-xl relative z-10">
                 <Link href="/support">Contact Privacy Center</Link>
               </Button>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/40 py-10 opacity-60">
        <div className="container mx-auto px-4 text-center text-[10px] font-black uppercase tracking-[0.2em]">
          <p>&copy; {new Date().getFullYear()} Kaamko Kura Privacy • Crafted with ❤️ by Zox</p>
        </div>
      </footer>
    </div>
  );
}
