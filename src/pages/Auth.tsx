import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useTranslation } from "react-i18next";

/* ─────────────────────────────────────────────────────────
   VOWPACT — Auth Page
   Aesthetic: deep space · minimal HUD · vast silence
   Palette: #00F2FF (ice cyan) · #F5C518 (gold) · void black
   Philosophy: less noise, more cosmos
───────────────────────────────────────────────────────── */

/* ── Deep space canvas — stars, nebula, silence ── */
function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;
    let t = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const stars = Array.from({ length: 280 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.2,
      alpha: 0.1 + Math.random() * 0.7,
      twinkleSpeed: 0.003 + Math.random() * 0.008,
      twinkleOffset: Math.random() * Math.PI * 2,
      layer: Math.floor(Math.random() * 3),
    }));

    const draw = () => {
      t += 0.003;
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      // Absolute void
      ctx.fillStyle = "#03050f";
      ctx.fillRect(0, 0, W, H);

      // Deep nebula — extremely subtle
      const nx = W * 0.62;
      const ny = H * 0.38;
      const nebulaR = Math.min(W, H) * 0.55;
      const nebula = ctx.createRadialGradient(nx, ny, 0, nx, ny, nebulaR);
      nebula.addColorStop(0, "rgba(0,80,140,0.045)");
      nebula.addColorStop(0.4, "rgba(0,50,100,0.025)");
      nebula.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = nebula;
      ctx.fillRect(0, 0, W, H);

      const nx2 = W * 0.25;
      const ny2 = H * 0.72;
      const nebula2 = ctx.createRadialGradient(nx2, ny2, 0, nx2, ny2, nebulaR * 0.6);
      nebula2.addColorStop(0, "rgba(80,50,0,0.025)");
      nebula2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = nebula2;
      ctx.fillRect(0, 0, W, H);

      // Stars
      stars.forEach((s) => {
        const twinkle = Math.sin(t * s.twinkleSpeed * 200 + s.twinkleOffset);
        const alpha = s.alpha * (0.7 + 0.3 * twinkle);
        const x = s.x * W;
        const y = s.y * H;
        const layerScale = [0.6, 0.85, 1][s.layer];
        const r = s.r * layerScale;

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = s.layer === 2 && s.r > 0.9 ? `rgba(200,240,255,${alpha})` : `rgba(200,220,240,${alpha * 0.8})`;
        ctx.fill();
      });

      // Horizon depth glow
      const horizon = ctx.createLinearGradient(0, H * 0.8, 0, H);
      horizon.addColorStop(0, "rgba(0,0,0,0)");
      horizon.addColorStop(1, "rgba(0,30,50,0.15)");
      ctx.fillStyle = horizon;
      ctx.fillRect(0, H * 0.8, W, H * 0.2);

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
}

/* ── Minimal field ── */
function Field({
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
    <div style={{ marginBottom: 20 }}>
      <label
        htmlFor={id}
        style={{
          display: "block",
          fontFamily: "'Orbitron', monospace",
          fontSize: 9,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: focused ? "rgba(0,242,255,0.7)" : "rgba(255,255,255,0.2)",
          marginBottom: 8,
          transition: "color 0.3s",
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative" }}>
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
            borderBottom: `1px solid ${focused ? "rgba(0,242,255,0.5)" : "rgba(255,255,255,0.1)"}`,
            outline: "none",
            padding: "12px 0",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 14,
            color: "rgba(220,240,255,0.9)",
            letterSpacing: "0.04em",
            boxSizing: "border-box" as const,
            transition: "border-color 0.3s",
          }}
        />
        {focused && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              height: 1,
              width: "100%",
              background: "linear-gradient(90deg, #00F2FF, rgba(0,242,255,0.05))",
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
      <SpaceBackground />

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
        {/* ── VOWPACT wordmark ── */}
        <div className="wordmark-enter" style={{ textAlign: "center", marginBottom: 72 }}>
          <div
            style={{
              fontFamily: "'Orbitron', monospace",
              fontWeight: 900,
              fontSize: "clamp(34px, 6vw, 58px)",
              letterSpacing: "0.5em",
              color: "#ffffff",
              textShadow: "0 0 60px rgba(0,242,255,0.15), 0 0 140px rgba(0,242,255,0.07)",
              textTransform: "uppercase",
              lineHeight: 1,
              marginBottom: 12,
            }}
          >
            VOWPACT
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.35em",
              color: "rgba(0,242,255,0.3)",
              textTransform: "uppercase",
            }}
          >
            {isLogin ? "Access your covenant" : "Forge your covenant"}
          </div>
        </div>

        {/* ── Panel ── */}
        <div
          className="panel-enter"
          style={{
            width: "100%",
            maxWidth: 380,
            background: "rgba(8,14,30,0.65)",
            border: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(28px)",
            padding: "40px 36px 32px",
            position: "relative",
          }}
        >
          {/* Corner accents — only two, diagonal */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 24,
              height: 24,
              borderTop: "1px solid rgba(0,242,255,0.45)",
              borderLeft: "1px solid rgba(0,242,255,0.45)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 24,
              height: 24,
              borderBottom: "1px solid rgba(0,242,255,0.45)",
              borderRight: "1px solid rgba(0,242,255,0.45)",
            }}
          />

          {/* Tab toggle */}
          <div style={{ display: "flex", gap: 28, marginBottom: 36 }}>
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
                    padding: "0 0 4px",
                    fontFamily: "'Orbitron', monospace",
                    fontSize: 10,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: active ? "rgba(0,242,255,0.9)" : "rgba(255,255,255,0.2)",
                    borderBottom: active ? "1px solid rgba(0,242,255,0.55)" : "1px solid transparent",
                    cursor: "pointer",
                    transition: "color 0.2s",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleAuth}>
            <Field
              id="email"
              type="email"
              placeholder="you@domain.com"
              value={email}
              onChange={setEmail}
              disabled={loading}
              label={t("common.email") || "Email"}
            />
            <Field
              id="password"
              type="password"
              placeholder="············"
              value={password}
              onChange={setPassword}
              disabled={loading}
              label={t("common.password") || "Password"}
            />

            <button
              type="submit"
              disabled={loading}
              className="submit-btn"
              style={{
                width: "100%",
                marginTop: 32,
                padding: "14px 0",
                background: "transparent",
                border: "1px solid rgba(0,242,255,0.3)",
                color: loading ? "rgba(0,242,255,0.3)" : "rgba(0,242,255,0.85)",
                fontFamily: "'Orbitron', monospace",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.3s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
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
                color: "rgba(255,255,255,0.16)",
                cursor: "pointer",
                letterSpacing: "0.04em",
                transition: "color 0.2s",
              }}
            >
              {isLogin ? "No account yet" : "Already have an account"}
            </button>
          </div>
        </div>

        {/* Distant tagline */}
        <div
          style={{
            marginTop: 52,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            color: "rgba(255,255,255,0.08)",
            letterSpacing: "0.25em",
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
  body { background: #03050f; margin: 0; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .wordmark-enter { animation: fadeUp 1.1s cubic-bezier(0.16,1,0.3,1) both; }
  .panel-enter    { animation: fadeUp 1.1s cubic-bezier(0.16,1,0.3,1) 0.18s both; }

  .submit-btn:hover:not(:disabled) {
    background: rgba(0,242,255,0.05) !important;
    border-color: rgba(0,242,255,0.65) !important;
    box-shadow: 0 0 28px rgba(0,242,255,0.08) !important;
  }

  .toggle-link:hover { color: rgba(255,255,255,0.45) !important; }

  .spinner {
    display: inline-block;
    width: 10px; height: 10px;
    border: 1px solid rgba(0,242,255,0.2);
    border-top-color: rgba(0,242,255,0.8);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  input::placeholder { color: rgba(255,255,255,0.1); }
  input:disabled { opacity: 0.4; cursor: not-allowed; }
`;
