import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
export default function NotFound() {
  return (
    <main className="loading-screen">
      <Sparkles />
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link className="btn btn-primary" href="/studio">
        Back to the studio <ArrowRight size={16} />
      </Link>
    </main>
  );
}
