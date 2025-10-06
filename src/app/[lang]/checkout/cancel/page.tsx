"use client";

import { Suspense } from "react";
import CheckoutCancelContent from "./cancel-content";

function CheckoutCancelLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default function CheckoutCancel() {
  return (
    <Suspense fallback={<CheckoutCancelLoading />}>
      <CheckoutCancelContent />
    </Suspense>
  );
}