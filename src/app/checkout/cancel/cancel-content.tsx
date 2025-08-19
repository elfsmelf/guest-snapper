"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function CheckoutCancelContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("event_id");

  const retryPayment = () => {
    if (eventId) {
      window.location.href = `/dashboard/events/${eventId}`;
    } else {
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-12 h-12 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Payment Cancelled
          </CardTitle>
          <p className="text-gray-600">
            Your payment was not completed
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-800">
              Don&apos;t worry! Your event is still available with your current plan. 
              You can try upgrading again anytime from your event settings.
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={retryPayment}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>

            {eventId && (
              <Button 
                variant="outline" 
                asChild 
                className="w-full"
              >
                <Link href={`/dashboard/events/${eventId}`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Event Settings
                </Link>
              </Button>
            )}

            <Button 
              variant="ghost" 
              asChild 
              className="w-full"
            >
              <Link href="/dashboard">
                Back to Dashboard
              </Link>
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Need help? Contact our support team for assistance with your upgrade.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}