import React from 'react';
import styled from 'styled-components';
import { DIFFICULTY_OPTIONS } from '@/lib/goalConstants';

interface Goal {
  id: string;
  name: string;
  type: string;
  difficulty?: string | null;
  status?: string | null;
  image_url?: string | null;
  is_focus?: boolean | null;
  goal_type?: string;
  habit_duration_days?: number | null;
  habit_checks?: boolean[] | null;
  totalStepsCount?: number;
  completedStepsCount?: number;
  potential_score?: number | null;
  tags?: string[];
}

interface BarViewGoalCardProps {
  goal: Goal;
  isCompleted?: boolean;
  customDifficultyName?: string;
  customDifficultyColor?: string;
  onNavigate: (goalId: string) => void;
  onToggleFocus: (goalId: string, currentFocus: boolean, e: React.MouseEvent) => void;
}

// Get difficulty color from constants or custom
function getDifficultyColor(difficulty: string | null | undefined, customColor: string): string {
  if (!difficulty) return '#00ffaa';
  if (difficulty === 'custom') return customColor;
  const found = DIFFICULTY_OPTIONS.find(d => d.value === difficulty);
  return found?.color || '#00ffaa';
}

// Get difficulty label
function getDifficultyDisplayLabel(difficulty: string | null | undefined, customName: string): string {
  if (!difficulty) return 'UNKNOWN';
  if (difficulty === 'custom') return customName.toUpperCase() || 'CUSTOM';
  const found = DIFFICULTY_OPTIONS.find(d => d.value === difficulty);
  return found?.value.toUpperCase() || difficulty.toUpperCase();
}

export function BarViewGoalCard({
  goal,
  isCompleted = false,
  customDifficultyName = "",
  customDifficultyColor = "#a855f7",
  onNavigate,
  onToggleFocus,
}: BarViewGoalCardProps) {
  const difficultyColor = getDifficultyColor(goal.difficulty, customDifficultyColor);
  const difficultyLabel = getDifficultyDisplayLabel(goal.difficulty, customDifficultyName);
  
  // Calculate progress
  const totalSteps = goal.totalStepsCount || 0;
  const completedSteps = goal.completedStepsCount || 0;
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <StyledWrapper $accentColor={difficultyColor} onClick={() => onNavigate(goal.id)}>
      <div className="container noselect">
        <div className="canvas">
          <div className="tracker tr-1"></div>
          <div className="tracker tr-2"></div>
          <div className="tracker tr-3"></div>
          <div className="tracker tr-4"></div>
          <div className="tracker tr-5"></div>
          <div className="tracker tr-6"></div>
          <div className="tracker tr-7"></div>
          <div className="tracker tr-8"></div>
          <div className="tracker tr-9"></div>
          <div className="tracker tr-10"></div>
          <div className="tracker tr-11"></div>
          <div className="tracker tr-12"></div>
          <div className="tracker tr-13"></div>
          <div className="tracker tr-14"></div>
          <div className="tracker tr-15"></div>
          <div className="tracker tr-16"></div>
          <div className="tracker tr-17"></div>
          <div className="tracker tr-18"></div>
          <div className="tracker tr-19"></div>
          <div className="tracker tr-20"></div>
          <div className="tracker tr-21"></div>
          <div className="tracker tr-22"></div>
          <div className="tracker tr-23"></div>
          <div className="tracker tr-24"></div>
          <div className="tracker tr-25"></div>
          <div id="card">
            <div className="card-content">
              <div className="card-glare"></div>
              <div className="cyber-lines">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="glowing-elements">
                <div className="glow-1"></div>
                <div className="glow-2"></div>
                <div className="glow-3"></div>
              </div>
              <p id="prompt">{goal.name.toUpperCase()}</p>
              <div className="title">
                {goal.name.length > 20 ? goal.name.substring(0, 20).toUpperCase() + '...' : goal.name.toUpperCase()}
              </div>
              <div className="card-particles">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="subtitle">
                {difficultyLabel}
                <span className="highlight">{progressPercent}%</span>
              </div>
              <div className="corner-elements">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="scan-line"></div>
            </div>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div<{ $accentColor: string }>`
  .container {
    position: relative;
    width: 600px;
    height: 184px;
    transition: 200ms;
  }

  .container:active {
    width: 180px;
    height: 245px;
  }

  #card {
    position: absolute;
    inset: 0;
    z-index: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 20px;
    transition: 700ms;
    background: linear-gradient(45deg, #1a1a1a, #262626);
    border: 2px solid ${props => props.$accentColor}33;
    overflow: hidden;
    box-shadow:
      0 0 20px rgba(0, 0, 0, 0.3),
      0 0 30px ${props => props.$accentColor}15,
      inset 0 0 20px rgba(0, 0, 0, 0.2);
  }

  .card-content {
    position: relative;
    width: 100%;
    height: 100%;
  }

  #prompt {
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 20;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 2px;
    transition: 300ms ease-in-out;
    position: absolute;
    text-align: center;
    color: rgba(255, 255, 255, 0.7);
    text-shadow: 0 0 10px ${props => props.$accentColor}50;
    max-width: 90%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .title {
    opacity: 0;
    transition: 300ms ease-in-out;
    position: absolute;
    font-size: 22px;
    font-weight: 800;
    letter-spacing: 3px;
    text-align: center;
    width: 100%;
    padding: 20px 10px 0;
    background: linear-gradient(45deg, ${props => props.$accentColor}, ${props => props.$accentColor}aa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 0 15px ${props => props.$accentColor}50);
    line-height: 1.2;
    word-break: break-word;
  }

  .subtitle {
    position: absolute;
    bottom: 40px;
    width: 100%;
    text-align: center;
    font-size: 12px;
    letter-spacing: 2px;
    transform: translateY(30px);
    color: rgba(255, 255, 255, 0.6);
  }

  .highlight {
    color: ${props => props.$accentColor};
    margin-left: 8px;
    background: linear-gradient(90deg, ${props => props.$accentColor}, ${props => props.$accentColor}cc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: bold;
  }

  .glowing-elements {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .glow-1,
  .glow-2,
  .glow-3 {
    position: absolute;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: radial-gradient(
      circle at center,
      ${props => props.$accentColor}4d 0%,
      ${props => props.$accentColor}00 70%
    );
    filter: blur(15px);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .glow-1 {
    top: -20px;
    left: -20px;
  }
  .glow-2 {
    top: 50%;
    right: -30px;
    transform: translateY(-50%);
  }
  .glow-3 {
    bottom: -20px;
    left: 30%;
  }

  .card-particles span {
    position: absolute;
    width: 3px;
    height: 3px;
    background: ${props => props.$accentColor};
    border-radius: 50%;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  /* Hover effects */
  .tracker:hover ~ #card .title {
    opacity: 1;
    transform: translateY(-10px);
  }

  .tracker:hover ~ #card .glowing-elements div {
    opacity: 1;
  }

  .tracker:hover ~ #card .card-particles span {
    animation: particleFloat 2s infinite;
  }

  @keyframes particleFloat {
    0% {
      transform: translate(0, 0);
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
    100% {
      transform: translate(calc(var(--x, 0) * 30px), calc(var(--y, 0) * 30px));
      opacity: 0;
    }
  }

  /* Particle positions */
  .card-particles span:nth-child(1) {
    --x: 1;
    --y: -1;
    top: 40%;
    left: 20%;
  }
  .card-particles span:nth-child(2) {
    --x: -1;
    --y: -1;
    top: 60%;
    right: 20%;
  }
  .card-particles span:nth-child(3) {
    --x: 0.5;
    --y: 1;
    top: 20%;
    left: 40%;
  }
  .card-particles span:nth-child(4) {
    --x: -0.5;
    --y: 1;
    top: 80%;
    right: 40%;
  }
  .card-particles span:nth-child(5) {
    --x: 1;
    --y: 0.5;
    top: 30%;
    left: 60%;
  }
  .card-particles span:nth-child(6) {
    --x: -1;
    --y: 0.5;
    top: 70%;
    right: 60%;
  }

  #card::before {
    content: "";
    background: radial-gradient(
      circle at center,
      ${props => props.$accentColor}1a 0%,
      ${props => props.$accentColor}0d 50%,
      transparent 100%
    );
    filter: blur(20px);
    opacity: 0;
    width: 150%;
    height: 150%;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    transition: opacity 0.3s ease;
  }

  .tracker:hover ~ #card::before {
    opacity: 1;
  }

  .tracker {
    position: absolute;
    z-index: 200;
    width: 100%;
    height: 100%;
  }

  .tracker:hover {
    cursor: pointer;
  }

  .tracker:hover ~ #card #prompt {
    opacity: 0;
  }

  .tracker:hover ~ #card {
    transition: 300ms;
    filter: brightness(1.1);
  }

  .container:hover #card::before {
    transition: 200ms;
    content: "";
    opacity: 80%;
  }

  .canvas {
    perspective: 800px;
    inset: 0;
    z-index: 200;
    position: absolute;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
    grid-template-rows: 1fr 1fr 1fr 1fr 1fr;
    gap: 0px 0px;
    grid-template-areas:
      "tr-1 tr-2 tr-3 tr-4 tr-5"
      "tr-6 tr-7 tr-8 tr-9 tr-10"
      "tr-11 tr-12 tr-13 tr-14 tr-15"
      "tr-16 tr-17 tr-18 tr-19 tr-20"
      "tr-21 tr-22 tr-23 tr-24 tr-25";
  }

  .tr-1 { grid-area: tr-1; }
  .tr-2 { grid-area: tr-2; }
  .tr-3 { grid-area: tr-3; }
  .tr-4 { grid-area: tr-4; }
  .tr-5 { grid-area: tr-5; }
  .tr-6 { grid-area: tr-6; }
  .tr-7 { grid-area: tr-7; }
  .tr-8 { grid-area: tr-8; }
  .tr-9 { grid-area: tr-9; }
  .tr-10 { grid-area: tr-10; }
  .tr-11 { grid-area: tr-11; }
  .tr-12 { grid-area: tr-12; }
  .tr-13 { grid-area: tr-13; }
  .tr-14 { grid-area: tr-14; }
  .tr-15 { grid-area: tr-15; }
  .tr-16 { grid-area: tr-16; }
  .tr-17 { grid-area: tr-17; }
  .tr-18 { grid-area: tr-18; }
  .tr-19 { grid-area: tr-19; }
  .tr-20 { grid-area: tr-20; }
  .tr-21 { grid-area: tr-21; }
  .tr-22 { grid-area: tr-22; }
  .tr-23 { grid-area: tr-23; }
  .tr-24 { grid-area: tr-24; }
  .tr-25 { grid-area: tr-25; }

  .tr-1:hover ~ #card { transition: 125ms ease-in-out; transform: rotateX(20deg) rotateY(-10deg) rotateZ(0deg); }
  .tr-2:hover ~ #card { transition: 125ms ease-in-out; transform: rotateX(20deg) rotateY(-5deg) rotateZ(0deg); }
  .tr-3:hover ~ #card { transition: 125ms ease-in-out; transform: rotateX(20deg) rotateY(0deg) rotateZ(0deg); }
  .tr-4:hover ~ #card { transition: 125ms ease-in-out; transform: rotateX(20deg) rotateY(5deg) rotateZ(0deg); }
  .tr-5:hover ~ #card { transition: 125ms ease-in-out; transform: rotateX(20deg) rotateY(10deg) rotateZ(0deg); }

  .tr-6:hover ~ #card { transition: 125ms ease-in-out; transform: rotateX(10deg) rotateY(-10deg) rotateZ(0deg); }
  .tr-7:hover ~ #card { transition: 125ms ease-in-out; transform: rotateX(10deg) rotateY(-5deg) rotateZ(0deg); }
  .tr-8:hover ~ #card { transition: 125ms ease-in-out; transform: rotateX(10deg) rotateY(0deg) rotateZ(0deg); }
  .tr-9:hover ~ #card { transition: 125ms ease-in-out; transform: rotateX(10deg) rotateY(5deg) rotateZ(0deg); }
  .tr-10:hover ~ #card { transition: 125ms ease-in-out; transform: rotateX(10deg) rotateY(10deg) rotateZ(0deg); }

  .tr-11:hover ~ #card { transition: 125ms ease-in-out; transform: rotateX(0deg) rotateY(-10deg) rotateZ(0deg); }
  .tr-12:hover ~ #card { transition: 125ms ease-in-out; transform: rotateX(0deg) rotateY(-5deg) rotateZ(0deg); }
  .tr-13:hover ~ #card { transition: 125ms ease-in-out; transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
  .tr-14:hover ~ #card { transition: 125ms ease-in-out; transform: rotateX(0deg) rotateY(5deg) rotateZ(0deg); }
  .tr-15:hover ~ #card { transition: 125ms ease-in-out; transform: rotateX(0deg) rotateY(10deg) rotateZ(0deg); }

  .tr-16:hover ~ #card { transition: 125ms ease-in-out; transform: rotateX(-10deg) rotateY(-10deg) rotateZ(0deg); }
  .tr-17:hover ~ #card { transition: 125ms ease-in-out; transform: rotateX(-10deg) rotateY(-5deg) rotateZ(0deg); }
  .tr-18:hover ~ #card { transition: 125ms ease-in-out; transform: rotateX(-10deg) rotateY(0deg) rotateZ(0deg); }
  .tr-19:hover ~ #card { transition: 125ms ease-in-out; transform: rotateX(-10deg) rotateY(5deg) rotateZ(0deg); }
  .tr-20:hover ~ #card { transition: 125ms ease-in-out; transform: rotateX(-10deg) rotateY(10deg) rotateZ(0deg); }

  .tr-21:hover ~ #card { transition: 125ms ease-in-out; transform: rotateX(-20deg) rotateY(-10deg) rotateZ(0deg); }
  .tr-22:hover ~ #card { transition: 125ms ease-in-out; transform: rotateX(-20deg) rotateY(-5deg) rotateZ(0deg); }
  .tr-23:hover ~ #card { transition: 125ms ease-in-out; transform: rotateX(-20deg) rotateY(0deg) rotateZ(0deg); }
  .tr-24:hover ~ #card { transition: 125ms ease-in-out; transform: rotateX(-20deg) rotateY(5deg) rotateZ(0deg); }
  .tr-25:hover ~ #card { transition: 125ms ease-in-out; transform: rotateX(-20deg) rotateY(10deg) rotateZ(0deg); }

  .noselect {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  .card-glare {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      125deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.05) 45%,
      rgba(255, 255, 255, 0.1) 50%,
      rgba(255, 255, 255, 0.05) 55%,
      rgba(255, 255, 255, 0) 100%
    );
    opacity: 0;
    transition: opacity 300ms;
  }

  .cyber-lines span {
    position: absolute;
    background: linear-gradient(
      90deg,
      transparent,
      ${props => props.$accentColor}33,
      transparent
    );
  }

  .cyber-lines span:nth-child(1) {
    top: 20%;
    left: 0;
    width: 100%;
    height: 1px;
    transform: scaleX(0);
    transform-origin: left;
    animation: lineGrow 3s linear infinite;
  }

  .cyber-lines span:nth-child(2) {
    top: 40%;
    right: 0;
    width: 100%;
    height: 1px;
    transform: scaleX(0);
    transform-origin: right;
    animation: lineGrow 3s linear infinite 1s;
  }

  .cyber-lines span:nth-child(3) {
    top: 60%;
    left: 0;
    width: 100%;
    height: 1px;
    transform: scaleX(0);
    transform-origin: left;
    animation: lineGrow 3s linear infinite 2s;
  }

  .cyber-lines span:nth-child(4) {
    top: 80%;
    right: 0;
    width: 100%;
    height: 1px;
    transform: scaleX(0);
    transform-origin: right;
    animation: lineGrow 3s linear infinite 1.5s;
  }

  .corner-elements span {
    position: absolute;
    width: 15px;
    height: 15px;
    border: 2px solid ${props => props.$accentColor}4d;
  }

  .corner-elements span:nth-child(1) {
    top: 10px;
    left: 10px;
    border-right: 0;
    border-bottom: 0;
  }

  .corner-elements span:nth-child(2) {
    top: 10px;
    right: 10px;
    border-left: 0;
    border-bottom: 0;
  }

  .corner-elements span:nth-child(3) {
    bottom: 10px;
    left: 10px;
    border-right: 0;
    border-top: 0;
  }

  .corner-elements span:nth-child(4) {
    bottom: 10px;
    right: 10px;
    border-left: 0;
    border-top: 0;
  }

  .scan-line {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      transparent,
      ${props => props.$accentColor}1a,
      transparent
    );
    transform: translateY(-100%);
    animation: scanMove 2s linear infinite;
  }

  @keyframes lineGrow {
    0% { transform: scaleX(0); opacity: 0; }
    50% { transform: scaleX(1); opacity: 1; }
    100% { transform: scaleX(0); opacity: 0; }
  }

  @keyframes scanMove {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100%); }
  }

  #card:hover .card-glare { opacity: 1; }

  .corner-elements span { transition: all 0.3s ease; }

  #card:hover .corner-elements span {
    border-color: ${props => props.$accentColor}cc;
    box-shadow: 0 0 10px ${props => props.$accentColor}80;
  }
`;

export default BarViewGoalCard;
