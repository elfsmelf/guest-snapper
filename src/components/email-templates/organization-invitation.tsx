import * as React from 'react';

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
    <div style={{ 
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#ffffff'
    }}>
      <div style={{
        backgroundColor: '#f8fafc',
        padding: '40px 30px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        marginBottom: '20px'
      }}>
        <h1 style={{
          color: '#1e293b',
          fontSize: '24px',
          fontWeight: '600',
          margin: '0 0 16px 0',
          textAlign: 'center'
        }}>
          You're invited to collaborate!
        </h1>
        
        <p style={{
          color: '#475569',
          fontSize: '16px',
          lineHeight: '1.5',
          margin: '0 0 24px 0',
          textAlign: 'center'
        }}>
          <strong>{inviterName}</strong> has invited you to join <strong>{organizationName}</strong> as a <strong>{role}</strong>.
        </p>

        <div style={{
          textAlign: 'center',
          margin: '32px 0'
        }}>
          <a 
            href={inviteLink}
            style={{
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              padding: '14px 28px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '600',
              display: 'inline-block',
              border: 'none'
            }}
          >
            Accept Invitation
          </a>
        </div>

        <p style={{
          color: '#64748b',
          fontSize: '14px',
          lineHeight: '1.4',
          margin: '24px 0 0 0',
          textAlign: 'center'
        }}>
          If you can't click the button, copy and paste this link into your browser:
        </p>
        <p style={{
          color: '#3b82f6',
          fontSize: '14px',
          wordBreak: 'break-all',
          textAlign: 'center',
          margin: '8px 0 0 0'
        }}>
          {inviteLink}
        </p>
      </div>

      <div style={{
        textAlign: 'center',
        padding: '20px 0',
        borderTop: '1px solid #e2e8f0'
      }}>
        <p style={{
          color: '#94a3b8',
          fontSize: '12px',
          margin: '0'
        }}>
          This invitation will expire in 48 hours. If you don't want to receive these emails, you can safely ignore this message.
        </p>
      </div>
    </div>
  );
}