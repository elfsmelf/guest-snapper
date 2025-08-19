"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function acceptInvitation(invitationId: string) {
  try {
    // According to Better Auth docs, the path is /organization/accept-invitation
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/organization/accept-invitation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': (await headers()).get('cookie') || '',
      },
      body: JSON.stringify({
        invitationId
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error("Error accepting invitation:", error);
      return redirect(`/accept-invitation/${invitationId}?error=${encodeURIComponent('Failed to accept invitation')}`);
    }
    
    return redirect(`/dashboard?success=invitation-accepted`);
  } catch (error: any) {
    console.error("Error accepting invitation:", error);
    return redirect(`/accept-invitation/${invitationId}?error=${encodeURIComponent(error.message || 'Failed to accept invitation')}`);
  }
}

export async function rejectInvitation(invitationId: string) {
  try {
    // According to Better Auth docs, the path is /organization/reject-invitation
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/organization/reject-invitation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': (await headers()).get('cookie') || '',
      },
      body: JSON.stringify({
        invitationId
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error("Error rejecting invitation:", error);
      return redirect(`/accept-invitation/${invitationId}?error=${encodeURIComponent('Failed to reject invitation')}`);
    }
    
    return redirect(`/dashboard?success=invitation-rejected`);
  } catch (error: any) {
    console.error("Error rejecting invitation:", error);
    return redirect(`/accept-invitation/${invitationId}?error=${encodeURIComponent(error.message || 'Failed to reject invitation')}`);
  }
}

export async function getInvitation(invitationId: string) {
  try {
    // Try to get the invitation details - note this is under organization namespace
    const result = await (auth.api.organization as any).getInvitation({
      query: {
        id: invitationId
      },
      headers: await headers()
    });
    
    return result;
  } catch (error) {
    console.error("Error fetching invitation:", error);
    // If that doesn't work, try without the organization namespace (for compatibility)
    try {
      const result = await (auth.api as any).getInvitation({
        query: {
          id: invitationId
        },
        headers: await headers()
      });
      return result;
    } catch (innerError) {
      console.error("Error fetching invitation (fallback):", innerError);
      return null;
    }
  }
}