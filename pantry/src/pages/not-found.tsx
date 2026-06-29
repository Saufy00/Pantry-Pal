import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center text-center min-h-[50vh] gap-4">
        <div className="text-7xl font-serif font-bold text-muted-foreground/30">
          404
        </div>
        <h1 className="text-xl font-serif font-semibold text-foreground">
          Page not found
        </h1>
        <p className="text-sm text-muted-foreground max-w-[300px]">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <Button variant="outline" className="mt-2 rounded-full gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    </Layout>
  );
}
