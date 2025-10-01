import { Resend } from 'resend';
import { OrganizationInvitationTemplate } from '@/components/email-templates/organization-invitation';
import { EmailOTPTemplate } from '@/components/email-templates/email-otp';
import { ContactFormEmail } from '@/components/email-templates/contact-form';

let resend: Resend | null = null;

function getResendClient() {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

interface SendOrganizationInvitationParams {
  email: string;
  inviterName: string;
  organizationName: string;
  inviteLink: string;
  role: string;
}

interface SendOTPEmailParams {
  email: string;
  otp: string;
  type: 'sign-in' | 'email-verification' | 'forget-password';
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

    const { data, error } = await getResendClient().emails.send({
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

export async function sendOTPEmail({
  email,
  otp,
  type
}: SendOTPEmailParams) {
  try {
    console.log('Attempting to send OTP email:', {
      to: email,
      from: process.env.EMAIL_FROM || 'Guest Snapper <noreply@notifications.guestsnapper.com>',
      type,
      otp: otp.substring(0, 2) + '****' // Log partial OTP for security
    });

    const getSubject = () => {
      switch (type) {
        case 'sign-in':
          return 'Your sign-in code for Guest Snapper'
        case 'email-verification':
          return 'Verify your email for Guest Snapper'
        case 'forget-password':
          return 'Reset your password for Guest Snapper'
        default:
          return 'Your verification code for Guest Snapper'
      }
    };

    const { data, error } = await getResendClient().emails.send({
      from: process.env.EMAIL_FROM || 'Guest Snapper <noreply@notifications.guestsnapper.com>',
      to: [email],
      subject: getSubject(),
      react: EmailOTPTemplate({
        otp,
        type,
        email
      }),
    });

    if (error) {
      console.error('Resend API error:', error);
      throw new Error(`Failed to send OTP email: ${error.message || JSON.stringify(error)}`);
    }

    console.log('OTP email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
}

interface SendContactFormParams {
  name: string;
  email: string;
  message: string;
}

export async function sendContactForm({
  name,
  email,
  message
}: SendContactFormParams) {
  try {
    console.log('Attempting to send contact form email:', {
      from: email,
      name
    });

    const { data, error } = await getResendClient().emails.send({
      from: process.env.EMAIL_FROM || 'Guest Snapper <noreply@notifications.guestsnapper.com>',
      to: ['support@guestsnapper.com'],
      replyTo: email,
      subject: `Contact Form: Message from ${name}`,
      react: ContactFormEmail({
        name,
        email,
        message
      }),
    });

    if (error) {
      console.error('Resend API error:', error);
      throw new Error(`Failed to send contact form email: ${error.message || JSON.stringify(error)}`);
    }

    console.log('Contact form email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending contact form email:', error);
    throw error;
  }
}