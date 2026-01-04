import Link from "next/link";
import { Mountain } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 text-foreground", className)}>
      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground">
        <Mountain className="h-5 w-5" />
      </div>
      <span className="font-headline text-xl font-semibold">Kaamko Kura</span>
    </Link>
  );
}
