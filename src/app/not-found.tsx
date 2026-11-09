import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
export default function NotFound() {
  return (
    <main className="loading-screen">
      <Sparkles />
      <h1>This story took a little detour.</h1>
      <p>The page you’re looking for isn’t here.</p>
      <Link className="btn btn-primary" href="/studio">
        Back to your studio <ArrowRight size={16} />
      </Link>
    </main>
  );
}
