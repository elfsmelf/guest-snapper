// Fallback components for when @react-email/components is not available
const Html = ({ children, ...props }: any) => <html {...props}>{children}</html>
const Head = ({ children, ...props }: any) => <head {...props}>{children}</head>
const Body = ({ children, ...props }: any) => <body {...props}>{children}</body>
const Container = ({ children, ...props }: any) => <div {...props}>{children}</div>
const Section = ({ children, ...props }: any) => <section {...props}>{children}</section>
const Text = ({ children, ...props }: any) => <p {...props}>{children}</p>
const Heading = ({ children, ...props }: any) => <h1 {...props}>{children}</h1>
const Button = ({ children, ...props }: any) => <button {...props}>{children}</button>
const Hr = (props: any) => <hr {...props} />

interface EmailOTPTemplateProps {
  otp: string
  type: 'sign-in' | 'email-verification' | 'forget-password'
  email: string
}

export function EmailOTPTemplate({ otp, type, email }: EmailOTPTemplateProps) {
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
  }

  const getHeading = () => {
    switch (type) {
      case 'sign-in':
        return 'Welcome to Guest Snapper!'
      case 'email-verification':
        return 'Verify your email address'
      case 'forget-password':
        return 'Reset your password'
      default:
        return 'Verification Code'
    }
  }

  const getMessage = () => {
    switch (type) {
      case 'sign-in':
        return 'Ready to create your wedding photo gallery? Use the code below to continue:'
      case 'email-verification':
        return 'Use the code below to verify your email address and start creating beautiful wedding memories:'
      case 'forget-password':
        return 'Use the code below to reset your password for Guest Snapper:'
      default:
        return 'Use the code below to continue:'
    }
  }

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
            <Heading style={heading}>{getHeading()}</Heading>
            <Text style={text}>Hi there,</Text>
            <Text style={text}>{getMessage()}</Text>
            
            <Section style={codeSection}>
              <Text style={codeText}>{otp}</Text>
            </Section>
            
            <Text style={text}>
              This code will expire in 10 minutes for security reasons.
            </Text>

            <Text style={text}>
              If you didn't request this code, you can safely ignore this email.
            </Text>

            <Hr style={hr} />

            <Text style={subtleText}>
              ✨ Guest Snapper helps you capture every precious moment from your special day with unlimited photo uploads from all your guests.
            </Text>

            <Text style={footer}>
              This email was sent to {email}. Questions? We're here to help!
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
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

const codeSection = {
  backgroundColor: '#f3f4f6',
  borderRadius: '12px',
  margin: '32px 0',
  padding: '32px 24px',
  border: '2px dashed #d1d5db',
}

const codeText = {
  fontSize: '36px',
  fontWeight: 'bold',
  color: '#1f2937',
  fontFamily: 'Monaco, Consolas, "Courier New", monospace',
  letterSpacing: '8px',
  margin: '0',
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