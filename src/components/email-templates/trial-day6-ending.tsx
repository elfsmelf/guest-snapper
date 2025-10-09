// Fallback components for when @react-email/components is not available
const Html = ({ children, ...props }: any) => <html {...props}>{children}</html>
const Head = ({ children, ...props }: any) => <head {...props}>{children}</head>
const Body = ({ children, ...props }: any) => <body {...props}>{children}</body>
const Container = ({ children, ...props }: any) => <div {...props}>{children}</div>
const Text = ({ children, ...props }: any) => <p {...props}>{children}</p>

interface TrialDay6EndingEmailProps {
  name: string
  dashboardLink: string
  pricingLink: string
}

export function TrialDay6EndingEmail({ name, dashboardLink, pricingLink }: TrialDay6EndingEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Text style={text}>Hi {name},</Text>

          <Text style={text}>
            Just a friendly heads up—your 7-day trial ends tomorrow, and I wanted to make sure you knew what happens next.
          </Text>

          <Text style={text}>
            After your trial ends:<br />
            • Your gallery will remain private and not accessible to guests<br />
            • To make it available for your event, you'll need to activate your gallery
          </Text>

          <Text style={text}>
            Event not for a while? No problem!
          </Text>

          <Text style={text}>
            You can activate your plan today and schedule your gallery to go live whenever you want—2 weeks, 2 months, or even 6 months from now. Here's why hosts love this:
          </Text>

          <Text style={text}>
            - Test early: Set your gallery to go live weeks before your event to test QR code scanning with friends<br />
            - No rush: Design and print your materials using our Canva templates at your own pace<br />
            - Refine settings: Adjust your privacy settings and make everything perfect<br />
            - Peace of mind: Know everything works long before your event day
          </Text>

          <Text style={text}>
            For example: If your wedding is 6 months away, you could activate today and schedule your gallery to go live in 5 months. You'll have plenty of time to test and prepare!
          </Text>

          <Text style={text}>
            View plans: {pricingLink}
          </Text>

          <Text style={text}>
            If you have questions, just hit reply. I'm here to help make sure your event goes smoothly.
          </Text>

          <Text style={text}>
            Thanks for trying Guest Snapper!<br /><br />
            Best,<br />
            Richard
          </Text>

          <Text style={footer}>
            Your trial ends in 24 hours. Activate now to unlock your gallery.
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
