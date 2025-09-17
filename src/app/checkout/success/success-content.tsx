"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Home } from "lucide-react";

export default function CheckoutSuccessContent() {
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    async function verifyPayment() {
      if (!sessionId) {
        setError("Missing session ID");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/checkout/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to verify payment");
        }

        setSessionData(data);
      } catch (err: any) {
        setError(err.message || "Failed to verify payment");
      } finally {
        setLoading(false);
      }
    }

    verifyPayment();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-muted/50 flex items-center justify-center relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl"></div>
        </div>

        <div className="text-center relative z-10">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-destructive/5 to-muted/50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-destructive/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl"></div>
        </div>

        <Card className="w-full max-w-md shadow-xl bg-card/95 backdrop-blur-sm relative z-10">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Payment Verification Failed</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => router.push("/dashboard")} className="w-full">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const eventId = sessionData?.metadata?.eventId;
  const planName = sessionData?.metadata?.plan;
  const context = sessionData?.metadata?.context || 'dashboard';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-muted/50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md shadow-xl bg-card/95 backdrop-blur-sm relative z-10">
        <CardHeader className="text-center pb-4">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg ring-4 ring-primary/20">
            <CheckCircle className="w-12 h-12 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Payment Successful! 🎉
          </CardTitle>
          <p className="text-muted-foreground">
            Your event has been upgraded to the {planName} plan
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {sessionData && (
            <div className="bg-gradient-to-r from-primary/5 to-secondary/10 border rounded-xl p-4 space-y-2">
              <p className="text-sm text-foreground">
                <span className="font-medium text-muted-foreground">Amount:</span> {" "}
                <span className="font-semibold">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: sessionData.currency?.toUpperCase() || "USD",
                  }).format((sessionData.amount_total || 0) / 100)}
                </span>
              </p>
              <p className="text-sm text-foreground">
                <span className="font-medium text-muted-foreground">Plan:</span> {" "}
                <span className="font-semibold">{planName} Plan</span>
              </p>
              <p className="text-sm text-foreground">
                <span className="font-medium text-muted-foreground">Status:</span> {" "}
                <span className="font-semibold text-primary">{sessionData.payment_status}</span>
              </p>
            </div>
          )}

          <div className="space-y-3">
            {context === 'onboarding' && eventId ? (
              <Button asChild className="w-full bg-primary hover:bg-primary/90 shadow-lg">
                <Link href={`/onboarding?slug=${sessionData?.metadata?.eventSlug || eventId}&step=5`}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Continue Setup
                </Link>
              </Button>
            ) : eventId ? (
              <Button asChild className="w-full bg-primary hover:bg-primary/90 shadow-lg">
                <Link href={`/dashboard/events/${eventId}`}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Go to Event Dashboard
                </Link>
              </Button>
            ) : null}

            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard">
                <Home className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              ✨ Your event features have been unlocked and you can now publish your gallery!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}