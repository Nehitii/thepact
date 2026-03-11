import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

/* ═══════════════════════════════════════════════════════════
   VOWPACT — Auth v6 (The "Monolith" Overhaul)
   - Asymmetrical Split-Screen Layout
   - Abstract Fluid Orbs (CSS-only, high performance)
   - Brutalist / High-End Minimalist Form
═══════════════════════════════════════════════════════════ */

/* ── Minimalist Input Field ── */
function MonolithField({ id, type, placeholder, value, onChange, disabled, label }: any) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="monolith-field" style={{ position: "relative", marginBottom: "40px" }}>
      <label
        htmlFor={id}
        style={{
          display: "block",
          fontFamily: "var(--f-orbit)",
          fontSize: "10px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: focused ? "var(--c-cyan)" : "rgba(255,255,255,0.4)",
          marginBottom: "10px",
          transition: "color 0.4s ease",
        }}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        className="monolith-input"
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          padding: "10px 0 15px 0",
          color: "#fff",
          fontFamily: "var(--f-mono)",
          fontSize: "18px",
          outline: "none",
          transition: "all 0.4s ease",
        }}
      />
      {/* Animated Bottom Line */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: focused ? 1 : 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: "var(--c-cyan)",
          transformOrigin: "left",
          boxShadow: "0 0 15px var(--c-cyan)",
        }}
      />
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
    email: z.string().email(t("auth.invalidEmail") || "Invalid email format"),
    password: z.string().min(6, t("auth.passwordMin") || "Minimum 6 characters required"),
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
    <div className="auth-monolith-layout">
      <style>{STYLES}</style>

      {/* --- LEFT SIDE : VISUAL ART --- */}
      <div className="auth-visual-side">
        {/* Abstract Fluid Gradient Background */}
        <div className="fluid-container">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
        </div>

        {/* Global Grid Overlay */}
        <div className="cyber-grid-overlay"></div>

        {/* Branding */}
        <div className="brand-container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="brand-title">VOWPACT</h1>
            <p className="brand-subtitle">THE ULTIMATE COMMITMENT FRAMEWORK.</p>
          </motion.div>
        </div>
      </div>

      {/* --- RIGHT SIDE : FORM --- */}
      <div className="auth-form-side">
        <motion.div
          className="form-wrapper"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Top Status */}
          <div className="system-status">
            <span className="status-dot pulse"></span>
            SYSTEM ONLINE — AWAITING CREDENTIALS
          </div>

          {/* Dynamic Header */}
          <div className="form-header">
            <AnimatePresence mode="wait">
              <motion.h2
                key={isLogin ? "login" : "register"}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
                className="form-title"
              >
                {isLogin ? "Authenticate." : "Initialize."}
              </motion.h2>
            </AnimatePresence>
            <p className="form-desc">
              {isLogin ? "Enter your coordinates to access the nexus." : "Create your identity within the system."}
            </p>
          </div>

          <form onSubmit={handleAuth} className="monolith-form">
            <MonolithField
              id="email"
              type="email"
              placeholder="agent@vowpact.io"
              value={email}
              onChange={setEmail}
              disabled={loading}
              label={t("common.email") || "Email Identity"}
            />
            <MonolithField
              id="password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={setPassword}
              disabled={loading}
              label={t("common.password") || "Access Code"}
            />

            <button type="submit" disabled={loading} className="monolith-submit-btn">
              <span className="btn-text">{loading ? "PROCESSING..." : isLogin ? "ENTER NEXUS" : "ESTABLISH PACT"}</span>
              <div className="btn-hover-effect"></div>
            </button>
          </form>

          {/* Toggle Action */}
          <div className="toggle-container">
            <span className="toggle-text">{isLogin ? "New to the system?" : "Already established?"}</span>
            <button type="button" onClick={() => setIsLogin(!isLogin)} disabled={loading} className="toggle-btn">
              {isLogin ? "Request Access" : "Return to Login"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;900&family=Inter:wght@300;400;600&family=JetBrains+Mono:wght@400;700&display=swap');

  :root {
    --c-bg-dark: #030407;
    --c-bg-panel: #0a0b10;
    --c-cyan: #00F2FF;
    --c-purple: #7000FF;
    --f-orbit: 'Orbitron', sans-serif;
    --f-inter: 'Inter', sans-serif;
    --f-mono: 'JetBrains Mono', monospace;
  }

  body { margin: 0; background-color: var(--c-bg-dark); overflow-x: hidden; }

  /* ── Layout ── */
  .auth-monolith-layout {
    display: flex;
    min-height: 100vh;
    width: 100vw;
  }

  .auth-visual-side {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--c-bg-dark);
    overflow: hidden;
  }

  .auth-form-side {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    background-color: var(--c-bg-panel);
    border-left: 1px solid rgba(255,255,255,0.05);
    padding: 40px;
    z-index: 10;
  }

  /* Responsive: Cache la partie visuelle sur mobile */
  @media (max-width: 968px) {
    .auth-monolith-layout { flex-direction: column; }
    .auth-visual-side { display: none; }
    .auth-form-side { border-left: none; padding: 20px; }
  }

  /* ── Art Abstrait (Orbes fluides) ── */
  .fluid-container {
    position: absolute;
    inset: 0;
    filter: blur(80px); /* Magie du flou qui mélange les couleurs */
    opacity: 0.6;
    z-index: 1;
  }

  .orb {
    position: absolute;
    border-radius: 50%;
    animation: drift linear infinite;
  }

  .orb-1 {
    width: 600px; height: 600px;
    background: var(--c-cyan);
    top: -10%; left: -10%;
    animation-duration: 25s;
  }
  .orb-2 {
    width: 500px; height: 500px;
    background: var(--c-purple);
    bottom: -10%; right: -20%;
    animation-duration: 30s;
    animation-direction: reverse;
  }
  .orb-3 {
    width: 400px; height: 400px;
    background: #0055FF;
    top: 40%; left: 30%;
    animation-duration: 20s;
  }

  @keyframes drift {
    0% { transform: rotate(0deg) translate(50px) rotate(0deg); }
    100% { transform: rotate(360deg) translate(50px) rotate(-360deg); }
  }

  /* ── Grille Cyberpunk Globale ── */
  .cyber-grid-overlay {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px);
    background-size: 50px 50px;
    z-index: 2;
    mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
    -webkit-mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
  }

  /* ── Branding ── */
  .brand-container {
    position: relative;
    z-index: 10;
    text-align: center;
  }
  .brand-title {
    font-family: var(--f-orbit);
    font-weight: 900;
    font-size: clamp(3rem, 8vw, 6rem);
    color: #fff;
    margin: 0;
    letter-spacing: 0.2em;
    text-shadow: 0 10px 40px rgba(0,242,255,0.4);
  }
  .brand-subtitle {
    font-family: var(--f-mono);
    color: var(--c-cyan);
    font-size: 12px;
    letter-spacing: 0.5em;
    margin-top: 20px;
  }

  /* ── Formulaire ── */
  .form-wrapper {
    width: 100%;
    max-width: 440px;
    margin: 0 auto;
  }

  .system-status {
    font-family: var(--f-mono);
    font-size: 10px;
    color: rgba(255,255,255,0.3);
    letter-spacing: 0.1em;
    margin-bottom: 60px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .status-dot {
    width: 6px; height: 6px;
    background-color: var(--c-cyan);
    border-radius: 50%;
  }
  .pulse { animation: statusPulse 2s infinite; }
  @keyframes statusPulse {
    0%, 100% { opacity: 1; box-shadow: 0 0 10px var(--c-cyan); }
    50% { opacity: 0.3; box-shadow: none; }
  }

  .form-header { margin-bottom: 50px; }
  .form-title {
    font-family: var(--f-inter);
    font-weight: 300;
    font-size: 42px;
    color: #fff;
    margin: 0 0 10px 0;
    letter-spacing: -0.02em;
  }
  .form-desc {
    font-family: var(--f-inter);
    color: rgba(255,255,255,0.5);
    font-size: 15px;
    margin: 0;
  }

  .monolith-input::placeholder { color: rgba(255,255,255,0.1); }
  .monolith-input:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── Bouton d'action massif ── */
  .monolith-submit-btn {
    width: 100%;
    position: relative;
    background: #fff;
    color: #000;
    border: none;
    padding: 20px;
    font-family: var(--f-orbit);
    font-weight: 900;
    font-size: 14px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    cursor: pointer;
    overflow: hidden;
    margin-top: 20px;
    transition: transform 0.2s;
  }
  .monolith-submit-btn:disabled { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.3); cursor: not-allowed; }
  .monolith-submit-btn:active:not(:disabled) { transform: scale(0.98); }
  
  .btn-text { position: relative; z-index: 2; transition: color 0.3s; }
  .monolith-submit-btn:hover:not(:disabled) .btn-text { color: #000; }

  .btn-hover-effect {
    position: absolute;
    inset: 0;
    background: var(--c-cyan);
    transform: translateY(100%);
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 1;
  }
  .monolith-submit-btn:hover:not(:disabled) .btn-hover-effect {
    transform: translateY(0);
  }

  /* ── Toggle bas de page ── */
  .toggle-container {
    margin-top: 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid rgba(255,255,255,0.05);
    padding-top: 30px;
  }
  .toggle-text {
    font-family: var(--f-inter);
    font-size: 13px;
    color: rgba(255,255,255,0.4);
  }
  .toggle-btn {
    background: none;
    border: none;
    color: var(--c-cyan);
    font-family: var(--f-mono);
    font-size: 12px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    cursor: pointer;
    padding: 0;
    transition: text-shadow 0.3s;
  }
  .toggle-btn:hover { text-shadow: 0 0 10px rgba(0,242,255,0.5); }
`;
