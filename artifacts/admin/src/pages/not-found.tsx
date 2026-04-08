import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground text-center p-4">
      <div className="w-24 h-24 mb-6 rounded-2xl bg-secondary flex items-center justify-center border-2 border-border shadow-xl">
        <span className="font-display text-4xl font-bold text-primary">404</span>
      </div>
      <h1 className="text-4xl font-bold font-display text-white mb-4">Page Not Found</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link href="/dashboard" className="outline-none">
        <Button size="lg" className="w-48">Go Home</Button>
      </Link>
    </div>
  );
}
