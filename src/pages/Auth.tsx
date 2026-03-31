import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

/* ═══════════════════════════════════════════════════════════
   VOWPACT — Auth v7 (Deep Cyber Terminal)
   - Hexadecimal Data Rain
   - Clip-path Sci-Fi Borders
   - Glitch UI & Command Prompt Inputs
═══════════════════════════════════════════════════════════ */

/* ── Hexadecimal Background Stream (CSS-only) ── */
function HexDataStream() {
  return (
    <div className="hex-stream hex-stream-css" aria-hidden="true">
      {Array.from({ length: 20 }, (_, i) => (
        <div key={i} className="hex-line-css" style={{ animationDelay: `${i * 0.15}s`, opacity: 1 - i * 0.04 }} />
      ))}
    </div>
  );
}

/* ── Cyber Terminal Input ── */
interface CyberTerminalFieldProps {
  id: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label: string;
}

function CyberTerminalField({ id, type, placeholder, value, onChange, disabled, label }: CyberTerminalFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className={`cyber-field-container ${focused ? "focused" : ""}`}>
      <div className="cyber-field-label">
        <span className="blink-arrow" aria-hidden="true">{">"}</span> {label}
      </div>
      <div className="cyber-input-wrapper">
        <input
          id={id}
          type={type}
          placeholder={focused ? "" : placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          className="cyber-input"
        />
        {focused && <span className="cursor-block"></span>}
      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function Auth() {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const authSchema = z.object({
    email: z.string().email(t("auth.invalidEmail") || "ERR: INVALID_FORMAT"),
    password: z.string().min(6, t("auth.passwordMin") || "ERR: INSUFFICIENT_LENGTH"),
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast({ title: "SYSTEM ERROR", description: validation.error.errors[0].message, variant: "destructive" });
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
        toast({ title: "SUCCESS", description: "IDENTITY ESTABLISHED." });
        setIsLogin(true);
      }
    } catch (err: any) {
      toast({ title: "ACCESS DENIED", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cyber-auth-layout">
      <style>{STYLES}</style>

      {/* Background Overlays */}
      <HexDataStream />
      <div className="scanlines"></div>
      <div className="vignette"></div>

      {/* Crosshairs & HUD elements */}
      <div className="hud-corner top-left"></div>
      <div className="hud-corner top-right"></div>
      <div className="hud-corner bottom-left"></div>
      <div className="hud-corner bottom-right"></div>

      <div className="hud-rec">
        <span className="rec-dot"></span> REC
      </div>

      <div className="cyber-content-wrapper">
        {/* LEFT: Branding & Lore */}
        <motion.div
          className="cyber-branding"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="tech-badge">SEC. LEVEL 04 // OVERRIDE</div>
          <h1 className="glitch-title" data-text="VOWPACT">
            VOWPACT
          </h1>
          <div className="barcode">||| | || ||| | ||| | || | |||</div>
          <p className="lore-text">
            WARNING: UNAUTHORIZED ACCESS IS STRICTLY PROHIBITED.
            <br />
            ALL PROTOCOLS ARE MONITORED. MAKE YOUR PACT.
          </p>
        </motion.div>

        {/* RIGHT: Form Terminal */}
        <motion.div
          className="cyber-terminal"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="terminal-header">
            <div className="header-stripes">///</div>
            <span>TERMINAL_OS v4.2</span>
            <div className="status-indicator">ONLINE</div>
          </div>

          <div className="terminal-body">
            <div className="auth-tabs">
              <button type="button" onClick={() => setIsLogin(true)} className={isLogin ? "active" : ""}>
                [ AUTHENTICATE ]
              </button>
              <button type="button" onClick={() => setIsLogin(false)} className={!isLogin ? "active" : ""}>
                [ REGISTER ]
              </button>
            </div>

            <form onSubmit={handleAuth} className="terminal-form">
              <CyberTerminalField
                id="email"
                type="email"
                placeholder="identity@matrix.net"
                value={email}
                onChange={setEmail}
                disabled={loading}
                label={isLogin ? "REQ. IDENTITY_ID" : "SET IDENTITY_ID"}
              />
              <CyberTerminalField
                id="password"
                type="password"
                placeholder="[ HIDDEN ]"
                value={password}
                onChange={setPassword}
                disabled={loading}
                label="REQ. ENCRYPTION_KEY"
              />

              <button type="submit" disabled={loading} className="cyber-submit-btn">
                <span className="btn-glitch-layer"></span>
                <span className="btn-text">
                  {loading ? "EXECUTING..." : isLogin ? "INITIATE_HANDSHAKE" : "FORGE_PACT"}
                </span>
                <div className="btn-corners"></div>
              </button>
            </form>

            <div className="sys-log">
              {">"} SYSTEM READY...
              <br />
              {">"} AWAITING USER INPUT...
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=JetBrains+Mono:wght@400;700;800&display=swap');

  :root {
    --bg-dark: #020202;
    --c-cyan: #00F2FF;
    --c-cyan-dim: rgba(0, 242, 255, 0.2);
    --c-red: #FF003C;
    --f-orbit: 'Orbitron', sans-serif;
    --f-mono: 'JetBrains Mono', monospace;
  }

  body { margin: 0; background-color: var(--bg-dark); color: var(--c-cyan); font-family: var(--f-mono); overflow: hidden; }

  /* ── Layout ── */
  .cyber-auth-layout {
    position: relative;
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cyber-content-wrapper {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 1200px;
    display: flex;
    gap: 60px;
    padding: 40px;
    align-items: center;
  }

  @media (max-width: 968px) {
    .cyber-content-wrapper { flex-direction: column; gap: 40px; }
    .cyber-branding { text-align: center; }
  }

  /* ── Background Effects ── */
  .hex-stream {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    font-size: 10px;
    line-height: 1.5;
    color: rgba(0, 242, 255, 0.15);
    padding: 20px;
    z-index: 1;
    overflow: hidden;
    user-select: none;
    mask-image: radial-gradient(circle at center, black 0%, transparent 80%);
    -webkit-mask-image: radial-gradient(circle at center, black 0%, transparent 80%);
  }

  /* CSS-only hex data rain */
  .hex-stream-css {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  @keyframes hexScroll {
    0% { content: "0A 3F 7B E2 9C D1 04 5A 8E F6 2B 71 C3 A9 6D 1F 4E B0 82 5C 3A D7 9F 0E 63 A1 B5 28 7C E4"; }
    25% { content: "B7 2E 94 0F C8 53 6A D5 1B 8C A3 7F 42 E9 06 3D 5B 91 C0 74 28 AF 6E D3 15 87 4C F2 A6 39"; }
    50% { content: "48 CF 71 A5 3B 8D E0 26 5F 93 0C 67 BA D4 18 7E 42 A8 F1 5D 30 C6 89 E3 07 6B 24 9A D8 4F"; }
    75% { content: "E1 56 2A 8F C4 03 7D B6 49 D2 15 A7 63 F0 38 9E 5C 81 0B C7 4A 2F 96 D9 6E B3 17 A4 58 E8"; }
    100% { content: "0A 3F 7B E2 9C D1 04 5A 8E F6 2B 71 C3 A9 6D 1F 4E B0 82 5C 3A D7 9F 0E 63 A1 B5 28 7C E4"; }
  }

  @keyframes hexFade {
    0%, 100% { opacity: 0.12; }
    50% { opacity: 0.25; }
  }

  .hex-line-css {
    font-family: var(--f-mono, monospace);
    white-space: nowrap;
    overflow: hidden;
    height: 1.5em;
    animation: hexFade 3s ease-in-out infinite;
  }

  .hex-line-css::before {
    content: "0A 3F 7B E2 9C D1 04 5A 8E F6 2B 71 C3 A9 6D 1F 4E B0 82 5C 3A D7 9F 0E 63 A1 B5 28 7C E4";
    animation: hexScroll 8s linear infinite;
  }

  .hex-line-css:nth-child(odd)::before {
    content: "B7 2E 94 0F C8 53 6A D5 1B 8C A3 7F 42 E9 06 3D 5B 91 C0 74 28 AF 6E D3 15 87 4C F2 A6 39";
    animation-duration: 12s;
    animation-direction: reverse;
  }

  .scanlines {
    position: absolute; inset: 0; z-index: 2; pointer-events: none;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.2) 2px, rgba(0, 0, 0, 0.2) 4px);
  }
  .vignette {
    position: absolute; inset: 0; z-index: 3; pointer-events: none;
    background: radial-gradient(circle, transparent 50%, rgba(0,0,0,0.8) 100%);
  }

  /* ── HUD Elements ── */
  .hud-corner { position: absolute; width: 40px; height: 40px; border: 2px solid var(--c-cyan); z-index: 5; opacity: 0.5; }
  .hud-corner.top-left { top: 20px; left: 20px; border-right: none; border-bottom: none; }
  .hud-corner.top-right { top: 20px; right: 20px; border-left: none; border-bottom: none; }
  .hud-corner.bottom-left { bottom: 20px; left: 20px; border-right: none; border-top: none; }
  .hud-corner.bottom-right { bottom: 20px; right: 20px; border-left: none; border-top: none; }

  .hud-rec {
    position: absolute; top: 30px; left: 80px; font-family: var(--f-orbit); font-size: 12px; color: var(--c-red);
    display: flex; align-items: center; gap: 8px; z-index: 5; font-weight: bold; letter-spacing: 2px;
  }
  .rec-dot { width: 10px; height: 10px; background: var(--c-red); border-radius: 50%; animation: blink 1s infinite; }
  @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

  /* ── LEFT: Branding ── */
  .cyber-branding { flex: 1; }
  .tech-badge {
    display: inline-block; padding: 4px 10px; border: 1px solid var(--c-cyan); background: var(--c-cyan-dim);
    font-size: 10px; letter-spacing: 0.2em; margin-bottom: 20px;
  }
  
  .glitch-title {
    font-family: var(--f-orbit); font-weight: 900; font-size: clamp(3rem, 7vw, 5rem);
    color: #fff; margin: 0; letter-spacing: 0.1em; position: relative;
    text-shadow: 0 0 20px var(--c-cyan);
  }
  .glitch-title::before, .glitch-title::after {
    content: attr(data-text); position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background: var(--bg-dark);
  }
  .glitch-title::before {
    left: 2px; text-shadow: -2px 0 var(--c-red); clip-path: inset(20% 0 80% 0);
    animation: glitch-anim 2s infinite linear alternate-reverse;
  }
  .glitch-title::after {
    left: -2px; text-shadow: -2px 0 var(--c-cyan); clip-path: inset(80% 0 10% 0);
    animation: glitch-anim 3s infinite linear alternate-reverse;
  }
  @keyframes glitch-anim {
    0% { clip-path: inset(20% 0 80% 0); }
    20% { clip-path: inset(60% 0 10% 0); }
    40% { clip-path: inset(40% 0 50% 0); }
    60% { clip-path: inset(80% 0 5% 0); }
    80% { clip-path: inset(10% 0 70% 0); }
    100% { clip-path: inset(30% 0 50% 0); }
  }

  .barcode { font-family: 'Times New Roman', serif; font-size: 24px; color: var(--c-cyan); opacity: 0.5; margin: 15px 0; letter-spacing: 2px; transform: scaleY(1.5); }
  .lore-text { font-size: 11px; color: rgba(0, 242, 255, 0.6); max-width: 400px; line-height: 1.6; }

  /* ── RIGHT: Terminal Form ── */
  .cyber-terminal {
    flex: 1; max-width: 480px; width: 100%;
    background: rgba(0, 15, 20, 0.85); border: 1px solid var(--c-cyan);
    /* SCIFI CLIP PATH CORNERS */
    clip-path: polygon(0 0, 100% 0, 100% calc(100% - 30px), calc(100% - 30px) 100%, 0 100%);
    box-shadow: 0 0 30px rgba(0, 242, 255, 0.1);
    backdrop-filter: blur(10px);
  }

  .terminal-header {
    background: var(--c-cyan); color: #000; padding: 8px 15px; font-weight: 800;
    display: flex; justify-content: space-between; align-items: center; font-size: 12px;
  }
  .header-stripes { letter-spacing: -2px; opacity: 0.5; }
  .status-indicator { background: #000; color: var(--c-cyan); padding: 2px 8px; font-size: 10px; }

  .terminal-body { padding: 30px; }

  .auth-tabs { display: flex; gap: 15px; margin-bottom: 30px; border-bottom: 1px solid var(--c-cyan-dim); padding-bottom: 10px; }
  .auth-tabs button { background: none; border: none; color: rgba(0,242,255,0.4); font-family: var(--f-mono); cursor: pointer; font-size: 12px; transition: 0.3s; }
  .auth-tabs button:hover { color: var(--c-cyan); text-shadow: 0 0 10px var(--c-cyan); }
  .auth-tabs button.active { color: #fff; font-weight: bold; text-shadow: 0 0 10px var(--c-cyan); }

  /* Inputs */
  .cyber-field-container { margin-bottom: 25px; }
  .cyber-field-label { font-size: 10px; color: rgba(0, 242, 255, 0.6); margin-bottom: 8px; transition: 0.3s; }
  .blink-arrow { animation: blink 1s infinite; }
  
  .cyber-input-wrapper { display: flex; align-items: center; background: rgba(0, 242, 255, 0.05); border-left: 3px solid var(--c-cyan-dim); padding: 12px; transition: 0.3s; }
  .cyber-field-container.focused .cyber-input-wrapper { border-left-color: var(--c-cyan); background: rgba(0, 242, 255, 0.1); box-shadow: inset 20px 0 30px -20px var(--c-cyan); }
  .cyber-field-container.focused .cyber-field-label { color: var(--c-cyan); text-shadow: 0 0 8px var(--c-cyan); }
  
  .cyber-input { flex: 1; background: transparent; border: none; outline: none; color: #fff; font-family: var(--f-mono); font-size: 14px; letter-spacing: 2px; }
  .cyber-input::placeholder { color: rgba(0, 242, 255, 0.2); }
  .cursor-block { width: 10px; height: 18px; background: var(--c-cyan); animation: blink 1s infinite; margin-left: 5px; }

  /* Submit Button */
  .cyber-submit-btn {
    width: 100%; position: relative; background: transparent; border: 1px solid var(--c-cyan); color: var(--c-cyan);
    padding: 18px; font-family: var(--f-orbit); font-weight: 800; font-size: 14px; letter-spacing: 3px;
    cursor: pointer; text-transform: uppercase; overflow: hidden; margin-top: 10px;
    clip-path: polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px);
    transition: 0.3s;
  }
  .btn-text { position: relative; z-index: 2; }
  .cyber-submit-btn:hover { background: var(--c-cyan); color: #000; box-shadow: 0 0 20px var(--c-cyan); }
  
  /* Glitch hover effect */
  .btn-glitch-layer {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: var(--c-red);
    transform: translateX(-100%); z-index: 1; mix-blend-mode: overlay;
  }
  .cyber-submit-btn:hover .btn-glitch-layer { animation: btn-glitch 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) both infinite; }
  @keyframes btn-glitch { 0% { transform: translate(0) } 20% { transform: translate(-5px, 5px) } 40% { transform: translate(-5px, -5px) } 60% { transform: translate(5px, 5px) } 80% { transform: translate(5px, -5px) } 100% { transform: translate(0) } }

  .sys-log { margin-top: 30px; font-size: 9px; color: rgba(0, 242, 255, 0.4); line-height: 1.5; border-top: 1px dashed rgba(0,242,255,0.2); padding-top: 15px; }
`;
