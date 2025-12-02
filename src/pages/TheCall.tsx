import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Flame, Zap, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';

interface PactData {
  id: string;
  checkin_total_count: number;
  checkin_streak: number;
  last_checkin_date: string | null;
}

enum RitualState {
  IDLE = 'idle',
  TOUCH_START = 'touch_start',
  CHARGING = 'charging',
  SOUL_CONNECTED = 'soul_connected',
  EXPLOSION = 'explosion',
  LOCKED = 'locked'
}

const HOLD_DURATION = 20000;

export default function TheCall() {
  const { user } = useAuth();
  const [pactData, setPactData] = useState<PactData | null>(null);
  const [ritualState, setRitualState] = useState<RitualState>(RitualState.IDLE);
  const [progress, setProgress] = useState(0);
  const [completedToday, setCompletedToday] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSoulConnected, setShowSoulConnected] = useState(false);
  
  const holdStartRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const isHoldingRef = useRef(false);

  useEffect(() => {
    if (user) fetchPactData();
  }, [user]);

  const fetchPactData = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('pacts')
      .select('id, checkin_total_count, checkin_streak, last_checkin_date')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching pact data:', error);
      return;
    }

    if (data) {
      setPactData(data);
      const isCompleted = checkIfCompletedToday(data.last_checkin_date);
      setCompletedToday(isCompleted);
      if (isCompleted) setRitualState(RitualState.LOCKED);
    }
  };

  const checkIfCompletedToday = (lastCheckInDate: string | null): boolean => {
    if (!lastCheckInDate) return false;
    const today = new Date().toISOString().split('T')[0];
    const lastCheckIn = new Date(lastCheckInDate).toISOString().split('T')[0];
    return today === lastCheckIn;
  };

  const animateProgress = useCallback(() => {
    if (!isHoldingRef.current) return;
    const elapsed = Date.now() - holdStartRef.current;
    const newProgress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
    setProgress(newProgress);

    if (newProgress >= 100) {
      isHoldingRef.current = false;
      triggerCompletion();
    } else {
      animationFrameRef.current = requestAnimationFrame(animateProgress);
    }
  }, []);

  const startHolding = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (completedToday || isProcessing || ritualState === RitualState.LOCKED) {
      const core = document.getElementById('ritual-core');
      core?.classList.add('locked-pulse');
      setTimeout(() => core?.classList.remove('locked-pulse'), 300);
      return;
    }

    e.preventDefault();
    isHoldingRef.current = true;
    holdStartRef.current = Date.now();
    setRitualState(RitualState.TOUCH_START);
    
    setTimeout(() => {
      if (isHoldingRef.current) setRitualState(RitualState.CHARGING);
    }, 100);
    
    animationFrameRef.current = requestAnimationFrame(animateProgress);
  }, [completedToday, isProcessing, ritualState, animateProgress]);

  const stopHolding = useCallback(() => {
    if (!isHoldingRef.current) return;
    isHoldingRef.current = false;
    cancelAnimationFrame(animationFrameRef.current);

    if (progress < 100 && ritualState === RitualState.CHARGING) {
      const core = document.getElementById('ritual-core');
      core?.classList.add('energy-collapse');
      toast.error('Hold longer to answer The Call.');
      setTimeout(() => core?.classList.remove('energy-collapse'), 500);
      setProgress(0);
      setRitualState(RitualState.IDLE);
    }
  }, [progress, ritualState]);

  const triggerCompletion = async () => {
    setIsProcessing(true);
    setRitualState(RitualState.SOUL_CONNECTED);
    setShowSoulConnected(true);
    
    await new Promise(resolve => setTimeout(resolve, 2500));
    setShowSoulConnected(false);
    
    setRitualState(RitualState.EXPLOSION);
    document.body.classList.add('screen-shake');
    
    if (pactData) await saveCheckInData();
    
    await new Promise(resolve => setTimeout(resolve, 2500));
    document.body.classList.remove('screen-shake');
    
    setRitualState(RitualState.LOCKED);
    setCompletedToday(true);
    setProgress(100);
    setIsProcessing(false);
    toast.success('The Call has been answered.');
  };

  const saveCheckInData = async () => {
    if (!pactData) return;
    let newStreak = 1;
    if (pactData.last_checkin_date) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const lastCheckIn = new Date(pactData.last_checkin_date).toISOString().split('T')[0];
      if (lastCheckIn === yesterdayStr) newStreak = (pactData.checkin_streak || 0) + 1;
    }

    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase
      .from('pacts')
      .update({
        checkin_total_count: (pactData.checkin_total_count || 0) + 1,
        checkin_streak: newStreak,
        last_checkin_date: today,
      })
      .eq('id', pactData.id);

    if (error) console.error('Error updating check-in:', error);
    fetchPactData();
  };

  const triggerDevAnimation = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    setRitualState(RitualState.CHARGING);
    for (let i = 0; i <= 100; i += 2) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    
    setRitualState(RitualState.SOUL_CONNECTED);
    setShowSoulConnected(true);
    await new Promise(resolve => setTimeout(resolve, 2500));
    setShowSoulConnected(false);
    
    setRitualState(RitualState.EXPLOSION);
    document.body.classList.add('screen-shake');
    await new Promise(resolve => setTimeout(resolve, 2500));
    document.body.classList.remove('screen-shake');
    
    setRitualState(completedToday ? RitualState.LOCKED : RitualState.IDLE);
    setProgress(completedToday ? 100 : 0);
    setIsProcessing(false);
  };

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      isHoldingRef.current = false;
    };
  }, []);

  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const chargePhase = progress < 25 ? 0 : progress < 60 ? 1 : progress < 90 ? 2 : 3;
  const isCharging = ritualState === RitualState.CHARGING;
  const isLocked = ritualState === RitualState.LOCKED;
  const isExplosion = ritualState === RitualState.EXPLOSION;

  const formatLastCall = (date: string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (!pactData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary/60 font-rajdhani animate-pulse">Loading ritual...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020408] relative overflow-hidden">
      {/* Cosmic Background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Deep space gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0015] via-[#020408] to-[#000a12]" />
        
        {/* Nebula clouds */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] animate-nebula-drift" />
          <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] animate-nebula-drift-reverse" />
          <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px] animate-nebula-pulse" />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-[2px] h-[2px] bg-primary/40 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float-particle ${8 + Math.random() * 12}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>

        {/* Ambient energy waves - always active when locked */}
        {(isLocked || isExplosion) && (
          <div className="absolute inset-0">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10"
                style={{
                  width: '200%',
                  height: '200%',
                  animation: `ambient-wave ${8 + i * 2}s ease-in-out infinite`,
                  animationDelay: `${i * 2}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Heat distortion layer */}
        {(isCharging || isLocked) && (
          <div 
            className="absolute inset-0 backdrop-blur-[0.5px]"
            style={{
              opacity: isCharging ? progress / 200 : 0.1,
              animation: 'heat-shimmer 2s ease-in-out infinite',
            }}
          />
        )}
      </div>

      {/* Soul Connected Overlay */}
      {showSoulConnected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-[#020408]/95 backdrop-blur-md" />
          
          {/* Holographic ripples */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full border border-primary/30"
                style={{
                  width: `${100 + i * 80}px`,
                  height: `${100 + i * 80}px`,
                  animation: `ripple-out 2s ease-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>

          {/* Light fragments */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-primary rounded-full"
                style={{
                  left: '50%',
                  top: '50%',
                  animation: `fragment-burst 2s ease-out forwards`,
                  animationDelay: `${i * 0.05}s`,
                  transform: `rotate(${i * 18}deg)`,
                }}
              />
            ))}
          </div>

          <h1 className="relative z-10 text-5xl md:text-7xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-primary animate-soul-text">
            Soul connected
            <span className="absolute inset-0 text-primary/30 blur-xl animate-soul-glow">Soul connected</span>
          </h1>
        </div>
      )}

      {/* Explosion Effects */}
      {isExplosion && (
        <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center overflow-hidden">
          {/* Multi-layer shockwaves */}
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: '300vmax',
                height: '300vmax',
                border: `${4 - i}px solid rgba(91, 180, 255, ${0.6 - i * 0.1})`,
                boxShadow: `0 0 ${60 - i * 10}px rgba(91, 180, 255, ${0.4 - i * 0.08}), inset 0 0 ${60 - i * 10}px rgba(91, 180, 255, ${0.2 - i * 0.04})`,
                animation: `shockwave-blast 2s ease-out forwards`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}

          {/* Spark ejection */}
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: `radial-gradient(circle, white 0%, hsl(var(--primary)) 50%, transparent 100%)`,
                animation: `spark-eject 1.5s ease-out forwards`,
                animationDelay: `${i * 0.02}s`,
                transform: `rotate(${i * 9}deg)`,
              }}
            />
          ))}

          {/* Screen flash */}
          <div className="absolute inset-0 bg-primary/20 animate-flash" />
          
          {/* Ghost ring echo */}
          <div 
            className="absolute w-[400px] h-[400px] rounded-full border-2 border-primary/20"
            style={{ animation: 'ghost-echo 3s ease-out forwards' }}
          />
        </div>
      )}

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pb-28 pt-8">
        {/* Title */}
        <div className="relative mb-8">
          <h1 className="text-4xl md:text-5xl font-orbitron font-black tracking-wider">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-primary to-purple-400">
              THE CALL
            </span>
          </h1>
          <div className="absolute inset-0 text-4xl md:text-5xl font-orbitron font-black tracking-wider text-primary/20 blur-lg">
            THE CALL
          </div>
          <p className="text-center text-primary/50 font-rajdhani text-sm mt-2 tracking-widest uppercase">
            20-second soul ritual
          </p>
        </div>

        {/* Main Ritual Core Container */}
        <div className="relative mb-10">
          {/* Outer ambient glow layers */}
          <div className={`absolute inset-[-60px] rounded-full transition-all duration-1000 ${
            isCharging ? 'opacity-100' : isLocked ? 'opacity-60' : 'opacity-30'
          }`}>
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-[80px] animate-breathe-slow" />
            <div className="absolute inset-[20px] bg-cyan-500/10 rounded-full blur-[60px] animate-breathe-offset" />
            <div className="absolute inset-[40px] bg-purple-500/5 rounded-full blur-[40px] animate-breathe" />
          </div>

          {/* Expanding halo during charge */}
          {isCharging && chargePhase >= 2 && (
            <div 
              className="absolute inset-[-80px] rounded-full border border-primary/20"
              style={{
                animation: 'halo-expand 2s ease-in-out infinite',
                boxShadow: '0 0 40px rgba(91, 180, 255, 0.2)',
              }}
            />
          )}

          {/* Lightning arcs at high charge */}
          {isCharging && chargePhase >= 2 && (
            <svg className="absolute inset-[-40px] w-[calc(100%+80px)] h-[calc(100%+80px)] pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <path
                  key={i}
                  d={`M ${50 + Math.sin(i * Math.PI / 3) * 45}% ${50 + Math.cos(i * Math.PI / 3) * 45}% Q ${50 + Math.random() * 10}% ${50 + Math.random() * 10}% 50% 50%`}
                  fill="none"
                  stroke="rgba(91, 180, 255, 0.6)"
                  strokeWidth="1"
                  className="animate-lightning"
                  style={{ animationDelay: `${i * 0.3}s` }}
                />
              ))}
            </svg>
          )}

          {/* Orbiting energy wisps */}
          {(isCharging || isLocked) && (
            <div className="absolute inset-[-30px] pointer-events-none">
              {[...Array(isLocked ? 5 : Math.floor(progress / 15))].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, white 0%, hsl(var(--primary)) 60%, transparent 100%)',
                    left: '50%',
                    top: '50%',
                    animation: `orbit-wisp ${3 + i * 0.5}s linear infinite`,
                    animationDelay: `${i * 0.4}s`,
                    boxShadow: '0 0 10px rgba(91, 180, 255, 0.8)',
                  }}
                />
              ))}
            </div>
          )}

          {/* Main ritual button */}
          <button
            id="ritual-core"
            onMouseDown={startHolding}
            onMouseUp={stopHolding}
            onMouseLeave={stopHolding}
            onTouchStart={startHolding}
            onTouchEnd={stopHolding}
            disabled={isProcessing}
            className={`relative w-56 h-56 md:w-72 md:h-72 rounded-full transition-all duration-500 flex items-center justify-center
              ${isLocked
                ? 'bg-gradient-to-br from-primary/30 via-primary/20 to-cyan-500/20 border-primary/60'
                : isExplosion
                ? 'bg-gradient-to-br from-white/40 via-primary/50 to-cyan-500/40 border-white scale-110'
                : isCharging
                ? 'bg-gradient-to-br from-primary/40 via-primary/30 to-purple-500/20 border-primary scale-105'
                : 'bg-gradient-to-br from-primary/15 via-primary/10 to-transparent border-primary/40 hover:border-primary/60'
              } border-2 cursor-pointer`}
            style={{
              boxShadow: isExplosion
                ? '0 0 150px rgba(91, 180, 255, 1), 0 0 80px rgba(147, 51, 234, 0.5), inset 0 0 60px rgba(91, 180, 255, 0.5)'
                : isCharging
                ? `0 0 ${40 + progress}px rgba(91, 180, 255, ${0.4 + progress / 200}), inset 0 0 ${20 + progress / 2}px rgba(91, 180, 255, 0.3)`
                : isLocked
                ? '0 0 60px rgba(91, 180, 255, 0.4), inset 0 0 30px rgba(91, 180, 255, 0.2)'
                : '0 0 30px rgba(91, 180, 255, 0.2)',
              animation: isCharging && chargePhase >= 3 
                ? 'peak-charge 0.15s ease-in-out infinite' 
                : ritualState === RitualState.IDLE 
                ? 'flame-breathe 4s ease-in-out infinite' 
                : 'none',
            }}
          >
            {/* Progress Ring - Multi-layer */}
            {!isLocked && !isExplosion && (
              <svg className="absolute inset-[-8px] w-[calc(100%+16px)] h-[calc(100%+16px)] -rotate-90">
                {/* Background ring */}
                <circle
                  cx="50%" cy="50%" r="90"
                  fill="none"
                  stroke="rgba(91, 180, 255, 0.1)"
                  strokeWidth="4"
                />
                {/* Glow ring */}
                <circle
                  cx="50%" cy="50%" r="90"
                  fill="none"
                  stroke="url(#ringGlow)"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  filter="url(#glow)"
                  className="transition-none"
                />
                {/* Main progress ring */}
                <circle
                  cx="50%" cy="50%" r="90"
                  fill="none"
                  stroke="url(#ringGradient)"
                  strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-none"
                />
                <defs>
                  <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="50%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                  <linearGradient id="ringGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                    <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.3" />
                  </linearGradient>
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
              </svg>
            )}

            {/* Locked state ring */}
            {isLocked && (
              <div className="absolute inset-[-4px] rounded-full border-2 border-primary/40 animate-locked-shimmer" />
            )}

            {/* Inner core glow layers */}
            <div className="absolute inset-8 rounded-full overflow-hidden">
              <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
                isExplosion ? 'bg-white/60' : isCharging ? 'bg-primary/30' : 'bg-primary/15'
              } blur-xl`} 
              style={{ opacity: isCharging ? 0.4 + progress / 200 : 0.4 }}
              />
              <div className="absolute inset-[20%] rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 blur-lg animate-inner-pulse" />
            </div>

            {/* Multi-layer flame system */}
            <div className="relative z-10 flex items-center justify-center">
              {isExplosion ? (
                <div className="relative">
                  <Zap 
                    className="w-28 h-28 md:w-36 md:h-36 text-white animate-spin"
                    style={{ 
                      filter: 'drop-shadow(0 0 60px white) drop-shadow(0 0 30px rgba(91, 180, 255, 1))',
                      animationDuration: '0.5s'
                    }}
                  />
                </div>
              ) : isLocked ? (
                <div className="relative">
                  <Check className="w-24 h-24 md:w-32 md:h-32 text-primary" style={{
                    filter: 'drop-shadow(0 0 20px rgba(91, 180, 255, 0.8))'
                  }} />
                  <div className="absolute inset-0 animate-pulse">
                    <Check className="w-24 h-24 md:w-32 md:h-32 text-primary/30 blur-md" />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {/* Layer 1 - Core flame */}
                  <Flame
                    className={`w-20 h-20 md:w-28 md:h-28 transition-all duration-300 ${
                      isCharging ? 'text-white' : 'text-primary'
                    }`}
                    style={{
                      transform: `scale(${1 + (progress / 100) * 0.5})`,
                      filter: `drop-shadow(0 0 ${15 + progress / 2}px rgba(91, 180, 255, ${0.6 + progress / 200}))`,
                    }}
                  />
                  
                  {/* Layer 2-5 - Energy plumes */}
                  {isCharging && chargePhase >= 1 && [...Array(4)].map((_, i) => (
                    <Flame
                      key={i}
                      className="absolute top-0 left-0 w-20 h-20 md:w-28 md:h-28 text-cyan-400/40"
                      style={{
                        transform: `scale(${0.9 + (progress / 100) * 0.4}) rotate(${i * 15 - 30}deg) translateY(${-4 - i * 2}px)`,
                        filter: `blur(${2 + i}px)`,
                        animation: `plume-dance ${1.5 + i * 0.3}s ease-in-out infinite`,
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  ))}

                  {/* Micro sparks */}
                  {isCharging && (
                    <div className="absolute inset-0 pointer-events-none">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-1 h-1 bg-white rounded-full"
                          style={{
                            left: '50%',
                            top: '30%',
                            animation: `spark-escape 1s ease-out infinite`,
                            animationDelay: `${i * 0.12}s`,
                            transform: `rotate(${i * 45}deg)`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sub-flames orbiting at 50%+ */}
            {isCharging && chargePhase >= 1 && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(chargePhase >= 2 ? 7 : 4)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-1/2 top-1/2"
                    style={{
                      animation: `sub-flame-orbit ${4 - i * 0.3}s linear infinite`,
                      animationDelay: `${i * 0.3}s`,
                    }}
                  >
                    <Flame
                      className="w-6 h-6 md:w-8 md:h-8 text-cyan-400/70 -translate-x-1/2 -translate-y-1/2"
                      style={{
                        transform: `translateX(-50%) translateY(-${70 + i * 5}px)`,
                        filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8))',
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Firefly particles */}
            {(isCharging || isLocked) && (
              <div className="absolute inset-0 pointer-events-none overflow-visible">
                {[...Array(isLocked ? 8 : 12 + Math.floor(progress / 8))].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 rounded-full"
                    style={{
                      background: i % 2 === 0 ? 'white' : 'hsl(var(--primary))',
                      left: '50%',
                      top: '50%',
                      animation: `firefly ${2 + Math.random() * 2}s ease-in-out infinite`,
                      animationDelay: `${i * 0.15}s`,
                      boxShadow: '0 0 6px rgba(91, 180, 255, 0.8)',
                    }}
                  />
                ))}
              </div>
            )}

            {/* Energy glyphs at high charge */}
            {isCharging && chargePhase >= 2 && (
              <div className="absolute inset-[-20px] pointer-events-none">
                {['◇', '○', '△', '☆'].map((glyph, i) => (
                  <span
                    key={i}
                    className="absolute text-primary/30 text-lg font-light"
                    style={{
                      left: `${20 + i * 20}%`,
                      top: `${10 + (i % 2) * 80}%`,
                      animation: `glyph-flash 2s ease-in-out infinite`,
                      animationDelay: `${i * 0.5}s`,
                    }}
                  >
                    {glyph}
                  </span>
                ))}
              </div>
            )}
          </button>

          {/* Timer display */}
          {isCharging && (
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="text-3xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-primary">
                {Math.ceil((HOLD_DURATION - (progress / 100) * HOLD_DURATION) / 1000)}
              </span>
              <span className="text-primary/60 font-orbitron text-lg ml-1">s</span>
            </div>
          )}
        </div>

        {/* Status Text */}
        <div className="text-center mb-6 h-12">
          {isLocked ? (
            <p className="text-primary/60 font-rajdhani text-base">
              Already answered today. Next call after midnight.
            </p>
          ) : isCharging ? (
            <p className="text-primary font-rajdhani text-lg animate-pulse tracking-wide">
              Channeling soul energy...
            </p>
          ) : ritualState === RitualState.IDLE ? (
            <p className="text-primary/50 font-rajdhani text-base tracking-wide">
              Hold to answer The Call
            </p>
          ) : null}
        </div>

        {/* Stats */}
        <div className="flex gap-16 mb-6">
          <div className="text-center">
            <p className="text-xs text-primary/40 font-rajdhani uppercase tracking-[0.2em] mb-2">Streak</p>
            <p className="text-4xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-primary">
              {pactData.checkin_streak || 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-primary/40 font-rajdhani uppercase tracking-[0.2em] mb-2">Total Calls</p>
            <p className="text-4xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
              {pactData.checkin_total_count || 0}
            </p>
          </div>
        </div>

        <div className="text-center mb-8">
          <p className="text-xs text-primary/30 font-rajdhani uppercase tracking-[0.15em] mb-1">Last Call</p>
          <p className="text-sm text-primary/50 font-rajdhani">
            {formatLastCall(pactData.last_checkin_date)}
          </p>
        </div>

        {/* Dev Button */}
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={triggerDevAnimation}
            disabled={isProcessing}
            className="font-rajdhani text-xs border-primary/20 text-primary/40 hover:text-primary/70 hover:border-primary/40 bg-transparent"
          >
            Replay animation (dev)
          </Button>
          <p className="text-primary/20 text-[10px] mt-1 font-rajdhani tracking-wide">
            Will not affect your real streak
          </p>
        </div>
      </main>

      <Navigation />

      <style>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { transform: translateY(-30px) translateX(10px); opacity: 0.6; }
        }

        @keyframes nebula-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.1); }
        }

        @keyframes nebula-drift-reverse {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, 30px) scale(1.05); }
        }

        @keyframes nebula-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }

        @keyframes flame-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }

        @keyframes breathe-slow {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }

        @keyframes breathe-offset {
          0%, 100% { transform: scale(1.05); opacity: 0.5; }
          50% { transform: scale(0.95); opacity: 0.7; }
        }

        @keyframes breathe {
          0%, 100% { transform: scale(0.95); opacity: 0.4; }
          50% { transform: scale(1.05); opacity: 0.6; }
        }

        @keyframes inner-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }

        @keyframes plume-dance {
          0%, 100% { transform: translateY(-4px) rotate(-5deg); }
          50% { transform: translateY(-8px) rotate(5deg); }
        }

        @keyframes spark-escape {
          0% { opacity: 0; transform: rotate(var(--r, 0deg)) translateY(0); }
          30% { opacity: 1; }
          100% { opacity: 0; transform: rotate(var(--r, 0deg)) translateY(-40px) translateX(10px); }
        }

        @keyframes sub-flame-orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes firefly {
          0% { opacity: 0; transform: translate(-50%, -50%) translateY(0) scale(1); }
          25% { opacity: 1; transform: translate(-50%, -50%) translateY(-30px) translateX(20px) scale(1.2); }
          50% { opacity: 0.7; transform: translate(-50%, -50%) translateY(-60px) translateX(-10px) scale(0.8); }
          75% { opacity: 0.4; transform: translate(-50%, -50%) translateY(-80px) translateX(5px) scale(0.6); }
          100% { opacity: 0; transform: translate(-50%, -50%) translateY(-100px) scale(0.3); }
        }

        @keyframes orbit-wisp {
          from { transform: translate(-50%, -50%) rotate(0deg) translateX(100px) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg) translateX(100px) rotate(-360deg); }
        }

        @keyframes halo-expand {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.5; }
        }

        @keyframes lightning {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }

        @keyframes glyph-flash {
          0%, 100% { opacity: 0; transform: scale(0.8); }
          50% { opacity: 0.4; transform: scale(1.1); }
        }

        @keyframes peak-charge {
          0%, 100% { transform: scale(1.05) translate(0, 0); }
          25% { transform: scale(1.05) translate(-2px, 1px); }
          75% { transform: scale(1.05) translate(2px, -1px); }
        }

        @keyframes soul-text {
          0% { opacity: 0; transform: scale(0.9); letter-spacing: 0.1em; }
          20% { opacity: 1; transform: scale(1); letter-spacing: 0.15em; }
          80% { opacity: 1; transform: scale(1); letter-spacing: 0.15em; }
          100% { opacity: 0; transform: scale(1.05); letter-spacing: 0.2em; }
        }

        @keyframes soul-glow {
          0%, 100% { opacity: 0; }
          20%, 80% { opacity: 0.6; }
        }

        @keyframes ripple-out {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(2); opacity: 0; }
        }

        @keyframes fragment-burst {
          0% { opacity: 1; transform: rotate(var(--r, 0deg)) translateY(0); }
          100% { opacity: 0; transform: rotate(var(--r, 0deg)) translateY(-200px); }
        }

        @keyframes shockwave-blast {
          0% { transform: scale(0); opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }

        @keyframes spark-eject {
          0% { opacity: 1; transform: rotate(var(--r, 0deg)) translateY(0) scale(1); }
          100% { opacity: 0; transform: rotate(var(--r, 0deg)) translateY(-300px) scale(0.3); }
        }

        @keyframes flash {
          0% { opacity: 0.4; }
          100% { opacity: 0; }
        }

        @keyframes ghost-echo {
          0% { transform: scale(0.5); opacity: 0.4; }
          100% { transform: scale(3); opacity: 0; }
        }

        @keyframes ambient-wave {
          0%, 100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.1; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.05; }
        }

        @keyframes heat-shimmer {
          0%, 100% { filter: blur(0.5px) brightness(1); }
          50% { filter: blur(0.8px) brightness(1.02); }
        }

        @keyframes locked-shimmer {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }

        .energy-collapse {
          animation: collapse-energy 0.4s ease-out !important;
        }

        @keyframes collapse-energy {
          0% { transform: scale(1); filter: brightness(1); }
          30% { transform: scale(0.9); filter: brightness(1.8); }
          100% { transform: scale(1); filter: brightness(1); }
        }

        .locked-pulse {
          animation: locked-tap 0.3s ease-out !important;
        }

        @keyframes locked-tap {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }

        .screen-shake {
          animation: screen-shake-intense 0.6s ease-in-out;
        }

        @keyframes screen-shake-intense {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-4px, 4px); }
          20% { transform: translate(4px, -4px); }
          30% { transform: translate(-4px, -2px); }
          40% { transform: translate(4px, 2px); }
          50% { transform: translate(-2px, 4px); }
          60% { transform: translate(2px, -4px); }
          70% { transform: translate(-4px, 2px); }
          80% { transform: translate(4px, -2px); }
          90% { transform: translate(-2px, -4px); }
        }
      `}</style>
    </div>
  );
}
