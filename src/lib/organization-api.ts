/**
 * Direct API calls for organization operations without the organizationClient plugin
 * This prevents unnecessary organization API calls on every session fetch
 */

const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

interface InviteMemberParams {
  email: string
  role: string
  organizationId: string
  resend?: boolean
}

interface CancelInvitationParams {
  invitationId: string
}

interface RemoveMemberParams {
  memberIdOrEmail: string
  organizationId: string
}

export async function inviteOrganizationMember(params: InviteMemberParams) {
  const response = await fetch(`${baseURL}/api/auth/organization/invite-member`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important for session cookies
    body: JSON.stringify(params)
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to invite member')
  }

  return await response.json()
}

export async function cancelOrganizationInvitation(params: CancelInvitationParams) {
  const response = await fetch(`${baseURL}/api/auth/organization/cancel-invitation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(params)
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to cancel invitation')
  }

  return await response.json()
}

export async function removeOrganizationMember(params: RemoveMemberParams) {
  const response = await fetch(`${baseURL}/api/auth/organization/remove-member`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(params)
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to remove member')
  }

  return await response.json()
}