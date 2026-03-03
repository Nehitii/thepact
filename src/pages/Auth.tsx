import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useTranslation } from "react-i18next";

/* ═══════════════════════════════════════════════════════════
   VOWPACT — Auth v4 (Hyper Premium)
   - Holographic rim (conic + film)
   - Ultra glass (specular highlights + vignette)
   - Micro-parallax deep space (pointer drift)
   - Subtle grain (CSS procedural) — no scanlines
═══════════════════════════════════════════════════════════ */

function DeepSpaceCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let t = 0;

    // micro-parallax (very subtle)
    let px = 0;
    let py = 0;
    let tx = 0;
    let ty = 0;

    const onPointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / innerWidth) * 2 - 1;
      const ny = (e.clientY / innerHeight) * 2 - 1;
      tx = nx;
      ty = ny;
    };

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(innerWidth * dpr);
      canvas.height = Math.floor(innerHeight * dpr);
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    addEventListener("resize", resize);
    addEventListener("pointermove", onPointerMove, { passive: true });

    /* Stars — 3 depth layers */
    const stars = Array.from({ length: 360 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.35,
      a: 0.08 + Math.random() * 0.78,
      spd: 0.35 + Math.random() * 1.25,
      off: Math.random() * Math.PI * 2,
      layer: Math.floor(Math.random() * 3),
      tint: Math.random(), // tiny temperature variation
    }));

    /* Distant nebula clusters */
    const nebulae = [
      { x: 0.68, y: 0.28, r: 0.52, cr: [0, 70, 140] as [number, number, number], a: 0.055 },
      { x: 0.18, y: 0.75, r: 0.4, cr: [70, 22, 0] as [number, number, number], a: 0.038 },
      { x: 0.85, y: 0.65, r: 0.28, cr: [0, 55, 110] as [number, number, number], a: 0.032 },
    ];

    /* Horizontal light streaks — distant craft */
    const streaks = Array.from({ length: 6 }, () => ({
      x: Math.random(),
      y: 0.12 + Math.random() * 0.48,
      len: 0.04 + Math.random() * 0.085,
      spd: 0.00007 + Math.random() * 0.00016,
      a: 0.14 + Math.random() * 0.26,
      w: 0.55 + Math.random() * 0.6,
    }));

    const draw = () => {
      t += 1;

      // eased parallax
      px += (tx - px) * 0.03;
      py += (ty - py) * 0.03;

      const W = innerWidth;
      const H = innerHeight;

      ctx.clearRect(0, 0, W, H);

      /* Void base */
      ctx.fillStyle = "#020408";
      ctx.fillRect(0, 0, W, H);

      /* Nebulae (slightly drifting with parallax) */
      nebulae.forEach((n, idx) => {
        const driftX = (px * (6 + idx * 2)) / W;
        const driftY = (py * (5 + idx * 2)) / H;
        const cx = (n.x + driftX * 0.02) * W;
        const cy = (n.y + driftY * 0.02) * H;
        const rr = n.r * Math.min(W, H);

        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
        g.addColorStop(0, `rgba(${n.cr[0]},${n.cr[1]},${n.cr[2]},${n.a})`);
        g.addColorStop(0.55, `rgba(${n.cr[0]},${n.cr[1]},${n.cr[2]},${n.a * 0.33})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      });

      /* Stars */
      stars.forEach((s) => {
        const pulse = Math.sin(t * 0.01 * s.spd + s.off);
        const alpha = s.a * (0.62 + 0.38 * pulse);
        const scale = [0.55, 0.82, 1][s.layer];

        // parallax per layer
        const lx = (px * [2, 5, 9][s.layer]) / W;
        const ly = (py * [2, 5, 9][s.layer]) / H;

        const x = (s.x + lx * 0.002) * W;
        const y = (s.y + ly * 0.002) * H;

        // subtle temperature tint
        const cool = 190 + Math.floor(45 * (1 - s.tint));
        const warm = 205 + Math.floor(40 * s.tint);

        ctx.beginPath();
        ctx.arc(x, y, s.r * scale, 0, Math.PI * 2);

        const cyan = s.layer === 2 && s.r > 1;
        ctx.fillStyle = cyan ? `rgba(185,235,255,${alpha})` : `rgba(${warm},${cool},245,${alpha * 0.86})`;
        ctx.fill();

        /* Rare bright star cross-flare */
        if (s.layer === 2 && s.r > 1.12 && pulse > 0.86) {
          ctx.strokeStyle = `rgba(205,245,255,${alpha * 0.28})`;
          ctx.lineWidth = 0.5;
          const fl = 5.5;
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
        s.x = (s.x + s.spd) % 1.18;
        const x = s.x * W + px * 6;
        const y = s.y * H + py * 4;
        const l = s.len * W;

        const g = ctx.createLinearGradient(x - l, y, x, y);
        g.addColorStop(0, "rgba(0,0,0,0)");
        g.addColorStop(0.72, `rgba(180,232,255,${s.a})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.strokeStyle = g;
        ctx.lineWidth = s.w;
        ctx.beginPath();
        ctx.moveTo(x - l, y);
        ctx.lineTo(x, y);
        ctx.stroke();
      });

      /* Vignette + lower atmosphere */
      const vign = ctx.createRadialGradient(W * 0.5, H * 0.45, H * 0.05, W * 0.5, H * 0.55, H * 0.9);
      vign.addColorStop(0, "rgba(0,0,0,0)");
      vign.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = vign;
      ctx.fillRect(0, 0, W, H);

      const atm = ctx.createLinearGradient(0, H * 0.72, 0, H);
      atm.addColorStop(0, "rgba(0,0,0,0)");
      atm.addColorStop(1, "rgba(0,22,44,0.22)");
      ctx.fillStyle = atm;
      ctx.fillRect(0, H * 0.72, W, H);

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
      removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return <canvas ref={ref} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
}

/* ── Diode component — premium LED dot ── */
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
        background: `radial-gradient(circle at 35% 35%, #fff9, ${color} 45%, ${color} 70%)`,
        boxShadow: `0 0 ${size * 2}px ${color}, 0 0 ${size * 6}px ${color}33, 0 0 ${size * 10}px ${color}1f`,
        animation: `diodePulse ${fast ? "1.15s" : "2.35s"} cubic-bezier(.2,.9,.2,1) ${delay}s infinite`,
        flexShrink: 0,
      }}
    />
  );
}

/* ── Cyber input — holographic underline + specular glass ── */
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
    <div className={`vf-field ${focused ? "is-focus" : ""}`} style={{ marginBottom: 28, position: "relative" }}>
      {/* Label row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
        <Diode color={focused ? "var(--c-cyan)" : "rgba(0,242,255,0.10)"} size={4} delay={0} fast={focused} />
        <label
          htmlFor={id}
          style={{
            fontFamily: "var(--f-orbit)",
            fontSize: 9,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: focused ? "rgba(0,242,255,0.82)" : "rgba(255,255,255,0.22)",
            transition: "color 0.3s",
            cursor: "pointer",
          }}
        >
          {label}
        </label>
      </div>

      <div style={{ position: "relative" }}>
        {/* Left glow bar */}
        <div
          className="vf-leftbar"
          style={{
            position: "absolute",
            left: -16,
            top: 8,
            bottom: 8,
            width: 1.5,
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
          className="vf-input"
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            borderBottom: `1px solid ${focused ? "rgba(0,242,255,0.50)" : "rgba(255,255,255,0.08)"}`,
            outline: "none",
            padding: "11px 0 11px 4px",
            fontFamily: "var(--f-mono)",
            fontSize: 14,
            color: "rgba(210,240,255,0.92)",
            letterSpacing: "0.05em",
            transition: "border-color 0.3s",
            boxSizing: "border-box" as const,
          }}
        />

        {/* Active glow underline */}
        {focused && <div className="vf-underline" />}
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
        {/* Wordmark */}
        <div className="enter-top" style={{ textAlign: "center", marginBottom: 80 }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 20 }}>
            <Diode color="var(--c-gold)" size={3} delay={0} />
            <Diode color="var(--c-cyan)" size={3} delay={0.4} />
            <Diode color="var(--c-cyan)" size={3} delay={0.8} />
            <Diode color="var(--c-gold)" size={3} delay={1.2} />
          </div>

          <h1 className="vf-title">VOWPACT</h1>

          <div className="vf-titleline" />
        </div>

        {/* Panel */}
        <div className="enter-panel" style={{ width: "100%", maxWidth: 410, position: "relative" }}>
          {/* Ambient halo behind */}
          <div className="vf-panelHalo" />

          <div className="vf-panel">
            {/* specular top line */}
            <div className="vf-specLine" />

            {/* corner diodes */}
            <div style={{ position: "absolute", top: 12, left: 12 }}>
              <Diode color="var(--c-cyan)" size={3.5} delay={0} />
            </div>
            <div style={{ position: "absolute", top: 12, right: 12 }}>
              <Diode color="var(--c-gold)" size={3} delay={1.1} />
            </div>
            <div style={{ position: "absolute", bottom: 12, left: 12 }}>
              <Diode color="var(--c-cyan)" size={2.5} delay={0.6} />
            </div>
            <div style={{ position: "absolute", bottom: 12, right: 12 }}>
              <Diode color="var(--c-cyan)" size={2.5} delay={1.8} />
            </div>

            {/* Corner L-brackets */}
            <div className="vf-corner tl" />
            <div className="vf-corner tr" />
            <div className="vf-corner bl" />
            <div className="vf-corner br" />

            {/* Tabs */}
            <div style={{ display: "flex", gap: 28, marginBottom: 38, paddingLeft: 2 }}>
              {(["Sign in", "Register"] as const).map((label, i) => {
                const active = (i === 0) === isLogin;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setIsLogin(i === 0)}
                    className={`vf-tab ${active ? "is-active" : ""}`}
                    style={{ background: "none", border: "none", padding: "0 0 5px", cursor: "pointer" }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

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

                <button type="submit" disabled={loading} className="enter-btn vf-btn">
                  <span className="vf-btnSpec" />
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
                className="toggle-link vf-toggle"
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                {isLogin ? "No account yet" : "Already have an account"}
              </button>
            </div>

            {/* Bottom status strip */}
            <div className="vf-status">
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Diode color="var(--c-cyan)" size={3} delay={0} fast />
                <span className="vf-statusLabel">Secure</span>
              </div>
              <span className="vf-statusMeta">AES-256</span>
            </div>

            {/* Subtle film grain overlay (inside panel only) */}
            <div className="vf-grain" aria-hidden />
          </div>
        </div>

        <div className="enter-tagline vf-tagline">Make your pact.</div>
      </div>
    </>
  );
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=JetBrains+Mono:wght@400;600&display=swap');

  :root{
    --c-bg: #020408;
    --c-cyan: #00F2FF;
    --c-gold: #F5C518;

    --glass-1: rgba(12,20,40,0.78);
    --glass-2: rgba(6,10,22,0.92);

    --rim: rgba(0,242,255,0.18);
    --rim-strong: rgba(0,242,255,0.42);

    --txt: rgba(210,240,255,0.92);
    --muted: rgba(255,255,255,0.20);

    --f-orbit: 'Orbitron', monospace;
    --f-mono: 'JetBrains Mono', monospace;

    --ease: cubic-bezier(0.16,1,0.3,1);
  }

  *{ box-sizing:border-box; }
  body { background: var(--c-bg); margin:0; }

  /* Motion safety */
  @media (prefers-reduced-motion: reduce){
    * { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; }
  }

  @keyframes fadeUp {
    from { opacity:0; transform: translateY(22px); }
    to   { opacity:1; transform: translateY(0); }
  }

  @keyframes diodePulse {
    0%, 100% { opacity: 1; filter: saturate(1.15); }
    50% { opacity: 0.18; filter: saturate(0.9); }
  }

  @keyframes expandLine {
    from { transform: scaleX(0); transform-origin: left; opacity: 0.0; }
    to   { transform: scaleX(1); transform-origin: left; opacity: 1; }
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* Holographic film (panel rim) */
  @keyframes holoDrift {
    0% { transform: translate3d(-4%, -2%, 0) rotate(0.001deg); opacity: .55; }
    50%{ transform: translate3d(4%, 2%, 0) rotate(0.001deg); opacity: .72; }
    100%{ transform: translate3d(-4%, -2%, 0) rotate(0.001deg); opacity: .55; }
  }

  /* Button spec sweep */
  @keyframes specSweep {
    0% { transform: translateX(-120%) skewX(-18deg); opacity: 0; }
    20% { opacity: .55; }
    60% { opacity: .12; }
    100% { transform: translateX(120%) skewX(-18deg); opacity: 0; }
  }

  .enter-top     { animation: fadeUp 1.1s var(--ease) 0s    both; }
  .enter-panel   { animation: fadeUp 1.1s var(--ease) 0.18s both; }
  .enter-tagline { animation: fadeUp 1.1s var(--ease) 0.35s both; }

  /* Title */
  .vf-title{
    font-family: var(--f-orbit);
    font-weight: 900;
    font-size: clamp(36px, 7vw, 64px);
    letter-spacing: 0.55em;
    color: #fff;
    text-transform: uppercase;
    line-height: 1;
    margin: 0;
    text-shadow:
      0 0 30px rgba(0,242,255,0.22),
      0 0 80px rgba(0,242,255,0.10),
      0 0 200px rgba(0,242,255,0.06);
  }
  .vf-titleline{
    margin: 18px auto 0;
    width: 230px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0,242,255,0.55), rgba(245,197,24,0.42), transparent);
    box-shadow: 0 0 20px rgba(0,242,255,0.12);
  }

  /* Panel shell */
  .vf-panelHalo{
    position:absolute;
    inset:-2px;
    background:
      radial-gradient(ellipse at 50% 0%, rgba(0,242,255,0.10) 0%, transparent 62%),
      radial-gradient(ellipse at 20% 90%, rgba(245,197,24,0.05) 0%, transparent 58%);
    pointer-events:none;
    z-index:-1;
    filter: blur(2px);
  }

  .vf-panel{
    position:relative;
    overflow:hidden;
    padding: 40px 40px 32px;
    background: linear-gradient(160deg, var(--glass-1) 0%, var(--glass-2) 100%);
    border: 1px solid rgba(0,242,255,0.14);
    backdrop-filter: blur(36px);
    box-shadow:
      0 22px 70px rgba(0,0,0,0.55),
      0 0 0 1px rgba(255,255,255,0.03) inset;
  }

  /* Holo rim (conic + subtle film) */
  .vf-panel::before{
    content:"";
    position:absolute;
    inset:-1px;
    border-radius: 0px;
    padding: 1px;
    background:
      conic-gradient(
        from 140deg,
        rgba(0,242,255,0.00),
        rgba(0,242,255,0.35),
        rgba(245,197,24,0.25),
        rgba(0,242,255,0.12),
        rgba(0,242,255,0.00)
      );
    -webkit-mask:
      linear-gradient(#000 0 0) content-box,
      linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events:none;
    opacity: .55;
    filter: blur(0.2px);
  }

  .vf-panel::after{
    content:"";
    position:absolute;
    inset:-30%;
    background:
      radial-gradient(circle at 30% 30%, rgba(255,255,255,0.06) 0%, transparent 55%),
      radial-gradient(circle at 70% 60%, rgba(0,242,255,0.06) 0%, transparent 58%),
      radial-gradient(circle at 50% 90%, rgba(245,197,24,0.04) 0%, transparent 60%);
    mix-blend-mode: screen;
    pointer-events:none;
    animation: holoDrift 7.5s var(--ease) infinite;
    opacity: .65;
  }

  .vf-specLine{
    position:absolute;
    top:0; left:0; right:0;
    height:1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(0,242,255,0.30) 28%,
      rgba(255,255,255,0.16) 50%,
      rgba(0,242,255,0.30) 72%,
      transparent 100%
    );
  }

  /* Corners */
  .vf-corner{
    position:absolute;
    width:20px;
    height:20px;
    pointer-events:none;
    opacity: .85;
  }
  .vf-corner.tl{ top:0; left:0; border-top:1px solid rgba(0,242,255,0.48); border-left:1px solid rgba(0,242,255,0.48); }
  .vf-corner.tr{ top:0; right:0; border-top:1px solid rgba(0,242,255,0.48); border-right:1px solid rgba(0,242,255,0.48); }
  .vf-corner.bl{ bottom:0; left:0; border-bottom:1px solid rgba(0,242,255,0.48); border-left:1px solid rgba(0,242,255,0.48); }
  .vf-corner.br{ bottom:0; right:0; border-bottom:1px solid rgba(0,242,255,0.48); border-right:1px solid rgba(0,242,255,0.48); }

  /* Tabs */
  .vf-tab{
    font-family: var(--f-orbit);
    font-size: 10px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.22);
    border-bottom: 1px solid transparent;
    transition: color .25s, text-shadow .25s, border-color .25s, transform .25s;
  }
  .vf-tab:hover{ color: rgba(255,255,255,0.42); transform: translateY(-1px); }
  .vf-tab.is-active{
    color: var(--c-cyan);
    text-shadow: 0 0 14px rgba(0,242,255,0.60);
    border-bottom: 1px solid rgba(0,242,255,0.72);
  }

  /* Fields */
  .vf-leftbar{
    background: linear-gradient(180deg, transparent, rgba(0,242,255,0.14), transparent);
    transition: background .35s;
  }
  .vf-field.is-focus .vf-leftbar{
    background: linear-gradient(180deg, transparent, rgba(0,242,255,0.95), transparent);
    box-shadow: 0 0 18px rgba(0,242,255,0.20);
  }

  .vf-input:focus{
    outline: none;
  }
  .vf-underline{
    position:absolute;
    bottom:0;
    left:0;
    right:0;
    height:1px;
    background:
      linear-gradient(90deg, rgba(0,242,255,0.0), rgba(0,242,255,1) 18%, rgba(245,197,24,0.32) 55%, rgba(0,242,255,0.0));
    filter: drop-shadow(0 0 10px rgba(0,242,255,0.35));
    animation: expandLine 0.35s var(--ease) forwards;
  }

  /* Button (premium) */
  .vf-btn{
    width:100%;
    margin-top:34px;
    padding: 15px 0;
    background: linear-gradient(135deg, rgba(0,242,255,0.08), rgba(0,242,255,0.03));
    border: 1px solid rgba(0,242,255,0.32);
    color: var(--c-cyan);
    font-family: var(--f-orbit);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.30em;
    text-transform: uppercase;
    cursor: pointer;
    transition: transform .22s var(--ease), box-shadow .3s, border-color .3s, background .3s, color .3s;
    text-shadow: 0 0 10px rgba(0,242,255,0.45);
    display:flex;
    align-items:center;
    justify-content:center;
    gap:10px;
    position:relative;
    overflow:hidden;
  }
  .vf-btn:disabled{
    color: rgba(0,242,255,0.28);
    cursor:not-allowed;
    text-shadow:none;
  }

  .vf-btnSpec{
    position:absolute;
    inset:-2px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
    width: 45%;
    left:-50%;
    top:-10%;
    height: 120%;
    transform: skewX(-18deg);
    pointer-events:none;
    opacity:0;
  }

  .enter-btn:hover:not(:disabled){
    transform: translateY(-1px);
    background: linear-gradient(135deg, rgba(0,242,255,0.14), rgba(0,242,255,0.06)) !important;
    border-color: rgba(0,242,255,0.70) !important;
    box-shadow:
      0 0 30px rgba(0,242,255,0.14),
      0 0 80px rgba(0,242,255,0.05),
      0 18px 60px rgba(0,0,0,0.30) !important;
  }
  .enter-btn:hover:not(:disabled) .vf-btnSpec{
    animation: specSweep 1.25s var(--ease) infinite;
  }
  .enter-btn:active:not(:disabled){
    transform: translateY(0px) scale(0.995);
  }

  /* Toggle */
  .vf-toggle{
    font-family: var(--f-mono);
    font-size: 11px;
    color: rgba(255,255,255,0.18);
    letter-spacing: 0.04em;
    transition: color 0.2s;
  }
  .toggle-link:hover{ color: rgba(255,255,255,0.48) !important; }

  /* Status */
  .vf-status{
    margin-top:28px;
    padding-top:14px;
    border-top: 1px solid rgba(255,255,255,0.05);
    display:flex;
    align-items:center;
    justify-content:space-between;
  }
  .vf-statusLabel{
    font-family: var(--f-mono);
    font-size: 8px;
    color: rgba(0,242,255,0.34);
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }
  .vf-statusMeta{
    font-family: var(--f-mono);
    font-size: 8px;
    color: rgba(255,255,255,0.14);
    letter-spacing: 0.10em;
  }

  /* Tagline */
  .vf-tagline{
    margin-top:52px;
    font-family: var(--f-mono);
    font-size: 9px;
    color: rgba(255,255,255,0.075);
    letter-spacing: 0.28em;
    text-transform: uppercase;
  }

  /* Panel-only subtle grain (procedural, premium, not scanline) */
  .vf-grain{
    position:absolute;
    inset:0;
    pointer-events:none;
    opacity: 0.10;
    mix-blend-mode: overlay;
    background-image:
      radial-gradient(circle at 20% 10%, rgba(255,255,255,0.10) 0, transparent 40%),
      radial-gradient(circle at 70% 30%, rgba(0,242,255,0.08) 0, transparent 45%),
      radial-gradient(circle at 40% 85%, rgba(245,197,24,0.06) 0, transparent 50%),
      repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.06) 0 1px, transparent 1px 3px);
    filter: blur(0.2px);
  }

  .spinner{
    display:inline-block;
    width:10px; height:10px;
    border: 1px solid rgba(0,242,255,0.20);
    border-top-color: rgba(0,242,255,0.85);
    border-radius:50%;
    animation: spin .8s linear infinite;
  }

  input::placeholder { color: rgba(255,255,255,0.10); }
  input:disabled { opacity: 0.35; cursor: not-allowed; }
`;
