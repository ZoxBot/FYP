import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowRight, 
  Briefcase, 
  Users, 
  Star, 
  CheckCircle2, 
  ShieldCheck, 
  Zap,
  Globe,
  Award,
  HelpCircle,
  FileText,
  Lock,
  Heart,
  Code2
} from "lucide-react";
import Logo from "@/components/logo";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen selection:bg-primary/30">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Logo className="scale-110" />
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="#how-it-works" className="hover:text-primary transition-colors">How it works</Link>
            <Link href="#about" className="hover:text-primary transition-colors">About Us</Link>
            <Link href="#categories" className="hover:text-primary transition-colors">Categories</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-full px-6 text-sm font-bold">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-20">
        {/* Hero Section - Clean, Centered Layout */}
        <section className="relative overflow-hidden mesh-gradient py-12 md:py-20 lg:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
            
            <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] animate-fade-in mb-8">
              <Zap className="h-3.5 w-3.5 fill-primary" /> Nepal's #1 Freelance Marketplace
            </div>
            
            <div className="space-y-6 max-w-4xl mx-auto">
              <h1 className="font-headline text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-foreground leading-[1.1]">
                Hire the <span className="text-primary italic">Best</span>.<br />
                Deliver <span className="underline decoration-primary/30 decoration-8 underline-offset-8">Results</span>.
              </h1>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto font-medium">
                Bridge the gap between vision and execution. Connect with Nepal's top-tier freelancers for your next big project. Secure, verified, and local.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-10">
              <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 md:h-14 px-8 md:px-10 text-base md:text-lg font-bold rounded-xl shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 group">
                <Link href="/tasks">
                  Browse Jobs <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12 md:h-14 px-8 md:px-10 text-base md:text-lg font-bold rounded-xl border-2 hover:bg-secondary/80 bg-background/30 backdrop-blur-sm transition-all hover:scale-105 active:scale-95">
                <Link href="/signup">Hire Talent</Link>
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-12">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  <ShieldCheck className="h-4 w-4 text-green-500" /> Secure Payments
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" /> Verified Pros
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  <Globe className="h-4 w-4 text-orange-500" /> Locally Optimized
                </div>
            </div>

            {/* Global Stats Overlay (Mobile & Tablet visible) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full max-w-5xl mx-auto pt-16 lg:pt-24">
              {[
                { label: 'Freelancers', value: '1,200+' },
                { label: 'Jobs Completed', value: '450+' },
                { label: 'Total Volume', value: 'NPR 5M+' },
                { label: 'Satisfaction', value: '98%' },
              ].map((stat) => (
                <div key={stat.label} className="glass-card p-5 rounded-2xl text-center space-y-1 hover:border-primary/30 transition-all hover:-translate-y-1">
                  <p className="text-2xl lg:text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Background Decorative Blobs */}
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -z-10 animate-pulse" />
          <div className="absolute bottom-0 -right-20 w-[30rem] h-[30rem] bg-accent/10 rounded-full blur-[120px] -z-10" />
        </section>

        {/* How It Works Section - Dark Premium Redesign */}
        <section id="how-it-works" className="py-24 bg-[#050505] relative overflow-hidden">
          {/* Background effects */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-7xl px-4">
             <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -mr-48 -mt-48" />
             <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/20 rounded-full blur-[100px] -ml-48 -mb-48" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center space-y-4 mb-16 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
                The Process
              </div>
              <h2 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
                Simple as <span className="text-primary italic">One, Two, Three.</span>
              </h2>
              <p className="text-base md:text-lg text-gray-400 font-medium leading-relaxed">
                We've stripped away the complexity of traditional freelancing to give you a streamlined, secure experience.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 pb-12">
              {[
                {
                  step: "01",
                  title: "Post Your Vision",
                  desc: "Share your project details. Whether it's a logo or a complex web app, our platform handles it all.",
                  icon: <FileText className="h-8 w-8 text-primary" />,
                  gradient: "from-primary/20 to-transparent"
                },
                {
                  step: "02",
                  title: "Match & Collaborate",
                  desc: "Connect with vetted talent. Use our secure workspace to communicate and manage milestones.",
                  icon: <Users className="h-8 w-8 text-primary" />,
                  gradient: "from-primary/20 to-transparent"
                },
                {
                  step: "03",
                  title: "Secure Delivery",
                  desc: "Finalize your project and release payment only when the results exceed your expectations.",
                  icon: <Zap className="h-8 w-8 text-primary" />,
                  gradient: "from-primary/20 to-transparent"
                }
              ].map((item) => (
                <div key={item.step} className="group relative">
                  <div className="relative h-full bg-[#0D0D0F] border border-white/5 p-12 rounded-[2.5rem] transition-all hover:border-primary/50 hover:bg-[#121214] overflow-hidden">
                    {/* Content */}
                    <div className="relative z-10 space-y-8">
                      <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        {item.icon}
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-2xl font-bold text-white tracking-tight group-hover:text-primary transition-colors">{item.title}</h3>
                        <p className="text-gray-400 leading-relaxed font-medium">{item.desc}</p>
                      </div>
                    </div>

                    {/* Subtle bottom accent */}
                    <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="about" className="py-20 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                  Empowering <span className="text-primary italic">Nepal's</span> Digital Economy.
                </h2>
                <div className="space-y-4">
                  <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                    Kaamko Kura was built to solve the trust gap in the local freelance market. We provide a secure workspace where quality work meets fair payment.
                  </p>
                  <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                    Whether you are a student looking for your first gig or a business scaling up, our platform offers the tools you need to succeed.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    "Verified Freelancers",
                    "Escrow Payouts",
                    "Local Support Team",
                    "5% Platform Fee"
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 bg-secondary/30 p-4 rounded-2xl border border-secondary">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span className="font-bold text-sm tracking-tight">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-6">
                <div className="glass-premium p-10 rounded-[3rem] border-primary/20 bg-primary/5">
                  <Award className="h-12 w-12 text-primary mb-6 animate-pulse-slow" />
                  <h3 className="text-2xl font-black mb-4 italic tracking-tight">Why Kaamko Kura?</h3>
                  <p className="text-muted-foreground font-medium leading-relaxed">
                    Designed exclusively for the Nepal market, we bridge the gap between global standards and local needs. Supporting local banks, Khalti, and understanding the unique landscape of Himalayan entrepreneurship.
                  </p>
                </div>
                <div className="flex items-center gap-6 p-8 glass-card rounded-[2.5rem] hover:border-primary/30 transition-all group">
                  <div className="p-4 bg-primary/10 rounded-2xl group-hover:bg-primary transition-colors">
                    <ShieldCheck className="h-8 w-8 text-primary group-hover:text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg tracking-tight">Built-in Trust</h4>
                    <p className="text-sm text-muted-foreground font-medium">Every contract is protected by our automated Escrow and Dispute Hub.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section id="categories" className="py-20 bg-secondary/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
              <div className="space-y-3 max-w-2xl">
                <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight italic">Find Talent In Any Field</h2>
                <p className="text-base md:text-lg text-muted-foreground">Explore thousands of skilled professionals across multiple domains.</p>
              </div>
              <Button variant="ghost" className="text-primary font-bold hover:bg-primary/10 h-12 rounded-xl group" asChild>
                <Link href="/tasks">View Marketplace <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" /></Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { name: 'Graphics & Design', icon: '🎨', color: 'from-orange-500/20 to-transparent' },
                { name: 'Programming', icon: '💻', color: 'from-blue-500/20 to-transparent' },
                { name: 'Digital Marketing', icon: '📈', color: 'from-green-500/20 to-transparent' },
                { name: 'Video Editing', icon: '🎬', color: 'from-red-500/20 to-transparent' },
                { name: 'Translation', icon: '✍️', color: 'from-purple-500/20 to-transparent' },
                { name: 'Data Entry', icon: '📊', color: 'from-gray-500/20 to-transparent' },
                { name: 'Business Support', icon: '🤝', color: 'from-amber-500/20 to-transparent' },
                { name: 'Audio Design', icon: '🎵', color: 'from-pink-500/20 to-transparent' },
              ].map((cat) => (
                <Link key={cat.name} href={`/tasks?category=${encodeURIComponent(cat.name)}`}>
                  <Card className="glass-premium border-none hover:scale-[1.05] transition-all duration-500 rounded-[2.5rem] cursor-pointer group overflow-hidden relative">
                    <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    <CardContent className="p-8 flex flex-col items-center gap-4 relative z-10">
                      <div className="text-5xl group-hover:scale-125 group-hover:-rotate-12 transition-all duration-500 drop-shadow-2xl">
                        {cat.icon}
                      </div>
                      <h4 className="font-bold text-center tracking-tight group-hover:text-primary transition-colors">
                        {cat.name}
                      </h4>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA - Ultra Premium */}
        <section className="py-20 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-dark rounded-[3rem] p-12 md:p-24 text-center space-y-8 relative overflow-hidden border border-white/10">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[100px] -mr-48 -mt-48 animate-pulse-slow" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] -ml-48 -mb-48" />
            
            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold font-headline tracking-tighter text-white leading-tight">
                Ready to start <br />
                <span className="text-gradient italic">something big?</span>
              </h2>
              <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed font-medium">
                Join thousands of Nepalese visionaries and experts building the future, one project at a time.
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6">
                <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-10 text-base md:text-lg font-bold rounded-xl shadow-xl shadow-primary/40 transition-all hover:scale-105 active:scale-95">
                  <Link href="/signup">Sign Up Today</Link>
                </Button>
                <Link href="/login" className="text-gray-400 font-bold hover:text-white transition-colors border-b border-transparent hover:border-white">
                  Already have an account? Log In
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Premium Overhaul */}
      <footer className="relative bg-[#0A0A0B] text-white pt-24 pb-12 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-64 -mt-64" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-6 gap-16 mb-24">
            {/* Branding & Mission */}
            <div className="md:col-span-3 space-y-8">
              <Logo className="scale-125 origin-left text-yellow-500" />
              <p className="text-gray-400 text-lg max-w-md leading-relaxed font-medium">
                The premier digital workspace built exclusively for Nepal. Empowering talent, bridging gaps, and fostering local innovation.
              </p>
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Architected By</span>
                  <span className="text-lg font-bold">Prabin Shah Aka Zox</span>
                </div>
                <div className="h-10 w-px bg-gray-800" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Status</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-bold">Systems Online</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-8">
              <h5 className="font-black text-xs uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                <Globe className="h-3 w-3" /> Connect
              </h5>
              <nav className="flex flex-col gap-5 text-sm font-bold">
                <Link href="/tasks" className="text-gray-400 hover:text-primary transition-colors hover:translate-x-1 transform duration-200">Post a Task</Link>
                <Link href="/tasks" className="text-gray-400 hover:text-primary transition-colors hover:translate-x-1 transform duration-200">Find Work</Link>
                <Link href="#how-it-works" className="text-gray-400 hover:text-primary transition-colors hover:translate-x-1 transform duration-200">How It Works</Link>
                <Link href="#about" className="text-gray-400 hover:text-primary transition-colors hover:translate-x-1 transform duration-200">About Us</Link>
              </nav>
            </div>

            {/* Support */}
            <div className="space-y-8">
              <h5 className="font-black text-xs uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                <HelpCircle className="h-3 w-3" /> Help
              </h5>
              <nav className="flex flex-col gap-5 text-sm font-bold">
                <Link href="/support" className="text-gray-400 hover:text-primary transition-colors group flex items-center gap-2">
                   Help Center <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </Link>
                <Link href="/support/terms" className="text-gray-400 hover:text-primary transition-colors group flex items-center gap-2">
                   Terms <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </Link>
                <Link href="/support/privacy" className="text-gray-400 hover:text-primary transition-colors group flex items-center gap-2">
                   Privacy <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </Link>
              </nav>
            </div>

            {/* Platform Badge */}
            <div className="hidden lg:flex flex-col justify-end items-end col-span-1">
               <div className="glass-card bg-white/5 border-white/10 p-6 rounded-[2rem] text-center space-y-2 w-full max-w-[160px]">
                  <Code2 className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-tighter leading-none">V. 1.0.4</p>
                  <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest text-center">Stable Release</p>
               </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
              <span>&copy; {new Date().getFullYear()} Kaamko Kura</span>
              <span className="h-1 w-1 rounded-full bg-gray-800" />
              <span>All rights reserved.</span>
            </div>
            
            <div className="flex items-center gap-3 px-6 py-2 rounded-full border border-white/5 bg-white/[0.02] text-[10px] font-black uppercase tracking-widest">
              <span>Crafted with</span>
              <Heart className="h-3 w-3 fill-primary text-primary animate-pulse" />
              <span>by</span>
              <Link href="#" className="text-white hover:text-primary transition-colors">Zox</Link>
            </div>

            <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-gray-600">
              <span className="hover:text-primary cursor-pointer transition-colors">Nepali Centric Platform</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
