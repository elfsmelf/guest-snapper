// Fallback components for when @react-email/components is not available
const Html = ({ children, ...props }: any) => <html {...props}>{children}</html>
const Head = ({ children, ...props }: any) => <head {...props}>{children}</head>
const Body = ({ children, ...props }: any) => <body {...props}>{children}</body>
const Container = ({ children, ...props }: any) => <div {...props}>{children}</div>
const Text = ({ children, ...props }: any) => <p {...props}>{children}</p>

interface TrialDay4ValueEmailProps {
  name: string
  dashboardLink: string
}

export function TrialDay4ValueEmail({ name, dashboardLink }: TrialDay4ValueEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Text style={text}>Hi {name},</Text>

          <Text style={text}>
            You're halfway through your 7-day trial, and I wanted to share why hosts love Guest Snapper.
          </Text>

          <Text style={text}>
            The problem we solve: After events, photos are scattered across dozens of phones. Guests forget to share them, or you're stuck chasing people down weeks later. With Guest Snapper, everyone's photos end up in one beautiful gallery automatically.
          </Text>

          <Text style={text}>
            One host told me they got over 300 photos from their wedding reception—photos they never would have seen otherwise. Candid moments, different perspectives, memories they didn't even know existed.
          </Text>

          <Text style={text}>
            Have you explored these features yet?
          </Text>

          <Text style={text}>
            - Canva templates for designing your print materials<br />
            - Privacy settings to control exactly who can view and upload<br />
            - Scheduled activation so you can set your gallery to go live at the perfect time
          </Text>

          <Text style={text}>
            Pro tip: Even if your event is months away, you can activate your plan now and schedule your gallery to go live 2-3 weeks before your event. Test everything early, print your materials using our Canva templates, and enjoy peace of mind knowing it's all ready to go!
          </Text>

          <Text style={text}>
            You've got 3 days left in your trial to set everything up.
          </Text>

          <Text style={text}>
            Dashboard: {dashboardLink}
          </Text>

          <Text style={text}>
            Got questions? Just reply—I'm always happy to help.
          </Text>

          <Text style={text}>
            Cheers,<br />
            Richard
          </Text>

          <Text style={footer}>
            3 days remaining in your free trial. No credit card required.
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
