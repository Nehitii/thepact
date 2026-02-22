

# Add Email-Based 2FA via Resend.com

## Overview

Add a second 2FA method: email code verification using Resend.com. When users choose email 2FA, they receive a 6-digit code at their registered email address. This works alongside the existing TOTP (authenticator app) method -- users can choose which method to use during verification.

## Prerequisites: Resend API Key

Resend.com requires an API key to send emails. You'll need to:
1. Create an account at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. I'll securely store it as a backend secret

## Database Migration

Add columns to `user_2fa_settings` to support email 2FA:

| Column | Type | Default | Purpose |
|---|---|---|---|
| `email_2fa_enabled` | boolean | `false` | Whether email 2FA is active |
| `email_code` | text | NULL | Current pending email code (hashed) |
| `email_code_expires_at` | timestamptz | NULL | When the code expires (5 min) |
| `email_code_attempts` | integer | 0 | Failed attempts counter (rate limit) |

Also update `get_user_2fa_status` function to return `email_2fa_enabled`.

## Edge Function Changes (`supabase/functions/two-factor/index.ts`)

Add 4 new actions:

| Action | Description |
|---|---|
| `enable_email_2fa` | Enable email 2FA for the user (sends a verification code first) |
| `confirm_email_2fa` | Confirm enabling email 2FA by verifying the code |
| `send_email_code` | Send a new 6-digit code to the user's email via Resend |
| `disable_email_2fa` | Disable email 2FA |

Update existing actions:
- **`status`**: Return `emailEnabled` alongside `enabled` (TOTP)
- **`verify`**: Accept `emailCode` in the body; verify against stored hash. Check expiry (5 min) and rate limit (max 5 attempts)

Email sending flow:
1. Generate a random 6-digit code
2. Hash it with SHA-256 and store in `email_code` column with expiry
3. Send the code via Resend API (`POST https://api.resend.com/emails`)
4. On verify, compare hashed input against stored hash

The email template will use a clean, branded HTML layout with the 6-digit code prominently displayed.

## UI Changes

### `src/pages/TwoFactor.tsx` (Verification gate)

Add a third mode option alongside TOTP and recovery:
- **TOTP** (authenticator app) -- existing
- **Email** (receive code by email) -- new
- **Recovery code** -- existing

When email mode is selected:
- Show a "Send Code" button that calls the `send_email_code` action
- Then show the same 6-digit OTP input to enter the received code
- Display a "Resend code" link with a 60-second cooldown timer

### 2FA Settings Page

In the existing 2FA management page (accessed from Account Information), add:
- A toggle to enable/disable email 2FA
- Enable flow: sends a verification email, then asks the user to enter the code to confirm
- Status indicator showing which methods are active (TOTP, Email, both)

## File Changes Summary

| File | Changes |
|---|---|
| Database migration | Add `email_2fa_enabled`, `email_code`, `email_code_expires_at`, `email_code_attempts` to `user_2fa_settings`; update `get_user_2fa_status` |
| `supabase/functions/two-factor/index.ts` | Add `enable_email_2fa`, `confirm_email_2fa`, `send_email_code`, `disable_email_2fa` actions; update `status` and `verify`; add Resend API call helper |
| `src/pages/TwoFactor.tsx` | Add email code mode (send code button, resend timer, 6-digit input) |
| `src/hooks/useTwoFactor.ts` | Expose `emailEnabled` from status response |
| `src/components/profile/ProfileAccountSettings.tsx` | Update TwoFactorSection to show email 2FA toggle |
| `src/i18n/locales/en.json` | Add i18n keys for email 2FA strings |
| `src/i18n/locales/fr.json` | Add French translations |

## Security Considerations

- Email codes are SHA-256 hashed before storage (never stored in plain text)
- Codes expire after 5 minutes
- Max 5 verification attempts per code (prevents brute force)
- 60-second cooldown between sending codes (prevents spam)
- Resend API key stored as a backend secret, never exposed to the client

