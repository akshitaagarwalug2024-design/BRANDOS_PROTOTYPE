"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
export default function Auth() {
  const [signup, setSignup] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [account, setAccount] = useState("");
  useEffect(() => {
    if (!supabase) return;
    const params = new URLSearchParams(location.hash.slice(1));
    const urlError = params.get("error_description");
    if (urlError) setMessage(urlError.replace(/\+/g, " "));
    void supabase.auth.getUser().then(({ data }) => {
      setAccount(data.user?.email || "");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAccount(session?.user?.email || "");
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return (
    <main className="auth-page">
      <div className="auth-art">
        <Link href="/" className="wordmark">
          UnStuck
        </Link>
        <img src="/media/grow.svg" alt="" />
        <h1>
          Consistent content,
          <br />
          without a content team.
        </h1>
      </div>
      <div className="auth-form">
        <Link href="/" className="text-link">
          <ArrowLeft size={16} /> Back to UnStuck
        </Link>
        <Sparkles size={28} />
        <h2>{signup ? "Create your account" : "Sign in to UnStuck"}</h2>
        <p>
          {supabase
            ? "Sign in to back up your workspace securely."
            : "Explore the prototype without an account. Cloud sign-in needs a Supabase connection."}
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!supabase) return;
            setBusy(true);
            setMessage("");
            try {
              const result = signup
                ? await supabase.auth.signUp({
                    email,
                    password,
                    options: { emailRedirectTo: location.origin + "/studio" },
                  })
                : await supabase.auth.signInWithPassword({ email, password });
              if (result.error) throw result.error;
              if (result.data.session) location.href = "/studio";
              else
                setMessage(
                  "Check your email to confirm your account, then sign in.",
                );
            } catch (e) {
              setMessage(
                e instanceof Error ? e.message : "Authentication failed",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              required
              minLength={8}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={signup ? "new-password" : "current-password"}
            />
          </label>
          <Button disabled={!supabase || busy} type="submit">
            {busy ? "Please wait…" : signup ? "Create account" : "Sign in"}{" "}
            <ArrowUpRight size={16} />
          </Button>
        </form>
        {message && (
          <p role="status" className="notice">
            {message}
          </p>
        )}
        {account && (
          <p role="status" className="notice">
            You are signed in as {account}.{" "}
            <Link href="/studio">Open the studio</Link> or{" "}
            <button
              className="text-link"
              onClick={async () => {
                await supabase?.auth.signOut();
                setMessage("Signed out.");
              }}
            >
              sign out
            </button>
            .
          </p>
        )}
        <button className="text-link" onClick={() => setSignup(!signup)}>
          {signup
            ? "Already have an account? Sign in"
            : "New here? Create an account"}
        </button>
        <div className="divider">or start exploring</div>
        <Link className="btn btn-outline" href="/studio">
          Continue in Demo Mode <ArrowUpRight size={16} />
        </Link>
        <small>No account required. Demo work is saved on this device.</small>
      </div>
    </main>
  );
}
