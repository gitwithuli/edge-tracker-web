import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface WaitlistWelcomeEmailProps {
  email?: string;
}

export function WaitlistWelcomeEmail({ email }: WaitlistWelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You're on the Edge of ICT waitlist</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo */}
          <Section style={logoSection}>
            <Img
              src="https://edgeofict.com/logo-icon-transparent.png"
              width="200"
              height="200"
              alt="Edge of ICT"
              style={logo}
            />
          </Section>

          {/* Main Content */}
          <Heading style={heading}>
            You're on the list.
          </Heading>

          <Text style={paragraph}>
            Thanks for joining the Edge of ICT waitlist. You're among the first traders
            who'll get access when we launch.
          </Text>

          <Text style={paragraph}>
            We're building something different — a focused tool to track when your
            trading setups actually appear. No noise. No complexity. Just clarity
            on your edge.
          </Text>

          <Hr style={hr} />

          {/* What's Coming */}
          <Text style={subheading}>What you'll get:</Text>

          <Text style={listItem}>
            <span style={bullet}>→</span> Track daily edge occurrences
          </Text>
          <Text style={listItem}>
            <span style={bullet}>→</span> Discover your best trading days
          </Text>
          <Text style={listItem}>
            <span style={bullet}>→</span> Visual journal with chart attachments
          </Text>
          <Text style={listItem}>
            <span style={bullet}>→</span> Backtest your setups with real data
          </Text>

          <Hr style={hr} />

          <Text style={paragraph}>
            We'll email you the moment we're ready. No spam, no fluff — just the launch announcement.
          </Text>

          <Text style={signature}>
            Trade well,
            <br />
            <span style={signatureName}>Edge of ICT</span>
          </Text>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Built for ICT traders, by ICT traders
            </Text>
            <Text style={footerLinks}>
              <Link href="https://edgeofict.com" style={link}>
                edgeofict.com
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#FAF7F2",
  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
};

const container = {
  margin: "0 auto",
  padding: "40px 24px",
  maxWidth: "520px",
};

const logoSection = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const logo = {
  margin: "0 auto",
};

const heading = {
  fontSize: "36px",
  fontWeight: "400",
  color: "#0F0F0F",
  textAlign: "center" as const,
  margin: "0 0 40px",
  fontFamily: "Georgia, 'Times New Roman', serif",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "1.8",
  color: "#4a4a4a",
  margin: "0 0 20px",
};

const subheading = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#0F0F0F",
  textTransform: "uppercase" as const,
  letterSpacing: "0.1em",
  margin: "0 0 16px",
  opacity: 0.5,
};

const listItem = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#0F0F0F",
  margin: "0 0 14px",
  paddingLeft: "4px",
};

const bullet = {
  color: "#C45A3B",
  marginRight: "12px",
  fontWeight: "bold" as const,
};

const hr = {
  borderColor: "#0F0F0F",
  opacity: 0.1,
  margin: "32px 0",
};

const signature = {
  fontSize: "15px",
  lineHeight: "1.7",
  color: "#0F0F0F",
  opacity: 0.7,
  margin: "32px 0 0",
};

const signatureName = {
  color: "#0F0F0F",
  fontWeight: "500",
  fontStyle: "italic" as const,
  fontFamily: "Georgia, 'Times New Roman', serif",
};

const footer = {
  textAlign: "center" as const,
  marginTop: "48px",
};

const footerText = {
  fontSize: "12px",
  color: "#0F0F0F",
  opacity: 0.4,
  margin: "0 0 8px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.15em",
};

const footerLinks = {
  fontSize: "12px",
  margin: "0",
};

const link = {
  color: "#C45A3B",
  textDecoration: "none",
};

export default WaitlistWelcomeEmail;
