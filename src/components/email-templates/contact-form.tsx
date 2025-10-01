import * as React from 'react'

interface ContactFormEmailProps {
  name: string
  email: string
  message: string
}

export const ContactFormEmail = ({ name, email, message }: ContactFormEmailProps) => {
  return (
    <html>
      <head>
        <style>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .header {
            border-bottom: 2px solid #8b5a5f;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          h1 {
            color: #8b5a5f;
            margin: 0;
            font-size: 24px;
          }
          .field {
            margin-bottom: 20px;
          }
          .label {
            font-weight: 600;
            color: #555;
            margin-bottom: 5px;
          }
          .value {
            color: #333;
            background-color: #f9f9f9;
            padding: 10px;
            border-radius: 4px;
            border-left: 3px solid #8b5a5f;
          }
          .message-content {
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #999;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <h1>New Contact Form Submission</h1>
          </div>

          <div className="field">
            <div className="label">Name:</div>
            <div className="value">{name}</div>
          </div>

          <div className="field">
            <div className="label">Email:</div>
            <div className="value">
              <a href={`mailto:${email}`} style={{ color: '#8b5a5f', textDecoration: 'none' }}>
                {email}
              </a>
            </div>
          </div>

          <div className="field">
            <div className="label">Message:</div>
            <div className="value message-content">{message}</div>
          </div>

          <div className="footer">
            This message was sent from the Guest Snapper contact form.
          </div>
        </div>
      </body>
    </html>
  )
}
