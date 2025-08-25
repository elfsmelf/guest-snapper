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
        return 'Sign in to Guest Snapper'
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
        return 'Use the code below to sign in to your Guest Snapper account:'
      case 'email-verification':
        return 'Use the code below to verify your email address for Guest Snapper:'
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
            <Text style={logoText}>Guest Snapper</Text>
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
            
            <Text style={footer}>
              This email was sent to {email}. If you have any questions, please contact us.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
}

const logoSection = {
  padding: '0 0 20px',
  textAlign: 'center' as const,
}

const logoText = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#2563eb',
  margin: '0',
}

const section = {
  padding: '24px',
  border: 'solid 1px #dedede',
  borderRadius: '5px',
  textAlign: 'center' as const,
}

const heading = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#000',
  margin: '0 0 30px',
}

const text = {
  fontSize: '16px',
  color: '#000',
  lineHeight: '26px',
  margin: '16px 0',
}

const codeSection = {
  backgroundColor: '#f4f4f4',
  borderRadius: '4px',
  margin: '32px 0',
  padding: '24px',
}

const codeText = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#000',
  fontFamily: 'monospace',
  letterSpacing: '6px',
  margin: '0',
}

const hr = {
  borderColor: '#dfe1e4',
  margin: '42px 0 26px',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  margin: '0',
  lineHeight: '16px',
}