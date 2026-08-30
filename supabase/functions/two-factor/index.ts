import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";
import {
  base32Encode, codeParCourrielValide, expirationDuCode, generate6DigitCode,
  generateDeviceToken, generateRecoveryCodes, sha256Hex, totpVerify,
  peutRedemanderUnCode, tropDeTentatives,
} from "./totp.ts";

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

/* LE CŒUR PUR DU SECOND FACTEUR VIT DANS `totp.ts`.
 *
 * Base32, HOTP, TOTP et les quatre generateurs en sont sortis pour
 * une seule raison : ce fichier-ci est INTESTABLE — il importe
 * depuis esm.sh et lit Deno.env des sa premiere ligne — tandis que
 * ce qu il en reste peut etre confronte aux vecteurs officiels de
 * la RFC 4226. Ce sont les fonctions qui decident si quelqu un
 * entre : elles meritaient de pouvoir etre relues. */

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
        /* Les revendications d'un jeton : on ne sait pas ce qu'il y a
           dedans, et les deux `typeof` juste dessous le disent deja. */
        const claims = (res.data as { claims?: Record<string, unknown> } | null)?.claims;
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

      await supabaseAdmin
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

      await supabaseAdmin
        .from("user_2fa_settings")
        .upsert({ user_id: user.id, totp_enabled: true, totp_secret: secret }, { onConflict: "user_id" });

      const codes = generateRecoveryCodes(10);
      const rows = await Promise.all(codes.map(async (c) => ({ user_id: user.id, code_hash: await sha256Hex(c) })));

      await supabaseAdmin.from("user_recovery_codes").delete().eq("user_id", user.id);
      await supabaseAdmin.from("user_recovery_codes").insert(rows);

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
        if (tropDeTentatives(settings.emailCodeAttempts)) {
          return jsonResponse({ error: "Too many attempts. Request a new code." }, 429);
        }

        /* LES TROIS MEMES CONDITIONS QU AU CHEMIN « confirm_email_2fa »,
           mais sur une saisie DEBARRASSEE DE SES BLANCS — la, elle ne
           l est pas. Un code colle avec une espace passe donc ici et
           pas la-bas. Constate, non corrige : voir totp.ts. */
        const codeHash = await sha256Hex(emailCode.trim());

        if (codeParCourrielValide(codeHash, settings.emailCode, settings.emailCodeExpiresAt, Date.now())) {
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
        const { data } = await supabaseAdmin
          .from("user_recovery_codes")
          .select("id, used_at")
          .eq("code_hash", hash)
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (data?.id && !data.used_at) {
          ok = true;
          usedRecovery = true;
          await supabaseAdmin
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
      await supabaseAdmin
        .from("user_2fa_settings")
        .upsert({ user_id: user.id, totp_enabled: false, totp_secret: null }, { onConflict: "user_id" });
      await supabaseAdmin.from("user_recovery_codes").delete().eq("user_id", user.id);
      await supabaseClient.from("user_trusted_devices").delete().eq("user_id", user.id);
      await logEvent("2fa_disabled");
      return jsonResponse({ success: true });
    }

    // ── ENABLE EMAIL 2FA (sends verification code) ──
    if (action === "enable_email_2fa") {
      if (!user.email) return jsonResponse({ error: "No email on account" }, 400);

      const code = generate6DigitCode();
      const codeHash = await sha256Hex(code);
      const expiresAt = expirationDuCode(Date.now());

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
      if (tropDeTentatives(settings.emailCodeAttempts)) return jsonResponse({ error: "Too many attempts" }, 429);

      /* SANS `.trim()`, contrairement au chemin « verify ». */
      const codeHash = await sha256Hex(emailCode);

      if (!codeParCourrielValide(codeHash, settings.emailCode, settings.emailCodeExpiresAt, Date.now())) {
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
        await supabaseAdmin.from("user_recovery_codes").delete().eq("user_id", user.id);
        await supabaseAdmin.from("user_recovery_codes").insert(rows);
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

      /* Un code par minute : voir peutRedemanderUnCode dans totp.ts,
         qui porte aussi la deduction de l heure d envoi. */
      if (!peutRedemanderUnCode(settings.emailCodeExpiresAt, Date.now())) {
        return jsonResponse({ error: "Please wait before requesting another code" }, 429);
      }

      const code = generate6DigitCode();
      const codeHash = await sha256Hex(code);
      const expiresAt = expirationDuCode(Date.now());

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
        await supabaseAdmin.from("user_recovery_codes").delete().eq("user_id", user.id);
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
      await supabaseAdmin.from("user_recovery_codes").delete().eq("user_id", user.id);
      await supabaseAdmin.from("user_recovery_codes").insert(rows);
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
