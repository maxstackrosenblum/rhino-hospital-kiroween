#!/usr/bin/env python3
"""
Test script for email functionality
Run: python test_email.py
"""

import sys
from core.config import settings
from core.email import send_password_reset_email, send_email

def test_email_config():
    """Test email configuration"""
    print("=" * 50)
    print("Email Configuration Test")
    print("=" * 50)
    
    print(f"SMTP Host: {settings.SMTP_HOST}")
    print(f"SMTP Port: {settings.SMTP_PORT}")
    print(f"SMTP User: {settings.SMTP_USER or '(not configured)'}")
    print(f"SMTP Password: {'*' * len(settings.SMTP_PASSWORD) if settings.SMTP_PASSWORD else '(not configured)'}")
    print(f"From Email: {settings.SMTP_FROM_EMAIL}")
    print(f"From Name: {settings.SMTP_FROM_NAME}")
    print(f"Frontend URL: {settings.FRONTEND_URL}")
    print()
    
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print("⚠️  SMTP credentials not configured")
        print("   Emails will be logged instead of sent")
        print()
        return False
    
    print("✓ SMTP credentials configured")
    print()
    return True

def test_smtp_connection():
    """Test SMTP connection"""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print("Skipping SMTP connection test (credentials not configured)")
        return False
    
    print("Testing SMTP connection...")
    try:
        import smtplib
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.quit()
        print("✓ SMTP connection successful")
        print()
        return True
    except Exception as e:
        print(f"✗ SMTP connection failed: {e}")
        print()
        return False

def test_send_email():
    """Test sending an email"""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print("Skipping email send test (credentials not configured)")
        return False
    
    print("=" * 50)
    print("Send Test Email")
    print("=" * 50)
    
    to_email = input("Enter recipient email address: ").strip()
    if not to_email:
        print("No email provided, skipping test")
        return False
    
    print(f"\nSending test email to {to_email}...")
    
    success = send_email(
        to_email=to_email,
        subject="Test Email - Hospital Management System",
        html_content="""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #667eea;">Test Email</h2>
            <p>This is a test email from the Hospital Management System.</p>
            <p>If you received this, your email configuration is working correctly! ✓</p>
            <hr>
            <p style="color: #666; font-size: 12px;">
                This is an automated test email.
            </p>
        </body>
        </html>
        """
    )
    
    if success:
        print("✓ Test email sent successfully")
        print(f"  Check {to_email} inbox (and spam folder)")
    else:
        print("✗ Failed to send test email")
    
    print()
    return success

def test_password_reset_email():
    """Test password reset email"""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print("Skipping password reset email test (credentials not configured)")
        return False
    
    print("=" * 50)
    print("Send Password Reset Email")
    print("=" * 50)
    
    to_email = input("Enter recipient email address: ").strip()
    if not to_email:
        print("No email provided, skipping test")
        return False
    
    username = input("Enter test username (default: testuser): ").strip() or "testuser"
    
    print(f"\nSending password reset email to {to_email}...")
    
    success = send_password_reset_email(
        to_email=to_email,
        reset_token="test-token-123456789",
        username=username
    )
    
    if success:
        print("✓ Password reset email sent successfully")
        print(f"  Check {to_email} inbox (and spam folder)")
        print(f"  Note: The reset link contains a test token and won't work")
    else:
        print("✗ Failed to send password reset email")
    
    print()
    return success

def main():
    """Run all tests"""
    print("\n")
    print("╔" + "=" * 48 + "╗")
    print("║  Hospital Management System - Email Test      ║")
    print("╚" + "=" * 48 + "╝")
    print()
    
    # Test configuration
    config_ok = test_email_config()
    
    if not config_ok:
        print("To configure email:")
        print("1. Copy .env.example to .env")
        print("2. Set SMTP_USER and SMTP_PASSWORD")
        print("3. Restart the backend")
        print()
        return
    
    # Test connection
    connection_ok = test_smtp_connection()
    
    if not connection_ok:
        print("Please check your SMTP credentials and try again")
        return
    
    # Interactive tests
    while True:
        print("=" * 50)
        print("Select a test:")
        print("1. Send test email")
        print("2. Send password reset email")
        print("3. Exit")
        print("=" * 50)
        
        choice = input("Enter choice (1-3): ").strip()
        print()
        
        if choice == "1":
            test_send_email()
        elif choice == "2":
            test_password_reset_email()
        elif choice == "3":
            print("Goodbye!")
            break
        else:
            print("Invalid choice, please try again\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n\nError: {e}")
        sys.exit(1)
