import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useTranslation } from "react-i18next";

/* ─────────────────────────────────────────────
   Cyberpunk / Sci-Fi Auth Page — Track v2
   Palette: #00F2FF (cyan HUD) · #F5C518 (corpo yellow) · #0a0e1a (void dark)
   Fonts: Orbitron (display) · JetBrains Mono (mono) · Rajdhani (body)
───────────────────────────────────────────── */

/* ── Canvas particle grid ── */
function CyberGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Grid nodes
    const cols = Math.floor(canvas.width / 60);
    const rows = Math.floor(canvas.height / 60);
    const nodes: { x: number; y: number; pulse: number; speed: number; active: boolean }[] = [];

    for (let c = 0; c <= cols; c++) {
      for (let r = 0; r <= rows; r++) {
        nodes.push({
          x: c * 60,
          y: r * 60,
          pulse: Math.random() * Math.PI * 2,
          speed: 0.02 + Math.random() * 0.03,
          active: Math.random() < 0.12,
        });
      }
    }

    // Scan line
    let scanY = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background void
      ctx.fillStyle = "#050810";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid lines
      ctx.strokeStyle = "rgba(0,242,255,0.04)";
      ctx.lineWidth = 1;
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath();
        ctx.moveTo(c * 60, 0);
        ctx.lineTo(c * 60, canvas.height);
        ctx.stroke();
      }
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * 60);
        ctx.lineTo(canvas.width, r * 60);
        ctx.stroke();
      }

      // Node dots
      nodes.forEach((n) => {
        n.pulse += n.speed;
        const alpha = n.active ? 0.4 + 0.5 * Math.sin(n.pulse) : 0.04 + 0.04 * Math.sin(n.pulse);
        const size = n.active ? 2.5 : 1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, size, 0, Math.PI * 2);
        ctx.fillStyle = n.active ? `rgba(0,242,255,${alpha})` : `rgba(0,242,255,${alpha})`;
        ctx.fill();

        if (n.active && Math.sin(n.pulse) > 0.8) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0,242,255,0.08)`;
          ctx.fill();
        }
      });

      // Moving scan line
      scanY = (scanY + 0.8) % canvas.height;
      const gradient = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40);
      gradient.addColorStop(0, "rgba(0,242,255,0)");
      gradient.addColorStop(0.5, "rgba(0,242,255,0.06)");
      gradient.addColorStop(1, "rgba(0,242,255,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, scanY - 40, canvas.width, 80);

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}

/* ── Glitch text ── */
function GlitchText({ text, className = "" }: { text: string; className?: string }) {
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    const interval = setInterval(
      () => {
        setGlitching(true);
        setTimeout(() => setGlitching(false), 150);
      },
      4000 + Math.random() * 3000,
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className={className}
      style={{
        position: "relative",
        display: "inline-block",
        filter: glitching ? "drop-shadow(2px 0 #F5C518) drop-shadow(-2px 0 #ff2060)" : "none",
        transform: glitching ? "skewX(-2deg)" : "none",
        transition: "filter 0.05s, transform 0.05s",
      }}
    >
      {text}
    </span>
  );
}

/* ── HUD input field ── */
function CyberInput({
  id,
  type,
  placeholder,
  value,
  onChange,
  disabled,
  label,
  icon,
}: {
  id: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  label: string;
  icon: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ position: "relative", marginBottom: 24 }}>
      {/* Label */}
      <label
        htmlFor={id}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontFamily: "'Orbitron', monospace",
          fontSize: 10,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: focused ? "#00F2FF" : "rgba(0,242,255,0.5)",
          marginBottom: 8,
          transition: "color 0.2s",
        }}
      >
        {icon}
        {label}
      </label>

      {/* Input wrapper */}
      <div
        style={{
          position: "relative",
          background: focused ? "rgba(0,242,255,0.04)" : "rgba(0,242,255,0.015)",
          border: `1px solid ${focused ? "rgba(0,242,255,0.7)" : "rgba(0,242,255,0.2)"}`,
          clipPath: "polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)",
          transition: "all 0.2s",
          boxShadow: focused ? "0 0 20px rgba(0,242,255,0.15), inset 0 0 20px rgba(0,242,255,0.03)" : "none",
        }}
      >
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
            outline: "none",
            padding: "14px 16px",
            fontFamily: "'JetBrains Mono', 'Share Tech Mono', monospace",
            fontSize: 14,
            color: "#e2f5ff",
            letterSpacing: "0.05em",
            boxSizing: "border-box",
          }}
        />
        {/* Corner accent */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 8,
            height: 8,
            background: focused ? "#00F2FF" : "rgba(0,242,255,0.3)",
            transition: "background 0.2s",
          }}
        />
      </div>

      {/* Active bottom bar */}
      <div
        style={{
          height: 2,
          background: focused ? "linear-gradient(90deg,transparent,#00F2FF,transparent)" : "transparent",
          marginTop: 2,
          transition: "background 0.3s",
        }}
      />
    </div>
  );
}

/* ── Main component ── */
export default function Auth() {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [bootSequence, setBootSequence] = useState(true);
  const [bootStep, setBootStep] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  const bootLines = [
    "INITIALIZING NEURAL INTERFACE...",
    "CONNECTING TO TRACK NETWORK...",
    "LOADING BIOMETRIC PROTOCOLS...",
    "IDENTITY VERIFICATION READY",
  ];

  useEffect(() => {
    if (!bootSequence) return;
    const timer = setInterval(() => {
      setBootStep((s) => {
        if (s >= bootLines.length - 1) {
          clearInterval(timer);
          setTimeout(() => setBootSequence(false), 400);
          return s;
        }
        return s + 1;
      });
    }, 350);
    return () => clearInterval(timer);
  }, [bootSequence]);

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

  /* ── Boot overlay ── */
  if (bootSequence) {
    return (
      <>
        <style>{GLOBAL_STYLES}</style>
        <CyberGrid />
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            letterSpacing: "0.15em",
          }}
        >
          {/* Logo */}
          <div style={{ marginBottom: 40, textAlign: "center" }}>
            <div className="track-logo-boot" />
            <div
              style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: 28,
                fontWeight: 900,
                letterSpacing: "0.4em",
                color: "#00F2FF",
                textShadow: "0 0 20px #00F2FF, 0 0 60px rgba(0,242,255,0.4)",
                textTransform: "uppercase",
              }}
            >
              TRACK
            </div>
          </div>

          {bootLines.slice(0, bootStep + 1).map((line, i) => (
            <div
              key={i}
              style={{
                color: i === bootStep ? "#00F2FF" : "rgba(0,242,255,0.4)",
                display: "flex",
                alignItems: "center",
                gap: 10,
                animation: "fadeInBoot 0.3s ease",
              }}
            >
              <span style={{ color: "#F5C518" }}>{i < bootStep ? "✓" : "›"}</span>
              {line}
              {i === bootStep && <span className="cursor-blink">_</span>}
            </div>
          ))}
        </div>
      </>
    );
  }

  /* ── Main auth UI ── */
  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <CyberGrid />

      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=JetBrains+Mono:wght@400;600&family=Rajdhani:wght@400;600;700&display=swap"
        rel="stylesheet"
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          fontFamily: "'Rajdhani', sans-serif",
        }}
      >
        {/* Ambient glow center */}
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle,rgba(0,242,255,0.04) 0%,transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            width: "100%",
            maxWidth: 460,
            animation: "slideInPanel 0.6s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {/* ── Header ── */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            {/* Hex logo */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <div className="hex-logo">
                <svg width="64" height="72" viewBox="0 0 64 72" fill="none">
                  <polygon
                    points="32,2 60,18 60,54 32,70 4,54 4,18"
                    stroke="#00F2FF"
                    strokeWidth="1.5"
                    fill="rgba(0,242,255,0.06)"
                  />
                  <polygon
                    points="32,10 54,22 54,50 32,62 10,50 10,22"
                    stroke="rgba(0,242,255,0.3)"
                    strokeWidth="0.8"
                    fill="none"
                  />
                  {/* T icon */}
                  <line x1="22" y1="28" x2="42" y2="28" stroke="#F5C518" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="32" y1="28" x2="32" y2="48" stroke="#F5C518" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            <div
              style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: 32,
                fontWeight: 900,
                letterSpacing: "0.5em",
                color: "#00F2FF",
                textShadow: "0 0 20px rgba(0,242,255,0.6), 0 0 60px rgba(0,242,255,0.2)",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              <GlitchText text="TRACK" />
            </div>

            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: "0.3em",
                color: "rgba(0,242,255,0.5)",
                textTransform: "uppercase",
              }}
            >
              {isLogin ? "// IDENTITY VERIFICATION" : "// NEW OPERATIVE REGISTRATION"}
            </div>
          </div>

          {/* ── Panel ── */}
          <div
            style={{
              background: "rgba(5,10,25,0.85)",
              border: "1px solid rgba(0,242,255,0.2)",
              backdropFilter: "blur(20px)",
              clipPath: "polygon(16px 0,100% 0,100% calc(100% - 16px),calc(100% - 16px) 100%,0 100%,0 16px)",
              boxShadow: "0 0 40px rgba(0,242,255,0.08), inset 0 0 40px rgba(0,242,255,0.02)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Corner brackets */}
            <div className="cb-tl" />
            <div className="cb-tr" />
            <div className="cb-bl" />
            <div className="cb-br" />

            {/* Scan line on panel */}
            <div className="panel-scan" />

            {/* Tab switch */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                borderBottom: "1px solid rgba(0,242,255,0.1)",
              }}
            >
              {["SIGN IN", "REGISTER"].map((label, i) => {
                const active = (i === 0) === isLogin;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setIsLogin(i === 0)}
                    disabled={loading}
                    style={{
                      padding: "14px 0",
                      fontFamily: "'Orbitron', monospace",
                      fontSize: 10,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: active ? "#00F2FF" : "rgba(0,242,255,0.35)",
                      background: active ? "rgba(0,242,255,0.05)" : "transparent",
                      border: "none",
                      borderBottom: active ? "2px solid #00F2FF" : "2px solid transparent",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      textShadow: active ? "0 0 10px rgba(0,242,255,0.5)" : "none",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Form body */}
            <div style={{ padding: "32px 32px 24px" }}>
              {/* Status bar */}
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  letterSpacing: "0.15em",
                  color: "rgba(0,242,255,0.4)",
                  marginBottom: 28,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#00F2FF",
                    boxShadow: "0 0 8px #00F2FF",
                    display: "inline-block",
                    animation: "pulseDot 2s ease-in-out infinite",
                  }}
                />
                SECURE CHANNEL ESTABLISHED · AES-256 · TLS 1.3
              </div>

              <form onSubmit={handleAuth}>
                <CyberInput
                  id="email"
                  type="email"
                  placeholder="operative@domain.net"
                  value={email}
                  onChange={setEmail}
                  disabled={loading}
                  label={t("common.email") || "Email"}
                  icon={
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <rect x="0.5" y="2" width="9" height="6.5" rx="1" stroke="currentColor" strokeWidth="1" />
                      <path d="M1 2.5 L5 5.5 L9 2.5" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
                    </svg>
                  }
                />

                <CyberInput
                  id="password"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={setPassword}
                  disabled={loading}
                  label={t("common.password") || "Password"}
                  icon={
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <rect x="2" y="4.5" width="6" height="5" rx="0.5" stroke="currentColor" strokeWidth="1" />
                      <path d="M3 4.5V3.5a2 2 0 014 0V4.5" stroke="currentColor" strokeWidth="1" />
                      <circle cx="5" cy="7" r="0.8" fill="currentColor" />
                    </svg>
                  }
                />

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "16px 0",
                    marginTop: 8,
                    background: loading
                      ? "rgba(0,242,255,0.05)"
                      : "linear-gradient(135deg,rgba(0,242,255,0.15),rgba(0,242,255,0.08))",
                    border: "1px solid rgba(0,242,255,0.6)",
                    clipPath: "polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)",
                    color: loading ? "rgba(0,242,255,0.4)" : "#00F2FF",
                    fontFamily: "'Orbitron', monospace",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    cursor: loading ? "not-allowed" : "pointer",
                    textShadow: loading ? "none" : "0 0 10px rgba(0,242,255,0.6)",
                    boxShadow: loading ? "none" : "0 0 20px rgba(0,242,255,0.15), inset 0 0 20px rgba(0,242,255,0.03)",
                    transition: "all 0.2s",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  className={loading ? "" : "btn-cyber-hover"}
                >
                  {loading ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <span className="spinner" />
                      PROCESSING
                    </span>
                  ) : isLogin ? (
                    "ACCESS GRANTED →"
                  ) : (
                    "INITIALIZE ACCOUNT →"
                  )}
                </button>
              </form>

              {/* Divider */}
              <div
                style={{
                  margin: "24px 0 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div style={{ flex: 1, height: 1, background: "rgba(0,242,255,0.1)" }} />
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    color: "rgba(0,242,255,0.3)",
                    letterSpacing: "0.15em",
                  }}
                >
                  ◆
                </span>
                <div style={{ flex: 1, height: 1, background: "rgba(0,242,255,0.1)" }} />
              </div>

              {/* Toggle link */}
              <div style={{ textAlign: "center" }}>
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  disabled={loading}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    color: "rgba(0,242,255,0.5)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    letterSpacing: "0.08em",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.color = "#00F2FF")}
                  onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.color = "rgba(0,242,255,0.5)")}
                >
                  {isLogin ? "No operative ID? → Register" : "Already registered? → Sign in"}
                </button>
              </div>
            </div>

            {/* Footer status */}
            <div
              style={{
                borderTop: "1px solid rgba(0,242,255,0.08)",
                padding: "10px 32px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  color: "rgba(0,242,255,0.25)",
                  letterSpacing: "0.1em",
                }}
              >
                TRACK OS v2.0
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  color: "rgba(245,197,24,0.5)",
                  letterSpacing: "0.1em",
                }}
              >
                ENCRYPTED ◆ SECURE
              </span>
            </div>
          </div>

          {/* Tagline under panel */}
          <div
            style={{
              textAlign: "center",
              marginTop: 20,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: "rgba(0,242,255,0.2)",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            Track your life. Master your future.
          </div>
        </div>
      </div>
    </>
  );
}

/* ── All styles in one place ── */
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=JetBrains+Mono:wght@400;600&family=Rajdhani:wght@400;600;700&display=swap');

  body { background: #050810; }

  @keyframes fadeInBoot {
    from { opacity: 0; transform: translateX(-10px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  @keyframes slideInPanel {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes pulseDot {
    0%,100% { opacity:1; box-shadow: 0 0 8px #00F2FF; }
    50%      { opacity:0.5; box-shadow: 0 0 3px #00F2FF; }
  }

  @keyframes cursorBlink {
    0%,100% { opacity:1; }
    50%      { opacity:0; }
  }

  @keyframes hexPulse {
    0%,100% { filter: drop-shadow(0 0 6px rgba(0,242,255,0.6)) drop-shadow(0 0 20px rgba(0,242,255,0.2)); }
    50%      { filter: drop-shadow(0 0 12px rgba(0,242,255,0.9)) drop-shadow(0 0 40px rgba(0,242,255,0.4)); }
  }

  @keyframes scanPanel {
    0%   { top: -2px; }
    100% { top: 100%; }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .cursor-blink { animation: cursorBlink 1s step-end infinite; }

  .hex-logo { animation: hexPulse 3s ease-in-out infinite; }
  .hex-logo svg { display:block; }

  .panel-scan {
    position:absolute;
    left:0; right:0;
    height:2px;
    background:linear-gradient(90deg,transparent,rgba(0,242,255,0.4),transparent);
    animation: scanPanel 4s linear infinite;
    pointer-events:none;
    z-index:2;
  }

  /* Corner brackets */
  .cb-tl,.cb-tr,.cb-bl,.cb-br {
    position:absolute; width:14px; height:14px; z-index:3; pointer-events:none;
    border-color:rgba(0,242,255,0.7);
  }
  .cb-tl { top:8px;left:8px; border-top:1.5px solid; border-left:1.5px solid; }
  .cb-tr { top:8px;right:8px; border-top:1.5px solid; border-right:1.5px solid; }
  .cb-bl { bottom:8px;left:8px; border-bottom:1.5px solid; border-left:1.5px solid; }
  .cb-br { bottom:8px;right:8px; border-bottom:1.5px solid; border-right:1.5px solid; }

  .btn-cyber-hover:hover {
    background: linear-gradient(135deg,rgba(0,242,255,0.2),rgba(0,242,255,0.12)) !important;
    box-shadow: 0 0 30px rgba(0,242,255,0.25), inset 0 0 30px rgba(0,242,255,0.06) !important;
  }

  .spinner {
    display:inline-block;
    width:12px; height:12px;
    border:1.5px solid rgba(0,242,255,0.2);
    border-top-color:#00F2FF;
    border-radius:50%;
    animation: spin 0.7s linear infinite;
  }

  .track-logo-boot {
    width:64px; height:64px; margin:0 auto 12px;
  }
`;
