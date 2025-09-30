import * as React from 'react';

// Fallback components for when @react-email/components is not available
const Html = ({ children, ...props }: any) => <html {...props}>{children}</html>
const Head = ({ children, ...props }: any) => <head {...props}>{children}</head>
const Body = ({ children, ...props }: any) => <body {...props}>{children}</body>
const Container = ({ children, ...props }: any) => <div {...props}>{children}</div>
const Section = ({ children, ...props }: any) => <section {...props}>{children}</section>
const Text = ({ children, ...props }: any) => <p {...props}>{children}</p>
const Heading = ({ children, ...props }: any) => <h1 {...props}>{children}</h1>
const Hr = (props: any) => <hr {...props} />

interface OrganizationInvitationTemplateProps {
  inviterName: string;
  organizationName: string;
  inviteLink: string;
  role: string;
}

export function OrganizationInvitationTemplate({
  inviterName,
  organizationName,
  inviteLink,
  role
}: OrganizationInvitationTemplateProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <img
              src="https://assets.guestsnapper.com/marketing/logos/Guest%20Snapper%20v6%20logo.png"
              alt="Guest Snapper"
              width="156"
              height="42"
              style={{ maxWidth: '156px', height: 'auto' }}
            />
          </Section>

          <Section style={section}>
            <Heading style={heading}>You're invited to collaborate!</Heading>
            <Text style={text}>Hi there,</Text>
            <Text style={text}>
              <strong>{inviterName}</strong> has invited you to join <strong>{organizationName}</strong> as a <strong>{role}</strong>.
            </Text>

            <Section style={buttonSection}>
              <a
                href={inviteLink}
                style={button}
              >
                Accept Invitation
              </a>
            </Section>

            <Text style={text}>
              This invitation will expire in 48 hours for security reasons.
            </Text>

            <Text style={text}>
              If you can't click the button, copy and paste this link into your browser:
            </Text>

            <Text style={linkText}>
              {inviteLink}
            </Text>

            <Hr style={hr} />

            <Text style={subtleText}>
              ✨ Join the team and help create beautiful wedding galleries that capture every precious moment from special days.
            </Text>

            <Text style={footer}>
              If you don't want to receive collaboration invitations, you can safely ignore this message.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles matching the email OTP template
const main = {
  backgroundColor: '#f8f9fa',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
}

const logoSection = {
  padding: '32px 0 24px',
  textAlign: 'center' as const,
  backgroundColor: '#ffffff',
  borderRadius: '12px 12px 0 0',
}

const section = {
  padding: '32px 24px',
  backgroundColor: '#ffffff',
  borderRadius: '0 0 12px 12px',
  textAlign: 'center' as const,
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
}

const heading = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0 0 16px',
  fontFamily: 'Georgia, serif',
}

const text = {
  fontSize: '16px',
  color: '#374151',
  lineHeight: '24px',
  margin: '16px 0',
}

const buttonSection = {
  margin: '32px 0',
  textAlign: 'center' as const,
}

const button = {
  backgroundColor: '#8B5A5C',
  color: '#ffffff',
  padding: '14px 28px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '16px',
  fontWeight: '600',
  display: 'inline-block',
  border: 'none'
}

const linkText = {
  color: '#8B5A5C',
  fontSize: '14px',
  wordBreak: 'break-all' as const,
  margin: '8px 0 16px 0',
  fontFamily: 'Monaco, Consolas, "Courier New", monospace',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0 24px',
  borderStyle: 'solid',
  borderWidth: '1px 0 0 0',
}

const subtleText = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '16px 0',
  lineHeight: '20px',
  fontStyle: 'italic',
}

const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '16px 0 0',
  lineHeight: '16px',
}