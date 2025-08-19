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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Payment Verification Failed</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">{error}</p>
            <Button onClick={() => router.push("/dashboard")}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const eventId = sessionData?.metadata?.eventId;
  const planName = sessionData?.metadata?.plan;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Payment Successful!
          </CardTitle>
          <p className="text-gray-600">
            Your event has been upgraded to the {planName} plan
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {sessionData && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
              <p className="text-sm text-green-800">
                <span className="font-medium">Amount:</span> {" "}
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: sessionData.currency?.toUpperCase() || "USD",
                }).format((sessionData.amount_total || 0) / 100)}
              </p>
              <p className="text-sm text-green-800">
                <span className="font-medium">Plan:</span> {planName} Plan
              </p>
              <p className="text-sm text-green-800">
                <span className="font-medium">Status:</span> {sessionData.payment_status}
              </p>
            </div>
          )}

          <div className="space-y-3">
            {eventId && (
              <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                <Link href={`/dashboard/events/${eventId}`}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Go to Event Dashboard
                </Link>
              </Button>
            )}

            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard">
                <Home className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Your event features have been unlocked and you can now publish your gallery!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}