// Fallback components for when @react-email/components is not available
const Html = ({ children, ...props }: any) => <html {...props}>{children}</html>
const Head = ({ children, ...props }: any) => <head {...props}>{children}</head>
const Body = ({ children, ...props }: any) => <body {...props}>{children}</body>
const Container = ({ children, ...props }: any) => <div {...props}>{children}</div>
const Text = ({ children, ...props }: any) => <p {...props}>{children}</p>

interface ActivationConfirmationEmailProps {
  name: string
  eventName: string
  activationDate: string
  dashboardLink: string
}

export function ActivationConfirmationEmail({
  name,
  eventName,
  activationDate,
  dashboardLink
}: ActivationConfirmationEmailProps) {
  // Format activation date nicely
  const formattedDate = new Date(activationDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Text style={text}>Hi {name},</Text>

          <Text style={text}>
            Congratulations! You've activated your Guest Snapper plan and your gallery is scheduled to go live on {formattedDate}.
          </Text>

          <Text style={text}>
            Here's what happens next:
          </Text>

          <Text style={text}>
            Gallery scheduled<br />
            Your gallery will automatically become accessible to guests on {formattedDate}
          </Text>

          <Text style={text}>
            Download your QR code<br />
            Head to your dashboard to download your QR code, or use our Canva templates to design beautiful print materials
          </Text>

          <Text style={text}>
            Refine your privacy settings<br />
            You have plenty of time to adjust your privacy controls exactly how you want them
          </Text>

          <Text style={text}>
            Test before it goes live<br />
            When your activation date arrives, have friends and family scan the QR code and upload test photos to make sure everything works perfectly
          </Text>

          <Text style={text}>
            Quick tips for your event:
          </Text>

          <Text style={text}>
            - Place QR codes in multiple high-traffic spots (entrance, bar, tables)<br />
            - Use our Canva templates to create eye-catching designs<br />
            - Make an announcement early in the event to encourage uploads<br />
            - Check your gallery during the event—it's fun to see photos coming in live!
          </Text>

          <Text style={text}>
            Dashboard: {dashboardLink}
          </Text>

          <Text style={text}>
            I'm thrilled you chose Guest Snapper for your event. If you need anything at all leading up to the big day, just hit reply—I'm here to help make sure everything goes perfectly.
          </Text>

          <Text style={text}>
            Enjoy your event!<br /><br />
            Best,<br />
            Richard<br />
            Founder, Guest Snapper
          </Text>

          <Text style={footer}>
            P.S. After your event, you'll have 12 months to download all your photos. Make sure to save them before the download window closes!
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
