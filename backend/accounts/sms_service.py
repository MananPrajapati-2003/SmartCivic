"""
SMS service for SmartCivic.
Uses Fast2SMS (https://www.fast2sms.com) for India SMS OTP delivery.
Fast2SMS free tier supports ~50 SMSes/day — enough for development.
"""

import requests
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def send_mobile_otp(mobile_number: str, otp: str) -> dict:
    """
    Send an OTP SMS to `mobile_number` via Fast2SMS.

    Returns:
        {"success": True}  on success
        {"success": False, "error": "..."} on failure
    """
    api_key = getattr(settings, "FAST2SMS_API_KEY", "")

    if not api_key:
        logger.warning(
            "FAST2SMS_API_KEY not configured. SMS not sent to %s. OTP (dev only): %s",
            mobile_number,
            otp,
        )
        # In development, log the OTP instead of failing hard
        return {"success": True, "dev_otp": otp, "warning": "SMS not sent — API key missing"}

    try:
        response = requests.post(
            "https://www.fast2sms.com/dev/bulkV2",
            headers={"authorization": api_key},
            data={
                "route": "otp",
                "variables_values": otp,
                "flash": "0",
                "numbers": mobile_number,
            },
            timeout=10,
        )
        result = response.json()

        if result.get("return"):
            logger.info("SMS OTP sent to %s", mobile_number)
            return {"success": True}

        logger.error("Fast2SMS error for %s: %s", mobile_number, result)
        return {"success": False, "error": result.get("message", "SMS delivery failed.")}

    except requests.Timeout:
        logger.error("Fast2SMS timeout for %s", mobile_number)
        return {"success": False, "error": "SMS gateway timed out. Please try again."}
    except Exception as exc:
        logger.error("SMS send exception for %s: %s", mobile_number, exc)
        return {"success": False, "error": "SMS could not be sent. Please try again."}
