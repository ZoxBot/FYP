"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  HelpCircle, 
  Search, 
  Book, 
  MessageSquare, 
  ArrowLeft,
  Mail,
  Smartphone
} from "lucide-react";
import Logo from "@/components/logo";

export default function SupportPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Logo />
          <Button variant="ghost" asChild>
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-grow">
        {/* Banner */}
        <section className="bg-primary/5 border-b border-border/40 py-20">
          <div className="container mx-auto px-4 text-center space-y-8">
            <h1 className="text-4xl md:text-5xl font-black font-headline">How can we <span className="text-primary italic">help?</span></h1>
            <div className="max-w-2xl mx-auto relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search for articles, guides, or questions..." 
                className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-border/60 bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-lg font-medium"
              />
            </div>
          </div>
        </section>

        {/* Support Grid */}
        <section className="container mx-auto px-4 py-24">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-card p-10 rounded-3xl border-border/50 hover:border-primary/30 transition-all cursor-pointer group">
              <Book className="h-10 w-10 text-primary mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-black mb-4">Knowledge Base</h3>
              <p className="text-muted-foreground font-medium mb-6">Learn how to post tasks, manage bids, and secure your account with our detailed guides.</p>
              <Button variant="link" className="p-0 text-primary font-black uppercase tracking-widest text-xs">Explore Guides →</Button>
            </div>
            
            <div className="glass-card p-10 rounded-3xl border-border/50 hover:border-primary/30 transition-all cursor-pointer group">
              <MessageSquare className="h-10 w-10 text-primary mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-black mb-4">Live Chat</h3>
              <p className="text-muted-foreground font-medium mb-6">Our local support team is available from 9:00 AM to 6:00 PM (NPT) for urgent queries.</p>
              <Button variant="link" className="p-0 text-primary font-black uppercase tracking-widest text-xs">Start Chat →</Button>
            </div>

            <div className="glass-card p-10 rounded-3xl border-border/50 hover:border-primary/30 transition-all cursor-pointer group">
              <HelpCircle className="h-10 w-10 text-primary mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-black mb-4">FAQs</h3>
              <p className="text-muted-foreground font-medium mb-6">Common questions about Khalti payments, commissions, and dispute resolution answered.</p>
              <Button variant="link" className="p-0 text-primary font-black uppercase tracking-widest text-xs">View FAQs →</Button>
            </div>
          </div>
        </section>

        {/* Contact Info */}
        <section className="container mx-auto px-4 pb-24">
          <div className="bg-foreground text-background rounded-[3rem] p-12 md:p-20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -mr-32 -mt-32" />
            <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl md:text-5xl font-black font-headline">Still need <span className="text-primary italic">support?</span></h2>
                <p className="text-xl text-background/60 font-medium">Reach out via email or phone, and we'll get back to you within 24 hours.</p>
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-6 p-6 bg-background/5 border border-white/5 rounded-2xl hover:bg-background/10 transition-all">
                  <Mail className="h-8 w-8 text-primary" />
                  <div>
                    <h4 className="font-black">Email Support</h4>
                    <p className="text-sm font-medium opacity-60">support@kaamkokura.com.np</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 p-6 bg-background/5 border border-white/5 rounded-2xl hover:bg-background/10 transition-all">
                  <Smartphone className="h-8 w-8 text-primary" />
                  <div>
                    <h4 className="font-black">Call Us</h4>
                    <p className="text-sm font-medium opacity-60">+977 1-44XXXXX (Kathmandu)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 py-10 opacity-60">
        <div className="container mx-auto px-4 flex justify-between items-center text-xs font-bold uppercase tracking-widest">
          <p>&copy; {new Date().getFullYear()} Kaamko Kura Support • Crafted with ❤️ by Zox</p>
          <div className="flex gap-6">
            <Link href="/">Back to Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
