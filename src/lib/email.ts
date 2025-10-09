import { Resend } from 'resend';
import { OrganizationInvitationTemplate } from '@/components/email-templates/organization-invitation';
import { EmailOTPTemplate } from '@/components/email-templates/email-otp';
import { ContactFormEmail } from '@/components/email-templates/contact-form';
import { TrialWelcomeEmail } from '@/components/email-templates/trial-welcome';
import { TrialDay2TipsEmail } from '@/components/email-templates/trial-day2-tips';
import { TrialDay4ValueEmail } from '@/components/email-templates/trial-day4-value';
import { TrialDay6EndingEmail } from '@/components/email-templates/trial-day6-ending';
import { ActivationConfirmationEmail } from '@/components/email-templates/activation-confirmation';

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

// Trial Email Functions

interface SendTrialWelcomeEmailParams {
  name: string;
  email: string;
  dashboardLink: string;
}

export async function sendTrialWelcomeEmail({
  name,
  email,
  dashboardLink
}: SendTrialWelcomeEmailParams) {
  try {
    console.log('Attempting to send trial welcome email:', {
      to: email,
      name
    });

    const { data, error } = await getResendClient().emails.send({
      from: process.env.EMAIL_FROM || 'Guest Snapper <noreply@notifications.guestsnapper.com>',
      to: [email],
      subject: 'Welcome to Guest Snapper! Let\'s get your gallery started 🎉',
      react: TrialWelcomeEmail({
        name,
        dashboardLink
      }),
    });

    if (error) {
      console.error('Resend API error:', error);
      throw new Error(`Failed to send trial welcome email: ${error.message || JSON.stringify(error)}`);
    }

    console.log('Trial welcome email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending trial welcome email:', error);
    throw error;
  }
}

interface SendTrialDay2TipsEmailParams {
  name: string;
  email: string;
  dashboardLink: string;
}

export async function sendTrialDay2TipsEmail({
  name,
  email,
  dashboardLink
}: SendTrialDay2TipsEmailParams) {
  try {
    console.log('Attempting to send trial day 2 tips email:', {
      to: email,
      name
    });

    const { data, error } = await getResendClient().emails.send({
      from: process.env.EMAIL_FROM || 'Guest Snapper <noreply@notifications.guestsnapper.com>',
      to: [email],
      subject: 'Quick tips to get the most out of Guest Snapper',
      react: TrialDay2TipsEmail({
        name,
        dashboardLink
      }),
    });

    if (error) {
      console.error('Resend API error:', error);
      throw new Error(`Failed to send trial day 2 tips email: ${error.message || JSON.stringify(error)}`);
    }

    console.log('Trial day 2 tips email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending trial day 2 tips email:', error);
    throw error;
  }
}

interface SendTrialDay4ValueEmailParams {
  name: string;
  email: string;
  dashboardLink: string;
}

export async function sendTrialDay4ValueEmail({
  name,
  email,
  dashboardLink
}: SendTrialDay4ValueEmailParams) {
  try {
    console.log('Attempting to send trial day 4 value email:', {
      to: email,
      name
    });

    const { data, error } = await getResendClient().emails.send({
      from: process.env.EMAIL_FROM || 'Guest Snapper <noreply@notifications.guestsnapper.com>',
      to: [email],
      subject: 'You\'re halfway through your trial—here\'s what makes Guest Snapper special',
      react: TrialDay4ValueEmail({
        name,
        dashboardLink
      }),
    });

    if (error) {
      console.error('Resend API error:', error);
      throw new Error(`Failed to send trial day 4 value email: ${error.message || JSON.stringify(error)}`);
    }

    console.log('Trial day 4 value email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending trial day 4 value email:', error);
    throw error;
  }
}

interface SendTrialDay6EndingEmailParams {
  name: string;
  email: string;
  dashboardLink: string;
  pricingLink: string;
}

export async function sendTrialDay6EndingEmail({
  name,
  email,
  dashboardLink,
  pricingLink
}: SendTrialDay6EndingEmailParams) {
  try {
    console.log('Attempting to send trial day 6 ending email:', {
      to: email,
      name
    });

    const { data, error } = await getResendClient().emails.send({
      from: process.env.EMAIL_FROM || 'Guest Snapper <noreply@notifications.guestsnapper.com>',
      to: [email],
      subject: 'Your Guest Snapper trial ends tomorrow',
      react: TrialDay6EndingEmail({
        name,
        dashboardLink,
        pricingLink
      }),
    });

    if (error) {
      console.error('Resend API error:', error);
      throw new Error(`Failed to send trial day 6 ending email: ${error.message || JSON.stringify(error)}`);
    }

    console.log('Trial day 6 ending email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending trial day 6 ending email:', error);
    throw error;
  }
}

interface SendActivationConfirmationEmailParams {
  name: string;
  email: string;
  eventName: string;
  activationDate: string;
  dashboardLink: string;
}

export async function sendActivationConfirmationEmail({
  name,
  email,
  eventName,
  activationDate,
  dashboardLink
}: SendActivationConfirmationEmailParams) {
  try {
    console.log('Attempting to send activation confirmation email:', {
      to: email,
      name,
      eventName
    });

    const { data, error } = await getResendClient().emails.send({
      from: process.env.EMAIL_FROM || 'Guest Snapper <noreply@notifications.guestsnapper.com>',
      to: [email],
      subject: `🎉 Your ${eventName} gallery is scheduled and ready!`,
      react: ActivationConfirmationEmail({
        name,
        eventName,
        activationDate,
        dashboardLink
      }),
    });

    if (error) {
      console.error('Resend API error:', error);
      throw new Error(`Failed to send activation confirmation email: ${error.message || JSON.stringify(error)}`);
    }

    console.log('Activation confirmation email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending activation confirmation email:', error);
    throw error;
  }
}