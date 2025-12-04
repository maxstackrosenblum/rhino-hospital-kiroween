import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from core.config import settings
import logging
from abc import ABC, abstractmethod
from typing import Optional

logger = logging.getLogger(__name__)

class EmailProvider(ABC):
    """Abstract base class for email providers"""
    
    @abstractmethod
    def send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        """Send an email using the provider"""
        pass

class MailerSendProvider(EmailProvider):
    """MailerSend email provider implementation"""
    
    def __init__(self, api_key: str, from_email: str, from_name: str):
        self.api_key = api_key
        self.from_email = from_email
        self.from_name = from_name
    
    def send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        """Send email using MailerSend API"""
        try:
            from mailersend import MailerSendClient, EmailBuilder
            
            # Create MailerSend client
            ms = MailerSendClient()
            ms.mailersend_api_key = self.api_key
            
            # Build email using EmailBuilder
            email = (EmailBuilder()
                    .from_email(self.from_email, self.from_name)
                    .to_many([{"email": to_email}])
                    .subject(subject)
                    .html(html_content)
                    .build())
            
            # Send email
            ms.emails.send(email)
            
            # MailerSend 2.0.0 - if no exception was raised, assume success
            # The fact that we got here means the API call completed without error
            logger.info(f"Email sent successfully via MailerSend to {to_email}")
            return True
                
        except Exception as e:
            logger.error(f"Failed to send email via MailerSend to {to_email}: {e}")
            return False

class SMTPProvider(EmailProvider):
    """SMTP email provider implementation"""
    
    def __init__(self, host: str, port: int, user: str, password: str, from_email: str, from_name: str):
        self.host = host
        self.port = port
        self.user = user
        self.password = password
        self.from_email = from_email
        self.from_name = from_name
    
    def send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        """Send email using SMTP"""
        # Skip if SMTP not configured
        if not self.user or not self.password:
            logger.warning(f"SMTP not configured. Email would be sent to {to_email}")
            logger.info(f"Subject: {subject}")
            logger.info(f"Content: {html_content}")
            return False
        
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{self.from_name} <{self.from_email}>"
            message["To"] = to_email
            
            # Add HTML content
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)
            
            # Send email
            with smtplib.SMTP(self.host, self.port) as server:
                server.starttls()
                server.login(self.user, self.password)
                server.send_message(message)
            
            logger.info(f"Email sent successfully via SMTP to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email via SMTP to {to_email}: {str(e)}")
            return False

def get_email_provider() -> EmailProvider:
    """Factory function to get the appropriate email provider based on configuration"""
    if settings.MAILERSEND_API_KEY:
        # Use MailerSend provider
        from_email = settings.MAILERSEND_FROM_EMAIL or settings.SMTP_FROM_EMAIL
        from_name = settings.MAILERSEND_FROM_NAME or settings.SMTP_FROM_NAME
        logger.info("Using MailerSend email provider")
        return MailerSendProvider(
            api_key=settings.MAILERSEND_API_KEY,
            from_email=from_email,
            from_name=from_name
        )
    else:
        # Use SMTP provider
        logger.info("Using SMTP email provider")
        return SMTPProvider(
            host=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            user=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            from_email=settings.SMTP_FROM_EMAIL,
            from_name=settings.SMTP_FROM_NAME
        )

def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """Send an email using the configured provider (MailerSend or SMTP)"""
    provider = get_email_provider()
    return provider.send_email(to_email, subject, html_content)

def send_password_reset_email(to_email: str, reset_token: str, username: str) -> bool:
    """Send password reset email"""
    
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                line-height: 1.6;
                color: #1a1d23;
                margin: 0;
                padding: 0;
                background-color: #f2f4f8;
            }}
            .container {{
                max-width: 600px;
                margin: 40px auto;
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }}
            .header {{
                background: linear-gradient(135deg, #16a249 0%, #14903f 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 700;
            }}
            .content {{
                padding: 40px 30px;
                background: white;
            }}
            .content p {{
                margin: 0 0 16px 0;
                color: #495057;
            }}
            .button {{
                display: inline-block;
                padding: 14px 32px;
                background: #16a249;
                color: white !important;
                text-decoration: none;
                border-radius: 8px;
                margin: 24px 0;
                font-weight: 600;
                font-size: 16px;
                transition: background 0.3s ease;
            }}
            .button:hover {{
                background: #14903f;
            }}
            .link-box {{
                background: #f2f4f8;
                padding: 16px;
                border-radius: 8px;
                margin: 20px 0;
                word-break: break-all;
            }}
            .link-box a {{
                color: #16a249;
                text-decoration: none;
                font-size: 14px;
            }}
            .warning {{
                background: #fff8e1;
                border-left: 4px solid #ffc107;
                padding: 16px;
                margin: 24px 0;
                border-radius: 4px;
            }}
            .warning strong {{
                color: #f57c00;
                display: block;
                margin-bottom: 8px;
            }}
            .warning ul {{
                margin: 8px 0 0 0;
                padding-left: 20px;
                color: #495057;
            }}
            .warning li {{
                margin: 4px 0;
            }}
            .footer {{
                text-align: center;
                padding: 24px 30px;
                background: #f2f4f8;
                color: #6c757d;
                font-size: 13px;
            }}
            .footer p {{
                margin: 4px 0;
            }}
            .logo {{
                font-size: 20px;
                font-weight: 700;
                margin-bottom: 8px;
            }}
            @media only screen and (max-width: 600px) {{
                .container {{
                    margin: 20px;
                    border-radius: 8px;
                }}
                .header {{
                    padding: 30px 20px;
                }}
                .header h1 {{
                    font-size: 24px;
                }}
                .content {{
                    padding: 30px 20px;
                }}
                .button {{
                    display: block;
                    text-align: center;
                }}
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🏥 Hospital Management System</div>
                <h1>Password Reset Request</h1>
            </div>
            <div class="content">
                <p>Hello <strong>{username}</strong>,</p>
                
                <p>We received a request to reset your password for your Hospital Management System account.</p>
                
                <p>Click the button below to reset your password:</p>
                
                <center>
                    <a href="{reset_link}" class="button">Reset Password</a>
                </center>
                
                <p style="color: #6c757d; font-size: 14px;">Or copy and paste this link into your browser:</p>
                <div class="link-box">
                    <a href="{reset_link}">{reset_link}</a>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Security Notice</strong>
                    <ul>
                        <li>This link will expire in <strong>1 hour</strong></li>
                        <li>If you didn't request this reset, please ignore this email</li>
                        <li>Never share this link with anyone</li>
                    </ul>
                </div>
                
                <p>If you have any questions or concerns, please contact our support team.</p>
                
                <p style="margin-top: 32px;">
                    Best regards,<br>
                    <strong>Hospital Management System Team</strong>
                </p>
            </div>
            <div class="footer">
                <p>This is an automated email. Please do not reply to this message.</p>
                <p>&copy; 2024 Hospital Management System. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return send_email(
        to_email=to_email,
        subject="Password Reset Request - Hospital Management System",
        html_content=html_content
    )

def send_appointment_confirmation_email(
    to_email: str,
    patient_name: str,
    doctor_name: str,
    appointment_date: str,
    department: str,
    disease: str
) -> bool:
    """Send appointment confirmation email"""
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                line-height: 1.6;
                color: #1a1d23;
                margin: 0;
                padding: 0;
                background-color: #f2f4f8;
            }}
            .container {{
                max-width: 600px;
                margin: 40px auto;
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }}
            .header {{
                background: linear-gradient(135deg, #16a249 0%, #14903f 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 700;
            }}
            .content {{
                padding: 40px 30px;
                background: white;
            }}
            .content p {{
                margin: 0 0 16px 0;
                color: #495057;
            }}
            .appointment-details {{
                background: #f2f4f8;
                padding: 24px;
                border-radius: 8px;
                margin: 24px 0;
                border-left: 4px solid #16a249;
            }}
            .detail-row {{
                display: flex;
                padding: 12px 0;
                border-bottom: 1px solid #e0e0e0;
            }}
            .detail-row:last-child {{
                border-bottom: none;
            }}
            .detail-label {{
                font-weight: 600;
                color: #1a1d23;
                min-width: 140px;
            }}
            .detail-value {{
                color: #495057;
                flex: 1;
            }}
            .status-badge {{
                display: inline-block;
                padding: 6px 12px;
                background: #fff8e1;
                color: #f57c00;
                border-radius: 4px;
                font-size: 14px;
                font-weight: 600;
            }}
            .info-box {{
                background: #e3f2fd;
                border-left: 4px solid #2196f3;
                padding: 16px;
                margin: 24px 0;
                border-radius: 4px;
            }}
            .info-box strong {{
                color: #1565c0;
                display: block;
                margin-bottom: 8px;
            }}
            .footer {{
                text-align: center;
                padding: 24px 30px;
                background: #f2f4f8;
                color: #6c757d;
                font-size: 13px;
            }}
            .footer p {{
                margin: 4px 0;
            }}
            .logo {{
                font-size: 20px;
                font-weight: 700;
                margin-bottom: 8px;
            }}
            @media only screen and (max-width: 600px) {{
                .container {{
                    margin: 20px;
                    border-radius: 8px;
                }}
                .header {{
                    padding: 30px 20px;
                }}
                .header h1 {{
                    font-size: 24px;
                }}
                .content {{
                    padding: 30px 20px;
                }}
                .detail-row {{
                    flex-direction: column;
                }}
                .detail-label {{
                    margin-bottom: 4px;
                }}
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🏥 Hospital Management System</div>
                <h1>Appointment Confirmed</h1>
            </div>
            <div class="content">
                <p>Dear <strong>{patient_name}</strong>,</p>
                
                <p>Your appointment has been successfully scheduled. Please find the details below:</p>
                
                <div class="appointment-details">
                    <div class="detail-row">
                        <div class="detail-label">📅 Date & Time:</div>
                        <div class="detail-value"><strong>{appointment_date}</strong></div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">👨‍⚕️ Doctor:</div>
                        <div class="detail-value">{doctor_name}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">🏥 Department:</div>
                        <div class="detail-value">{department}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">📋 Reason:</div>
                        <div class="detail-value">{disease}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Status:</div>
                        <div class="detail-value"><span class="status-badge">⏳ Pending</span></div>
                    </div>
                </div>
                
                <div class="info-box">
                    <strong>📌 Important Reminders</strong>
                    <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #495057;">
                        <li>Please arrive 15 minutes before your appointment time</li>
                        <li>Bring your medical records and insurance information</li>
                        <li>If you need to cancel or reschedule, please do so at least 24 hours in advance</li>
                    </ul>
                </div>
                
                <p>You can view and manage your appointments by logging into your account.</p>
                
                <p style="margin-top: 32px;">If you have any questions, please contact our reception desk.</p>
                
                <p style="margin-top: 32px;">
                    Best regards,<br>
                    <strong>Hospital Management System Team</strong>
                </p>
            </div>
            <div class="footer">
                <p>This is an automated email. Please do not reply to this message.</p>
                <p>&copy; 2024 Hospital Management System. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return send_email(
        to_email=to_email,
        subject="Appointment Confirmation - Hospital Management System",
        html_content=html_content
    )

def send_welcome_email(to_email: str, username: str, first_name: str) -> bool:
    """Send welcome email to new users"""
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                line-height: 1.6;
                color: #1a1d23;
                margin: 0;
                padding: 0;
                background-color: #f2f4f8;
            }}
            .container {{
                max-width: 600px;
                margin: 40px auto;
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }}
            .header {{
                background: linear-gradient(135deg, #16a249 0%, #14903f 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 700;
            }}
            .content {{
                padding: 40px 30px;
                background: white;
            }}
            .content p {{
                margin: 0 0 16px 0;
                color: #495057;
            }}
            .info-box {{
                background: #f2f4f8;
                padding: 20px;
                border-radius: 8px;
                margin: 24px 0;
                border-left: 4px solid #16a249;
            }}
            .info-box strong {{
                color: #1a1d23;
                font-size: 14px;
            }}
            .info-box .value {{
                color: #16a249;
                font-size: 18px;
                font-weight: 600;
                margin-top: 4px;
            }}
            .button {{
                display: inline-block;
                padding: 14px 32px;
                background: #16a249;
                color: white !important;
                text-decoration: none;
                border-radius: 8px;
                margin: 24px 0;
                font-weight: 600;
                font-size: 16px;
                transition: background 0.3s ease;
            }}
            .button:hover {{
                background: #14903f;
            }}
            .footer {{
                text-align: center;
                padding: 24px 30px;
                background: #f2f4f8;
                color: #6c757d;
                font-size: 13px;
            }}
            .footer p {{
                margin: 4px 0;
            }}
            .logo {{
                font-size: 20px;
                font-weight: 700;
                margin-bottom: 8px;
            }}
            .features {{
                margin: 24px 0;
            }}
            .feature {{
                padding: 12px 0;
                border-bottom: 1px solid #e0e0e0;
            }}
            .feature:last-child {{
                border-bottom: none;
            }}
            .feature-icon {{
                display: inline-block;
                width: 24px;
                margin-right: 8px;
            }}
            @media only screen and (max-width: 600px) {{
                .container {{
                    margin: 20px;
                    border-radius: 8px;
                }}
                .header {{
                    padding: 30px 20px;
                }}
                .header h1 {{
                    font-size: 24px;
                }}
                .content {{
                    padding: 30px 20px;
                }}
                .button {{
                    display: block;
                    text-align: center;
                }}
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🏥 Hospital Management System</div>
                <h1>Welcome Aboard!</h1>
            </div>
            <div class="content">
                <p>Hello <strong>{first_name}</strong>,</p>
                
                <p>Welcome to the Hospital Management System! Your account has been successfully created and you're all set to get started.</p>
                
                <div class="info-box">
                    <strong>Your Username</strong>
                    <div class="value">{username}</div>
                </div>
                
                <p>You can now log in and start using the system to manage your healthcare operations efficiently.</p>
                
                <center>
                    <a href="{settings.FRONTEND_URL}/login" class="button">Go to Login</a>
                </center>
                
                <div class="features">
                    <p style="font-weight: 600; color: #1a1d23; margin-bottom: 12px;">What you can do:</p>
                    <div class="feature">
                        <span class="feature-icon">👤</span>
                        <span>Manage your profile and account settings</span>
                    </div>
                    <div class="feature">
                        <span class="feature-icon">🔐</span>
                        <span>Secure access with session management</span>
                    </div>
                    <div class="feature">
                        <span class="feature-icon">📊</span>
                        <span>Access your personalized dashboard</span>
                    </div>
                </div>
                
                <p style="margin-top: 32px;">If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
                
                <p style="margin-top: 32px;">
                    Best regards,<br>
                    <strong>Hospital Management System Team</strong>
                </p>
            </div>
            <div class="footer">
                <p>This is an automated email. Please do not reply to this message.</p>
                <p>&copy; 2024 Hospital Management System. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return send_email(
        to_email=to_email,
        subject="Welcome to Hospital Management System",
        html_content=html_content
    )

def send_welcome_email_with_credentials(
    to_email: str, 
    username: str, 
    temporary_password: str, 
    first_name: str
) -> bool:
    """Send welcome email with login credentials to new users"""
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                line-height: 1.6;
                color: #1a1d23;
                margin: 0;
                padding: 0;
                background-color: #f2f4f8;
            }}
            .container {{
                max-width: 600px;
                margin: 40px auto;
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }}
            .header {{
                background: linear-gradient(135deg, #16a249 0%, #14903f 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 700;
            }}
            .content {{
                padding: 40px 30px;
                background: white;
            }}
            .content p {{
                margin: 0 0 16px 0;
                color: #495057;
            }}
            .credentials-box {{
                background: #f2f4f8;
                padding: 24px;
                border-radius: 8px;
                margin: 24px 0;
                border-left: 4px solid #16a249;
            }}
            .credential {{
                display: flex;
                padding: 12px 0;
                border-bottom: 1px solid #e0e0e0;
            }}
            .credential:last-child {{
                border-bottom: none;
            }}
            .credential strong {{
                color: #1a1d23;
                min-width: 140px;
                font-weight: 600;
            }}
            .credential-value {{
                color: #16a249;
                font-weight: 600;
                font-family: 'Courier New', monospace;
                word-break: break-all;
            }}
            .credential a {{
                color: #16a249;
                text-decoration: none;
            }}
            .credential a:hover {{
                text-decoration: underline;
            }}
            .button {{
                display: inline-block;
                padding: 14px 32px;
                background: #16a249;
                color: white !important;
                text-decoration: none;
                border-radius: 8px;
                margin: 24px 0;
                font-weight: 600;
                font-size: 16px;
                transition: background 0.3s ease;
            }}
            .button:hover {{
                background: #14903f;
            }}
            .security-notice {{
                background: #fff8e1;
                border-left: 4px solid #ffc107;
                padding: 16px;
                margin: 24px 0;
                border-radius: 4px;
            }}
            .security-notice strong {{
                color: #f57c00;
                display: block;
                margin-bottom: 8px;
            }}
            .security-notice ul {{
                margin: 8px 0 0 0;
                padding-left: 20px;
                color: #495057;
            }}
            .security-notice li {{
                margin: 4px 0;
            }}
            .footer {{
                text-align: center;
                padding: 24px 30px;
                background: #f2f4f8;
                color: #6c757d;
                font-size: 13px;
            }}
            .footer p {{
                margin: 4px 0;
            }}
            .logo {{
                font-size: 20px;
                font-weight: 700;
                margin-bottom: 8px;
            }}
            @media only screen and (max-width: 600px) {{
                .container {{
                    margin: 20px;
                    border-radius: 8px;
                }}
                .header {{
                    padding: 30px 20px;
                }}
                .header h1 {{
                    font-size: 24px;
                }}
                .content {{
                    padding: 30px 20px;
                }}
                .button {{
                    display: block;
                    text-align: center;
                }}
                .credential {{
                    flex-direction: column;
                }}
                .credential strong {{
                    margin-bottom: 4px;
                }}
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🏥 Hospital Management System</div>
                <h1>Welcome to the Team!</h1>
            </div>
            <div class="content">
                <p>Hello <strong>{first_name}</strong>,</p>
                
                <p>Your account has been created successfully in the Hospital Management System. Here are your login credentials:</p>
                
                <div class="credentials-box">
                    <div class="credential">
                        <strong>Username:</strong>
                        <div class="credential-value">{username}</div>
                    </div>
                    <div class="credential">
                        <strong>Temporary Password:</strong>
                        <div class="credential-value">{temporary_password}</div>
                    </div>
                    <div class="credential">
                        <strong>Login URL:</strong>
                        <div class="credential-value">
                            <a href="{settings.FRONTEND_URL}/login">{settings.FRONTEND_URL}/login</a>
                        </div>
                    </div>
                </div>
                
                <center>
                    <a href="{settings.FRONTEND_URL}/login" class="button">Login Now</a>
                </center>
                
                <div class="security-notice">
                    <strong>🔒 Important Security Notice</strong>
                    <ul>
                        <li><strong>You will be required to change your password on first login</strong></li>
                        <li>Keep these credentials secure and do not share them with anyone</li>
                        <li>Your new password must meet our security requirements (12+ characters, mixed case, numbers, special characters)</li>
                        <li>Contact support if you have any issues accessing your account</li>
                    </ul>
                </div>
                
                <p>Once you log in and change your password, you'll have access to all the features appropriate for your role in the system.</p>
                
                <p style="margin-top: 32px;">If you have any questions or need assistance, please contact our support team.</p>
                
                <p style="margin-top: 32px;">
                    Best regards,<br>
                    <strong>Hospital Management System Team</strong>
                </p>
            </div>
            <div class="footer">
                <p>This is an automated email. Please do not reply to this message.</p>
                <p>&copy; 2024 Hospital Management System. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return send_email(
        to_email=to_email,
        subject="Welcome to Hospital Management System - Your Account Credentials",
        html_content=html_content
    )
