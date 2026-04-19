"""
Email service for SmartCivic.
All outgoing transactional emails are sent from this module.
"""

import traceback
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def _base_wrapper(body_html):
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


def _send(subject, text_body, html_body, to_email):
    # Check global email notifications toggle
    try:
        from .site_settings import SiteSettings
        if not SiteSettings.get().email_notifications_enabled:
            print("[EMAIL] Skipped (notifications disabled globally): " + subject)
            return False
    except Exception:
        pass  # If settings table doesn't exist yet, allow email

    print("[EMAIL] Attempting to send '" + subject + "' to " + to_email)
    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[to_email],
        )
        msg.attach_alternative(_base_wrapper(html_body), "text/html")
        msg.send(fail_silently=False)
        print("[EMAIL] SUCCESS: '" + subject + "' sent to " + to_email)
        return True
    except Exception as exc:
        print("[EMAIL] FAILED: '" + subject + "' to " + to_email)
        print("[EMAIL] Error: " + str(exc))
        traceback.print_exc()
        logger.error("Failed to send email to %s: %s", to_email, exc)
        return False


def _otp_block(otp, color="#818cf8", border_color="#6366f1"):
    return (
        "<div style='background:#000;border:2px solid " + border_color + ";border-radius:14px;"
        "padding:24px;text-align:center;margin:28px 0;'>"
        "<p style='margin:0 0 8px;color:#94a3b8;font-size:13px;letter-spacing:2px;'>YOUR OTP CODE</p>"
        "<p style='margin:0;font-size:42px;font-weight:900;letter-spacing:16px;color:" + color + ";'>" + otp + "</p>"
        "</div>"
    )


# ─── Citizen auth emails ──────────────────────────────────────────────────────

def send_welcome_and_email_otp(user, otp):
    subject = "Welcome to SmartCivic - Verify Your Email"
    text_body = "Welcome to SmartCivic, " + user.full_name + "!\nYour OTP: " + otp + "\nValid for 10 minutes."
    html_body = (
        "<h2 style='color:#fff;margin-top:0;'>Welcome, " + user.full_name + "!</h2>"
        "<p style='color:#cbd5e1;line-height:1.7;'>You have joined <strong style='color:#22d3ee;'>SmartCivic</strong>. "
        "Enter the OTP below to activate your account:</p>"
        + _otp_block(otp)
        + "<p style='color:#94a3b8;font-size:13px;'>Expires in <strong style='color:#fff;'>10 minutes</strong>.</p>"
        "<p style='color:#64748b;font-size:12px;margin-top:24px;'>If you did not register, ignore this email.</p>"
    )
    return _send(subject, text_body, html_body, user.email)


def send_email_otp(user, otp):
    subject = "SmartCivic - Email Verification OTP"
    text_body = "Your SmartCivic email verification OTP is: " + otp + "\nValid for 10 minutes."
    html_body = (
        "<h2 style='color:#fff;margin-top:0;'>Email Verification</h2>"
        "<p style='color:#cbd5e1;'>Here is your new OTP for <strong style='color:#22d3ee;'>SmartCivic</strong>:</p>"
        + _otp_block(otp)
        + "<p style='color:#94a3b8;font-size:13px;'>Expires in <strong style='color:#fff;'>10 minutes</strong>.</p>"
    )
    return _send(subject, text_body, html_body, user.email)


def send_mobile_otp_email(user, otp):
    subject = "SmartCivic - Mobile Verification OTP"
    text_body = "Your SmartCivic mobile verification OTP is: " + otp + "\nValid for 10 minutes."
    html_body = (
        "<h2 style='color:#fff;margin-top:0;'>Mobile Number Verification</h2>"
        "<p style='color:#cbd5e1;'>Hi <strong style='color:#fff;'>" + user.full_name + "</strong>, "
        "enter this OTP to verify your mobile number:</p>"
        + _otp_block(otp, color="#22d3ee", border_color="#06b6d4")
        + "<p style='color:#94a3b8;font-size:13px;'>Expires in <strong style='color:#fff;'>10 minutes</strong>.</p>"
    )
    return _send(subject, text_body, html_body, user.email)


def send_password_reset_email(user, reset_link):
    subject = "SmartCivic - Reset Your Password"
    text_body = "Hi " + user.full_name + ",\nReset your password: " + reset_link + "\nExpires in 60 minutes."
    html_body = (
        "<h2 style='color:#fff;margin-top:0;'>Password Reset Request</h2>"
        "<p style='color:#cbd5e1;line-height:1.7;'>Hi <strong style='color:#fff;'>" + user.full_name + "</strong>, "
        "click below to reset your SmartCivic password.</p>"
        "<div style='text-align:center;margin:36px 0;'>"
        "<a href='" + reset_link + "' style='display:inline-block;padding:14px 36px;border-radius:10px;"
        "background:#6366f1;color:#fff;font-weight:700;font-size:15px;text-decoration:none;'>Reset Password</a></div>"
        "<p style='color:#94a3b8;font-size:13px;'>Expires in <strong style='color:#fff;'>60 minutes</strong>.</p>"
        "<p style='color:#64748b;font-size:12px;margin-top:24px;'>If you did not request a reset, ignore this email.</p>"
    )
    return _send(subject, text_body, html_body, user.email)


# ─── NGO registration flow emails ────────────────────────────────────────────

def send_ngo_pending_email(user, org_name):
    subject = "SmartCivic - NGO Registration Received"
    text_body = (
        "Hi " + user.full_name + ",\n\nThank you for registering " + org_name + " on SmartCivic.\n"
        "Your application is under review. You will receive an email once approved.\n\n"
        "You can check your application status by contacting support."
    )
    html_body = (
        "<h2 style='color:#fff;margin-top:0;'>Application Received!</h2>"
        "<p style='color:#cbd5e1;line-height:1.7;'>Hi <strong style='color:#fff;'>" + user.full_name + "</strong>,</p>"
        "<p style='color:#cbd5e1;'>Thank you for registering "
        "<strong style='color:#22d3ee;'>" + org_name + "</strong> on SmartCivic.</p>"
        "<div style='background:#0f2a1a;border:1px solid #166534;border-radius:12px;padding:20px;margin:24px 0;'>"
        "<p style='color:#4ade80;font-weight:700;margin:0 0 6px;'>Application Status: Under Review</p>"
        "<p style='color:#86efac;font-size:13px;margin:0;'>Our team will review your details and respond within 2–3 business days.</p>"
        "</div>"
        "<p style='color:#94a3b8;font-size:13px;'>You will receive an email notification once a decision is made.</p>"
    )
    return _send(subject, text_body, html_body, user.email)


def send_ngo_approved_email(user, org_name):
    from django.conf import settings as dj_settings
    login_url = getattr(dj_settings, 'FRONTEND_URL', 'http://localhost:5173') + "/login"
    subject = "SmartCivic - Your NGO Account is Approved!"
    text_body = (
        "Congratulations " + user.full_name + "!\n\n"
        + org_name + " has been approved on SmartCivic. You can now log in.\n"
        + "Login at: " + login_url
    )
    html_body = (
        "<h2 style='color:#4ade80;margin-top:0;'>Congratulations! You're Approved! 🎉</h2>"
        "<p style='color:#cbd5e1;line-height:1.7;'>Hi <strong style='color:#fff;'>" + user.full_name + "</strong>,</p>"
        "<p style='color:#cbd5e1;'>Your NGO/CSR registration for "
        "<strong style='color:#22d3ee;'>" + org_name + "</strong> has been approved.</p>"
        "<div style='background:#0f2a1a;border:1px solid #166534;border-radius:12px;padding:20px;margin:24px 0;'>"
        "<p style='color:#4ade80;font-weight:700;margin:0 0 6px;'>Account Status: APPROVED ✓</p>"
        "<p style='color:#86efac;font-size:13px;margin:0;'>You can now log in and start using SmartCivic.</p>"
        "</div>"
        "<div style='text-align:center;margin:28px 0;'>"
        "<a href='" + login_url + "' style='display:inline-block;padding:14px 36px;border-radius:10px;"
        "background:#16a34a;color:#fff;font-weight:700;font-size:15px;text-decoration:none;'>Login to SmartCivic</a></div>"
    )
    return _send(subject, text_body, html_body, user.email)


def send_ngo_rejected_email(user, org_name, reason):
    subject = "SmartCivic - NGO Registration Update"
    text_body = (
        "Hi " + user.full_name + ",\n\nUnfortunately, " + org_name + " was not approved.\n"
        "Reason: " + reason + "\n\nContact support for more information."
    )
    html_body = (
        "<h2 style='color:#f87171;margin-top:0;'>Registration Not Approved</h2>"
        "<p style='color:#cbd5e1;line-height:1.7;'>Hi <strong style='color:#fff;'>" + user.full_name + "</strong>,</p>"
        "<p style='color:#cbd5e1;'>After reviewing your registration for "
        "<strong style='color:#22d3ee;'>" + org_name + "</strong>, we were unable to approve it at this time.</p>"
        "<div style='background:#2a0f0f;border:1px solid #991b1b;border-radius:12px;padding:20px;margin:24px 0;'>"
        "<p style='color:#f87171;font-weight:700;margin:0 0 6px;'>Reason:</p>"
        "<p style='color:#fca5a5;font-size:14px;margin:0;'>" + reason + "</p>"
        "</div>"
        "<p style='color:#94a3b8;font-size:13px;'>If you believe this is an error, please contact our support team.</p>"
    )
    return _send(subject, text_body, html_body, user.email)


def send_contact_message(first_name, last_name, sender_email, message, support_email):
    """Send a contact-form submission to the platform support inbox."""
    subject = f"SmartCivic Contact: Message from {first_name} {last_name}"
    text_body = (
        f"Contact form submission\n\n"
        f"Name: {first_name} {last_name}\n"
        f"Email: {sender_email}\n\n"
        f"Message:\n{message}"
    )
    html_body = (
        "<h2 style='color:#22d3ee;margin-top:0;'>New Contact Message</h2>"
        "<p style='color:#94a3b8;font-size:13px;margin-bottom:24px;'>Received via the SmartCivic contact form</p>"
        "<div style='background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:20px;margin-bottom:20px;'>"
        "<table style='width:100%;border-collapse:collapse;'>"
        f"<tr><td style='color:#64748b;font-size:13px;padding:6px 0;width:100px;'>Name</td>"
        f"<td style='color:#fff;font-weight:600;font-size:14px;'>{first_name} {last_name}</td></tr>"
        f"<tr><td style='color:#64748b;font-size:13px;padding:6px 0;'>Email</td>"
        f"<td style='color:#22d3ee;font-size:14px;'><a href='mailto:{sender_email}' style='color:#22d3ee;'>{sender_email}</a></td></tr>"
        "</table></div>"
        "<div style='background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:20px;'>"
        "<p style='color:#64748b;font-size:13px;margin:0 0 10px;'>Message</p>"
        f"<p style='color:#e2e8f0;font-size:14px;line-height:1.7;margin:0;white-space:pre-wrap;'>{message}</p>"
        "</div>"
        f"<p style='color:#475569;font-size:12px;margin-top:20px;'>Reply directly to <a href='mailto:{sender_email}' style='color:#22d3ee;'>{sender_email}</a> to respond.</p>"
    )
    return _send(subject, text_body, html_body, support_email)


def send_contact_confirmation(first_name, sender_email):
    """Send a confirmation email to the person who submitted the contact form."""
    subject = "SmartCivic — We received your message!"
    text_body = (
        f"Hi {first_name},\n\n"
        "Thank you for reaching out to SmartCivic. We've received your message and will get back to you shortly.\n\n"
        "— The SmartCivic Team"
    )
    html_body = (
        f"<h2 style='color:#fff;margin-top:0;'>Thanks for reaching out, {first_name}!</h2>"
        "<p style='color:#cbd5e1;line-height:1.7;'>We've received your message and our team will review it shortly.</p>"
        "<div style='background:#0f2a1a;border:1px solid #166534;border-radius:12px;padding:20px;margin:24px 0;'>"
        "<p style='color:#4ade80;font-weight:700;margin:0 0 6px;'>What happens next?</p>"
        "<p style='color:#86efac;font-size:13px;margin:0;'>Our support team typically responds within 1–2 business days.</p>"
        "</div>"
        "<p style='color:#94a3b8;font-size:13px;'>If your query is urgent, you can also email us directly at "
        "<a href='mailto:smart.civicissue@gmail.com' style='color:#22d3ee;'>smart.civicissue@gmail.com</a>.</p>"
    )
    return _send(subject, text_body, html_body, sender_email)


def send_credentials_email(user, password, role_label):
    from django.conf import settings as dj_settings
    login_url = getattr(dj_settings, 'FRONTEND_URL', 'http://localhost:5173') + "/login"
    subject = "SmartCivic - Your " + role_label + " Account Credentials"
    text_body = (
        "Hi " + user.full_name + ",\n\nYour " + role_label + " account on SmartCivic has been created.\n"
        + "Email: " + user.email + "\nTemporary Password: " + password + "\n\n"
        + "Please log in and change your password immediately."
    )
    html_body = (
        "<h2 style='color:#fff;margin-top:0;'>Your " + role_label + " Account is Ready</h2>"
        "<p style='color:#cbd5e1;line-height:1.7;'>Hi <strong style='color:#fff;'>" + user.full_name + "</strong>,</p>"
        "<p style='color:#cbd5e1;'>Your <strong style='color:#22d3ee;'>" + role_label + "</strong> account has been created on SmartCivic.</p>"
        "<div style='background:#0f0f2a;border:2px solid #6366f1;border-radius:14px;padding:24px;margin:24px 0;'>"
        "<table style='width:100%;border-collapse:collapse;'>"
        "<tr><td style='color:#94a3b8;font-size:13px;padding:6px 0;'>Email</td>"
        "<td style='color:#fff;font-weight:600;font-size:14px;'>" + user.email + "</td></tr>"
        "<tr><td style='color:#94a3b8;font-size:13px;padding:6px 0;'>Temporary Password</td>"
        "<td style='color:#818cf8;font-weight:700;font-size:16px;font-family:monospace;'>" + password + "</td></tr>"
        "</table></div>"
        "<div style='background:#2a1a00;border:1px solid #92400e;border-radius:10px;padding:14px;margin:16px 0;'>"
        "<p style='color:#fcd34d;font-weight:700;margin:0 0 4px;'>⚠ Important</p>"
        "<p style='color:#fde68a;font-size:13px;margin:0;'>Please change your password immediately after your first login.</p>"
        "</div>"
        "<div style='text-align:center;margin:28px 0;'>"
        "<a href='" + login_url + "' style='display:inline-block;padding:14px 36px;border-radius:10px;"
        "background:#6366f1;color:#fff;font-weight:700;font-size:15px;text-decoration:none;'>Login Now</a></div>"
    )
    return _send(subject, text_body, html_body, user.email)
