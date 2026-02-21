"""
Email service for SmartCivic.
All outgoing transactional emails are sent from this module.
"""

import traceback
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def _base_wrapper(body_html: str) -> str:
    """Wrap email body in a consistent SmartCivic HTML shell."""
    return (
        "<!DOCTYPE html>"
        "<html lang='en'><head><meta charset='UTF-8'/></head>"
        "<body style='margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;'>"
        "<table width='100%' cellpadding='0' cellspacing='0' style='background:#0a0a0a;padding:40px 20px;'>"
        "<tr><td align='center'>"
        "<table width='600' cellpadding='0' cellspacing='0' "
        "style='background:#111827;border-radius:16px;border:1px solid #3730a3;max-width:600px;width:100%;'>"
        "<tr><td style='background:#0f172a;padding:32px 40px;text-align:center;'>"
        "<h1 style='margin:0;font-size:26px;font-weight:800;color:#22d3ee;'>SmartCivic</h1>"
        "<p style='margin:4px 0 0;color:#94a3b8;font-size:13px;'>CIVIC INTELLIGENCE PLATFORM</p>"
        "</td></tr>"
        "<tr><td style='padding:40px;'>"
        + body_html
        + "</td></tr>"
        "<tr><td style='padding:20px 40px;border-top:1px solid #1e293b;text-align:center;'>"
        "<p style='margin:0;color:#475569;font-size:12px;'>© 2025 SmartCivic &middot; Automated email &mdash; do not reply.</p>"
        "</td></tr>"
        "</table></td></tr></table></body></html>"
    )


def _send(subject: str, text_body: str, html_body: str, to_email: str) -> bool:
    """Send an email. Prints detailed errors to stdout for Django terminal visibility."""
    print(f"[EMAIL] Attempting to send '{subject}' to {to_email}")
    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[to_email],
        )
        msg.attach_alternative(_base_wrapper(html_body), "text/html")
        msg.send(fail_silently=False)
        print(f"[EMAIL] SUCCESS: '{subject}' sent to {to_email}")
        return True
    except Exception as exc:
        print(f"[EMAIL] FAILED: '{subject}' to {to_email}")
        print(f"[EMAIL] Error: {exc}")
        traceback.print_exc()
        logger.error("Failed to send email to %s: %s", to_email, exc)
        return False


# ─── Public API ───────────────────────────────────────────────────────────────

def send_welcome_and_email_otp(user, otp: str) -> bool:
    """Sent immediately on registration. Combines welcome message with email OTP."""
    subject = "Welcome to SmartCivic - Verify Your Email"
    text_body = (
        "Welcome to SmartCivic, " + user.full_name + "!\n\n"
        "Your email verification OTP is: " + otp + "\n"
        "Valid for 10 minutes.\n\n"
        "If you did not create this account, please ignore this email."
    )
    html_body = (
        "<h2 style='color:#fff;margin-top:0;'>Welcome, " + user.full_name + "!</h2>"
        "<p style='color:#cbd5e1;line-height:1.7;'>You have joined <strong style='color:#22d3ee;'>SmartCivic</strong> "
        "- AI-powered civic issue reporting platform.</p>"
        "<p style='color:#cbd5e1;'>To activate your account, enter the OTP below:</p>"
        "<div style='background:#000;border:2px solid #6366f1;border-radius:14px;padding:24px;text-align:center;margin:28px 0;'>"
        "<p style='margin:0 0 8px;color:#94a3b8;font-size:13px;letter-spacing:2px;'>YOUR OTP CODE</p>"
        "<p style='margin:0;font-size:42px;font-weight:900;letter-spacing:16px;color:#818cf8;'>" + otp + "</p>"
        "</div>"
        "<p style='color:#94a3b8;font-size:13px;'>This OTP expires in <strong style='color:#fff;'>10 minutes</strong>.</p>"
        "<p style='color:#64748b;font-size:12px;margin-top:24px;'>If you did not register on SmartCivic, ignore this email.</p>"
    )
    return _send(subject, text_body, html_body, user.email)


def send_email_otp(user, otp: str) -> bool:
    """Resend standalone email verification OTP."""
    subject = "SmartCivic - Email Verification OTP"
    text_body = "Your SmartCivic email verification OTP is: " + otp + "\nValid for 10 minutes."
    html_body = (
        "<h2 style='color:#fff;margin-top:0;'>Email Verification</h2>"
        "<p style='color:#cbd5e1;'>Here is your new OTP for <strong style='color:#22d3ee;'>SmartCivic</strong>:</p>"
        "<div style='background:#000;border:2px solid #6366f1;border-radius:14px;padding:24px;text-align:center;margin:28px 0;'>"
        "<p style='margin:0 0 8px;color:#94a3b8;font-size:13px;letter-spacing:2px;'>OTP CODE</p>"
        "<p style='margin:0;font-size:42px;font-weight:900;letter-spacing:16px;color:#818cf8;'>" + otp + "</p>"
        "</div>"
        "<p style='color:#94a3b8;font-size:13px;'>Expires in <strong style='color:#fff;'>10 minutes</strong>.</p>"
    )
    return _send(subject, text_body, html_body, user.email)


def send_mobile_otp_email(user, otp: str) -> bool:
    """Send mobile number verification OTP via email."""
    subject = "SmartCivic - Mobile Verification OTP"
    text_body = "Your SmartCivic mobile verification OTP is: " + otp + "\nValid for 10 minutes."
    html_body = (
        "<h2 style='color:#fff;margin-top:0;'>Mobile Number Verification</h2>"
        "<p style='color:#cbd5e1;'>Hi <strong style='color:#fff;'>" + user.full_name + "</strong>,"
        "<br/>Enter this OTP to verify your mobile number:</p>"
        "<div style='background:#000;border:2px solid #06b6d4;border-radius:14px;padding:24px;text-align:center;margin:28px 0;'>"
        "<p style='margin:0 0 8px;color:#94a3b8;font-size:13px;letter-spacing:2px;'>MOBILE OTP</p>"
        "<p style='margin:0;font-size:42px;font-weight:900;letter-spacing:16px;color:#22d3ee;'>" + otp + "</p>"
        "</div>"
        "<p style='color:#94a3b8;font-size:13px;'>Expires in <strong style='color:#fff;'>10 minutes</strong>.</p>"
    )
    return _send(subject, text_body, html_body, user.email)


def send_password_reset_email(user, reset_link: str) -> bool:
    """Send a password reset link email."""
    subject = "SmartCivic - Reset Your Password"
    text_body = (
        "Hi " + user.full_name + ",\n\n"
        "Reset your SmartCivic password by visiting:\n" + reset_link + "\n\n"
        "This link expires in 60 minutes.\n"
        "If you did not request this, ignore this email."
    )
    html_body = (
        "<h2 style='color:#fff;margin-top:0;'>Password Reset Request</h2>"
        "<p style='color:#cbd5e1;line-height:1.7;'>Hi <strong style='color:#fff;'>" + user.full_name + "</strong>,"
        "<br/>Click the button below to reset your SmartCivic password.</p>"
        "<div style='text-align:center;margin:36px 0;'>"
        "<a href='" + reset_link + "' "
        "style='display:inline-block;padding:14px 36px;border-radius:10px;"
        "background:#6366f1;color:#fff;font-weight:700;font-size:15px;text-decoration:none;'>"
        "Reset Password</a></div>"
        "<p style='color:#94a3b8;font-size:13px;'>This link expires in <strong style='color:#fff;'>60 minutes</strong>.</p>"
        "<p style='color:#64748b;font-size:12px;margin-top:24px;'>If you did not request a reset, ignore this email.</p>"
    )
    return _send(subject, text_body, html_body, user.email)
