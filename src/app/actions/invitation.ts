"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function acceptInvitation(invitationId: string) {
  try {
    const result = await (auth.api as any).acceptInvitation({
      body: {
        invitationId
      },
      headers: await headers()
    });
    
    if (result.error) {
      return redirect(`/accept-invitation/${invitationId}?error=${encodeURIComponent(result.error.message || 'Failed to accept invitation')}`);
    }
    
    return redirect(`/accept-invitation/${invitationId}?success=accepted`);
  } catch (error: any) {
    console.error("Error accepting invitation:", error);
    return redirect(`/accept-invitation/${invitationId}?error=${encodeURIComponent(error.message || 'Failed to accept invitation')}`);
  }
}

export async function rejectInvitation(invitationId: string) {
  try {
    const result = await (auth.api as any).rejectInvitation({
      body: {
        invitationId
      },
      headers: await headers()
    });
    
    if (result.error) {
      return redirect(`/accept-invitation/${invitationId}?error=${encodeURIComponent(result.error.message || 'Failed to reject invitation')}`);
    }
    
    return redirect(`/accept-invitation/${invitationId}?success=rejected`);
  } catch (error: any) {
    console.error("Error rejecting invitation:", error);
    return redirect(`/accept-invitation/${invitationId}?error=${encodeURIComponent(error.message || 'Failed to reject invitation')}`);
  }
}

export async function getInvitation(invitationId: string) {
  try {
    const result = await (auth.api as any).getInvitation({
      query: {
        id: invitationId
      },
      headers: await headers()
    });
    
    return result;
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return null;
  }
}