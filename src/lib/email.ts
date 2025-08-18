import { Resend } from 'resend';
import { OrganizationInvitationTemplate } from '@/components/email-templates/organization-invitation';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is required');
}

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendOrganizationInvitationParams {
  email: string;
  inviterName: string;
  organizationName: string;
  inviteLink: string;
  role: string;
}

export async function sendOrganizationInvitation({
  email,
  inviterName,
  organizationName,
  inviteLink,
  role
}: SendOrganizationInvitationParams) {
  try {
    console.log('Attempting to send invitation email:', {
      to: email,
      from: process.env.EMAIL_FROM || 'Guest Snapper <noreply@notifications.guestsnapper.com>',
      organizationName,
      inviterName,
      role,
      inviteLink
    })

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Guest Snapper <noreply@notifications.guestsnapper.com>',
      to: [email],
      subject: `You're invited to join ${organizationName}`,
      react: OrganizationInvitationTemplate({
        inviterName,
        organizationName,
        inviteLink,
        role
      }),
    });

    if (error) {
      console.error('Resend API error:', error);
      throw new Error(`Failed to send email: ${error.message || JSON.stringify(error)}`);
    }

    console.log('Invitation email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending invitation email:', error);
    throw error;
  }
}