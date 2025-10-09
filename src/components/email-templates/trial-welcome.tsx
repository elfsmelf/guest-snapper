// Fallback components for when @react-email/components is not available
const Html = ({ children, ...props }: any) => <html {...props}>{children}</html>
const Head = ({ children, ...props }: any) => <head {...props}>{children}</head>
const Body = ({ children, ...props }: any) => <body {...props}>{children}</body>
const Container = ({ children, ...props }: any) => <div {...props}>{children}</div>
const Text = ({ children, ...props }: any) => <p {...props}>{children}</p>

interface TrialWelcomeEmailProps {
  name: string
  dashboardLink: string
}

export function TrialWelcomeEmail({ name, dashboardLink }: TrialWelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Text style={text}>Hi {name},</Text>

          <Text style={text}>
            Thanks for signing up for Guest Snapper! I'm Richard, the founder, and I'm excited to help you create a memorable photo experience for your event.
          </Text>

          <Text style={text}>
            Here's how it works:
          </Text>

          <Text style={text}>
            1. Create your gallery and customize it with your event details<br />
            2. Set your privacy settings to control who can view and upload<br />
            3. Generate a QR code (or use our Canva templates)<br />
            4. Choose when to activate your gallery—even if your event is months away<br />
            5. Guests upload photos directly to your gallery in real-time<br />
            6. You get all the photos in one place—no more chasing people down after the event
          </Text>

          <Text style={text}>
            Pro tip: You can activate your plan today and schedule your gallery to go live weeks or months before your event. This gives you plenty of time to test everything before the big day.
          </Text>

          <Text style={text}>
            You've got 7 days to explore the platform and set everything up.
          </Text>

          <Text style={text}>
            Get started: {dashboardLink}
          </Text>

          <Text style={text}>
            If you have any questions or get stuck, just hit reply—I personally read and respond to every email.
          </Text>

          <Text style={text}>
            Cheers,<br />
            Richard<br />
            Founder, Guest Snapper
          </Text>

          <Text style={footer}>
            Your 7-day free trial gives you access to all features. No credit card required.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// Styles - Plain text optimized for deliverability
const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
}

const text = {
  fontSize: '15px',
  color: '#000000',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
}

const footer = {
  color: '#666666',
  fontSize: '13px',
  margin: '24px 0 0',
  lineHeight: '1.4',
}
