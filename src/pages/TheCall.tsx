import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Flame, Zap, Check, ArrowLeft } from 'lucide-react';
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
  PRESSING = 'pressing',
  CHARGING = 'charging',
  RADIATING = 'radiating',
  COMPRESSION = 'compression',
  RELEASE = 'release',
  SOUL_CONNECTED = 'soul_connected',
  LOCKED = 'locked'
}

const HOLD_DURATION = 20000;

// Phase boundaries (in percentage)
const PHASE_CHARGING_END = 50; // 0-10s
const PHASE_RADIATING_END = 85; // 10-17s
const PHASE_COMPRESSION_END = 100; // 17-20s

export default function TheCall() {
  const navigate = useNavigate();
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
  const hasCompletedRef = useRef(false);

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
      hasCompletedRef.current = isCompleted;
      if (isCompleted) setRitualState(RitualState.LOCKED);
    }
  };

  const checkIfCompletedToday = (lastCheckInDate: string | null): boolean => {
    if (!lastCheckInDate) return false;
    const today = new Date();
    const todayStr = today.toLocaleDateString('en-CA'); // YYYY-MM-DD in local timezone
    const lastCheckIn = new Date(lastCheckInDate);
    const lastCheckInStr = lastCheckIn.toLocaleDateString('en-CA');
    return todayStr === lastCheckInStr;
  };

  // Determine ritual phase based on progress
  const getRitualPhase = useCallback((prog: number): RitualState => {
    if (prog < PHASE_CHARGING_END) return RitualState.CHARGING;
    if (prog < PHASE_RADIATING_END) return RitualState.RADIATING;
    if (prog < PHASE_COMPRESSION_END) return RitualState.COMPRESSION;
    return RitualState.RELEASE;
  }, []);

  const animateProgress = useCallback(() => {
    if (!isHoldingRef.current) return;
    const elapsed = Date.now() - holdStartRef.current;
    const newProgress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
    setProgress(newProgress);

    // Update ritual state based on phase
    const phase = getRitualPhase(newProgress);
    setRitualState(phase);

    if (newProgress >= 100 && !hasCompletedRef.current) {
      isHoldingRef.current = false;
      hasCompletedRef.current = true;
      triggerCompletion();
    } else if (newProgress < 100) {
      animationFrameRef.current = requestAnimationFrame(animateProgress);
    }
  }, [getRitualPhase]);

  const startHolding = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (completedToday || isProcessing || ritualState === RitualState.LOCKED || hasCompletedRef.current) {
      const core = document.getElementById('ritual-core');
      core?.classList.add('locked-pulse');
      setTimeout(() => core?.classList.remove('locked-pulse'), 300);
      return;
    }

    e.preventDefault();
    isHoldingRef.current = true;
    holdStartRef.current = Date.now();
    setRitualState(RitualState.PRESSING);
    
    // Micro-interaction: initial press feedback
    setTimeout(() => {
      if (isHoldingRef.current) setRitualState(RitualState.CHARGING);
    }, 120);
    
    animationFrameRef.current = requestAnimationFrame(animateProgress);
  }, [completedToday, isProcessing, ritualState, animateProgress]);

  const stopHolding = useCallback(() => {
    if (!isHoldingRef.current) return;
    isHoldingRef.current = false;
    cancelAnimationFrame(animationFrameRef.current);

    // Only show feedback if we were actually charging and didn't complete
    if (progress < 100 && progress > 0 && !hasCompletedRef.current) {
      const core = document.getElementById('ritual-core');
      core?.classList.add('energy-dissipate');
      
      // Elegant energy dissipation with neutral message
      if (progress >= 50) {
        // After 10s - add final wave effect
        core?.classList.add('final-wave');
        setTimeout(() => core?.classList.remove('final-wave'), 600);
        toast('Not yet. Hold longer.', { duration: 2000 });
      } else if (progress >= 10) {
        toast('Hold longer to connect.', { duration: 2000 });
      }
      
      setTimeout(() => core?.classList.remove('energy-dissipate'), 500);
      
      // Smooth progress reset
      const resetProgress = () => {
        setProgress(prev => {
          const newVal = prev - 5;
          if (newVal <= 0) {
            setRitualState(RitualState.IDLE);
            return 0;
          }
          requestAnimationFrame(resetProgress);
          return newVal;
        });
      };
      resetProgress();
    } else if (progress === 0) {
      setRitualState(RitualState.IDLE);
    }
  }, [progress]);

  const triggerCompletion = async () => {
    setIsProcessing(true);
    setRitualState(RitualState.RELEASE);
    
    // Brief flash before soul connected
    await new Promise(resolve => setTimeout(resolve, 350));
    
    setRitualState(RitualState.SOUL_CONNECTED);
    setShowSoulConnected(true);
    
    // Save data during the soul connected display
    if (pactData && !completedToday) {
      await saveCheckInData();
    }
    
    await new Promise(resolve => setTimeout(resolve, 2200));
    setShowSoulConnected(false);
    
    // Calm screen effect (no aggressive shake)
    document.body.classList.add('screen-pulse');
    
    await new Promise(resolve => setTimeout(resolve, 800));
    document.body.classList.remove('screen-pulse');
    
    setRitualState(RitualState.LOCKED);
    setCompletedToday(true);
    hasCompletedRef.current = true;
    setProgress(100);
    setIsProcessing(false);
    toast.success('The Call has been answered.', { duration: 3000 });
  };

  const saveCheckInData = async () => {
    if (!pactData) return;
    
    // Timezone-safe day boundary check
    const today = new Date();
    const todayStr = today.toLocaleDateString('en-CA'); // YYYY-MM-DD local
    
    // Check if already completed today (double protection)
    if (pactData.last_checkin_date) {
      const lastCheckIn = new Date(pactData.last_checkin_date);
      const lastCheckInStr = lastCheckIn.toLocaleDateString('en-CA');
      if (lastCheckInStr === todayStr) {
        console.log('Already checked in today, skipping save');
        return;
      }
    }
    
    // Calculate new streak
    let newStreak = 1;
    if (pactData.last_checkin_date) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toLocaleDateString('en-CA');
      const lastCheckIn = new Date(pactData.last_checkin_date);
      const lastCheckInStr = lastCheckIn.toLocaleDateString('en-CA');
      
      if (lastCheckInStr === yesterdayStr) {
        // Consecutive day - increment streak
        newStreak = (pactData.checkin_streak || 0) + 1;
      }
      // If not yesterday, streak resets to 1
    }

    const { error } = await supabase
      .from('pacts')
      .update({
        checkin_total_count: (pactData.checkin_total_count || 0) + 1,
        checkin_streak: newStreak,
        last_checkin_date: todayStr,
      })
      .eq('id', pactData.id);

    if (error) {
      console.error('Error updating check-in:', error);
      return;
    }
    
    // Update local state immediately
    setPactData(prev => prev ? {
      ...prev,
      checkin_total_count: (prev.checkin_total_count || 0) + 1,
      checkin_streak: newStreak,
      last_checkin_date: todayStr,
    } : null);
  };

  const triggerDevAnimation = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    // Phase A: Charging (0-50%)
    setRitualState(RitualState.CHARGING);
    for (let i = 0; i <= 50; i += 1) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    
    // Phase B: Radiating (50-85%)
    setRitualState(RitualState.RADIATING);
    for (let i = 51; i <= 85; i += 1) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    
    // Phase C: Compression (85-100%)
    setRitualState(RitualState.COMPRESSION);
    for (let i = 86; i <= 100; i += 1) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    
    // Release
    setRitualState(RitualState.RELEASE);
    await new Promise(resolve => setTimeout(resolve, 350));
    
    setRitualState(RitualState.SOUL_CONNECTED);
    setShowSoulConnected(true);
    await new Promise(resolve => setTimeout(resolve, 2200));
    setShowSoulConnected(false);
    
    document.body.classList.add('screen-pulse');
    await new Promise(resolve => setTimeout(resolve, 800));
    document.body.classList.remove('screen-pulse');
    
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
  
  // Phase helpers
  const isCharging = ritualState === RitualState.CHARGING;
  const isRadiating = ritualState === RitualState.RADIATING;
  const isCompression = ritualState === RitualState.COMPRESSION;
  const isRelease = ritualState === RitualState.RELEASE;
  const isLocked = ritualState === RitualState.LOCKED;
  const isActive = isCharging || isRadiating || isCompression;
  
  // Animation intensities based on phase
  const pulseRate = isCompression ? 0.35 : isRadiating ? 0.7 : isCharging ? (1.2 - (progress / 100) * 0.5) : 4;
  const coreScale = isCompression ? 0.92 - (progress - 85) / 150 : isRadiating ? 0.96 : 1;
  const shakeIntensity = isCompression ? 0.5 + (progress - 85) / 15 : 0;

  const formatLastCall = (date: string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getTimeUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
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
        
        {/* Soft vignette */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.8) 100%)'
        }} />
        
        {/* Subtle grain texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")'
        }} />
        
        {/* Nebula clouds */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] animate-nebula-drift" />
          <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] animate-nebula-drift-reverse" />
          <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px] animate-nebula-pulse" />
        </div>

        {/* Floating particles - very subtle */}
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-[1px] h-[1px] bg-primary/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float-particle ${10 + Math.random() * 15}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 8}s`,
              }}
            />
          ))}
        </div>

        {/* Ambient energy waves - locked state */}
        {isLocked && (
          <div className="absolute inset-0">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/5"
                style={{
                  width: '200%',
                  height: '200%',
                  animation: `ambient-wave ${10 + i * 3}s ease-in-out infinite`,
                  animationDelay: `${i * 2}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Soul Connected Overlay */}
      {showSoulConnected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-[#020408]/90 backdrop-blur-sm" />
          
          {/* Subtle ripples */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full border border-primary/20"
                style={{
                  width: `${80 + i * 60}px`,
                  height: `${80 + i * 60}px`,
                  animation: `ripple-out 2.5s ease-out infinite`,
                  animationDelay: `${i * 0.25}s`,
                }}
              />
            ))}
          </div>

          {/* Light fragments - sparse */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-primary/60 rounded-full"
                style={{
                  left: '50%',
                  top: '50%',
                  animation: `fragment-burst 2.2s ease-out forwards`,
                  animationDelay: `${i * 0.08}s`,
                  transform: `rotate(${i * 24}deg)`,
                }}
              />
            ))}
          </div>

          {/* Text reveal - cinematic */}
          <h1 className="relative z-10 text-4xl md:text-6xl font-orbitron font-bold tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-primary/80 via-white to-primary/80 animate-soul-text">
            Soul connected
            <span className="absolute inset-0 text-primary/20 blur-lg animate-soul-glow">Soul connected</span>
          </h1>
        </div>
      )}

      {/* Release Effects - clean burst */}
      {isRelease && (
        <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center overflow-hidden">
          {/* Central flash - subtle */}
          <div className="absolute w-32 h-32 bg-white/30 rounded-full blur-xl animate-flash" />
          
          {/* Wave rings */}
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: '200vmax',
                height: '200vmax',
                border: `${2 - i * 0.5}px solid rgba(91, 180, 255, ${0.4 - i * 0.1})`,
                animation: `shockwave-blast 1.5s ease-out forwards`,
                animationDelay: `${i * 0.08}s`,
              }}
            />
          ))}

          {/* Fine particles */}
          {[...Array(25)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                background: `radial-gradient(circle, white 0%, hsl(var(--primary)) 60%, transparent 100%)`,
                animation: `spark-eject 1.2s ease-out forwards`,
                animationDelay: `${i * 0.02}s`,
                transform: `rotate(${i * 14.4}deg)`,
              }}
            />
          ))}
        </div>
      )}

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pb-28 pt-8">
        {/* Header with Back Button */}
        <div className="absolute top-8 left-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="px-4 py-2 font-rajdhani text-sm text-primary/60 hover:text-primary hover:bg-primary/5"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Back</span>
          </Button>
        </div>

        {/* Title */}
        <div className="relative mb-10">
          <h1 className="text-3xl md:text-4xl font-orbitron font-bold tracking-widest">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-primary to-purple-400">
              THE CALL
            </span>
          </h1>
          <div className="absolute inset-0 text-3xl md:text-4xl font-orbitron font-bold tracking-widest text-primary/10 blur-lg">
            THE CALL
          </div>
          <p className="text-center text-primary/40 font-rajdhani text-xs mt-3 tracking-[0.25em] uppercase">
            20-second soul ritual
          </p>
        </div>

        {/* Main Ritual Core Container */}
        <div className="relative mb-12">
          {/* Outer ambient glow layers */}
          <div className={`absolute inset-[-50px] rounded-full transition-all duration-700 ${
            isActive ? 'opacity-100' : isLocked ? 'opacity-40' : 'opacity-20'
          }`}>
            <div 
              className="absolute inset-0 bg-primary/8 rounded-full blur-[70px]"
              style={{ animation: `breathe-slow ${pulseRate * 3}s ease-in-out infinite` }}
            />
            <div 
              className="absolute inset-[15px] bg-cyan-500/6 rounded-full blur-[50px]"
              style={{ animation: `breathe-offset ${pulseRate * 2.5}s ease-in-out infinite` }}
            />
          </div>

          {/* Expanding halo during radiating/compression */}
          {(isRadiating || isCompression) && (
            <div 
              className="absolute inset-[-70px] rounded-full border border-primary/15"
              style={{
                animation: `halo-expand ${isCompression ? 1 : 2}s ease-in-out infinite`,
                boxShadow: '0 0 30px rgba(91, 180, 255, 0.15)',
              }}
            />
          )}

          {/* Energy arcs during radiating */}
          {isRadiating && (
            <svg className="absolute inset-[-35px] w-[calc(100%+70px)] h-[calc(100%+70px)] pointer-events-none">
              {[...Array(4)].map((_, i) => (
                <path
                  key={i}
                  d={`M ${50 + Math.sin(i * Math.PI / 2) * 42}% ${50 + Math.cos(i * Math.PI / 2) * 42}% Q ${50}% ${50}% 50% 50%`}
                  fill="none"
                  stroke="rgba(91, 180, 255, 0.4)"
                  strokeWidth="1"
                  className="animate-arc-draw"
                  style={{ animationDelay: `${i * 0.3}s` }}
                />
              ))}
            </svg>
          )}

          {/* Orbiting energy wisps */}
          {(isActive || isLocked) && (
            <div className="absolute inset-[-25px] pointer-events-none">
              {[...Array(isLocked ? 3 : Math.floor(progress / 20))].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, white 0%, hsl(var(--primary)) 70%, transparent 100%)',
                    left: '50%',
                    top: '50%',
                    animation: `orbit-wisp ${4 + i * 0.6}s linear infinite`,
                    animationDelay: `${i * 0.5}s`,
                    boxShadow: '0 0 8px rgba(91, 180, 255, 0.6)',
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
            className={`relative w-52 h-52 md:w-64 md:h-64 rounded-full transition-all duration-300 flex items-center justify-center
              ${isLocked
                ? 'bg-gradient-to-br from-primary/20 via-primary/15 to-cyan-500/15 border-primary/50'
                : isRelease
                ? 'bg-gradient-to-br from-white/30 via-primary/40 to-cyan-500/30 border-white/60 scale-105'
                : isActive
                ? 'bg-gradient-to-br from-primary/30 via-primary/20 to-purple-500/15 border-primary/70'
                : 'bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/30 hover:border-primary/50'
              } border-2 cursor-pointer select-none`}
            style={{
              transform: `scale(${coreScale}) ${shakeIntensity > 0 ? `translate(${(Math.random() - 0.5) * shakeIntensity}px, ${(Math.random() - 0.5) * shakeIntensity}px)` : ''}`,
              boxShadow: isRelease
                ? '0 0 100px rgba(91, 180, 255, 0.8), inset 0 0 40px rgba(91, 180, 255, 0.4)'
                : isActive
                ? `0 0 ${30 + progress / 2}px rgba(91, 180, 255, ${0.3 + progress / 300}), inset 0 0 ${15 + progress / 4}px rgba(91, 180, 255, 0.2)`
                : isLocked
                ? '0 0 40px rgba(91, 180, 255, 0.25), inset 0 0 20px rgba(91, 180, 255, 0.15)'
                : '0 0 20px rgba(91, 180, 255, 0.15)',
              animation: ritualState === RitualState.IDLE 
                ? 'flame-breathe 4s ease-in-out infinite' 
                : isCompression
                ? `compression-pulse ${pulseRate}s ease-in-out infinite`
                : 'none',
            }}
          >
            {/* Progress Ring */}
            {!isLocked && !isRelease && (
              <svg className="absolute inset-[-6px] w-[calc(100%+12px)] h-[calc(100%+12px)] -rotate-90">
                {/* Background ring */}
                <circle
                  cx="50%" cy="50%" r="90"
                  fill="none"
                  stroke="rgba(91, 180, 255, 0.08)"
                  strokeWidth="3"
                />
                {/* Glow ring */}
                <circle
                  cx="50%" cy="50%" r="90"
                  fill="none"
                  stroke="url(#ringGlow)"
                  strokeWidth="6"
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
                  stroke={progress > 95 ? 'rgba(255,255,255,0.9)' : 'url(#ringGradient)'}
                  strokeWidth="3"
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
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                    <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.25" />
                  </linearGradient>
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
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
              <div className="absolute inset-[-3px] rounded-full border border-primary/30 animate-locked-shimmer" />
            )}

            {/* Inner core glow */}
            <div className="absolute inset-10 rounded-full overflow-hidden">
              <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
                isRelease ? 'bg-white/50' : isActive ? 'bg-primary/20' : 'bg-primary/10'
              } blur-lg`} 
              style={{ opacity: isActive ? 0.3 + progress / 250 : 0.3 }}
              />
            </div>

            {/* Icon */}
            <div className="relative z-10 flex items-center justify-center">
              {isRelease ? (
                <Zap 
                  className="w-24 h-24 md:w-28 md:h-28 text-white"
                  style={{ 
                    filter: 'drop-shadow(0 0 40px white) drop-shadow(0 0 20px rgba(91, 180, 255, 0.8))',
                    animation: 'icon-flash 0.5s ease-out'
                  }}
                />
              ) : isLocked ? (
                <div className="relative">
                  <Check className="w-20 h-20 md:w-24 md:h-24 text-primary/80" style={{
                    filter: 'drop-shadow(0 0 15px rgba(91, 180, 255, 0.6))'
                  }} />
                </div>
              ) : (
                <div className="relative">
                  {/* Core flame */}
                  <Flame
                    className={`w-18 h-18 md:w-22 md:h-22 transition-all duration-200 ${
                      isActive ? 'text-white' : 'text-primary/80'
                    }`}
                    style={{
                      width: isActive ? `${70 + progress / 4}px` : '70px',
                      height: isActive ? `${70 + progress / 4}px` : '70px',
                      filter: `drop-shadow(0 0 ${10 + progress / 3}px rgba(91, 180, 255, ${0.5 + progress / 250}))`,
                    }}
                  />
                  
                  {/* Energy vein - rotating inside */}
                  {isActive && (
                    <div 
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ animation: `energy-rotation ${6 - progress / 30}s linear infinite` }}
                    >
                      <div className="w-1 h-12 bg-gradient-to-t from-transparent via-cyan-400/60 to-transparent rounded-full blur-[2px]" />
                    </div>
                  )}

                  {/* Micro sparks */}
                  {isActive && (
                    <div className="absolute inset-0 pointer-events-none">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-0.5 h-0.5 bg-white rounded-full"
                          style={{
                            left: '50%',
                            top: '35%',
                            animation: `spark-escape ${0.8 + i * 0.1}s ease-out infinite`,
                            animationDelay: `${i * 0.15}s`,
                            transform: `rotate(${i * 60}deg)`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Firefly particles */}
            {(isActive || isLocked) && (
              <div className="absolute inset-0 pointer-events-none overflow-visible">
                {[...Array(isLocked ? 5 : 8 + Math.floor(progress / 12))].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-0.5 h-0.5 rounded-full"
                    style={{
                      background: i % 2 === 0 ? 'white' : 'hsl(var(--primary))',
                      left: '50%',
                      top: '50%',
                      animation: `firefly ${2.5 + Math.random() * 2}s ease-in-out infinite`,
                      animationDelay: `${i * 0.2}s`,
                      boxShadow: '0 0 4px rgba(91, 180, 255, 0.6)',
                    }}
                  />
                ))}
              </div>
            )}
          </button>

          {/* Timer display */}
          {isActive && (
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="text-2xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-primary">
                {Math.ceil((HOLD_DURATION - (progress / 100) * HOLD_DURATION) / 1000)}
              </span>
              <span className="text-primary/50 font-orbitron text-sm ml-1">s</span>
            </div>
          )}
        </div>

        {/* Status Text */}
        <div className="text-center mb-8 h-10">
          {isLocked ? (
            <p className="text-primary/50 font-rajdhani text-sm">
              Connected — next call in {getTimeUntilMidnight()}
            </p>
          ) : isActive ? (
            <p className="text-primary/70 font-rajdhani text-base tracking-wide animate-pulse">
              {isCompression ? 'Almost there...' : isRadiating ? 'Energy building...' : 'Channeling...'}
            </p>
          ) : ritualState === RitualState.IDLE ? (
            <p className="text-primary/40 font-rajdhani text-sm tracking-wide">
              Hold to connect
            </p>
          ) : null}
        </div>

        {/* Stats */}
        <div className="flex gap-14 mb-6">
          <div className="text-center">
            <p className="text-[10px] text-primary/35 font-rajdhani uppercase tracking-[0.2em] mb-1.5">Streak</p>
            <p className="text-3xl font-bold font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-primary">
              {pactData.checkin_streak || 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-primary/35 font-rajdhani uppercase tracking-[0.2em] mb-1.5">Total Calls</p>
            <p className="text-3xl font-bold font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
              {pactData.checkin_total_count || 0}
            </p>
          </div>
        </div>

        <div className="text-center mb-8">
          <p className="text-[10px] text-primary/25 font-rajdhani uppercase tracking-[0.15em] mb-0.5">Last Call</p>
          <p className="text-xs text-primary/40 font-rajdhani">
            {formatLastCall(pactData.last_checkin_date)}
          </p>
        </div>

        {/* Dev Button */}
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={triggerDevAnimation}
            disabled={isProcessing}
            className="font-rajdhani text-[10px] text-primary/25 hover:text-primary/50 bg-transparent"
          >
            Replay animation (dev)
          </Button>
        </div>
      </main>

      <Navigation />

      <style>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.2; }
          50% { transform: translateY(-25px) translateX(8px); opacity: 0.4; }
        }

        @keyframes nebula-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -15px) scale(1.05); }
        }

        @keyframes nebula-drift-reverse {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-15px, 20px) scale(1.03); }
        }

        @keyframes nebula-pulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(1.1); }
        }

        @keyframes flame-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }

        @keyframes breathe-slow {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.08); opacity: 0.7; }
        }

        @keyframes breathe-offset {
          0%, 100% { transform: scale(1.03); opacity: 0.4; }
          50% { transform: scale(0.97); opacity: 0.55; }
        }

        @keyframes compression-pulse {
          0%, 100% { transform: scale(0.92); }
          50% { transform: scale(0.88); }
        }

        @keyframes energy-rotation {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes spark-escape {
          0% { opacity: 0; transform: rotate(var(--r, 0deg)) translateY(0); }
          25% { opacity: 0.8; }
          100% { opacity: 0; transform: rotate(var(--r, 0deg)) translateY(-35px) translateX(8px); }
        }

        @keyframes firefly {
          0% { opacity: 0; transform: translate(-50%, -50%) translateY(0) scale(1); }
          25% { opacity: 0.8; transform: translate(-50%, -50%) translateY(-25px) translateX(15px) scale(1.1); }
          50% { opacity: 0.5; transform: translate(-50%, -50%) translateY(-50px) translateX(-8px) scale(0.7); }
          75% { opacity: 0.3; transform: translate(-50%, -50%) translateY(-70px) translateX(3px) scale(0.5); }
          100% { opacity: 0; transform: translate(-50%, -50%) translateY(-85px) scale(0.2); }
        }

        @keyframes orbit-wisp {
          from { transform: translate(-50%, -50%) rotate(0deg) translateX(85px) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg) translateX(85px) rotate(-360deg); }
        }

        @keyframes halo-expand {
          0%, 100% { transform: scale(1); opacity: 0.25; }
          50% { transform: scale(1.08); opacity: 0.4; }
        }

        @keyframes arc-draw {
          0%, 100% { opacity: 0; stroke-dashoffset: 100; }
          50% { opacity: 0.6; stroke-dashoffset: 0; }
        }

        @keyframes soul-text {
          0% { opacity: 0; transform: scale(0.98); letter-spacing: 0.1em; }
          15% { opacity: 1; transform: scale(1); letter-spacing: 0.15em; }
          85% { opacity: 1; transform: scale(1); letter-spacing: 0.15em; }
          100% { opacity: 0; transform: scale(1.02); letter-spacing: 0.18em; }
        }

        @keyframes soul-glow {
          0%, 100% { opacity: 0; }
          15%, 85% { opacity: 0.4; }
        }

        @keyframes ripple-out {
          0% { transform: scale(0.9); opacity: 0.4; }
          100% { transform: scale(1.8); opacity: 0; }
        }

        @keyframes fragment-burst {
          0% { opacity: 0.8; transform: rotate(var(--r, 0deg)) translateY(0); }
          100% { opacity: 0; transform: rotate(var(--r, 0deg)) translateY(-150px); }
        }

        @keyframes shockwave-blast {
          0% { transform: scale(0); opacity: 0.8; }
          100% { transform: scale(1); opacity: 0; }
        }

        @keyframes spark-eject {
          0% { opacity: 0.9; transform: rotate(var(--r, 0deg)) translateY(0) scale(1); }
          100% { opacity: 0; transform: rotate(var(--r, 0deg)) translateY(-200px) scale(0.2); }
        }

        @keyframes flash {
          0% { opacity: 0.6; transform: scale(1); }
          100% { opacity: 0; transform: scale(2); }
        }

        @keyframes icon-flash {
          0% { transform: scale(0.9); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        @keyframes ambient-wave {
          0%, 100% { transform: translate(-50%, -50%) scale(0.85); opacity: 0.08; }
          50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.03; }
        }

        @keyframes locked-shimmer {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }

        .energy-dissipate {
          animation: dissipate-energy 0.5s ease-out !important;
        }

        @keyframes dissipate-energy {
          0% { filter: brightness(1.1); }
          50% { filter: brightness(0.95); }
          100% { filter: brightness(1); }
        }

        .final-wave {
          animation: final-wave-out 0.6s ease-out !important;
        }

        @keyframes final-wave-out {
          0% { box-shadow: 0 0 40px rgba(91, 180, 255, 0.5); }
          100% { box-shadow: 0 0 60px rgba(91, 180, 255, 0); }
        }

        .locked-pulse {
          animation: locked-tap 0.3s ease-out !important;
        }

        @keyframes locked-tap {
          0% { transform: scale(1); }
          50% { transform: scale(1.015); }
          100% { transform: scale(1); }
        }

        .screen-pulse {
          animation: screen-pulse-soft 0.8s ease-in-out;
        }

        @keyframes screen-pulse-soft {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.05); }
        }
      `}</style>
    </div>
  );
}
