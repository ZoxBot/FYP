import Link from "next/link";
import { Mountain } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Logo({
  className,
  hideText = false
}: {
  className?: string;
  hideText?: boolean;
}) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 text-foreground", className)}>
      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground shrink-0">
        <Mountain className="h-5 w-5" />
      </div>
      {!hideText && <span className="font-headline text-xl font-semibold">Kaamko Kura</span>}
    </Link>
  );
}
