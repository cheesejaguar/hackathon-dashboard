import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Commit, PullRequest, WorkflowRun } from '@/lib/types';

interface ParticleBurstProps {
  commits: Commit[];
  pullRequests: PullRequest[];
  workflowRuns: WorkflowRun[];
  isActive?: boolean;
}

interface BurstParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'spark' | 'trail' | 'explosion' | 'ripple';
  rotation: number;
  rotationSpeed: number;
  glowIntensity: number;
}

interface BurstEffect {
  x: number;
  y: number;
  type: 'commit' | 'pr' | 'success' | 'failure';
  intensity: number;
  startTime: number;
  duration: number;
}

export function ParticleBurst({ commits, pullRequests, workflowRuns, isActive = false }: ParticleBurstProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<BurstParticle[]>([]);
  const burstsRef = useRef<BurstEffect[]>([]);
  const { theme } = useTheme();
  const lastCommitCountRef = useRef(commits.length);
  const lastPRCountRef = useRef(pullRequests.length);
  const lastRunCountRef = useRef(workflowRuns.length);

  // Detect new activity and trigger bursts
  useEffect(() => {
    if (!isActive || theme !== 'vibes') return;

    // Check for new commits
    if (commits.length > lastCommitCountRef.current) {
      const newCommits = commits.length - lastCommitCountRef.current;
      triggerBurst('commit', Math.min(newCommits, 5));
      lastCommitCountRef.current = commits.length;
    }

    // Check for new PRs
    if (pullRequests.length > lastPRCountRef.current) {
      const newPRs = pullRequests.length - lastPRCountRef.current;
      triggerBurst('pr', Math.min(newPRs, 3));
      lastPRCountRef.current = pullRequests.length;
    }

    // Check for new workflow runs
    if (workflowRuns.length > lastRunCountRef.current) {
      const newRuns = workflowRuns.slice(lastRunCountRef.current);
      newRuns.forEach(run => {
        if (run.conclusion === 'success') {
          triggerBurst('success', 1);
        } else if (run.conclusion === 'failure') {
          triggerBurst('failure', 1);
        }
      });
      lastRunCountRef.current = workflowRuns.length;
    }
  }, [commits.length, pullRequests.length, workflowRuns.length, isActive, theme]);

  const triggerBurst = (type: 'commit' | 'pr' | 'success' | 'failure', intensity: number) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const burstCount = Math.min(intensity * 3, 15); // Scale burst size with intensity
    
    // Create multiple burst points for more dramatic effect
    for (let i = 0; i < burstCount; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height * 0.7 + canvas.height * 0.15; // Focus bursts in middle area
      
      burstsRef.current.push({
        x,
        y,
        type,
        intensity: intensity + Math.random() * 2,
        startTime: Date.now(),
        duration: 2000 + Math.random() * 1000
      });

      // Create initial burst particles
      createBurstParticles(x, y, type, intensity);
    }

    // Trigger screen flash for high intensity bursts
    if (intensity >= 5) {
      triggerScreenFlash();
    }
  };

  const triggerScreenFlash = () => {
    // Add screen flash effect to document body
    document.body.classList.add('screen-flash');
    setTimeout(() => {
      document.body.classList.remove('screen-flash');
    }, 300);
  };

  const createBurstParticles = (x: number, y: number, type: 'commit' | 'pr' | 'success' | 'failure', intensity: number) => {
    const colors = {
      commit: ['#ff00ff', '#ff0080', '#ff40c0'], // Hot pink variants
      pr: ['#00ffff', '#40ffff', '#80ffff'],     // Cyan variants
      success: ['#00ff00', '#40ff40', '#80ff80'], // Green variants
      failure: ['#ff0040', '#ff4060', '#ff8080']  // Red variants
    };

    const particleCount = Math.floor(intensity * 25 + 15); // More particles
    const burstColors = colors[type];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const speed = Math.random() * 12 + 3; // Faster particles
      const size = Math.random() * 8 + 2; // Larger particles
      
      // Create main spark particles with enhanced properties
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 180 + Math.random() * 90, // Longer life
        maxLife: 180 + Math.random() * 90,
        color: burstColors[Math.floor(Math.random() * burstColors.length)],
        size,
        type: 'spark',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        glowIntensity: Math.random() * 1.0 + 0.5 // Brighter glow
      });

      // Create more trailing particles for dense effect
      if (Math.random() < 0.5) {
        particlesRef.current.push({
          x: x + Math.random() * 30 - 15,
          y: y + Math.random() * 30 - 15,
          vx: Math.cos(angle) * speed * 0.4,
          vy: Math.sin(angle) * speed * 0.4,
          life: 250,
          maxLife: 250,
          color: burstColors[1] || burstColors[0],
          size: size * 0.6,
          type: 'trail',
          rotation: 0,
          rotationSpeed: 0,
          glowIntensity: 0.7
        });
      }
    }

    // Enhanced explosion center with pulsing effect
    particlesRef.current.push({
      x,
      y,
      vx: 0,
      vy: 0,
      life: 90,
      maxLife: 90,
      color: burstColors[0],
      size: intensity * 6 + 12, // Larger explosion
      type: 'explosion',
      rotation: 0,
      rotationSpeed: 0.15,
      glowIntensity: 1.5 // Maximum glow
    });

    // Create multiple ripple effects for more impact
    for (let r = 0; r < 5; r++) {
      particlesRef.current.push({
        x,
        y,
        vx: 0,
        vy: 0,
        life: 120 + r * 25,
        maxLife: 120 + r * 25,
        color: burstColors[r % burstColors.length],
        size: 3,
        type: 'ripple',
        rotation: r * 15,
        rotationSpeed: 0,
        glowIntensity: 1.0 - r * 0.15
      });
    }

    // Add special effects based on activity type
    if (type === 'commit') {
      // Commits create fountain effect
      for (let f = 0; f < 8; f++) {
        particlesRef.current.push({
          x: x + (Math.random() - 0.5) * 20,
          y,
          vx: (Math.random() - 0.5) * 4,
          vy: -Math.random() * 15 - 5,
          life: 200,
          maxLife: 200,
          color: burstColors[0],
          size: Math.random() * 4 + 2,
          type: 'spark',
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
          glowIntensity: 0.8
        });
      }
    } else if (type === 'failure') {
      // Failures create chaotic scattered particles
      for (let c = 0; c < 20; c++) {
        particlesRef.current.push({
          x: x + (Math.random() - 0.5) * 60,
          y: y + (Math.random() - 0.5) * 60,
          vx: (Math.random() - 0.5) * 16,
          vy: (Math.random() - 0.5) * 16,
          life: 100 + Math.random() * 50,
          maxLife: 100 + Math.random() * 50,
          color: burstColors[Math.floor(Math.random() * burstColors.length)],
          size: Math.random() * 3 + 1,
          type: 'trail',
          rotation: 0,
          rotationSpeed: 0,
          glowIntensity: 0.9
        });
      }
    }
  };

  // Main animation loop
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

      // Clear canvas with subtle fade
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw active bursts
      updateBursts(ctx, canvas.width, canvas.height);

      // Update and draw particles
      updateParticles(ctx);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, theme]);

  const updateBursts = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const now = Date.now();
    
    burstsRef.current.forEach((burst, index) => {
      const elapsed = now - burst.startTime;
      const progress = elapsed / burst.duration;
      
      if (progress >= 1) {
        burstsRef.current.splice(index, 1);
        return;
      }

      // Draw burst center glow
      const alpha = Math.max(0, 1 - progress * 2);
      const radius = progress * 50 * burst.intensity;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      
      // Create radial gradient for burst
      const gradient = ctx.createRadialGradient(
        burst.x, burst.y, 0,
        burst.x, burst.y, radius
      );
      
      const colors = {
        commit: '#ff00ff',
        pr: '#00ffff',
        success: '#00ff00',
        failure: '#ff0040'
      };
      
      gradient.addColorStop(0, colors[burst.type]);
      gradient.addColorStop(0.5, colors[burst.type] + '80');
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(burst.x, burst.y, radius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });
  };

  const updateParticles = (ctx: CanvasRenderingContext2D) => {
    particlesRef.current.forEach((particle, index) => {
      // Update particle physics
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Apply different physics based on particle type
      switch (particle.type) {
        case 'spark':
          particle.vy += 0.15; // gravity
          particle.vx *= 0.98; // air resistance
          particle.rotation += particle.rotationSpeed;
          break;
        case 'trail':
          particle.vy += 0.05; // lighter gravity
          particle.vx *= 0.95;
          break;
        case 'explosion':
          particle.size *= 1.05; // expand
          particle.rotation += particle.rotationSpeed;
          break;
        case 'ripple':
          particle.size += 2; // expand ripple
          particle.rotation += 1;
          break;
      }
      
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
      ctx.shadowBlur = particle.glowIntensity * 15;
      
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      
      // Draw different shapes based on particle type
      switch (particle.type) {
        case 'spark':
          // Star shape
          drawStar(ctx, 0, 0, particle.size, particle.size * 0.4, 5);
          break;
        case 'trail':
          // Small circle
          ctx.beginPath();
          ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'explosion':
          // Large pulsing circle
          ctx.beginPath();
          ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'ripple':
          // Expanding ring
          ctx.strokeStyle = particle.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
          ctx.stroke();
          break;
      }
      
      ctx.restore();
    });
  };

  const drawStar = (ctx: CanvasRenderingContext2D, x: number, y: number, outerRadius: number, innerRadius: number, points: number) => {
    const step = Math.PI / points;
    
    ctx.beginPath();
    ctx.moveTo(x, y - outerRadius);
    
    for (let i = 0; i <= 2 * points; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = i * step - Math.PI / 2;
      ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
    }
    
    ctx.closePath();
    ctx.fill();
  };

  // Don't render if not in vibes mode
  if (theme !== 'vibes' || !isActive) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[1]">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ mixBlendMode: 'screen' }}
      />
    </div>
  );
}