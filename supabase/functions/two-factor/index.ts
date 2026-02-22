import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Action =
  | "status"
  | "begin_enroll"
  | "confirm_enroll"
  | "verify"
  | "disable"
  | "regenerate_recovery"
  | "list_trusted"
  | "revoke_trusted"
  | "revoke_all_trusted"
  | "enable_email_2fa"
  | "confirm_email_2fa"
  | "send_email_code"
  | "disable_email_2fa";

type Json = Record<string, unknown>;

function jsonResponse(body: Json, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function base32Alphabet() {
  return "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
}

function base32Encode(bytes: Uint8Array): string {
  const alphabet = base32Alphabet();
  let bits = 0;
  let value = 0;
  let output = "";

  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += alphabet[(value << (5 - bits)) & 31];
  return output;
}

function base32Decode(input: string): Uint8Array {
  const alphabet = base32Alphabet();
  const clean = input.toUpperCase().replace(/=+$/g, "").replace(/\s+/g, "");

  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = alphabet.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function toBigEndianCounter(counter: number): Uint8Array {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  const hi = Math.floor(counter / 0x100000000);
  const lo = counter >>> 0;
  view.setUint32(0, hi);
  view.setUint32(4, lo);
  return new Uint8Array(buf);
}

async function hotp(secretB32: string, counter: number, digits = 6): Promise<string> {
  const keyBytes = base32Decode(secretB32);
  const keyBuf = new ArrayBuffer(keyBytes.length);
  new Uint8Array(keyBuf).set(keyBytes);

  const counterBytes = toBigEndianCounter(counter);
  const counterBuf = new ArrayBuffer(counterBytes.length);
  new Uint8Array(counterBuf).set(counterBytes);
  const key = await crypto.subtle.importKey(
    "raw",
    keyBuf,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, counterBuf);
  const hmac = new Uint8Array(sig);
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (binCode % 10 ** digits).toString().padStart(digits, "0");
}

async function totpVerify(secretB32: string, code: string, opts?: { step?: number; window?: number }) {
  const step = opts?.step ?? 30;
  const window = opts?.window ?? 1;
  const normalized = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(normalized)) return false;

  const now = Math.floor(Date.now() / 1000);
  const counter = Math.floor(now / step);
  for (let w = -window; w <= window; w++) {
    const expected = await hotp(secretB32, counter + w, 6);
    if (expected === normalized) return true;
  }
  return false;
}

function generateRecoveryCodes(count = 10): string[] {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = crypto.getRandomValues(new Uint8Array(10));
    let raw = "";
    for (const b of bytes) raw += alphabet[b % alphabet.length];
    codes.push(`${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 10)}`);
  }
  return codes;
}

function generateDeviceToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generate6DigitCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const num = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  return (num % 1000000).toString().padStart(6, "0");
}

async function sendEmailViaResend(to: string, code: string): Promise<boolean> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.error("RESEND_API_KEY not configured");
    return false;
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #1a1a2e; font-size: 24px; margin: 0;">Pacte</h1>
        <p style="color: #666; font-size: 14px; margin-top: 8px;">Two-Factor Authentication</p>
      </div>
      <div style="background: #f8f9fa; border-radius: 12px; padding: 32px; text-align: center;">
        <p style="color: #333; font-size: 16px; margin: 0 0 24px;">Your verification code is:</p>
        <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1a1a2e; font-family: monospace; background: white; border-radius: 8px; padding: 16px; border: 2px solid #e2e8f0;">
          ${code}
        </div>
        <p style="color: #888; font-size: 13px; margin-top: 24px;">This code expires in 5 minutes.<br/>If you didn't request this, you can safely ignore it.</p>
      </div>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("RESEND_FROM_EMAIL") || "Pacte <onboarding@resend.dev>",
        to: [to],
        subject: `${code} — Your Pacte verification code`,
        html,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Resend API error:", res.status, errBody);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Resend send error:", err);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonResponse({ error: "Authentication required" }, 401);

    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let userId = "";
    let userEmail: string | null = null;

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (!userError && userData?.user) {
      userId = userData.user.id;
      userEmail = userData.user.email ?? null;
    } else {
      try {
        const res = await supabaseClient.auth.getClaims(token);
        const claims: any = (res.data as any)?.claims;
        userId = typeof claims?.sub === "string" ? claims.sub : "";
        userEmail = typeof claims?.email === "string" ? claims.email : null;
      } catch (e) {
        console.error("two-factor auth validation failed", e);
        return jsonResponse({ error: "Invalid or expired token" }, 401);
      }
    }

    if (!userId) return jsonResponse({ error: "Invalid or expired token" }, 401);

    const user = { id: userId, email: userEmail };

    const body = (await req.json().catch(() => ({}))) as {
      action?: Action;
      code?: string;
      emailCode?: string;
      recoveryCode?: string;
      trustDevice?: boolean;
      deviceToken?: string;
      deviceLabel?: string;
      id?: string;
    };

    const action = body.action;
    if (!action) return jsonResponse({ error: "Missing action" }, 400);

    const logEvent = async (event_type: string, metadata: Json = {}) => {
      await supabaseClient.from("security_events").insert({ user_id: user.id, event_type, metadata });
    };

    const getSettings = async () => {
      const { data } = await supabaseAdmin
        .from("user_2fa_settings")
        .select("totp_enabled, totp_secret, email_2fa_enabled, email_code, email_code_expires_at, email_code_attempts")
        .eq("user_id", user.id)
        .maybeSingle();
      return {
        enabled: !!data?.totp_enabled,
        secret: (data?.totp_secret as string | null) ?? null,
        emailEnabled: !!data?.email_2fa_enabled,
        emailCode: (data?.email_code as string | null) ?? null,
        emailCodeExpiresAt: (data?.email_code_expires_at as string | null) ?? null,
        emailCodeAttempts: (data?.email_code_attempts as number) ?? 0,
      };
    };

    // ── STATUS ──
    if (action === "status") {
      const settings = await getSettings();
      const deviceToken = typeof body.deviceToken === "string" ? body.deviceToken : "";
      let trusted = false;

      const anyEnabled = settings.enabled || settings.emailEnabled;

      if (anyEnabled && deviceToken) {
        const tokenHash = await sha256Hex(deviceToken);
        const { data } = await supabaseClient
          .from("user_trusted_devices")
          .select("id, expires_at")
          .eq("token_hash", tokenHash)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data?.id && data.expires_at && new Date(data.expires_at).getTime() > Date.now()) {
          trusted = true;
          await supabaseClient
            .from("user_trusted_devices")
            .update({ last_used_at: new Date().toISOString() })
            .eq("id", data.id);
        }
      }

      return jsonResponse({ enabled: settings.enabled, emailEnabled: settings.emailEnabled, trusted });
    }

    // ── BEGIN ENROLL (TOTP) ──
    if (action === "begin_enroll") {
      const bytes = crypto.getRandomValues(new Uint8Array(20));
      const secret = base32Encode(bytes);

      await supabaseClient
        .from("user_2fa_settings")
        .upsert({ user_id: user.id, totp_enabled: false, totp_secret: secret }, { onConflict: "user_id" });

      const issuer = "Pacte";
      const account = user.email ?? user.id;
      const label = encodeURIComponent(`${issuer}:${account}`);
      const uri = `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
      await logEvent("2fa_enroll_started");
      return jsonResponse({ secret, uri });
    }

    // ── CONFIRM ENROLL (TOTP) ──
    if (action === "confirm_enroll") {
      const { secret } = await getSettings();
      if (!secret) return jsonResponse({ error: "Enrollment not started" }, 400);
      const ok = await totpVerify(secret, body.code ?? "", { window: 1 });
      if (!ok) {
        await logEvent("2fa_enroll_failed");
        return jsonResponse({ error: "Invalid code" }, 400);
      }

      await supabaseClient
        .from("user_2fa_settings")
        .upsert({ user_id: user.id, totp_enabled: true, totp_secret: secret }, { onConflict: "user_id" });

      const codes = generateRecoveryCodes(10);
      const rows = await Promise.all(codes.map(async (c) => ({ user_id: user.id, code_hash: await sha256Hex(c) })));

      await supabaseClient.from("user_recovery_codes").delete().eq("user_id", user.id);
      await supabaseClient.from("user_recovery_codes").insert(rows);

      await logEvent("2fa_enabled");
      await logEvent("recovery_codes_regenerated", { count: codes.length });
      return jsonResponse({ success: true, recoveryCodes: codes });
    }

    // ── VERIFY (TOTP + Email + Recovery) ──
    if (action === "verify") {
      const settings = await getSettings();
      if (!settings.enabled && !settings.emailEnabled) return jsonResponse({ error: "2FA not enabled" }, 400);

      const totpCode = typeof body.code === "string" ? body.code : "";
      const emailCode = typeof body.emailCode === "string" ? body.emailCode : "";
      const recoveryCode = typeof body.recoveryCode === "string" ? body.recoveryCode : "";
      const trustDevice = !!body.trustDevice;
      const deviceLabel = typeof body.deviceLabel === "string" ? body.deviceLabel.slice(0, 200) : null;

      let ok = false;
      let usedRecovery = false;

      // Try TOTP
      if (totpCode && settings.enabled && settings.secret) {
        ok = await totpVerify(settings.secret, totpCode, { window: 1 });
      }

      // Try Email code
      if (!ok && emailCode && settings.emailEnabled) {
        if (settings.emailCodeAttempts >= 5) {
          return jsonResponse({ error: "Too many attempts. Request a new code." }, 429);
        }

        const codeHash = await sha256Hex(emailCode.trim());
        const expiresAt = settings.emailCodeExpiresAt ? new Date(settings.emailCodeExpiresAt).getTime() : 0;

        if (settings.emailCode && codeHash === settings.emailCode && expiresAt > Date.now()) {
          ok = true;
          // Clear the used code
          await supabaseAdmin
            .from("user_2fa_settings")
            .update({ email_code: null, email_code_expires_at: null, email_code_attempts: 0 })
            .eq("user_id", user.id);
        } else {
          // Increment attempts
          await supabaseAdmin
            .from("user_2fa_settings")
            .update({ email_code_attempts: settings.emailCodeAttempts + 1 })
            .eq("user_id", user.id);
        }
      }

      // Try recovery code
      if (!ok && recoveryCode) {
        const hash = await sha256Hex(recoveryCode.trim());
        const { data } = await supabaseClient
          .from("user_recovery_codes")
          .select("id, used_at")
          .eq("code_hash", hash)
          .limit(1)
          .maybeSingle();

        if (data?.id && !data.used_at) {
          ok = true;
          usedRecovery = true;
          await supabaseClient
            .from("user_recovery_codes")
            .update({ used_at: new Date().toISOString() })
            .eq("id", data.id);
        }
      }

      if (!ok) {
        await logEvent("2fa_failed_attempt");
        return jsonResponse({ error: "Invalid code" }, 400);
      }

      const res: Json = { success: true, usedRecovery };
      if (trustDevice) {
        const token = generateDeviceToken();
        const tokenHash = await sha256Hex(token);
        const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        await supabaseClient.from("user_trusted_devices").insert({
          user_id: user.id,
          token_hash: tokenHash,
          device_label: deviceLabel,
          expires_at: expires.toISOString(),
          last_used_at: new Date().toISOString(),
        });
        await logEvent("trusted_device_added", { expires_at: expires.toISOString() });
        res.deviceToken = token;
        res.deviceExpiresAt = expires.toISOString();
      }

      await logEvent("2fa_verified", { usedRecovery });
      return jsonResponse(res);
    }

    // ── DISABLE TOTP ──
    if (action === "disable") {
      await supabaseClient
        .from("user_2fa_settings")
        .upsert({ user_id: user.id, totp_enabled: false, totp_secret: null }, { onConflict: "user_id" });
      await supabaseClient.from("user_recovery_codes").delete().eq("user_id", user.id);
      await supabaseClient.from("user_trusted_devices").delete().eq("user_id", user.id);
      await logEvent("2fa_disabled");
      return jsonResponse({ success: true });
    }

    // ── ENABLE EMAIL 2FA (sends verification code) ──
    if (action === "enable_email_2fa") {
      if (!user.email) return jsonResponse({ error: "No email on account" }, 400);

      const code = generate6DigitCode();
      const codeHash = await sha256Hex(code);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      // Store hashed code
      await supabaseAdmin
        .from("user_2fa_settings")
        .upsert(
          { user_id: user.id, email_code: codeHash, email_code_expires_at: expiresAt, email_code_attempts: 0 },
          { onConflict: "user_id" },
        );

      const sent = await sendEmailViaResend(user.email, code);
      if (!sent) return jsonResponse({ error: "Failed to send email" }, 500);

      await logEvent("email_2fa_enroll_started");
      return jsonResponse({ success: true, message: "Verification code sent" });
    }

    // ── CONFIRM EMAIL 2FA ──
    if (action === "confirm_email_2fa") {
      const settings = await getSettings();
      const emailCode = typeof body.code === "string" ? body.code.trim() : "";

      if (!emailCode) return jsonResponse({ error: "Missing code" }, 400);
      if (settings.emailCodeAttempts >= 5) return jsonResponse({ error: "Too many attempts" }, 429);

      const codeHash = await sha256Hex(emailCode);
      const expiresAt = settings.emailCodeExpiresAt ? new Date(settings.emailCodeExpiresAt).getTime() : 0;

      if (!settings.emailCode || codeHash !== settings.emailCode || expiresAt <= Date.now()) {
        await supabaseAdmin
          .from("user_2fa_settings")
          .update({ email_code_attempts: settings.emailCodeAttempts + 1 })
          .eq("user_id", user.id);
        return jsonResponse({ error: "Invalid or expired code" }, 400);
      }

      // Enable email 2FA
      await supabaseAdmin
        .from("user_2fa_settings")
        .update({ email_2fa_enabled: true, email_code: null, email_code_expires_at: null, email_code_attempts: 0 })
        .eq("user_id", user.id);

      // Generate recovery codes if none exist and TOTP isn't enabled
      if (!settings.enabled) {
        const codes = generateRecoveryCodes(10);
        const rows = await Promise.all(codes.map(async (c) => ({ user_id: user.id, code_hash: await sha256Hex(c) })));
        await supabaseClient.from("user_recovery_codes").delete().eq("user_id", user.id);
        await supabaseClient.from("user_recovery_codes").insert(rows);
        await logEvent("email_2fa_enabled");
        await logEvent("recovery_codes_regenerated", { count: codes.length });
        return jsonResponse({ success: true, recoveryCodes: codes });
      }

      await logEvent("email_2fa_enabled");
      return jsonResponse({ success: true });
    }

    // ── SEND EMAIL CODE (for verification gate) ──
    if (action === "send_email_code") {
      if (!user.email) return jsonResponse({ error: "No email on account" }, 400);

      const settings = await getSettings();
      if (!settings.emailEnabled) return jsonResponse({ error: "Email 2FA not enabled" }, 400);

      // Rate limit: check if last code was sent < 60s ago
      if (settings.emailCodeExpiresAt) {
        const lastSentAt = new Date(settings.emailCodeExpiresAt).getTime() - 5 * 60 * 1000; // sent = expires - 5min
        if (Date.now() - lastSentAt < 60 * 1000) {
          return jsonResponse({ error: "Please wait before requesting another code" }, 429);
        }
      }

      const code = generate6DigitCode();
      const codeHash = await sha256Hex(code);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      await supabaseAdmin
        .from("user_2fa_settings")
        .update({ email_code: codeHash, email_code_expires_at: expiresAt, email_code_attempts: 0 })
        .eq("user_id", user.id);

      const sent = await sendEmailViaResend(user.email, code);
      if (!sent) return jsonResponse({ error: "Failed to send email" }, 500);

      await logEvent("email_2fa_code_sent");
      return jsonResponse({ success: true });
    }

    // ── DISABLE EMAIL 2FA ──
    if (action === "disable_email_2fa") {
      await supabaseAdmin
        .from("user_2fa_settings")
        .update({ email_2fa_enabled: false, email_code: null, email_code_expires_at: null, email_code_attempts: 0 })
        .eq("user_id", user.id);

      // If TOTP is also disabled, clean up trusted devices and recovery codes
      const settings = await getSettings();
      if (!settings.enabled) {
        await supabaseClient.from("user_recovery_codes").delete().eq("user_id", user.id);
        await supabaseClient.from("user_trusted_devices").delete().eq("user_id", user.id);
      }

      await logEvent("email_2fa_disabled");
      return jsonResponse({ success: true });
    }

    // ── REGENERATE RECOVERY ──
    if (action === "regenerate_recovery") {
      const settings = await getSettings();
      if (!settings.enabled && !settings.emailEnabled) return jsonResponse({ error: "2FA not enabled" }, 400);
      const codes = generateRecoveryCodes(10);
      const rows = await Promise.all(codes.map(async (c) => ({ user_id: user.id, code_hash: await sha256Hex(c) })));
      await supabaseClient.from("user_recovery_codes").delete().eq("user_id", user.id);
      await supabaseClient.from("user_recovery_codes").insert(rows);
      await logEvent("recovery_codes_regenerated", { count: codes.length });
      return jsonResponse({ success: true, recoveryCodes: codes });
    }

    if (action === "list_trusted") {
      const { data } = await supabaseClient
        .from("user_trusted_devices")
        .select("id, device_label, expires_at, last_used_at, created_at")
        .order("created_at", { ascending: false });
      return jsonResponse({ devices: data ?? [] });
    }

    if (action === "revoke_trusted") {
      if (!body.id) return jsonResponse({ error: "Missing id" }, 400);
      await supabaseClient.from("user_trusted_devices").delete().eq("id", body.id);
      await logEvent("trusted_device_revoked", { id: body.id });
      return jsonResponse({ success: true });
    }

    if (action === "revoke_all_trusted") {
      await supabaseClient.from("user_trusted_devices").delete().eq("user_id", user.id);
      await logEvent("trusted_device_revoked_all");
      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (err) {
    console.error("two-factor error", err);
    return jsonResponse({ error: "Server error" }, 500);
  }
});
