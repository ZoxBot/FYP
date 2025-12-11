import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Briefcase, Users, Star } from "lucide-react";
import Logo from "@/components/logo";
import { placeholderImages } from "@/lib/placeholder-images";

export default function LandingPage() {
  const heroImage = placeholderImages.find(p => p.id === "hero");

  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tight text-foreground">
              Connecting Talent with Opportunity in Nepal
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Kaamko Kura is your go-to platform for finding skilled freelancers and exciting project opportunities, right here in Nepal.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/tasks">
                  Find Work <ArrowRight className="ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/signup">
                  Hire Talent
                </Link>
              </Button>
            </div>
          </div>
          {heroImage && (
            <div className="mt-12 relative h-96 w-full max-w-5xl mx-auto rounded-xl overflow-hidden shadow-2xl">
              <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                fill
                className="object-cover"
                data-ai-hint={heroImage.imageHint}
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            </div>
          )}
        </section>

        {/* How It Works Section */}
        <section className="bg-secondary py-20 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="font-headline text-3xl md:text-4xl font-bold">How It Works</h2>
              <p className="mt-4 text-muted-foreground">
                A simple, secure, and efficient way to get things done.
              </p>
            </div>
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/20 text-primary">
                  <Briefcase className="h-8 w-8" />
                </div>
                <h3 className="font-headline mt-6 text-xl font-semibold">1. Post a Task</h3>
                <p className="mt-2 text-muted-foreground">Clients describe the work, set a budget, and post it for our community of talented freelancers.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/20 text-primary">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="font-headline mt-6 text-xl font-semibold">2. Choose a Freelancer</h3>
                <p className="mt-2 text-muted-foreground">Review bids, check profiles, and hire the best student or professional for your job.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/20 text-primary">
                  <Star className="h-8 w-8" />
                </div>
                <h3 className="font-headline mt-6 text-xl font-semibold">3. Collaborate & Pay Securely</h3>
                <p className="mt-2 text-muted-foreground">Work together, and once the job is complete, release payment through our secure Khalti integration.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Categories */}
        <section className="py-20 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="font-headline text-3xl md:text-4xl font-bold">Find Talent In Any Field</h2>
              <p className="mt-4 text-muted-foreground">
                Whatever your project needs, there's a freelancer on Kaamko Kura ready to help.
              </p>
            </div>
            <div className="mt-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {['Graphics & Design', 'Writing & Translation', 'Digital Marketing', 'Video & Animation', 'Music & Audio', 'Programming & Tech', 'Data Entry', 'Business Support'].map(category => (
                <Card key={category} className="hover:shadow-lg hover:-translate-y-1 transition-transform duration-300">
                  <CardContent className="p-6">
                    <h3 className="font-headline text-center font-semibold">{category}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-secondary border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row justify-between items-center">
          <Logo />
          <p className="text-sm text-muted-foreground mt-4 sm:mt-0">&copy; {new Date().getFullYear()} Kaamko Kura. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
