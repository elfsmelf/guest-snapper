// Fallback components for when @react-email/components is not available
const Html = ({ children, ...props }: any) => <html {...props}>{children}</html>
const Head = ({ children, ...props }: any) => <head {...props}>{children}</head>
const Body = ({ children, ...props }: any) => <body {...props}>{children}</body>
const Container = ({ children, ...props }: any) => <div {...props}>{children}</div>
const Text = ({ children, ...props }: any) => <p {...props}>{children}</p>

interface TrialDay2TipsEmailProps {
  name: string
  dashboardLink: string
}

export function TrialDay2TipsEmail({ name, dashboardLink }: TrialDay2TipsEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Text style={text}>Hi {name},</Text>

          <Text style={text}>
            Just checking in! Have you had a chance to create your first gallery yet?
          </Text>

          <Text style={text}>
            I wanted to share a few quick tips to help you get ready for your event:
          </Text>

          <Text style={text}>
            Customize your gallery<br />
            Add your event name, date, and a welcome message. Don't forget to refine your privacy settings to control who can view and upload photos.
          </Text>

          <Text style={text}>
            Use our Canva templates<br />
            We've created free templates to help you design beautiful table signs, programs, and posters with your QR code. You'll find them in your dashboard—just download, customize in Canva, and print!
          </Text>

          <Text style={text}>
            Schedule your gallery activation<br />
            Here's something many hosts don't realize: you can activate your plan now and schedule your gallery to go live 2-3 weeks before your event (or whenever works for you). This gives you time to test scanning the QR code, have friends upload photos, and work out any kinks—all without the stress of doing it last minute.
          </Text>

          <Text style={text}>
            Plan your QR code placement<br />
            Think about where guests will see it—table signs, programs, or at the entrance. The easier you make it to find, the more photos you'll get!
          </Text>

          <Text style={text}>
            Dashboard: {dashboardLink}
          </Text>

          <Text style={text}>
            Need help with anything? Just reply to this email—I'm here to help.
          </Text>

          <Text style={text}>
            Best,<br />
            Richard
          </Text>

          <Text style={footer}>
            You have 5 days left in your free trial to explore all features.
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
