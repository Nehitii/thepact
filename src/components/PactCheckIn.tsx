import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Flame, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useParticleEffect } from './ParticleEffect';

interface PactData {
  id: string;
  checkin_total_count: number;
  checkin_streak: number;
  last_checkin_date: string | null;
}

const HOLD_DURATION = 20000; // 20 seconds in milliseconds

export const PactCheckIn = () => {
  const { user } = useAuth();
  const [pactData, setPactData] = useState<PactData | null>(null);
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completedToday, setCompletedToday] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const holdStartRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const { trigger, ParticleEffects } = useParticleEffect();

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
      checkIfCompletedToday(data.last_checkin_date);
    }
  };

  const checkIfCompletedToday = (lastCheckInDate: string | null) => {
    if (!lastCheckInDate) {
      setCompletedToday(false);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const lastCheckIn = new Date(lastCheckInDate).toISOString().split('T')[0];
    setCompletedToday(today === lastCheckIn);
  };

  const startHolding = (e: React.MouseEvent | React.TouchEvent) => {
    if (completedToday || !pactData || isCompleting) return;

    e.preventDefault();
    setIsHolding(true);
    holdStartRef.current = Date.now();
    animateProgress();
  };

  const stopHolding = () => {
    if (!isHolding) return;

    setIsHolding(false);
    cancelAnimationFrame(animationFrameRef.current);

    // If not completed, shake and reset
    if (progress < 100) {
      const button = document.getElementById('energy-core');
      button?.classList.add('animate-shake');
      setTimeout(() => {
        button?.classList.remove('animate-shake');
      }, 500);
      setProgress(0);
    }
  };

  const animateProgress = () => {
    const elapsed = Date.now() - holdStartRef.current;
    const newProgress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
    setProgress(newProgress);

    if (newProgress >= 100) {
      completeCheckIn();
    } else {
      animationFrameRef.current = requestAnimationFrame(animateProgress);
    }
  };

  const completeCheckIn = async () => {
    if (!pactData || isCompleting) return;

    setIsCompleting(true);
    setIsHolding(false);

    // Calculate streak
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
      toast.error('Failed to complete check-in');
      setIsCompleting(false);
      setProgress(0);
      return;
    }

    // Success animation
    setCompletedToday(true);
    toast.success('Energy collected — Your Pact grows stronger.');
    
    // Refresh data
    setTimeout(() => {
      fetchPactData();
      setIsCompleting(false);
    }, 1000);
  };

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  if (!pactData) {
    return null;
  }

  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <>
      <ParticleEffects />
      <div className="animate-fade-in relative group">
        <div className="absolute inset-0 bg-primary/5 rounded-lg blur-xl" />
        <div className="relative bg-card/20 backdrop-blur-xl border-2 border-primary/30 rounded-lg overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-[2px] border border-primary/20 rounded-[6px]" />
          </div>

          {/* Header */}
          <div className="relative z-10 p-6 border-b border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary font-orbitron uppercase tracking-widest drop-shadow-[0_0_10px_rgba(91,180,255,0.5)]">
                  Pact Check-In
                </h2>
                <p className="text-sm text-primary/60 mt-1 font-rajdhani">
                  20-second daily ritual
                </p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-md rounded-full" />
                <Flame className="w-8 h-8 text-primary relative z-10" />
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="relative z-10 p-8">
            <div className="flex flex-col items-center">
              {/* Energy Core Button */}
              <div className="relative mb-6">
                <button
                  id="energy-core"
                  onMouseDown={startHolding}
                  onMouseUp={stopHolding}
                  onMouseLeave={stopHolding}
                  onTouchStart={startHolding}
                  onTouchEnd={stopHolding}
                  disabled={completedToday || isCompleting}
                  className={`relative w-40 h-40 rounded-full transition-all duration-300 ${
                    completedToday
                      ? 'bg-green-500/20 border-green-500/50 cursor-not-allowed'
                      : isHolding
                      ? 'bg-primary/30 border-primary shadow-[0_0_40px_rgba(91,180,255,0.6)] scale-105'
                      : 'bg-primary/10 border-primary/50 shadow-[0_0_20px_rgba(91,180,255,0.3)] hover:bg-primary/20 hover:scale-102 cursor-pointer'
                  } border-4 flex items-center justify-center group/core`}
                  style={{
                    animation: isHolding ? 'pulse 1s ease-in-out infinite' : 'none',
                  }}
                >
                  {/* Progress Ring */}
                  {!completedToday && (
                    <svg className="absolute inset-0 w-full h-full -rotate-90" style={{ filter: 'drop-shadow(0 0 8px rgba(91, 180, 255, 0.5))' }}>
                      <circle
                        cx="80"
                        cy="80"
                        r="60"
                        fill="none"
                        stroke="rgba(91, 180, 255, 0.2)"
                        strokeWidth="4"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="60"
                        fill="none"
                        stroke="rgba(91, 180, 255, 1)"
                        strokeWidth="4"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        style={{
                          transition: isHolding ? 'none' : 'stroke-dashoffset 0.3s ease',
                        }}
                      />
                    </svg>
                  )}

                  {/* Inner Glow */}
                  <div className={`absolute inset-6 rounded-full ${
                    completedToday ? 'bg-green-500/10' : 'bg-primary/10'
                  } blur-xl`} />

                  {/* Icon */}
                  {completedToday ? (
                    <Check className="w-16 h-16 text-green-500 relative z-10 drop-shadow-[0_0_10px_rgba(34,197,94,0.7)]" />
                  ) : (
                    <Flame
                      className={`w-16 h-16 relative z-10 transition-all duration-300 ${
                        isHolding ? 'text-primary scale-110' : 'text-primary/70'
                      }`}
                      style={{
                        filter: isHolding ? 'drop-shadow(0 0 15px rgba(91, 180, 255, 0.8))' : 'drop-shadow(0 0 8px rgba(91, 180, 255, 0.4))',
                      }}
                    />
                  )}

                  {/* Particles on hold */}
                  {isHolding && (
                    <div className="absolute inset-0 pointer-events-none">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-1 h-1 bg-primary rounded-full"
                          style={{
                            left: '50%',
                            top: '50%',
                            animation: `float-up 1.5s ease-out infinite`,
                            animationDelay: `${i * 0.2}s`,
                            transform: `rotate(${i * 45}deg) translateY(-70px)`,
                            opacity: 0,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </button>

                {/* Timer Display */}
                {isHolding && !completedToday && (
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="text-primary font-orbitron font-bold text-lg drop-shadow-[0_0_8px_rgba(91,180,255,0.6)]">
                      {Math.ceil((HOLD_DURATION - (progress / 100) * HOLD_DURATION) / 1000)}s
                    </span>
                  </div>
                )}
              </div>

              {/* Status Text */}
              <div className="text-center mt-8 mb-4">
                {completedToday ? (
                  <p className="text-primary/80 font-rajdhani text-lg">
                    Your ritual for today is complete.
                  </p>
                ) : (
                  <p className="text-primary/70 font-rajdhani text-lg">
                    Hold to channel your energy
                  </p>
                )}
              </div>

              {/* Stats Footer */}
              <div className="w-full grid grid-cols-3 gap-4 pt-6 border-t border-primary/20">
                <div className="text-center">
                  <p className="text-xs text-primary/60 font-rajdhani uppercase tracking-wider mb-1">Total</p>
                  <p className="text-2xl font-bold text-primary font-orbitron drop-shadow-[0_0_5px_rgba(91,180,255,0.4)]">
                    {pactData.checkin_total_count || 0}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-primary/60 font-rajdhani uppercase tracking-wider mb-1">Streak</p>
                  <p className="text-2xl font-bold text-accent font-orbitron drop-shadow-[0_0_5px_rgba(91,180,255,0.4)]">
                    {pactData.checkin_streak || 0}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-primary/60 font-rajdhani uppercase tracking-wider mb-1">Last</p>
                  <p className="text-sm font-medium text-primary/80 font-rajdhani">
                    {pactData.last_checkin_date
                      ? new Date(pactData.last_checkin_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float-up {
          0% {
            opacity: 0;
            transform: rotate(var(--rotation, 0deg)) translateY(0) scale(1);
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: rotate(var(--rotation, 0deg)) translateY(-70px) scale(0.5);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </>
  );
};
