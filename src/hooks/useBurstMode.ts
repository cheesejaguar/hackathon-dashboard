import { useState, useEffect, useRef } from 'react';
import { Commit, PullRequest, WorkflowRun } from '@/lib/types';

interface BurstModeState {
  isActive: boolean;
  intensity: number;
  lastTrigger: Date | null;
  burstType: 'commit' | 'pr' | 'success' | 'failure' | null;
}

export function useBurstMode(
  commits: Commit[],
  pullRequests: PullRequest[],
  workflowRuns: WorkflowRun[],
  isVibesMode: boolean
) {
  const [burstState, setBurstState] = useState<BurstModeState>({
    isActive: false,
    intensity: 0,
    lastTrigger: null,
    burstType: null
  });

  const lastCommitCountRef = useRef(commits.length);
  const lastPRCountRef = useRef(pullRequests.length);
  const lastRunCountRef = useRef(workflowRuns.length);
  const burstTimeoutRef = useRef<NodeJS.Timeout>();

  // Trigger burst mode when new activity is detected
  useEffect(() => {
    if (!isVibesMode) {
      setBurstState(prev => ({ ...prev, isActive: false }));
      return;
    }

    let triggered = false;
    let newBurstType: 'commit' | 'pr' | 'success' | 'failure' | null = null;
    let intensity = 0;

    // Check for new commits
    if (commits.length > lastCommitCountRef.current) {
      const newCommits = commits.length - lastCommitCountRef.current;
      intensity = Math.max(intensity, Math.min(newCommits * 2, 10));
      newBurstType = 'commit';
      triggered = true;
      lastCommitCountRef.current = commits.length;
    }

    // Check for new PRs
    if (pullRequests.length > lastPRCountRef.current) {
      const newPRs = pullRequests.length - lastPRCountRef.current;
      intensity = Math.max(intensity, Math.min(newPRs * 3, 8));
      newBurstType = 'pr';
      triggered = true;
      lastPRCountRef.current = pullRequests.length;
    }

    // Check for new workflow runs
    if (workflowRuns.length > lastRunCountRef.current) {
      const newRuns = workflowRuns.slice(lastRunCountRef.current);
      const hasSuccess = newRuns.some(run => run.conclusion === 'success');
      const hasFailure = newRuns.some(run => run.conclusion === 'failure');
      
      if (hasFailure) {
        intensity = Math.max(intensity, 7);
        newBurstType = 'failure';
        triggered = true;
      } else if (hasSuccess) {
        intensity = Math.max(intensity, 5);
        newBurstType = 'success';
        triggered = true;
      }
      
      lastRunCountRef.current = workflowRuns.length;
    }

    if (triggered) {
      setBurstState({
        isActive: true,
        intensity,
        lastTrigger: new Date(),
        burstType: newBurstType
      });

      // Clear any existing timeout
      if (burstTimeoutRef.current) {
        clearTimeout(burstTimeoutRef.current);
      }

      // Auto-deactivate burst mode after duration based on intensity
      const duration = Math.max(2000, intensity * 500); // 2-5 seconds based on intensity
      burstTimeoutRef.current = setTimeout(() => {
        setBurstState(prev => ({ ...prev, isActive: false }));
      }, duration);
    }
  }, [commits.length, pullRequests.length, workflowRuns.length, isVibesMode]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (burstTimeoutRef.current) {
        clearTimeout(burstTimeoutRef.current);
      }
    };
  }, []);

  // Manual trigger for testing or special events
  const triggerBurst = (type: 'commit' | 'pr' | 'success' | 'failure', intensity: number = 5) => {
    if (!isVibesMode) return;

    setBurstState({
      isActive: true,
      intensity,
      lastTrigger: new Date(),
      burstType: type
    });

    if (burstTimeoutRef.current) {
      clearTimeout(burstTimeoutRef.current);
    }

    const duration = Math.max(2000, intensity * 500);
    burstTimeoutRef.current = setTimeout(() => {
      setBurstState(prev => ({ ...prev, isActive: false }));
    }, duration);
  };

  // Calculate the time since last burst for decay effects
  const timeSinceLastBurst = burstState.lastTrigger 
    ? Date.now() - burstState.lastTrigger.getTime()
    : Infinity;

  return {
    burstMode: burstState,
    triggerBurst,
    timeSinceLastBurst,
    // Helper functions for applying burst effects
    getBurstClassName: () => burstState.isActive ? 'burst-active' : '',
    getIntensityLevel: () => {
      if (!burstState.isActive) return 'none';
      if (burstState.intensity >= 8) return 'extreme';
      if (burstState.intensity >= 5) return 'high';
      if (burstState.intensity >= 3) return 'medium';
      return 'low';
    }
  };
}