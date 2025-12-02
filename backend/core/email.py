import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from core.config import settings
import logging

logger = logging.getLogger(__name__)

def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """Send an email using SMTP"""
    
    # Skip if SMTP not configured
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(f"SMTP not configured. Email would be sent to {to_email}")
        logger.info(f"Subject: {subject}")
        logger.info(f"Content: {html_content}")
        return False
    
    try:
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        message["To"] = to_email
        
        # Add HTML content
        html_part = MIMEText(html_content, "html")
        message.attach(html_part)
        
        # Send email
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False

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
