import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Flame, Zap, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';
import { CyberBackground } from '@/components/CyberBackground';

interface PactData {
  id: string;
  checkin_total_count: number;
  checkin_streak: number;
  last_checkin_date: string | null;
}

// State machine states
enum RitualState {
  IDLE = 'idle',
  TOUCH_START = 'touch_start',
  CHARGING = 'charging',
  SOUL_CONNECTED = 'soul_connected',
  EXPLOSION = 'explosion',
  LOCKED = 'locked'
}

const HOLD_DURATION = 20000; // 20 seconds

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
    if (user) {
      fetchPactData();
    }
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
      if (isCompleted) {
        setRitualState(RitualState.LOCKED);
      }
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
      // Pulse effect on locked tap
      const core = document.getElementById('ritual-core');
      core?.classList.add('locked-pulse');
      setTimeout(() => core?.classList.remove('locked-pulse'), 300);
      return;
    }

    e.preventDefault();
    isHoldingRef.current = true;
    holdStartRef.current = Date.now();
    setRitualState(RitualState.TOUCH_START);
    
    // Quick transition to charging
    setTimeout(() => {
      if (isHoldingRef.current) {
        setRitualState(RitualState.CHARGING);
      }
    }, 100);
    
    animationFrameRef.current = requestAnimationFrame(animateProgress);
  }, [completedToday, isProcessing, ritualState, animateProgress]);

  const stopHolding = useCallback(() => {
    if (!isHoldingRef.current) return;

    isHoldingRef.current = false;
    cancelAnimationFrame(animationFrameRef.current);

    if (progress < 100 && ritualState === RitualState.CHARGING) {
      // Energy collapse animation
      const core = document.getElementById('ritual-core');
      core?.classList.add('energy-collapse');
      toast.error('Hold longer to answer The Call.');
      setTimeout(() => {
        core?.classList.remove('energy-collapse');
      }, 500);
      setProgress(0);
      setRitualState(RitualState.IDLE);
    }
  }, [progress, ritualState]);

  const triggerCompletion = async () => {
    setIsProcessing(true);
    
    // Soul Connected phase
    setRitualState(RitualState.SOUL_CONNECTED);
    setShowSoulConnected(true);
    
    // Wait for soul connected display
    await new Promise(resolve => setTimeout(resolve, 1900));
    setShowSoulConnected(false);
    
    // Explosion phase
    setRitualState(RitualState.EXPLOSION);
    document.body.classList.add('screen-shake');
    
    // Save data
    if (pactData) {
      await saveCheckInData();
    }
    
    // Wait for explosion
    await new Promise(resolve => setTimeout(resolve, 2000));
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
      
      if (lastCheckIn === yesterdayStr) {
        newStreak = (pactData.checkin_streak || 0) + 1;
      }
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

    if (error) {
      console.error('Error updating check-in:', error);
      return;
    }

    fetchPactData();
  };

  const triggerDevAnimation = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    // Fast charge simulation
    setRitualState(RitualState.CHARGING);
    for (let i = 0; i <= 100; i += 5) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    
    // Soul connected
    setRitualState(RitualState.SOUL_CONNECTED);
    setShowSoulConnected(true);
    await new Promise(resolve => setTimeout(resolve, 1900));
    setShowSoulConnected(false);
    
    // Explosion
    setRitualState(RitualState.EXPLOSION);
    document.body.classList.add('screen-shake');
    await new Promise(resolve => setTimeout(resolve, 2000));
    document.body.classList.remove('screen-shake');
    
    // Reset to appropriate state
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

  // Visual calculations
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const flameScale = 1 + (progress / 100) * 0.4;
  const glowIntensity = 0.3 + (progress / 100) * 0.7;
  const showSubFlames = progress > 50;
  const showHalo = progress > 70;
  const showIntenseShake = progress > 90;

  const formatLastCall = (date: string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!pactData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary/60 font-rajdhani">Loading ritual...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <CyberBackground />
      
      {/* Soul Connected Overlay */}
      {showSoulConnected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
          <h1 className="text-4xl md:text-6xl font-orbitron font-bold text-primary animate-soul-connected drop-shadow-[0_0_30px_rgba(91,180,255,0.8)]">
            Soul connected
          </h1>
        </div>
      )}

      {/* Explosion shockwaves */}
      {ritualState === RitualState.EXPLOSION && (
        <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center">
          <div className="absolute w-[200vmax] h-[200vmax] rounded-full border-4 border-primary/60 animate-shockwave" />
          <div className="absolute w-[200vmax] h-[200vmax] rounded-full border-2 border-primary/40 animate-shockwave" style={{ animationDelay: '0.1s' }} />
          <div className="absolute w-[200vmax] h-[200vmax] rounded-full bg-primary/10 animate-shockwave" style={{ animationDelay: '0.2s' }} />
        </div>
      )}

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pb-24">
        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary mb-2 tracking-wider drop-shadow-[0_0_15px_rgba(91,180,255,0.5)]">
          THE CALL
        </h1>
        <p className="text-primary/60 font-rajdhani text-lg mb-12">
          20-second daily ritual
        </p>

        {/* Main Ritual Core */}
        <div className="relative mb-12">
          {/* Outer halo effect */}
          {showHalo && ritualState === RitualState.CHARGING && (
            <div className="absolute inset-[-40px] rounded-full bg-primary/10 animate-pulse blur-xl" />
          )}
          
          {/* Intense shake indicator */}
          {showIntenseShake && ritualState === RitualState.CHARGING && (
            <div className="absolute inset-[-20px] rounded-full border-2 border-primary/30 animate-ping" />
          )}

          <button
            id="ritual-core"
            onMouseDown={startHolding}
            onMouseUp={stopHolding}
            onMouseLeave={stopHolding}
            onTouchStart={startHolding}
            onTouchEnd={stopHolding}
            disabled={isProcessing}
            className={`relative w-52 h-52 md:w-64 md:h-64 rounded-full transition-all duration-300 flex items-center justify-center
              ${ritualState === RitualState.LOCKED
                ? 'bg-primary/20 border-primary/60 cursor-default'
                : ritualState === RitualState.EXPLOSION
                ? 'bg-primary/60 border-primary shadow-[0_0_100px_rgba(91,180,255,1)] scale-110'
                : ritualState === RitualState.CHARGING || ritualState === RitualState.TOUCH_START
                ? 'bg-primary/30 border-primary shadow-[0_0_60px_rgba(91,180,255,0.7)] scale-105'
                : 'bg-primary/10 border-primary/50 shadow-[0_0_30px_rgba(91,180,255,0.3)] hover:bg-primary/15 cursor-pointer'
              } border-4`}
            style={{
              animation: ritualState === RitualState.IDLE ? 'breathe 3s ease-in-out infinite' : 
                         ritualState === RitualState.CHARGING && showIntenseShake ? 'micro-shake 0.1s ease-in-out infinite' :
                         'none',
            }}
          >
            {/* Progress Ring */}
            {ritualState !== RitualState.LOCKED && ritualState !== RitualState.EXPLOSION && (
              <svg className="absolute inset-0 w-full h-full -rotate-90" style={{ filter: 'drop-shadow(0 0 10px rgba(91, 180, 255, 0.6))' }}>
                <circle
                  cx="50%"
                  cy="50%"
                  r="70"
                  fill="none"
                  stroke="rgba(91, 180, 255, 0.15)"
                  strokeWidth="6"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="70"
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-none"
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--accent))" />
                  </linearGradient>
                </defs>
              </svg>
            )}

            {/* Inner glow */}
            <div 
              className={`absolute inset-8 rounded-full blur-xl transition-all duration-300 ${
                ritualState === RitualState.LOCKED ? 'bg-primary/20' : 'bg-primary/15'
              }`}
              style={{ opacity: glowIntensity }}
            />

            {/* Sub-flames at 50% */}
            {showSubFlames && ritualState === RitualState.CHARGING && (
              <>
                {[0, 72, 144, 216, 288].map((rotation, i) => (
                  <Flame
                    key={i}
                    className="absolute w-8 h-8 text-primary/70"
                    style={{
                      transform: `rotate(${rotation}deg) translateY(-60px)`,
                      animation: `orbit ${3 - i * 0.2}s linear infinite`,
                      filter: 'drop-shadow(0 0 8px rgba(91, 180, 255, 0.7))',
                    }}
                  />
                ))}
              </>
            )}

            {/* Main Icon */}
            {ritualState === RitualState.EXPLOSION ? (
              <Zap 
                className="w-24 h-24 md:w-28 md:h-28 text-primary relative z-10 animate-spin"
                style={{ filter: 'drop-shadow(0 0 40px rgba(91, 180, 255, 1))' }}
              />
            ) : ritualState === RitualState.LOCKED ? (
              <div className="relative">
                <Check className="w-20 h-20 md:w-24 md:h-24 text-primary relative z-10 drop-shadow-[0_0_15px_rgba(91,180,255,0.8)]" />
                <div className="absolute inset-0 animate-pulse">
                  <Check className="w-20 h-20 md:w-24 md:h-24 text-primary/30 blur-md" />
                </div>
              </div>
            ) : (
              <Flame
                className={`w-20 h-20 md:w-24 md:h-24 relative z-10 transition-all duration-200 ${
                  ritualState === RitualState.CHARGING ? 'text-primary' : 'text-primary/80'
                }`}
                style={{
                  transform: `scale(${flameScale})`,
                  filter: `drop-shadow(0 0 ${20 * glowIntensity}px rgba(91, 180, 255, ${glowIntensity}))`,
                }}
              />
            )}

            {/* Particle effects while charging */}
            {(ritualState === RitualState.CHARGING || ritualState === RitualState.TOUCH_START) && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1.5 h-1.5 bg-primary rounded-full"
                    style={{
                      left: '50%',
                      top: '50%',
                      animation: `particle-rise 1.5s ease-out infinite`,
                      animationDelay: `${i * 0.12}s`,
                      transform: `rotate(${i * 30}deg)`,
                    }}
                  />
                ))}
              </div>
            )}
          </button>

          {/* Timer Display */}
          {ritualState === RitualState.CHARGING && (
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="text-primary font-orbitron font-bold text-2xl drop-shadow-[0_0_10px_rgba(91,180,255,0.7)]">
                {Math.ceil((HOLD_DURATION - (progress / 100) * HOLD_DURATION) / 1000)}s
              </span>
            </div>
          )}
        </div>

        {/* Status Text */}
        <div className="text-center mb-8 h-16">
          {ritualState === RitualState.LOCKED ? (
            <p className="text-primary/70 font-rajdhani text-lg">
              Already answered today. Next call after midnight.
            </p>
          ) : ritualState === RitualState.CHARGING ? (
            <p className="text-primary font-rajdhani text-lg animate-pulse">
              Channeling energy...
            </p>
          ) : ritualState === RitualState.IDLE ? (
            <p className="text-primary/70 font-rajdhani text-lg">
              Hold to answer The Call
            </p>
          ) : null}
        </div>

        {/* Stats */}
        <div className="flex gap-12 mb-8">
          <div className="text-center">
            <p className="text-xs text-primary/50 font-rajdhani uppercase tracking-wider mb-1">Streak</p>
            <p className="text-3xl font-bold text-accent font-orbitron drop-shadow-[0_0_8px_rgba(91,180,255,0.5)]">
              {pactData.checkin_streak || 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-primary/50 font-rajdhani uppercase tracking-wider mb-1">Total Calls</p>
            <p className="text-3xl font-bold text-primary font-orbitron drop-shadow-[0_0_8px_rgba(91,180,255,0.5)]">
              {pactData.checkin_total_count || 0}
            </p>
          </div>
        </div>

        <div className="text-center mb-8">
          <p className="text-xs text-primary/40 font-rajdhani uppercase tracking-wider mb-1">Last Call</p>
          <p className="text-sm text-primary/60 font-rajdhani">
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
            className="font-rajdhani text-xs border-primary/30 text-primary/60 hover:text-primary hover:border-primary/50"
          >
            Replay animation (dev)
          </Button>
          <p className="text-primary/30 text-xs mt-1 font-rajdhani">
            This will not affect your real streak
          </p>
        </div>
      </main>

      <Navigation />

      <style>{`
        @keyframes breathe {
          0%, 100% { 
            transform: scale(1);
            opacity: 0.85;
          }
          50% { 
            transform: scale(1.03);
            opacity: 1;
          }
        }

        @keyframes orbit {
          from { transform: rotate(0deg) translateY(-60px) rotate(0deg); }
          to { transform: rotate(360deg) translateY(-60px) rotate(-360deg); }
        }

        @keyframes particle-rise {
          0% {
            opacity: 0;
            transform: rotate(var(--rotation, 0deg)) translateY(0) scale(1);
          }
          30% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: rotate(var(--rotation, 0deg)) translateY(-80px) scale(0.3);
          }
        }

        @keyframes micro-shake {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-1px, 1px); }
          50% { transform: translate(1px, -1px); }
          75% { transform: translate(-1px, -1px); }
        }

        @keyframes soul-connected {
          0% { opacity: 0; transform: scale(0.9); }
          20% { opacity: 1; transform: scale(1); }
          80% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.05); }
        }

        .animate-soul-connected {
          animation: soul-connected 1.9s ease-in-out forwards;
        }

        @keyframes shockwave {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }

        .animate-shockwave {
          animation: shockwave 1.5s ease-out forwards;
        }

        .energy-collapse {
          animation: collapse 0.4s ease-out;
        }

        @keyframes collapse {
          0% { transform: scale(1); filter: brightness(1); }
          30% { transform: scale(0.92); filter: brightness(1.5); }
          100% { transform: scale(1); filter: brightness(1); }
        }

        .locked-pulse {
          animation: lockedPulse 0.3s ease-out;
        }

        @keyframes lockedPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }

        .screen-shake {
          animation: screenShake 0.5s ease-in-out;
        }

        @keyframes screenShake {
          0%, 100% { transform: translate(0, 0); }
          10%, 30%, 50%, 70%, 90% { transform: translate(-3px, 3px); }
          20%, 40%, 60%, 80% { transform: translate(3px, -3px); }
        }
      `}</style>
    </div>
  );
}
