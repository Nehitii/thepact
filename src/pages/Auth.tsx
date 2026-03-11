import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

/* ═══════════════════════════════════════════════════════════
   VOWPACT — Auth v5 (Hyper Premium Interactive)
   - Séquence de boot via Framer Motion
   - Panneau avec effet de tilt 3D (Mouse Tracking)
   - Micro-parallax deep space
═══════════════════════════════════════════════════════════ */

function DeepSpaceCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let t = 0;
    let px = 0;
    let py = 0;
    let tx = 0;
    let ty = 0;

    const onPointerMove = (e: PointerEvent) => {
      tx = (e.clientX / innerWidth) * 2 - 1;
      ty = (e.clientY / innerHeight) * 2 - 1;
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

    const stars = Array.from({ length: 360 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.35,
      a: 0.08 + Math.random() * 0.78,
      spd: 0.35 + Math.random() * 1.25,
      off: Math.random() * Math.PI * 2,
      layer: Math.floor(Math.random() * 3),
      tint: Math.random(),
    }));

    const nebulae = [
      { x: 0.68, y: 0.28, r: 0.52, cr: [0, 70, 140] as [number, number, number], a: 0.055 },
      { x: 0.18, y: 0.75, r: 0.4, cr: [70, 22, 0] as [number, number, number], a: 0.038 },
    ];

    const draw = () => {
      t += 1;
      px += (tx - px) * 0.03;
      py += (ty - py) * 0.03;
      const W = innerWidth;
      const H = innerHeight;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#020408";
      ctx.fillRect(0, 0, W, H);

      nebulae.forEach((n, idx) => {
        const cx = (n.x + ((px * (6 + idx * 2)) / W) * 0.02) * W;
        const cy = (n.y + ((py * (5 + idx * 2)) / H) * 0.02) * H;
        const rr = n.r * Math.min(W, H);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
        g.addColorStop(0, `rgba(${n.cr[0]},${n.cr[1]},${n.cr[2]},${n.a})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      });

      stars.forEach((s) => {
        const pulse = Math.sin(t * 0.01 * s.spd + s.off);
        const alpha = s.a * (0.62 + 0.38 * pulse);
        const scale = [0.55, 0.82, 1][s.layer];
        const x = (s.x + ((px * [2, 5, 9][s.layer]) / W) * 0.002) * W;
        const y = (s.y + ((py * [2, 5, 9][s.layer]) / H) * 0.002) * H;

        ctx.beginPath();
        ctx.arc(x, y, s.r * scale, 0, Math.PI * 2);
        const cyan = s.layer === 2 && s.r > 1;
        ctx.fillStyle = cyan ? `rgba(185,235,255,${alpha})` : `rgba(220,200,245,${alpha * 0.86})`;
        ctx.fill();
      });

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

/* ── Diode component ── */
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
        boxShadow: `0 0 ${size * 2}px ${color}, 0 0 ${size * 6}px ${color}33`,
        animation: `diodePulse ${fast ? "1.15s" : "2.35s"} cubic-bezier(.2,.9,.2,1) ${delay}s infinite`,
        flexShrink: 0,
      }}
    />
  );
}

/* ── Cyber input ── */
function CyberField({ id, type, placeholder, value, onChange, disabled, label }: any) {
  const [focused, setFocused] = useState(false);
  return (
    <div className={`vf-field ${focused ? "is-focus" : ""}`} style={{ marginBottom: 28, position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
        <Diode color={focused ? "var(--c-cyan)" : "rgba(0,242,255,0.10)"} size={4} fast={focused} />
        <label
          htmlFor={id}
          className="vf-label"
          style={{ color: focused ? "rgba(0,242,255,0.82)" : "rgba(255,255,255,0.3)" }}
        >
          {label}
        </label>
      </div>
      <div style={{ position: "relative" }}>
        <div className="vf-leftbar" style={{ position: "absolute", left: -16, top: 8, bottom: 8, width: 2 }} />
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
        />
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

  // 3D Tilt Effect State
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 15; // Max 15 deg tilt
    const y = (clientY / innerHeight - 0.5) * -15;
    setMousePosition({ x, y });
  };

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
        if (error) throw error;
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast({ title: t("common.success"), description: t("auth.accountCreated") });
        setIsLogin(true);
      }
    } catch (err: any) {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onMouseMove={handleMouseMove} style={{ perspective: "1000px" }}>
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
          overflow: "hidden",
        }}
      >
        {/* Séquence d'entrée Framer Motion pour le Titre */}
        <motion.div
          initial={{ opacity: 0, y: -20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ textAlign: "center", marginBottom: 60 }}
        >
          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 20 }}>
            <Diode color="var(--c-gold)" size={3} delay={0} />
            <Diode color="var(--c-cyan)" size={3} delay={0.4} />
            <Diode color="var(--c-gold)" size={3} delay={0.8} />
          </div>
          <h1 className="vf-title">VOWPACT</h1>
          <div className="vf-titleline" />
        </motion.div>

        {/* Panneau avec Tilt 3D */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1, rotateY: mousePosition.x, rotateX: mousePosition.y }}
          transition={{
            opacity: { duration: 0.8, delay: 0.3 },
            scale: { duration: 0.8, delay: 0.3 },
            rotateX: { type: "spring", stiffness: 75, damping: 15 },
            rotateY: { type: "spring", stiffness: 75, damping: 15 },
          }}
          style={{ width: "100%", maxWidth: 410, position: "relative", transformStyle: "preserve-3d" }}
        >
          <div className="vf-panelHalo" style={{ transform: "translateZ(-20px)" }} />

          <div className="vf-panel">
            <div className="vf-specLine" />

            <div style={{ position: "absolute", top: 12, left: 12 }}>
              <Diode color="var(--c-cyan)" size={3.5} />
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

            <div className="vf-corner tl" />
            <div className="vf-corner tr" />
            <div className="vf-corner bl" />
            <div className="vf-corner br" />

            <div style={{ display: "flex", gap: 28, marginBottom: 38, paddingLeft: 2, transform: "translateZ(10px)" }}>
              {(["Sign in", "Register"] as const).map((label, i) => {
                const active = (i === 0) === isLogin;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setIsLogin(i === 0)}
                    className={`vf-tab ${active ? "is-active" : ""}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div style={{ paddingLeft: 20, transform: "translateZ(20px)" }}>
              <form onSubmit={handleAuth}>
                <CyberField
                  id="email"
                  type="email"
                  placeholder="sys.admin@vowpact.com"
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
                      <span className="spinner" /> AUTHENTICATING...
                    </>
                  ) : isLogin ? (
                    "INITIALIZE CONNECTION"
                  ) : (
                    "ESTABLISH IDENTITY"
                  )}
                </button>
              </form>
            </div>

            <div style={{ marginTop: 22, textAlign: "center", transform: "translateZ(10px)" }}>
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                disabled={loading}
                className="toggle-link vf-toggle"
              >
                {isLogin ? "> Request Access Clearance" : "> Return to Login Vector"}
              </button>
            </div>

            <div className="vf-status" style={{ transform: "translateZ(5px)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Diode color="var(--c-cyan)" size={3} fast />
                <span className="vf-statusLabel">Link Secure</span>
              </div>
              <span className="vf-statusMeta">V-4.0.0</span>
            </div>

            <div className="vf-grain" aria-hidden />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="vf-tagline"
        >
          System Ready.
        </motion.div>
      </div>
    </div>
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
    --f-orbit: 'Orbitron', monospace;
    --f-mono: 'JetBrains Mono', monospace;
    --ease: cubic-bezier(0.16,1,0.3,1);
  }

  body { margin:0; background: var(--c-bg); overflow: hidden; }

  @keyframes diodePulse {
    0%, 100% { opacity: 1; filter: saturate(1.15); }
    50% { opacity: 0.18; filter: saturate(0.9); }
  }

  @keyframes expandLine {
    from { transform: scaleX(0); opacity: 0; }
    to   { transform: scaleX(1); opacity: 1; }
  }

  @keyframes spin { to { transform: rotate(360deg); } }
  
  @keyframes specSweep {
    0% { transform: translateX(-150%) skewX(-25deg); opacity: 0; }
    15% { opacity: 0.8; }
    50% { transform: translateX(150%) skewX(-25deg); opacity: 0; }
    100% { transform: translateX(150%) skewX(-25deg); opacity: 0; }
  }

  /* Title */
  .vf-title{
    font-family: var(--f-orbit); font-weight: 900; font-size: clamp(36px, 7vw, 64px);
    letter-spacing: 0.6em; color: #fff; text-transform: uppercase; line-height: 1; margin: 0;
    text-shadow: 0 0 30px rgba(0,242,255,0.4), 0 0 80px rgba(0,242,255,0.2);
  }
  .vf-titleline{
    margin: 18px auto 0; width: 260px; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0,242,255,0.8), rgba(245,197,24,0.6), transparent);
    box-shadow: 0 0 20px rgba(0,242,255,0.3);
  }

  /* Panel */
  .vf-panelHalo{
    position:absolute; inset:-4px;
    background: radial-gradient(ellipse at 50% -20%, rgba(0,242,255,0.2) 0%, transparent 60%),
                radial-gradient(ellipse at 50% 120%, rgba(245,197,24,0.1) 0%, transparent 60%);
    pointer-events:none; z-index:-1; filter: blur(8px);
  }
  .vf-panel{
    position:relative; overflow:hidden; padding: 40px 40px 32px;
    background: linear-gradient(160deg, var(--glass-1) 0%, var(--glass-2) 100%);
    border: 1px solid rgba(0,242,255,0.2);
    backdrop-filter: blur(36px);
    box-shadow: 0 30px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05) inset;
    border-radius: 4px;
  }
  .vf-specLine{
    position:absolute; top:0; left:0; right:0; height:1px;
    background: linear-gradient(90deg, transparent, rgba(0,242,255,0.5) 20%, rgba(255,255,255,0.8) 50%, rgba(0,242,255,0.5) 80%, transparent);
  }

  /* Corners */
  .vf-corner{ position:absolute; width:16px; height:16px; pointer-events:none; }
  .vf-corner.tl{ top:0; left:0; border-top:2px solid rgba(0,242,255,0.6); border-left:2px solid rgba(0,242,255,0.6); }
  .vf-corner.tr{ top:0; right:0; border-top:2px solid rgba(0,242,255,0.6); border-right:2px solid rgba(0,242,255,0.6); }
  .vf-corner.bl{ bottom:0; left:0; border-bottom:2px solid rgba(0,242,255,0.6); border-left:2px solid rgba(0,242,255,0.6); }
  .vf-corner.br{ bottom:0; right:0; border-bottom:2px solid rgba(0,242,255,0.6); border-right:2px solid rgba(0,242,255,0.6); }

  /* Tabs */
  .vf-tab{
    font-family: var(--f-orbit); font-size: 11px; letter-spacing: 0.25em; text-transform: uppercase;
    color: rgba(255,255,255,0.3); border:none; background:none; cursor:pointer; padding-bottom: 6px;
    border-bottom: 2px solid transparent; transition: all 0.3s;
  }
  .vf-tab:hover{ color: rgba(255,255,255,0.7); }
  .vf-tab.is-active{
    color: var(--c-cyan); text-shadow: 0 0 15px rgba(0,242,255,0.8);
    border-bottom: 2px solid var(--c-cyan);
  }

  /* Inputs */
  .vf-label { font-family: var(--f-orbit); font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase; transition: color 0.3s; }
  .vf-leftbar{ background: rgba(255,255,255,0.05); transition: all 0.3s; }
  .vf-field.is-focus .vf-leftbar{ background: var(--c-cyan); box-shadow: 0 0 15px var(--c-cyan); }
  
  .vf-input{
    width: 100%; background: rgba(0,0,0,0.2); border: none; outline: none; padding: 12px 12px;
    font-family: var(--f-mono); font-size: 14px; color: #fff; letter-spacing: 0.08em;
    border-bottom: 1px solid rgba(255,255,255,0.1); transition: all 0.3s;
  }
  .vf-input:focus { background: rgba(0,242,255,0.03); border-bottom-color: transparent; }
  .vf-input::placeholder { color: rgba(255,255,255,0.15); }
  
  .vf-underline{
    position:absolute; bottom:0; left:0; right:0; height:2px; transform-origin: left;
    background: linear-gradient(90deg, var(--c-cyan), rgba(245,197,24,0.5), transparent);
    animation: expandLine 0.4s var(--ease) forwards; box-shadow: 0 0 10px var(--c-cyan);
  }

  /* Button */
  .vf-btn{
    width:100%; margin-top:35px; padding: 16px 0; background: rgba(0,242,255,0.05);
    border: 1px solid rgba(0,242,255,0.4); color: var(--c-cyan); font-family: var(--f-orbit);
    font-size: 11px; font-weight: 700; letter-spacing: 0.35em; text-transform: uppercase;
    cursor: pointer; transition: all 0.3s var(--ease); display:flex; align-items:center; justify-content:center;
    position:relative; overflow:hidden;
  }
  .vf-btn:disabled{ color: rgba(0,242,255,0.3); border-color: rgba(0,242,255,0.1); cursor:not-allowed; }
  
  .vf-btnSpec{
    position:absolute; inset:-2px; width: 50px; height: 200%; left:-100px; top:-50%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
    transform: skewX(-25deg); pointer-events:none; opacity:0;
  }

  .enter-btn:hover:not(:disabled){
    background: rgba(0,242,255,0.15); border-color: #fff; color: #fff;
    box-shadow: 0 0 25px rgba(0,242,255,0.3), 0 0 50px rgba(0,242,255,0.1) inset;
    transform: translateY(-2px);
  }
  .enter-btn:hover:not(:disabled) .vf-btnSpec{ animation: specSweep 2s infinite; }
  .enter-btn:active:not(:disabled){ transform: scale(0.98); }

  /* Utilities */
  .vf-toggle{ background:none; border:none; cursor:pointer; font-family: var(--f-mono); font-size: 11px; color: rgba(255,255,255,0.3); transition: color 0.2s; }
  .vf-toggle:hover{ color: var(--c-cyan); text-shadow: 0 0 8px rgba(0,242,255,0.5); }
  
  .vf-status{ margin-top:30px; padding-top:15px; border-top: 1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; }
  .vf-statusLabel{ font-family: var(--f-mono); font-size: 9px; color: rgba(0,242,255,0.5); text-transform: uppercase; letter-spacing: 0.2em;}
  .vf-statusMeta{ font-family: var(--f-mono); font-size: 9px; color: rgba(255,255,255,0.2); }
  
  .vf-tagline{ position:absolute; bottom: 40px; font-family: var(--f-mono); font-size: 10px; color: rgba(255,255,255,0.15); letter-spacing: 0.4em; text-transform: uppercase; }
  
  .spinner{ width:12px; height:12px; border: 2px solid rgba(0,242,255,0.2); border-top-color: var(--c-cyan); border-radius:50%; animation: spin 0.8s linear infinite; margin-right: 10px; }
  
  .vf-grain{ position:absolute; inset:0; pointer-events:none; opacity: 0.05; background-image: repeating-radial-gradient(circle at 50% 50%, #fff 0 1px, transparent 1px 3px); filter: blur(0.5px); }
`;
