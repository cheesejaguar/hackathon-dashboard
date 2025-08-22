import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Commit, PullRequest, WorkflowRun } from '@/lib/types';

interface SynthwaveVisualizerProps {
  commits: Commit[];
  pullRequests: PullRequest[];
  workflowRuns: WorkflowRun[];
  isActive?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'commit' | 'pr' | 'success' | 'failure';
}

interface WaveBar {
  height: number;
  targetHeight: number;
  color: string;
  glowIntensity: number;
}

export function SynthwaveVisualizer({ commits, pullRequests, workflowRuns, isActive = false }: SynthwaveVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const waveBarsRef = useRef<WaveBar[]>([]);
  const { theme } = useTheme();
  const [lastActivity, setLastActivity] = useState<Date>(new Date());

  // Initialize wave bars
  useEffect(() => {
    const barCount = 32;
    waveBarsRef.current = Array.from({ length: barCount }, (_, i) => ({
      height: 0,
      targetHeight: Math.random() * 20 + 10,
      color: i % 4 === 0 ? '#ff00ff' : i % 4 === 1 ? '#00ffff' : i % 4 === 2 ? '#ffff00' : '#ff0080',
      glowIntensity: 0.5
    }));
  }, []);

  // Create particles based on repository activity
  const createParticles = (type: 'commit' | 'pr' | 'success' | 'failure', count: number = 1) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const colors = {
      commit: '#ff00ff', // Hot pink for commits
      pr: '#00ffff',     // Cyan for PRs
      success: '#00ff00', // Green for success
      failure: '#ff0040'  // Red for failures
    };

    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: canvas.height,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 8 - 2,
        life: 100,
        maxLife: 100,
        color: colors[type],
        size: Math.random() * 4 + 2,
        type
      });
    }
    
    // Trigger wave animation
    waveBarsRef.current.forEach((bar, i) => {
      bar.targetHeight = Math.random() * 60 + 20;
      bar.glowIntensity = Math.random() * 0.8 + 0.4;
    });
    
    setLastActivity(new Date());
  };

  // Monitor repository activity changes
  useEffect(() => {
    const recentCommits = commits.filter(commit => 
      new Date(commit.commit.author.date) > new Date(Date.now() - 5 * 60 * 1000)
    );
    
    const recentPRs = pullRequests.filter(pr => 
      new Date(pr.updated_at) > new Date(Date.now() - 5 * 60 * 1000)
    );
    
    const recentRuns = workflowRuns.filter(run => 
      new Date(run.updated_at) > new Date(Date.now() - 5 * 60 * 1000)
    );

    if (recentCommits.length > 0) {
      createParticles('commit', Math.min(recentCommits.length, 5));
    }
    
    if (recentPRs.length > 0) {
      createParticles('pr', Math.min(recentPRs.length, 3));
    }
    
    recentRuns.forEach(run => {
      if (run.conclusion === 'success') {
        createParticles('success', 2);
      } else if (run.conclusion === 'failure') {
        createParticles('failure', 3);
      }
    });
  }, [commits, pullRequests, workflowRuns]);

  // Animation loop
  useEffect(() => {
    if (!isActive || theme !== 'vibes') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      // Resize canvas to match container
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      // Clear canvas with fade effect
      ctx.fillStyle = 'rgba(20, 8, 40, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid background
      drawGrid(ctx, canvas.width, canvas.height);
      
      // Draw wave bars
      drawWaveBars(ctx, canvas.width, canvas.height);
      
      // Update and draw particles
      updateParticles(ctx);
      
      // Draw activity pulses
      drawActivityPulses(ctx, canvas.width, canvas.height);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, theme, lastActivity]);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 40;
    ctx.strokeStyle = 'rgba(255, 0, 255, 0.1)';
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    for (let x = 0; x <= width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
  };

  const drawWaveBars = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const barWidth = width / waveBarsRef.current.length;
    
    waveBarsRef.current.forEach((bar, i) => {
      // Smooth height transition
      bar.height += (bar.targetHeight - bar.height) * 0.1;
      
      const x = i * barWidth;
      const barHeight = bar.height * (height / 100);
      
      // Draw bar with glow effect
      ctx.fillStyle = bar.color;
      ctx.shadowColor = bar.color;
      ctx.shadowBlur = bar.glowIntensity * 20;
      
      // Main bar
      ctx.fillRect(x + 2, height - barHeight, barWidth - 4, barHeight);
      
      // Top glow
      const gradient = ctx.createLinearGradient(x, height - barHeight, x, height - barHeight - 20);
      gradient.addColorStop(0, bar.color);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(x + 2, height - barHeight - 20, barWidth - 4, 20);
      
      // Reset shadow
      ctx.shadowBlur = 0;
      
      // Gradually decrease target height for idle animation
      bar.targetHeight *= 0.99;
      if (bar.targetHeight < 10) bar.targetHeight = 10;
      bar.glowIntensity *= 0.98;
      if (bar.glowIntensity < 0.3) bar.glowIntensity = 0.3;
    });
  };

  const updateParticles = (ctx: CanvasRenderingContext2D) => {
    particlesRef.current.forEach((particle, index) => {
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.1; // gravity
      particle.life--;
      
      // Remove dead particles
      if (particle.life <= 0) {
        particlesRef.current.splice(index, 1);
        return;
      }
      
      // Draw particle
      const alpha = particle.life / particle.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 10;
      
      // Draw particle shape based on type
      if (particle.type === 'commit') {
        // Diamond shape for commits
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y - particle.size);
        ctx.lineTo(particle.x + particle.size, particle.y);
        ctx.lineTo(particle.x, particle.y + particle.size);
        ctx.lineTo(particle.x - particle.size, particle.y);
        ctx.closePath();
        ctx.fill();
      } else if (particle.type === 'pr') {
        // Arrow shape for PRs
        ctx.beginPath();
        ctx.moveTo(particle.x - particle.size, particle.y - particle.size/2);
        ctx.lineTo(particle.x, particle.y - particle.size);
        ctx.lineTo(particle.x + particle.size, particle.y);
        ctx.lineTo(particle.x, particle.y + particle.size);
        ctx.lineTo(particle.x - particle.size, particle.y + particle.size/2);
        ctx.closePath();
        ctx.fill();
      } else {
        // Circle for success/failure
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    });
  };

  const drawActivityPulses = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const timeSinceActivity = Date.now() - lastActivity.getTime();
    if (timeSinceActivity < 3000) { // Show pulse for 3 seconds after activity
      const progress = timeSinceActivity / 3000;
      const radius = (1 - progress) * Math.min(width, height) * 0.3;
      const alpha = (1 - progress) * 0.5;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ff00ff';
      ctx.shadowBlur = 20;
      
      // Draw expanding circle from center
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.restore();
    }
  };

  // Don't render if not in vibes mode
  if (theme !== 'vibes' || !isActive) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 opacity-30">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ mixBlendMode: 'screen' }}
      />
    </div>
  );
}