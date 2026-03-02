import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useTranslation } from "react-i18next";

/* ═══════════════════════════════════════════════════════════
   VOWPACT — Auth v3
   Cosmos + matière : étoiles lointaines, diodes, lumières froides,
   reflets sur verre, profondeur abyssale. Zéro scanline.
═══════════════════════════════════════════════════════════ */

function DeepSpaceCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    let t = 0;

    const resize = () => {
      canvas.width = innerWidth;
      canvas.height = innerHeight;
    };
    resize();
    addEventListener("resize", resize);

    /* Stars — 3 depth layers */
    const stars = Array.from({ length: 320 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.3,
      a: 0.08 + Math.random() * 0.75,
      spd: 0.4 + Math.random() * 1.2,
      off: Math.random() * Math.PI * 2,
      layer: Math.floor(Math.random() * 3),
    }));

    /* Distant nebula clusters */
    const nebulae = [
      { x: 0.68, y: 0.28, r: 0.48, cr: [0, 60, 120] as [number, number, number], a: 0.05 },
      { x: 0.18, y: 0.75, r: 0.38, cr: [60, 20, 0] as [number, number, number], a: 0.035 },
      { x: 0.85, y: 0.65, r: 0.25, cr: [0, 40, 80] as [number, number, number], a: 0.03 },
    ];

    /* Horizontal light streaks — distant spacecraft */
    const streaks = Array.from({ length: 5 }, () => ({
      x: Math.random(),
      y: 0.1 + Math.random() * 0.5,
      len: 0.04 + Math.random() * 0.08,
      spd: 0.00008 + Math.random() * 0.00015,
      a: 0.15 + Math.random() * 0.25,
      w: 0.5 + Math.random() * 0.5,
    }));

    const draw = () => {
      t += 1;
      const W = canvas.width,
        H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      /* Void */
      ctx.fillStyle = "#020408";
      ctx.fillRect(0, 0, W, H);

      /* Nebulae */
      nebulae.forEach((n) => {
        const g = ctx.createRadialGradient(n.x * W, n.y * H, 0, n.x * W, n.y * H, n.r * Math.min(W, H));
        g.addColorStop(0, `rgba(${n.cr[0]},${n.cr[1]},${n.cr[2]},${n.a})`);
        g.addColorStop(0.5, `rgba(${n.cr[0]},${n.cr[1]},${n.cr[2]},${n.a * 0.4})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      });

      /* Stars */
      stars.forEach((s) => {
        const pulse = Math.sin(t * 0.01 * s.spd + s.off);
        const alpha = s.a * (0.65 + 0.35 * pulse);
        const scale = [0.55, 0.8, 1][s.layer];
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r * scale, 0, Math.PI * 2);
        const cyan = s.layer === 2 && s.r > 1;
        ctx.fillStyle = cyan ? `rgba(190,235,255,${alpha})` : `rgba(210,225,245,${alpha * 0.85})`;
        ctx.fill();
        /* Rare bright star cross-flare */
        if (s.layer === 2 && s.r > 1.1 && pulse > 0.85) {
          ctx.strokeStyle = `rgba(200,240,255,${alpha * 0.3})`;
          ctx.lineWidth = 0.5;
          const x = s.x * W,
            y = s.y * H,
            fl = 5;
          ctx.beginPath();
          ctx.moveTo(x - fl, y);
          ctx.lineTo(x + fl, y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x, y - fl);
          ctx.lineTo(x, y + fl);
          ctx.stroke();
        }
      });

      /* Streaks */
      streaks.forEach((s) => {
        s.x = (s.x + s.spd) % 1.15;
        const x = s.x * W,
          y = s.y * H,
          l = s.len * W;
        const g = ctx.createLinearGradient(x - l, y, x, y);
        g.addColorStop(0, "rgba(0,0,0,0)");
        g.addColorStop(0.7, `rgba(180,230,255,${s.a})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.strokeStyle = g;
        ctx.lineWidth = s.w;
        ctx.beginPath();
        ctx.moveTo(x - l, y);
        ctx.lineTo(x, y);
        ctx.stroke();
      });

      /* Bottom atmosphere */
      const atm = ctx.createLinearGradient(0, H * 0.75, 0, H);
      atm.addColorStop(0, "rgba(0,0,0,0)");
      atm.addColorStop(1, "rgba(0,20,40,0.18)");
      ctx.fillStyle = atm;
      ctx.fillRect(0, H * 0.75, W, H);

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
}

/* ── Diode component — pulsing LED dot ── */
function Diode({
  color = "#00F2FF",
  size = 4,
  delay = 0,
  fast = false,
}: {
  color?: string;
  size?: number;
  delay?: number;
  fast?: boolean;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 ${size * 2}px ${color}, 0 0 ${size * 4}px ${color}55`,
        animation: `diodePulse ${fast ? "1.2s" : "2.4s"} ease-in-out ${delay}s infinite`,
        flexShrink: 0,
      }}
    />
  );
}

/* ── Cyber input — underline + left LED ── */
function CyberField({
  id,
  type,
  placeholder,
  value,
  onChange,
  disabled,
  label,
}: {
  id: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  label: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ marginBottom: 28, position: "relative" }}>
      {/* Label row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
        <Diode color={focused ? "#00F2FF" : "#003a45"} size={4} delay={0} fast={focused} />
        <label
          htmlFor={id}
          style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 9,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: focused ? "rgba(0,242,255,0.8)" : "rgba(255,255,255,0.22)",
            transition: "color 0.3s",
            cursor: "pointer",
          }}
        >
          {label}
        </label>
      </div>

      {/* Input */}
      <div style={{ position: "relative" }}>
        {/* Left glow bar */}
        <div
          style={{
            position: "absolute",
            left: -16,
            top: 8,
            bottom: 8,
            width: 1.5,
            background: focused
              ? "linear-gradient(180deg, transparent, #00F2FF, transparent)"
              : "linear-gradient(180deg, transparent, rgba(0,242,255,0.12), transparent)",
            transition: "background 0.4s",
          }}
        />

        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            borderBottom: `1px solid ${focused ? "rgba(0,242,255,0.45)" : "rgba(255,255,255,0.08)"}`,
            outline: "none",
            padding: "11px 0 11px 4px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 14,
            color: "rgba(210,240,255,0.92)",
            letterSpacing: "0.05em",
            transition: "border-color 0.3s",
            boxSizing: "border-box" as const,
          }}
        />

        {/* Active glow underline */}
        {focused && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 1,
              background: "linear-gradient(90deg, #00F2FF 0%, rgba(0,242,255,0.3) 60%, transparent 100%)",
              animation: "expandLine 0.35s ease forwards",
            }}
          />
        )}
      </div>
    </div>
  );
}

/* ── Main ── */
export default function Auth() {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const authSchema = z.object({
    email: z.string().email(t("auth.invalidEmail")),
    password: z.string().min(6, t("auth.passwordMin")),
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast({
        title: t("auth.validationError"),
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast({
            title: error.message.includes("Invalid login credentials") ? t("auth.loginFailed") : t("common.error"),
            description: error.message.includes("Invalid login credentials")
              ? t("auth.invalidCredentials")
              : error.message,
            variant: "destructive",
          });
        } else {
          navigate("/");
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) {
          toast({
            title: error.message.includes("already registered") ? t("auth.accountExists") : t("common.error"),
            description: error.message.includes("already registered")
              ? t("auth.emailAlreadyRegistered")
              : error.message,
            variant: "destructive",
          });
        } else {
          toast({ title: t("common.success"), description: t("auth.accountCreated") });
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      toast({ title: t("common.error"), description: err.message || t("common.error"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <DeepSpaceCanvas />

      {/* Full-page layout */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
        }}
      >
        {/* ═══ VOWPACT — dominant wordmark ═══ */}
        <div className="enter-top" style={{ textAlign: "center", marginBottom: 80 }}>
          {/* Tiny diode row above title */}
          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 20 }}>
            <Diode color="#F5C518" size={3} delay={0} />
            <Diode color="#00F2FF" size={3} delay={0.4} />
            <Diode color="#00F2FF" size={3} delay={0.8} />
            <Diode color="#F5C518" size={3} delay={1.2} />
          </div>

          <h1
            style={{
              fontFamily: "'Orbitron', monospace",
              fontWeight: 900,
              fontSize: "clamp(36px, 7vw, 64px)",
              letterSpacing: "0.55em",
              color: "#ffffff",
              textShadow: `
              0 0 30px rgba(0,242,255,0.22),
              0 0 80px rgba(0,242,255,0.1),
              0 0 200px rgba(0,242,255,0.05)
            `,
              textTransform: "uppercase",
              lineHeight: 1,
              margin: 0,
            }}
          >
            VOWPACT
          </h1>

          {/* Thin light line under title */}
          <div
            style={{
              margin: "18px auto 0",
              width: 220,
              height: 1,
              background: "linear-gradient(90deg, transparent, rgba(0,242,255,0.5), rgba(245,197,24,0.4), transparent)",
            }}
          />
        </div>

        {/* ═══ Glass panel ═══ */}
        <div
          className="enter-panel"
          style={{
            width: "100%",
            maxWidth: 400,
            position: "relative",
          }}
        >
          {/* Panel glow behind — depth layer */}
          <div
            style={{
              position: "absolute",
              inset: -1,
              background: "radial-gradient(ellipse at 50% 0%, rgba(0,242,255,0.06) 0%, transparent 65%)",
              pointerEvents: "none",
              zIndex: -1,
            }}
          />

          {/* Glass surface */}
          <div
            style={{
              background: "linear-gradient(160deg, rgba(12,20,40,0.85) 0%, rgba(6,10,22,0.92) 100%)",
              border: "1px solid rgba(0,242,255,0.12)",
              backdropFilter: "blur(32px)",
              padding: "40px 40px 32px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Inner top reflection — frosted glass feel */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 1,
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(0,242,255,0.35) 30%, rgba(255,255,255,0.15) 50%, rgba(0,242,255,0.35) 70%, transparent 100%)",
              }}
            />

            {/* Corner diodes */}
            <div style={{ position: "absolute", top: 12, left: 12 }}>
              <Diode color="#00F2FF" size={3.5} delay={0} />
            </div>
            <div style={{ position: "absolute", top: 12, right: 12 }}>
              <Diode color="#F5C518" size={3} delay={1.1} />
            </div>
            <div style={{ position: "absolute", bottom: 12, left: 12 }}>
              <Diode color="#00F2FF" size={2.5} delay={0.6} />
            </div>
            <div style={{ position: "absolute", bottom: 12, right: 12 }}>
              <Diode color="#00F2FF" size={2.5} delay={1.8} />
            </div>

            {/* Corner L-brackets */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 20,
                height: 20,
                borderTop: "1px solid rgba(0,242,255,0.4)",
                borderLeft: "1px solid rgba(0,242,255,0.4)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 20,
                height: 20,
                borderTop: "1px solid rgba(0,242,255,0.4)",
                borderRight: "1px solid rgba(0,242,255,0.4)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: 20,
                height: 20,
                borderBottom: "1px solid rgba(0,242,255,0.4)",
                borderLeft: "1px solid rgba(0,242,255,0.4)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 20,
                height: 20,
                borderBottom: "1px solid rgba(0,242,255,0.4)",
                borderRight: "1px solid rgba(0,242,255,0.4)",
              }}
            />

            {/* Tab row */}
            <div style={{ display: "flex", gap: 28, marginBottom: 38, paddingLeft: 2 }}>
              {(["Sign in", "Register"] as const).map((label, i) => {
                const active = (i === 0) === isLogin;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setIsLogin(i === 0)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: "0 0 5px",
                      fontFamily: "'Orbitron', monospace",
                      fontSize: 10,
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: active ? "#00F2FF" : "rgba(255,255,255,0.2)",
                      textShadow: active ? "0 0 12px rgba(0,242,255,0.6)" : "none",
                      borderBottom: active ? "1px solid rgba(0,242,255,0.7)" : "1px solid transparent",
                      cursor: "pointer",
                      transition: "all 0.25s",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Fields — left-bar offset for the vertical glow */}
            <div style={{ paddingLeft: 20 }}>
              <form onSubmit={handleAuth}>
                <CyberField
                  id="email"
                  type="email"
                  placeholder="you@domain.com"
                  value={email}
                  onChange={setEmail}
                  disabled={loading}
                  label={t("common.email") || "Email"}
                />
                <CyberField
                  id="password"
                  type="password"
                  placeholder="············"
                  value={password}
                  onChange={setPassword}
                  disabled={loading}
                  label={t("common.password") || "Password"}
                />

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="enter-btn"
                  style={{
                    width: "100%",
                    marginTop: 34,
                    padding: "15px 0",
                    background: "linear-gradient(135deg, rgba(0,242,255,0.06), rgba(0,242,255,0.03))",
                    border: "1px solid rgba(0,242,255,0.3)",
                    color: loading ? "rgba(0,242,255,0.3)" : "#00F2FF",
                    fontFamily: "'Orbitron', monospace",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.3s",
                    textShadow: loading ? "none" : "0 0 10px rgba(0,242,255,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Button inner top reflection */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 1,
                      background: "linear-gradient(90deg,transparent,rgba(0,242,255,0.4),transparent)",
                      pointerEvents: "none",
                    }}
                  />
                  {loading ? (
                    <>
                      <span className="spinner" /> Processing
                    </>
                  ) : isLogin ? (
                    "Enter"
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>
            </div>

            {/* Toggle */}
            <div style={{ marginTop: 22, textAlign: "center" }}>
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                disabled={loading}
                className="toggle-link"
                style={{
                  background: "none",
                  border: "none",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: "rgba(255,255,255,0.18)",
                  cursor: "pointer",
                  letterSpacing: "0.04em",
                  transition: "color 0.2s",
                }}
              >
                {isLogin ? "No account yet" : "Already have an account"}
              </button>
            </div>

            {/* Bottom status strip */}
            <div
              style={{
                marginTop: 28,
                paddingTop: 14,
                borderTop: "1px solid rgba(255,255,255,0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Diode color="#00F2FF" size={3} delay={0} fast />
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 8,
                    color: "rgba(0,242,255,0.3)",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                  }}
                >
                  Secure
                </span>
              </div>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 8,
                  color: "rgba(255,255,255,0.12)",
                  letterSpacing: "0.1em",
                }}
              >
                AES-256
              </span>
            </div>
          </div>
        </div>

        {/* Distant tagline */}
        <div
          className="enter-tagline"
          style={{
            marginTop: 52,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            color: "rgba(255,255,255,0.07)",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
          }}
        >
          Make your pact.
        </div>
      </div>
    </>
  );
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=JetBrains+Mono:wght@400;600&display=swap');

  * { box-sizing: border-box; }
  body { background: #020408; margin: 0; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes diodePulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.2; }
  }

  @keyframes expandLine {
    from { transform: scaleX(0); transform-origin: left; }
    to   { transform: scaleX(1); transform-origin: left; }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .enter-top     { animation: fadeUp 1.1s cubic-bezier(0.16,1,0.3,1) 0s    both; }
  .enter-panel   { animation: fadeUp 1.1s cubic-bezier(0.16,1,0.3,1) 0.18s both; }
  .enter-tagline { animation: fadeUp 1.1s cubic-bezier(0.16,1,0.3,1) 0.35s both; }

  .enter-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, rgba(0,242,255,0.12), rgba(0,242,255,0.06)) !important;
    border-color: rgba(0,242,255,0.65) !important;
    box-shadow: 0 0 30px rgba(0,242,255,0.12), 0 0 60px rgba(0,242,255,0.05) !important;
  }

  .toggle-link:hover { color: rgba(255,255,255,0.45) !important; }

  .spinner {
    display: inline-block; width: 10px; height: 10px;
    border: 1px solid rgba(0,242,255,0.2);
    border-top-color: rgba(0,242,255,0.8);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  input::placeholder { color: rgba(255,255,255,0.09); }
  input:disabled { opacity: 0.35; cursor: not-allowed; }
  h1 { margin: 0; }
`;
