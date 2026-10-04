/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ShieldAlert, 
  Clock, 
  Activity, 
  Users, 
  ChevronRight, 
  AlertCircle, 
  FileText, 
  Send, 
  RefreshCcw,
  CheckCircle2,
  Lock,
  Download,
  Info,
  Radio,
  Volume2,
  VolumeX,
  Zap,
  Navigation,
  MessageSquare,
  DoorOpen,
  Search,
  LogOut,
  AlertTriangle,
  Mic2,
  UserCheck,
  Building,
  UserX,
  Flame,
  Stethoscope,
  Shield,
  Truck,
  Wind,
  Server,
  Droplets,
  Package,
  HardHat,
  Share2,
  Layers,
  Key,
  FlameKindling,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { jsPDF } from 'jspdf';
import { scenarios, Scenario } from './data/scenarios';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';

type AppPhase = 'LOBBY' | 'TEAM_SETUP' | 'TERMINAL' | 'RESULT' | 'FINAL_DASHBOARD';

interface TeamRoles {
  teamLeader: string;
  suppressionLead: string;
  casualtyCareLead: string;
  evacuationSupportLead: string;
  externalLiaison: string;
}

interface TacticalAction {
  id: string;
  label: string;
  isCorrect: boolean;
  impact: Partial<PerformanceGauges>;
  logMsg: string;
  description: string;
}

const TACTICAL_ACTIONS: Record<string, TacticalAction[]> = {
  teamLeader: [
    { 
      id: 'icp', 
      label: 'Establish Ground ICP', 
      isCorrect: true, 
      impact: { regulatory: 15, egressFlow: 10 }, 
      logMsg: 'Incident Command Post established at Ground Foyer Assembly Point with Building Evacuation Warden.',
      description: 'Establishes unified command outside office risk envelope and coordinates with AOCC.'
    },
    { 
      id: 'cvse', 
      label: 'Office Evac Directive', 
      isCorrect: true, 
      impact: { containment: 15, egressFlow: 15 }, 
      logMsg: 'Ordered horizontal evacuation to fire compartment B, followed by phased stairwell egress.',
      description: 'Executes compartmentalized evacuation logic for open cubicles and executive suites.'
    },
    { 
      id: 'cpr_tl', 
      label: 'Perform Hands-On CPR', 
      isCorrect: false, 
      impact: { regulatory: -20, lifeSafety: -10 }, 
      logMsg: 'TACTICAL ERROR: Team Leader abandoned command post to deliver compressions; lost multi-floor oversight.',
      description: 'Commanders must maintain global situational awareness, not engage in hands-on medical care.'
    },
    { 
      id: 'enter_burn', 
      label: 'Enter Smoke-Filled Office', 
      isCorrect: false, 
      impact: { regulatory: -25, lifeSafety: -20 }, 
      logMsg: 'CRITICAL FAILURE: Incident Commander entered unvented office without SCBA; command hierarchy collapsed.',
      description: 'Unprotected entry violates GACA safety mandates and incapacitates command personnel.'
    },
  ],
  suppressionLead: [
    { 
      id: 'iso', 
      label: 'Trip Office Sub-Panel', 
      isCorrect: true, 
      impact: { containment: 20, regulatory: 10 }, 
      logMsg: 'Emergency breaker isolated office floor sub-panel & energized ceiling distribution busway.',
      description: 'Removes electrocution hazards from office electronics and computer power lines.'
    },
    { 
      id: 'pass', 
      label: 'PASS Attack (CO2 / Clean)', 
      isCorrect: true, 
      impact: { containment: 25, lifeSafety: 10 }, 
      logMsg: 'Deployed Clean Agent/CO2 at 2.5m standoff utilizing PASS mechanics (Pull, Aim, Squeeze, Sweep).',
      description: 'Suppresses electrical and office furniture fire without leaving corrosive residue on IT equipment.'
    },
    { 
      id: 'water_c', 
      label: 'Discharge Water on IT Rack', 
      isCorrect: false, 
      impact: { containment: -25, lifeSafety: -25 }, 
      logMsg: 'CRITICAL SAFETY BREACH: Water stream directed onto energized 480V office server rack. Violent arc blast.',
      description: 'Discharging water onto energized office electrical infrastructure creates catastrophic electrocution risk.'
    },
    { 
      id: 'no_ppe', 
      label: 'Enter Office Without PPE', 
      isCorrect: false, 
      impact: { lifeSafety: -35 }, 
      logMsg: 'SAFETY VIOLATION: Suppression officer entered burning office partition without respiratory protection.',
      description: 'Acoustic tile and foam partition smoke contains lethal concentrations of HCN and CO.'
    },
  ],
  casualtyCareLead: [
    { 
      id: 'survey', 
      label: 'Primary <C>ABCDE Survey', 
      isCorrect: true, 
      impact: { lifeSafety: 20, regulatory: 10 }, 
      logMsg: 'Primary trauma assessment completed. Catastrophic bleed arrested, cervical spine maintained, airway cleared.',
      description: 'Rapid systematic assessment of injured office worker to identify immediately life-threatening conditions.'
    },
    { 
      id: 'cpr_cycle', 
      label: 'High-Quality CPR & AED', 
      isCorrect: true, 
      impact: { lifeSafety: 25 }, 
      logMsg: 'Delivering continuous 30:2 compressions (110 bpm, 5cm depth). Office corridor AED attached and analyzing.',
      description: 'Immediate defibrillation and minimal-interruption CPR maximize cerebral and coronary perfusion.'
    },
    { 
      id: 'pause_cpr', 
      label: 'Pause CPR to Record Notes', 
      isCorrect: false, 
      impact: { lifeSafety: -20 }, 
      logMsg: 'PROTOCOL ERROR: Compressions paused >10 seconds to transcribe vitals; perfusion pressure dropped.',
      description: 'Never interrupt chest compressions for clerical logging or non-vital administrative tasks.'
    },
    { 
      id: 'touch_shock', 
      label: 'Touch Patient During Shock', 
      isCorrect: false, 
      impact: { lifeSafety: -30 }, 
      logMsg: 'CRITICAL ERROR: Rescuer touching casualty during AED shock discharge. Second casualty created.',
      description: 'Clear verbal and visual sweeps ("ALL CLEAR") are strictly mandatory before discharging defibrillator.'
    },
  ],
  evacuationSupportLead: [
    { 
      id: 'sweep', 
      label: 'Left-to-Right Office Sweep', 
      isCorrect: true, 
      impact: { egressFlow: 25, regulatory: 10 }, 
      logMsg: 'Conducted systematic sweep of cubicles, soundproof booths, restrooms, and conference rooms. Magnetic door tags applied.',
      description: 'Ensures no office personnel or visitors remain trapped in acoustic pods or private rooms.'
    },
    { 
      id: 'lnnh', 
      label: 'Transmit L-N-N-H to AOCC', 
      isCorrect: true, 
      impact: { regulatory: 25, egressFlow: 10 }, 
      logMsg: 'Official 4-part L-N-N-H report transmitted to Airport Operations Control Center (AOCC).',
      description: 'Communicates Location, Nature, Numbers, and Hazards to dispatch Civil Defense and emergency medical assets.'
    },
    { 
      id: 'codes', 
      label: 'Transmit Ambiguous 10-Codes', 
      isCorrect: false, 
      impact: { regulatory: -15 }, 
      logMsg: 'COMMUNICATION ERROR: Non-standard 10-codes used on inter-agency radio. GACA clear-text standard breached.',
      description: 'Multi-agency office evacuations require plain, clear language to avoid misinterpretation.'
    },
    { 
      id: 'reentry', 
      label: 'Permit Staff Re-entry', 
      isCorrect: false, 
      impact: { lifeSafety: -25, regulatory: -15 }, 
      logMsg: 'SECURITY BREACH: Permitted office workers to re-enter smoke envelope to retrieve laptops and car keys.',
      description: 'Occupants must never be allowed re-entry until Civil Defense grants official building All-Clear.'
    },
  ],
};

interface PerformanceGauges {
  containment: number;
  lifeSafety: number;
  egressFlow: number;
  regulatory: number;
}

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('LOBBY');
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [roles, setRoles] = useState<TeamRoles>({
    teamLeader: '',
    suppressionLead: '',
    casualtyCareLead: '',
    evacuationSupportLead: '',
    externalLiaison: ''
  });

  // Sound effects toggle
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Simulation State
  const [time, setTime] = useState(900); // 15 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [activeInjects, setActiveInjects] = useState<string[]>([]);
  const [radioBlackout, setRadioBlackout] = useState(false);
  const [stairwellCompromised, setStairwellCompromised] = useState(false);
  const [turnstileJammed, setTurnstileJammed] = useState(false);
  const [activeFloorTab, setActiveFloorTab] = useState<'schematic' | 'occupants' | 'sensors'>('schematic');
  
  // Modals
  const [showLnnhModal, setShowLnnhModal] = useState(false);
  const [showAtmistModal, setShowAtmistModal] = useState(false);
  const [showFacilitatorPanel, setShowFacilitatorPanel] = useState(false);

  // Guided Flow
  const [currentStep, setCurrentStep] = useState(1);
  const steps = [
    { id: 1, title: 'Mobilization', desc: 'Confirm all 5 certified functional roles for Airport Offices ERT.' },
    { id: 2, title: 'Office Size-Up', desc: 'Analyze office floorplate schematic, occupant density, and smoke migration paths.' },
    { id: 3, title: 'L-N-N-H Report', desc: 'Transmit the mandatory 4-part office situation report to AOCC & Civil Defense.' },
    { id: 4, title: 'Stabilization', desc: 'Execute parallel actions: Sub-panel power trip, Primary Medical Survey, and Cubicle/Room Sweeps.' },
    { id: 5, title: 'Cascading Response', desc: 'Resolve secondary office failures (Stairwell pressurization, jammed magnetic fire doors, HVAC smoke dampers).' },
    { id: 6, title: 'Handover Preparation', desc: 'Compile ATMIST medical dossier and verify complete office floor headcounts.' },
    { id: 7, title: 'Tactical Handover', desc: 'Deliver technical dossier and execute formal command transfer to Civil Defense at Ground Assembly Point.' }
  ];

  // Tactical Gauges
  const [gauges, setGauges] = useState<PerformanceGauges>({
    containment: 70,
    lifeSafety: 80,
    egressFlow: 55,
    regulatory: 65
  });

  // Logs
  const [lnnhSent, setLnnhSent] = useState(false);
  const [tacticalLog, setTacticalLog] = useState<{time: string, msg: string, type?: 'info' | 'alert' | 'success' | 'danger'}[]>([]);
  
  // Scoring
  const [score, setScore] = useState(0);
  const [plusDelta, setPlusDelta] = useState({ 
    plus: ['Rapid sub-panel isolation prevented electrical conflagration', 'Clear text radio communication between floor wardens', 'Thorough sweep of quiet rooms and restrooms'], 
    delta: ['Initial hesitation in ordering horizontal compartmentalization', 'Minor congestion around North Stairwell door', 'Better briefing needed for visitor badging applicants'] 
  });
  const [executedActions, setExecutedActions] = useState<string[]>([]);
  const [atmistGenerated, setAtmistGenerated] = useState(false);
  const [roleActionCounts, setRoleActionCounts] = useState<Record<string, number>>({
    teamLeader: 0,
    suppressionLead: 0,
    casualtyCareLead: 0,
    evacuationSupportLead: 0,
  });

  // Audio tone generator
  const playTacticalSound = (freq = 440, type: OscillatorType = 'sine', duration = 0.15) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {
      // AudioContext unavailable or blocked by browser policy
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const addTacticalLog = (msg: string, type: 'info' | 'alert' | 'success' | 'danger' = 'info') => {
    const timestamp = formatTime(time);
    setTacticalLog(prev => [{ time: timestamp, msg, type }, ...prev]);
  };

  // Timer & Injects
  useEffect(() => {
    let interval: any;
    if (isActive && time > 0) {
      interval = setInterval(() => {
        setTime(prev => {
          const newTime = prev - 1;
          const elapsed = 900 - newTime;
          
          // Check for injects
          if (selectedScenario) {
            selectedScenario.cascadingInjects.forEach(inject => {
              if (elapsed === inject.time) {
                setActiveInjects(prevInjects => {
                  if (prevInjects.includes(inject.title)) return prevInjects;
                  return [...prevInjects, inject.title];
                });
                addTacticalLog(`INJECT ALERT: ${inject.title} - ${inject.description}`, 'alert');
                playTacticalSound(660, 'square', 0.25);
                
                // Specific inject flags
                if (inject.type === 'RADIO') setRadioBlackout(true);
                if (inject.title.toLowerCase().includes('stairwell')) setStairwellCompromised(true);
                if (inject.title.toLowerCase().includes('turnstile') || inject.title.toLowerCase().includes('jam')) setTurnstileJammed(true);
                
                // Penalize gauges for inject onset
                setGauges(g => ({
                  ...g,
                  regulatory: Math.max(0, g.regulatory - 8),
                  egressFlow: inject.type === 'SECURITY' ? Math.max(0, g.egressFlow - 15) : g.egressFlow,
                  containment: inject.type === 'SYSTEM' ? Math.max(0, g.containment - 10) : g.containment
                }));
              }
            });
          }

          // Natural decay
          setGauges(g => ({
            containment: Math.max(0, g.containment - 0.04),
            lifeSafety: Math.max(0, g.lifeSafety - 0.08),
            egressFlow: Math.max(0, g.egressFlow - 0.05),
            regulatory: Math.max(0, g.regulatory - 0.03)
          }));

          return newTime;
        });
      }, 1000);
    } else if (time === 0 && isActive) {
      handleFinishDrill();
    }
    return () => clearInterval(interval);
  }, [isActive, time, selectedScenario]);

  const handleSelectGroup = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setPhase('TEAM_SETUP');
    setIsActive(true);
    setCurrentStep(1);
    playTacticalSound(520, 'sine', 0.15);
    addTacticalLog(`OFFICE SECTOR INITIALIZED: ${scenario.name.toUpperCase()} (${scenario.floorLevel})`, 'info');
  };

  const handleStartDrill = () => {
    if (Object.values(roles).some(r => !r)) return;
    setPhase('TERMINAL');
    setCurrentStep(2);
    playTacticalSound(600, 'triangle', 0.2);
    addTacticalLog('OFFICE ERT TERMINAL ONLINE: Commencing Initial Floorplate Size-Up', 'success');
  };

  const handleFinishDrill = () => {
    setIsActive(false);
    
    const gaugeScore = (gauges.containment + gauges.lifeSafety + gauges.egressFlow + gauges.regulatory) / 4;
    
    let correctCount = 0;
    let incorrectCount = 0;
    
    executedActions.forEach(id => {
      Object.values(TACTICAL_ACTIONS).flat().forEach(a => {
        if (a.id === id) {
          if (a.isCorrect) correctCount++;
          else incorrectCount++;
        }
      });
    });

    const actionScore = Math.max(0, (correctCount * 12.5) - (incorrectCount * 20));
    const finalScore = Math.round((gaugeScore * 0.4) + (actionScore * 0.6));
    
    setScore(finalScore);
    setPhase('RESULT');
    if (finalScore >= 80) {
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    }
  };

  const performAction = (role: string, actionId: string) => {
    if (!isActive) return;
    
    const currentCount = roleActionCounts[role] || 0;
    if (currentCount >= 2 && !executedActions.includes(actionId)) {
      alert(`Role Limit Reached: A maximum of 2 core tactical decisions permitted per functional lead.`);
      return;
    }

    if (executedActions.includes(actionId)) return;

    const action = TACTICAL_ACTIONS[role]?.find(a => a.id === actionId);
    if (!action) return;

    playTacticalSound(action.isCorrect ? 580 : 280, action.isCorrect ? 'sine' : 'sawtooth', 0.2);

    setGauges(prev => ({
      containment: Math.min(100, Math.max(0, prev.containment + (action.impact.containment || 0))),
      lifeSafety: Math.min(100, Math.max(0, prev.lifeSafety + (action.impact.lifeSafety || 0))),
      egressFlow: Math.min(100, Math.max(0, prev.egressFlow + (action.impact.egressFlow || 0))),
      regulatory: Math.min(100, Math.max(0, prev.regulatory + (action.impact.regulatory || 0)))
    }));

    setExecutedActions(prev => [...prev, actionId]);
    setRoleActionCounts(prev => ({ ...prev, [role]: (prev[role] || 0) + 1 }));
    addTacticalLog(
      `${roles[role as keyof TeamRoles].toUpperCase()} [${role.replace(/([A-Z])/g, ' $1').toUpperCase()}]: ${action.logMsg}`, 
      action.isCorrect ? 'success' : 'danger'
    );
    
    if (actionId === 'lnnh') setLnnhSent(true);
  };

  const handleQuickFillRoles = () => {
    setRoles({
      teamLeader: 'Capt. Tariq Al-Ghamdi',
      suppressionLead: 'Fahad Al-Shehri',
      casualtyCareLead: 'Dr. Noura Al-Zahrani',
      evacuationSupportLead: 'Majed Al-Otaibi',
      externalLiaison: 'Sultan Al-Dossary'
    });
  };

  const sendWhatsApp = () => {
    const text = `*KSIA Airport Offices ERT Mission Dossier*%0A%0AScenario: ${selectedScenario?.name}%0ALocation: ${selectedScenario?.location}%0AOperational Score: ${score}/100%0AStatus: ${score >= 80 ? 'GACA CERTIFIED (OFFICE COMPLEX)' : 'RE-DRILL REQUIRED'}%0A%0ATactical terminal certified for King Salman International Airport Corporate & Administrative Directorate.`;
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Keyboard hotkeys for trainers / facilitators
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'TERMINAL' || !e.shiftKey || !e.ctrlKey) return;
      
      e.preventDefault();
      switch(e.key) {
        case 'F1':
          setRadioBlackout(true);
          addTacticalLog('FACILITATOR INJECT: RF DEADZONE TRIGGERED IN STRUCTURAL OFFICE CORE', 'alert');
          playTacticalSound(300, 'sawtooth', 0.3);
          break;
        case 'F2':
          setGauges(prev => ({ ...prev, lifeSafety: Math.max(0, prev.lifeSafety - 25) }));
          addTacticalLog('FACILITATOR INJECT: SUDDEN VENTRICULAR FIBRILLATION IN OFFICE CASUALTY', 'danger');
          playTacticalSound(220, 'square', 0.4);
          break;
        case 'F3':
          setStairwellCompromised(true);
          setGauges(prev => ({ ...prev, egressFlow: Math.max(0, prev.egressFlow - 25) }));
          addTacticalLog('FACILITATOR INJECT: PRIMARY OFFICE STAIRWELL A SMOKE DAMPER COMPROMISED', 'danger');
          break;
        case 'F4':
          setTurnstileJammed(true);
          setGauges(prev => ({ ...prev, egressFlow: Math.max(0, prev.egressFlow - 20) }));
          addTacticalLog('FACILITATOR INJECT: MAGNETIC BADGE TURNSTILE JAMMED IN FAIL-SECURE', 'alert');
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase]);

  const downloadDossier = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('KSIA Airport Offices Technical Incident Dossier', 20, 20);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('KING SALMAN INTERNATIONAL AIRPORT - ADMINISTRATIVE & CORPORATE ERT', 20, 27);
    
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 31, 190, 31);

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Scenario: ${selectedScenario?.name}`, 20, 40);
    doc.text(`Facility: ${selectedScenario?.location}`, 20, 47);
    doc.text(`Building Level: ${selectedScenario?.floorLevel}`, 20, 54);
    doc.text(`Final Performance Score: ${score}/100 [${score >= 80 ? 'GACA CERTIFIED' : 'FAILED - RETRAINING REQUIRED'}]`, 20, 61);
    
    doc.setFontSize(10);
    doc.text(`Incident Commander (Team Lead): ${roles.teamLeader}`, 20, 71);
    doc.text(`Suppression Specialist: ${roles.suppressionLead}`, 20, 77);
    doc.text(`Casualty Care Lead: ${roles.casualtyCareLead}`, 20, 83);
    doc.text(`Evacuation Floor Warden: ${roles.evacuationSupportLead}`, 20, 89);
    doc.text(`AOCC External Liaison: ${roles.externalLiaison}`, 20, 95);
    
    const correctActions: string[] = [];
    const incorrectActions: string[] = [];
    
    executedActions.forEach(id => {
      Object.values(TACTICAL_ACTIONS).flat().forEach(a => {
        if (a.id === id) {
          if (a.isCorrect) correctActions.push(a.label);
          else incorrectActions.push(a.label);
        }
      });
    });

    const allCorrectIds = Object.values(TACTICAL_ACTIONS).flat().filter(a => a.isCorrect).map(a => a.id);
    const omissions = allCorrectIds.filter(id => !executedActions.includes(id)).map(id => {
      return Object.values(TACTICAL_ACTIONS).flat().find(a => a.id === id)?.label || '';
    });

    doc.setFontSize(13);
    doc.text('1. Office Tactical Decision Audit', 20, 108);
    doc.setFontSize(10);
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text(`Compliant Actions: ${correctActions.length > 0 ? correctActions.join(', ') : 'None'}`, 20, 116, { maxWidth: 170 });
    
    doc.setTextColor(239, 68, 68); // Red
    doc.text(`Critical Tactical Errors: ${incorrectActions.length > 0 ? incorrectActions.join(', ') : 'None'}`, 20, 128, { maxWidth: 170 });
    
    doc.setTextColor(100, 116, 139); // Slate
    doc.text(`Procedural Omissions: ${omissions.length > 0 ? omissions.join(', ') : 'None'}`, 20, 140, { maxWidth: 170 });
    
    doc.setTextColor(0, 0, 0); // Black
    doc.setFontSize(13);
    doc.text('2. Syndicate Plus/Delta Self-Evaluation', 20, 155);
    doc.setFontSize(10);
    doc.text('Operational Strengths:', 20, 163);
    plusDelta.plus.forEach((p, i) => {
      if (p.trim()) doc.text(`+ ${p}`, 25, 170 + (i * 6));
    });

    doc.text('Behavioral & Tactical Refinements:', 20, 192);
    plusDelta.delta.forEach((d, i) => {
      if (d.trim()) doc.text(`- ${d}`, 25, 199 + (i * 6));
    });
    
    doc.setFontSize(13);
    doc.text('3. Chronological Office Terminal Log', 20, 222);
    doc.setFontSize(8.5);
    let y = 230;
    tacticalLog.slice(0, 10).forEach(entry => {
      doc.text(`[${entry.time}] ${entry.msg}`, 20, y, { maxWidth: 170 });
      y += 6;
    });
    
    doc.save(`KSIA-Office-ERT-Dossier-${selectedScenario?.id || 'report'}.pdf`);
  };

  // --- Render Sub-Components ---

  const Gauge = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between text-[10px] uppercase tracking-wider text-slate-400 font-mono font-bold">
        <span>{label}</span>
        <span>{Math.round(value)}%</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={`h-full ${color} shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#05080f] text-slate-200 selection:bg-amber-500/30 font-sans">
      <OfflineIndicator />
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0a0f1a] px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <Building className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-100 flex items-center gap-2">
              KSIA ERT TERMINAL
              <span className="text-[9px] sm:text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-mono border border-amber-500/30 uppercase">
                Airport Offices
              </span>
            </h1>
            <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-[0.18em]">
              Administration & Corporate Directorate Crisis Ops
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-500 hover:border-amber-500/30 transition-all text-xs flex items-center gap-1.5"
            title={soundEnabled ? 'Mute Tactical Audio' : 'Unmute Tactical Audio'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-600" />}
          </button>

          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 text-xl sm:text-2xl font-mono font-bold text-amber-500 tracking-tighter">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 opacity-60" />
              {formatTime(time)}
            </div>
            <div className="text-[8px] sm:text-[9px] uppercase tracking-widest text-slate-500">Mission Clock</div>
          </div>
          <PWAInstallButton />
        </div>
      </header>

      <main className="p-4 sm:p-6 max-w-[1400px] mx-auto min-h-[calc(100vh-80px)]">
        <AnimatePresence mode="wait">
          
          {/* LOBBY PHASE */}
          {phase === 'LOBBY' && (
            <motion.div 
              key="lobby"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center max-w-3xl mx-auto space-y-4 py-4 sm:py-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-mono font-semibold">
                  <ShieldAlert className="w-3.5 h-3.5" /> GACA PART 139 / NFPA 101 LIFE SAFETY DRILL
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Airport Offices Emergency Response Simulator
                </h2>
                <p className="text-slate-400 text-sm sm:text-base leading-relaxed px-4">
                  Focused crisis operations for King Salman International Airport Corporate, Directorate, and Administrative Office Complexes. Practice rapid compartmentation, electrical lockout, multi-office floor sweeps, and high-quality casualty resuscitation.
                </p>
                <div className="flex justify-center pt-2">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-xs font-bold animate-pulse">
                    <Clock className="w-4 h-4" /> 15-MINUTE MANDATORY RESPONSE CLOCK COMMENCES ON SELECTION
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {scenarios.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectGroup(s)}
                    className="group relative text-left p-6 bg-[#0a0f1a] border border-slate-800 rounded-2xl hover:border-amber-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,158,11,0.08)] flex flex-col justify-between"
                  >
                    <div className="absolute top-4 right-4 text-slate-800 group-hover:text-amber-500/20 text-6xl font-black transition-colors font-mono pointer-events-none">
                      0{idx + 1}
                    </div>
                    <div className="space-y-4 relative z-10">
                      <div className="inline-flex p-3 bg-slate-900 rounded-xl border border-slate-800">
                        {idx === 0 && <Building className="w-6 h-6 text-amber-400" />}
                        {idx === 1 && <Key className="w-6 h-6 text-blue-400" />}
                        {idx === 2 && <Radio className="w-6 h-6 text-emerald-400" />}
                        {idx === 3 && <FlameKindling className="w-6 h-6 text-orange-400" />}
                        {idx === 4 && <Layers className="w-6 h-6 text-purple-400" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold">
                            {s.floorLevel}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white group-hover:text-amber-500 transition-colors mt-2">
                          {s.name}
                        </h3>
                        <p className="text-xs font-semibold text-slate-400 mt-1">{s.buildingType}</p>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                        {s.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-800/80 mt-4 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span className="flex items-center gap-1.5 text-slate-300">
                          <Users className="w-3.5 h-3.5 text-amber-500" />
                          {s.paxCount} Office Occupants
                        </span>
                        <span className="text-red-400 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> 1 Casualty
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase truncate">
                        <Navigation className="w-3 h-3 shrink-0 text-amber-500" />
                        <span className="truncate">{s.location}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* TEAM SETUP PHASE */}
          {phase === 'TEAM_SETUP' && selectedScenario && (
            <motion.div 
              key="setup"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="max-w-4xl mx-auto space-y-8 py-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <button onClick={() => setPhase('LOBBY')} className="text-amber-500 text-xs sm:text-sm flex items-center gap-1 hover:underline mb-2">
                    <ChevronRight className="w-4 h-4 rotate-180" /> Change Office Scenario
                  </button>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <span className="text-lg font-black text-amber-500">1</span>
                    </div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-white">Airport Offices ERT Roster</h2>
                      <p className="text-slate-400 mt-1 text-xs sm:text-sm">Assign qualified responders to the 5 mandatory ICS functional roles.</p>
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Assigned Facility</div>
                  <div className="text-sm font-bold text-amber-500">{selectedScenario.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{selectedScenario.floorLevel}</div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleQuickFillRoles}
                  className="text-xs text-amber-400 hover:text-amber-300 underline font-mono flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" /> Quick Fill Certified ERT Roster
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(Object.keys(roles) as Array<keyof TeamRoles>).map((role) => (
                  <div key={role} className="p-4 bg-[#0a0f1a] border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-2">
                        {role === 'teamLeader' && <Shield className="w-3.5 h-3.5 text-red-500" />}
                        {role === 'suppressionLead' && <Flame className="w-3.5 h-3.5 text-orange-500" />}
                        {role === 'casualtyCareLead' && <Stethoscope className="w-3.5 h-3.5 text-emerald-500" />}
                        {role === 'evacuationSupportLead' && <Users className="w-3.5 h-3.5 text-blue-500" />}
                        {role === 'externalLiaison' && <Radio className="w-3.5 h-3.5 text-amber-500" />}
                        {role === 'teamLeader' ? 'Office Incident Commander (Lead)' :
                         role === 'suppressionLead' ? 'Electrical & Suppression Lead' :
                         role === 'casualtyCareLead' ? 'Workplace Casualty Care Lead' :
                         role === 'evacuationSupportLead' ? 'Floor Warden / Egress Lead' :
                         'AOCC & Civil Defense Liaison'}
                      </label>
                      <span className="text-[9px] font-mono text-slate-500 uppercase">NFPA ICS</span>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Enter Certified Member Name"
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                      value={roles[role]}
                      onChange={(e) => setRoles(prev => ({ ...prev, [role]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-slate-800 gap-4">
                <div className="text-xs text-slate-500">
                  <span className="text-amber-500 font-bold">{Object.values(roles).filter(Boolean).length} / 5</span> Roles confirmed
                </div>
                <button 
                  onClick={handleStartDrill}
                  disabled={Object.values(roles).some(r => !r)}
                  className="w-full sm:w-auto px-8 py-3.5 bg-amber-500 text-amber-950 font-black rounded-xl hover:bg-amber-400 transition-all disabled:opacity-40 disabled:grayscale flex items-center justify-center gap-3 text-base shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                >
                  INITIALIZE OFFICE TACTICAL TERMINAL
                  <Zap className="w-5 h-5 fill-current" />
                </button>
              </div>
            </motion.div>
          )}

          {/* TERMINAL PHASE */}
          {phase === 'TERMINAL' && selectedScenario && (
            <div className="flex flex-col gap-6">
              {/* Directive HUD */}
              <div className="bg-[#0a0f1a] border border-amber-500/30 rounded-2xl p-4 shadow-[0_0_20px_rgba(245,158,11,0.05)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <span className="text-xl font-black text-amber-500 font-mono">{currentStep}</span>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-amber-500/80 font-bold">
                        Phase {currentStep} of 7: Operational Objective
                      </div>
                      <h3 className="text-lg font-black text-white uppercase tracking-tight">
                        {steps.find(s => s.id === currentStep)?.title}
                      </h3>
                      <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
                        {steps.find(s => s.id === currentStep)?.desc}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 self-end md:self-center">
                    <div className="hidden lg:flex items-center gap-1.5 mr-2">
                      {steps.map(s => (
                        <div 
                          key={s.id} 
                          title={s.title}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${s.id === currentStep ? 'bg-amber-500 scale-125' : s.id < currentStep ? 'bg-emerald-500' : 'bg-slate-800'}`} 
                        />
                      ))}
                    </div>

                    <button 
                      onClick={() => setShowFacilitatorPanel(!showFacilitatorPanel)}
                      className="px-3 py-2 bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-400 hover:text-amber-400 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all"
                      title="Trainer Inject Simulator"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      Trainer Injects
                    </button>

                    {currentStep < 7 && (
                      <button 
                        onClick={() => {
                          setCurrentStep(prev => prev + 1);
                          playTacticalSound(540, 'triangle', 0.15);
                          addTacticalLog(`OBJECTIVE ADVANCED: ${steps.find(s => s.id === currentStep + 1)?.title.toUpperCase()}`, 'info');
                        }}
                        className="px-5 py-2 bg-amber-500 text-amber-950 font-black rounded-lg text-xs hover:bg-amber-400 transition-all flex items-center gap-2 shadow-md"
                      >
                        NEXT OBJECTIVE
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Collapsible Trainer Injects Panel */}
                <AnimatePresence>
                  {showFacilitatorPanel && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-slate-800 text-xs font-mono"
                    >
                      <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Zap className="w-3 h-3" /> Facilitator / Drill Instructor Fast Injects
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button 
                          onClick={() => {
                            setRadioBlackout(true);
                            addTacticalLog('INJECT: Radio deadzone inside office core', 'alert');
                            playTacticalSound(320, 'sawtooth', 0.2);
                          }}
                          className="p-2 bg-slate-900 border border-slate-800 hover:border-red-500/50 text-slate-300 rounded text-[11px] text-left"
                        >
                          Trigger Comms Blackout
                        </button>
                        <button 
                          onClick={() => {
                            setStairwellCompromised(true);
                            setGauges(prev => ({ ...prev, egressFlow: Math.max(0, prev.egressFlow - 20) }));
                            addTacticalLog('INJECT: Stairwell A smoke intrusion', 'danger');
                            playTacticalSound(240, 'square', 0.2);
                          }}
                          className="p-2 bg-slate-900 border border-slate-800 hover:border-red-500/50 text-slate-300 rounded text-[11px] text-left"
                        >
                          Compromise Stairwell A
                        </button>
                        <button 
                          onClick={() => {
                            setTurnstileJammed(true);
                            setGauges(prev => ({ ...prev, egressFlow: Math.max(0, prev.egressFlow - 15) }));
                            addTacticalLog('INJECT: Turnstiles jammed in fail-secure', 'alert');
                          }}
                          className="p-2 bg-slate-900 border border-slate-800 hover:border-red-500/50 text-slate-300 rounded text-[11px] text-left"
                        >
                          Lockdown Badge Gates
                        </button>
                        <button 
                          onClick={() => {
                            setGauges(prev => ({ ...prev, lifeSafety: Math.max(0, prev.lifeSafety - 25) }));
                            addTacticalLog('INJECT: Casualty sudden arrest / V-Fib', 'danger');
                          }}
                          className="p-2 bg-slate-900 border border-slate-800 hover:border-red-500/50 text-slate-300 rounded text-[11px] text-left"
                        >
                          Casualty Cardiac Arrest
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.div 
                key="terminal"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:h-[calc(100vh-230px)]"
              >
                {/* Left Column: Office Telemetry & Architectural Schematic */}
                <div className="col-span-12 lg:col-span-4 space-y-6 lg:overflow-y-auto lg:pr-2 custom-scrollbar">
                  {/* Gauge telemetry */}
                  <section className="bg-[#0a0f1a] border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Activity className="w-4 h-4 text-amber-500" />
                        Office Life-Safety Telemetry
                      </h3>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        MONITORING
                      </span>
                    </div>
                    <div className="space-y-4 py-1">
                      <Gauge label="Office Floor Containment" value={gauges.containment} color="bg-blue-500" />
                      <Gauge label="Casualty Hemodynamics / SpO2" value={gauges.lifeSafety} color="bg-emerald-500" />
                      <Gauge label="Corridor & Stairwell Egress Flow" value={gauges.egressFlow} color="bg-amber-500" />
                      <Gauge label="GACA Regulatory & AOCC Sync" value={gauges.regulatory} color="bg-slate-400" />
                    </div>
                  </section>

                  {/* Office Floorplate Blueprint */}
                  <section className="bg-[#0a0f1a] border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Building className="w-4 h-4 text-amber-500" />
                        Office Floorplate Blueprint
                      </h3>
                      
                      {/* Sub-tabs */}
                      <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
                        <button 
                          onClick={() => setActiveFloorTab('schematic')}
                          className={`px-2 py-1 rounded ${activeFloorTab === 'schematic' ? 'bg-amber-500 text-amber-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                        >
                          Plan
                        </button>
                        <button 
                          onClick={() => setActiveFloorTab('occupants')}
                          className={`px-2 py-1 rounded ${activeFloorTab === 'occupants' ? 'bg-amber-500 text-amber-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                        >
                          Muster
                        </button>
                        <button 
                          onClick={() => setActiveFloorTab('sensors')}
                          className={`px-2 py-1 rounded ${activeFloorTab === 'sensors' ? 'bg-amber-500 text-amber-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                        >
                          Sensors
                        </button>
                      </div>
                    </div>

                    {/* Architectural SVG Plan */}
                    {activeFloorTab === 'schematic' && (
                      <div className="space-y-3">
                        <div className="relative bg-[#070b14] border border-slate-800 rounded-xl p-3 overflow-hidden">
                          <svg viewBox="0 0 400 240" className="w-full h-auto text-slate-600 select-none">
                            {/* Outer Office Boundary */}
                            <rect x="10" y="10" width="380" height="220" rx="8" fill="#0d1424" stroke="#334155" strokeWidth="2" />
                            
                            {/* Corridor Spine */}
                            <rect x="20" y="100" width="360" height="40" fill="#090d18" stroke="#1e293b" strokeDasharray="3 3" />
                            <text x="180" y="124" fill="#475569" fontSize="9" fontFamily="monospace" textAnchor="middle">CENTRAL EGRESS CORRIDOR</text>
                            
                            {/* North Rooms */}
                            {/* Executive Boardroom */}
                            <rect x="20" y="20" width="110" height="75" fill="#131c2e" stroke="#334155" />
                            <text x="75" y="55" fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle">BOARDROOM / VIP</text>
                            
                            {/* Server & UPS Archive */}
                            <rect x="135" y="20" width="95" height="75" fill="#1e1828" stroke="#475569" />
                            <text x="182" y="50" fill="#cbd5e1" fontSize="8" fontWeight="bold" textAnchor="middle">SERVER & UPS</text>
                            <text x="182" y="65" fill="#e2e8f0" fontSize="7" textAnchor="middle" opacity="0.6">[SUB-PANEL]</text>
                            
                            {/* Kitchenette / Pantry */}
                            <rect x="235" y="20" width="85" height="75" fill="#1a1c22" stroke="#334155" />
                            <text x="277" y="55" fill="#94a3b8" fontSize="8" textAnchor="middle">PANTRY / BREAK</text>

                            {/* North Stairwell A (Fire Exit) */}
                            <rect 
                              x="325" y="20" width="55" height="75" 
                              fill={stairwellCompromised ? '#3b1219' : '#0f291e'} 
                              stroke={stairwellCompromised ? '#ef4444' : '#10b981'} 
                              strokeWidth="1.5"
                            />
                            <text x="352" y="50" fill={stairwellCompromised ? '#f87171' : '#34d399'} fontSize="7.5" fontWeight="bold" textAnchor="middle">STAIR A</text>
                            <text x="352" y="62" fill={stairwellCompromised ? '#fca5a5' : '#6ee7b7'} fontSize="6.5" textAnchor="middle">
                              {stairwellCompromised ? 'SMOKE LEAK' : 'PRESSURIZED'}
                            </text>

                            {/* South Rooms */}
                            {/* Open Plan Cubicles & Workstation Bays */}
                            <rect x="20" y="145" width="170" height="75" fill="#111827" stroke="#334155" />
                            <text x="105" y="175" fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle">OPEN WORKSTATIONS</text>
                            <text x="105" y="190" fill="#64748b" fontSize="7" textAnchor="middle">Pod A1 - A8 (35 Pax)</text>

                            {/* Soundproof Focus Pods */}
                            <rect x="195" y="145" width="60" height="75" fill="#131c2e" stroke="#334155" />
                            <text x="225" y="178" fill="#94a3b8" fontSize="7" textAnchor="middle">PODS</text>
                            <text x="225" y="190" fill="#64748b" fontSize="6" textAnchor="middle">1-4</text>

                            {/* Restrooms */}
                            <rect x="260" y="145" width="60" height="75" fill="#101828" stroke="#334155" />
                            <text x="290" y="185" fill="#64748b" fontSize="7" textAnchor="middle">RESTROOMS</text>

                            {/* South Stairwell B / Exit Gate */}
                            <rect x="325" y="145" width="55" height="75" fill="#0f291e" stroke="#10b981" strokeWidth="1.5" />
                            <text x="352" y="178" fill="#34d399" fontSize="7.5" fontWeight="bold" textAnchor="middle">STAIR B</text>
                            <text x="352" y="190" fill="#6ee7b7" fontSize="6.5" textAnchor="middle">PRIMARY EGRESS</text>

                            {/* Turnstile Access Gate */}
                            <line 
                              x1="20" y1="100" x2="20" y2="140" 
                              stroke={turnstileJammed ? '#ef4444' : '#38bdf8'} 
                              strokeWidth="4" 
                            />
                            <text x="25" y="123" fill="#38bdf8" fontSize="6" transform="rotate(-90, 25, 123)" textAnchor="middle">
                              {turnstileJammed ? 'JAMMED' : 'RFID GATE'}
                            </text>

                            {/* Hazard Hotzone Indicator */}
                            <circle cx="180" cy="55" r="22" fill="#ef4444" opacity="0.25" className="animate-ping" />
                            <circle cx="180" cy="55" r="14" fill="#ef4444" opacity="0.4" />
                            <text x="180" y="58" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">FIRE</text>

                            {/* Casualty Marker */}
                            <circle cx="85" cy="55" r="7" fill="#dc2626" stroke="#ffffff" strokeWidth="1.5" />
                            <text x="85" y="58" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">+</text>

                            {/* Evacuation Flow Arrows */}
                            <path d="M 120 120 L 320 120" stroke="#10b981" strokeWidth="2" strokeDasharray="6 4" markerEnd="url(#arrow)" />
                          </svg>

                          {/* Map Legend */}
                          <div className="flex flex-wrap items-center justify-between text-[9px] font-mono text-slate-400 mt-2 pt-2 border-t border-slate-800">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse"></span>
                              Active Office Conflagration
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-red-600 inline-block"></span>
                              Casualty Position
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                              Pressurized Stairwell
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-[10px] font-mono">
                          <div className="text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
                            <span>Sector Hazard Matrix</span>
                            <span className="text-amber-500">{selectedScenario.floorLevel}</span>
                          </div>
                          {selectedScenario.initialHazards.map(h => (
                            <div key={h} className="py-1 px-2.5 bg-red-500/10 border border-red-500/20 rounded text-red-300 flex items-center gap-2">
                              <Zap className="w-3 h-3 text-red-400 shrink-0" /> {h}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Occupant Muster List Tab */}
                    {activeFloorTab === 'occupants' && (
                      <div className="space-y-2 text-xs">
                        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between font-mono text-[11px]">
                            <span className="text-slate-400">Total Accounted on Floor:</span>
                            <span className="text-amber-400 font-bold">{selectedScenario.paxCount} Personnel</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full w-[82%]" />
                          </div>
                          <div className="text-[10px] text-slate-500">82% Horizontal evacuation underway to Stairwell B.</div>
                        </div>

                        <div className="space-y-1 text-[11px] font-mono">
                          <div className="p-2 bg-slate-900 border border-slate-800 rounded flex justify-between">
                            <span className="text-slate-300">Executive Suites</span>
                            <span className="text-amber-400">8 Occupants</span>
                          </div>
                          <div className="p-2 bg-slate-900 border border-slate-800 rounded flex justify-between">
                            <span className="text-slate-300">Open Cubicle Pods A1-A8</span>
                            <span className="text-emerald-400">Evacuating (35 Pax)</span>
                          </div>
                          <div className="p-2 bg-slate-900 border border-slate-800 rounded flex justify-between">
                            <span className="text-slate-300">Soundproof Pods 1-4</span>
                            <span className="text-red-400">Sweep Required (2 Pax)</span>
                          </div>
                          <div className="p-2 bg-slate-900 border border-slate-800 rounded flex justify-between">
                            <span className="text-slate-300">Restroom Corridors</span>
                            <span className="text-slate-400">Clear</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sensor Telemetry Tab */}
                    {activeFloorTab === 'sensors' && (
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                          <div className="text-[9px] text-slate-500 uppercase">Carbon Monoxide</div>
                          <div className="text-base font-bold text-red-400 mt-1">285 PPM</div>
                          <div className="text-[8px] text-red-500">HAZARDOUS TO LIFE</div>
                        </div>
                        <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                          <div className="text-[9px] text-slate-500 uppercase">Hydrogen Cyanide</div>
                          <div className="text-base font-bold text-red-400 mt-1">42 PPM</div>
                          <div className="text-[8px] text-red-500">IDLH TOXICITY</div>
                        </div>
                        <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                          <div className="text-[9px] text-slate-500 uppercase">Ceiling Thermal</div>
                          <div className="text-base font-bold text-amber-400 mt-1">148 °C</div>
                          <div className="text-[8px] text-amber-500">ELEVATED PLENUM</div>
                        </div>
                        <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                          <div className="text-[9px] text-slate-500 uppercase">Stair Delta-P</div>
                          <div className={`text-base font-bold mt-1 ${stairwellCompromised ? 'text-red-400' : 'text-emerald-400'}`}>
                            {stairwellCompromised ? '+12 Pa (LOW)' : '+52 Pa (SAFE)'}
                          </div>
                          <div className="text-[8px] text-slate-400">SMOKE BARRIER</div>
                        </div>
                      </div>
                    )}
                  </section>
                </div>

                {/* Center Column: Tactical Decision Action Nodes */}
                <div className="col-span-12 lg:col-span-5 flex flex-col gap-6 lg:overflow-hidden">
                  <div className="flex-1 bg-[#0a0f1a] border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-5 lg:overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <HardHat className="w-4 h-4 text-amber-500" />
                          Office Tactical Action Nodes
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Maximum 2 tactical interventions permitted per functional lead.
                        </p>
                      </div>

                      {radioBlackout && (
                        <motion.div 
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 text-[10px] font-bold font-mono"
                        >
                          <UserX className="w-3 h-3" /> RF DEADZONE
                        </motion.div>
                      )}
                    </div>

                    {/* Role Decision Grid */}
                    <div className="space-y-4 lg:overflow-y-auto lg:pr-1 custom-scrollbar">
                      {Object.entries(TACTICAL_ACTIONS).map(([roleKey, roleActions]) => {
                        const count = roleActionCounts[roleKey] || 0;
                        const roleTitle = roleKey === 'teamLeader' ? 'Office Incident Commander' :
                                          roleKey === 'suppressionLead' ? 'Electrical & Suppression' :
                                          roleKey === 'casualtyCareLead' ? 'Workplace Casualty Care' :
                                          'Floor Warden & Egress';
                        const assignedPerson = roles[roleKey as keyof TeamRoles];

                        return (
                          <div key={roleKey} className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2.5">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                              <div>
                                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider font-mono">
                                  {roleTitle}
                                </span>
                                <span className="text-slate-400 text-[11px] ml-2 font-medium">({assignedPerson})</span>
                              </div>
                              <span className="text-[9px] font-mono font-bold text-slate-500">
                                {count} / 2 Actions
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {roleActions.map(action => {
                                const isExecuted = executedActions.includes(action.id);
                                let btnStyle = 'bg-slate-900 border-slate-800 text-slate-300 hover:border-amber-500/50 hover:bg-slate-800/60';
                                
                                if (isExecuted) {
                                  btnStyle = action.isCorrect 
                                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200' 
                                    : 'bg-red-500/15 border-red-500/40 text-red-200';
                                }

                                return (
                                  <button
                                    key={action.id}
                                    onClick={() => performAction(roleKey, action.id)}
                                    disabled={isExecuted || (!isExecuted && count >= 2)}
                                    title={action.description}
                                    className={`p-2.5 border rounded-lg transition-all text-left flex flex-col justify-between gap-1 group ${btnStyle} disabled:opacity-40 disabled:pointer-events-none`}
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <span className="text-xs font-bold font-mono">{action.label}</span>
                                      {isExecuted ? (
                                        action.isCorrect ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                      ) : (
                                        <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 shrink-0" />
                                      )}
                                    </div>
                                    <span className="text-[9px] text-slate-400 line-clamp-1">
                                      {action.description}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Secondary Office Obstacles / Injects Quick Controls */}
                    {(radioBlackout || stairwellCompromised || turnstileJammed) && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl space-y-2">
                        <div className="text-[10px] text-red-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" /> Active Office Cascading Obstacles
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {radioBlackout && (
                            <button
                              onClick={() => {
                                setRadioBlackout(false);
                                addTacticalLog('COMMS RESOLVED: Activated redundant cellular push-to-talk in office core.', 'success');
                                playTacticalSound(520, 'sine', 0.15);
                              }}
                              className="px-3 py-1.5 bg-red-500 text-white text-[10px] font-bold rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1.5"
                            >
                              <Radio className="w-3 h-3" /> Engage Cellular PTT
                            </button>
                          )}
                          {stairwellCompromised && (
                            <button
                              onClick={() => {
                                setStairwellCompromised(false);
                                setGauges(prev => ({ ...prev, egressFlow: Math.min(100, prev.egressFlow + 20) }));
                                addTacticalLog('DAMPER OVERRIDDEN: Stairwell A fan reset; positive pressure restored.', 'success');
                                playTacticalSound(520, 'sine', 0.15);
                              }}
                              className="px-3 py-1.5 bg-amber-500 text-amber-950 text-[10px] font-bold rounded-lg hover:bg-amber-400 transition-colors flex items-center gap-1.5"
                            >
                              <Wind className="w-3 h-3" /> Reset Stairwell A Pressurization
                            </button>
                          )}
                          {turnstileJammed && (
                            <button
                              onClick={() => {
                                setTurnstileJammed(false);
                                setGauges(prev => ({ ...prev, egressFlow: Math.min(100, prev.egressFlow + 15) }));
                                addTacticalLog('TURNSTILE MANUAL OVERRIDE: Mechanical release lever pulled; full egress restored.', 'success');
                                playTacticalSound(520, 'sine', 0.15);
                              }}
                              className="px-3 py-1.5 bg-blue-500 text-white text-[10px] font-bold rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1.5"
                            >
                              <DoorOpen className="w-3 h-3" /> Override Magnetic Badge Gate
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Handover & Reporting Buttons */}
                    <div className="mt-auto pt-3 border-t border-slate-800 flex flex-wrap gap-2">
                      <button
                        onClick={() => setShowLnnhModal(true)}
                        className={`flex-1 p-2.5 border rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-2 ${lnnhSent ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-amber-500/40'}`}
                      >
                        <Radio className="w-4 h-4 text-amber-400" />
                        {lnnhSent ? 'L-N-N-H TRANSMITTED' : 'TRANSMIT L-N-N-H REPORT'}
                      </button>

                      <button
                        onClick={() => setShowAtmistModal(true)}
                        className={`flex-1 p-2.5 border rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-2 ${atmistGenerated ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-amber-500/40'}`}
                      >
                        <FileText className="w-4 h-4 text-blue-400" />
                        {atmistGenerated ? 'ATMIST COMPILED' : 'GENERATE ATMIST DOSSIER'}
                      </button>

                      <button
                        onClick={handleFinishDrill}
                        className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 text-amber-950 rounded-xl text-xs font-black hover:bg-amber-400 transition-all flex items-center justify-center gap-2 shadow-lg"
                      >
                        <CheckCircle2 className="w-4 h-4" /> INITIATE CIVIL DEFENSE HANDOVER
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Roles & Live Tactical Radio Log */}
                <div className="col-span-12 lg:col-span-3 space-y-6 flex flex-col lg:overflow-hidden">
                  {/* ICS Roster */}
                  <section className="bg-[#0a0f1a] border border-slate-800 rounded-2xl p-4 shrink-0 space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-500" />
                      Office ICS Roster
                    </h3>
                    <div className="space-y-2 text-xs">
                      {Object.entries(roles).map(([role, name]) => (
                        <div key={role} className="flex justify-between items-center py-1 border-b border-slate-800/60 last:border-0">
                          <span className="text-[10px] text-slate-500 uppercase font-mono">
                            {role === 'teamLeader' ? 'Commander' :
                             role === 'suppressionLead' ? 'Suppression' :
                             role === 'casualtyCareLead' ? 'Medical' :
                             role === 'evacuationSupportLead' ? 'Warden' : 'Liaison'}
                          </span>
                          <span className="text-slate-200 font-semibold truncate max-w-[140px] text-right">{name || 'Unassigned'}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Radio & Tactical Log */}
                  <section className="bg-[#0a0f1a] border border-slate-800 rounded-2xl p-4 flex-1 min-h-[300px] lg:min-h-0 flex flex-col gap-3 lg:overflow-hidden">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-slate-400" />
                        Office Tactical Radio Log
                      </h3>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>

                    <div className="flex-1 lg:overflow-y-auto space-y-2.5 lg:pr-1 custom-scrollbar text-[11px] font-mono">
                      {tacticalLog.map((log, i) => {
                        let color = 'text-slate-300';
                        if (log.type === 'alert') color = 'text-amber-400';
                        if (log.type === 'danger') color = 'text-red-400';
                        if (log.type === 'success') color = 'text-emerald-400';

                        return (
                          <div key={i} className="flex gap-2 items-start leading-snug">
                            <span className="text-slate-500 text-[10px] shrink-0 font-bold">[{log.time}]</span>
                            <span className={`${color} leading-tight`}>{log.msg}</span>
                          </div>
                        );
                      })}
                      {tacticalLog.length === 0 && (
                        <div className="text-slate-600 italic py-4 text-center">Awaiting terminal communications...</div>
                      )}
                    </div>
                  </section>

                  {/* Active Injects Counter */}
                  <section className="bg-[#0a0f1a] border border-slate-800 rounded-2xl p-4 shrink-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Office Injects</h3>
                      <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[10px] text-amber-500 font-mono font-bold">
                        {activeInjects.length} Active
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                      {activeInjects.length > 0 ? (
                        activeInjects.map(i => (
                          <div key={i} className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded truncate flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />
                            {i}
                          </div>
                        ))
                      ) : (
                        <div className="text-[11px] text-slate-600 font-mono">No active systemic injects.</div>
                      )}
                    </div>
                  </section>
                </div>
              </motion.div>

              {/* L-N-N-H Report Modal */}
              <AnimatePresence>
                {showLnnhModal && (
                  <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="bg-[#0a0f1a] border border-slate-800 max-w-xl w-full rounded-2xl p-6 space-y-4 shadow-2xl"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                          <Radio className="w-5 h-5" /> Mandatory L-N-N-H Report to AOCC & Civil Defense
                        </div>
                        <button onClick={() => setShowLnnhModal(false)} className="text-slate-400 hover:text-white text-xs">✕ Close</button>
                      </div>

                      <div className="space-y-3 font-mono text-xs">
                        <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                          <div className="text-[10px] text-amber-400 font-bold uppercase">L - Location</div>
                          <div className="text-slate-200 mt-0.5">{selectedScenario.location}</div>
                        </div>

                        <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                          <div className="text-[10px] text-amber-400 font-bold uppercase">N - Nature of Incident</div>
                          <div className="text-slate-200 mt-0.5">{selectedScenario.description}</div>
                        </div>

                        <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                          <div className="text-[10px] text-amber-400 font-bold uppercase">N - Numbers & Casualties</div>
                          <div className="text-slate-200 mt-0.5">{selectedScenario.paxCount} Occupants on Floor | Casualty: {selectedScenario.initialCasualties}</div>
                        </div>

                        <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                          <div className="text-[10px] text-amber-400 font-bold uppercase">H - Hazards & Obstacles</div>
                          <div className="text-slate-200 mt-0.5">{selectedScenario.initialHazards.join(', ')}</div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <button 
                          onClick={() => {
                            setShowLnnhModal(false);
                            setLnnhSent(true);
                            setGauges(prev => ({ ...prev, regulatory: Math.min(100, prev.regulatory + 20) }));
                            addTacticalLog(`AOCC ACKNOWLEDGED: Formal L-N-N-H received for ${selectedScenario.location}. Civil Defense units rolling.`, 'success');
                            playTacticalSound(580, 'sine', 0.2);
                          }}
                          className="px-6 py-2.5 bg-amber-500 text-amber-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition-all flex items-center gap-2"
                        >
                          <Send className="w-4 h-4" /> TRANSMIT STANDARDIZED REPORT
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* ATMIST Modal */}
              <AnimatePresence>
                {showAtmistModal && (
                  <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="bg-[#0a0f1a] border border-slate-800 max-w-xl w-full rounded-2xl p-6 space-y-4 shadow-2xl"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                          <FileText className="w-5 h-5" /> ATMIST Medical Handover Dossier
                        </div>
                        <button onClick={() => setShowAtmistModal(false)} className="text-slate-400 hover:text-white text-xs">✕ Close</button>
                      </div>

                      <div className="space-y-2.5 font-mono text-xs">
                        <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                          <span className="text-emerald-400 font-bold">A - Age & Demographic:</span> 38-year-old male, administrative corporate staff member.
                        </div>
                        <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                          <span className="text-emerald-400 font-bold">T - Time of Incident:</span> {formatTime(900 - time)} elapsed since alarm activation.
                        </div>
                        <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                          <span className="text-emerald-400 font-bold">M - Mechanism of Injury:</span> Office hazard exposure - {selectedScenario.name}.
                        </div>
                        <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                          <span className="text-emerald-400 font-bold">I - Injuries Identified:</span> {selectedScenario.initialCasualties}.
                        </div>
                        <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                          <span className="text-emerald-400 font-bold">S - Signs & Vitals:</span> Pulse weak/thready, SpO2 88% on room air, airway cleared, GCS 4.
                        </div>
                        <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                          <span className="text-emerald-400 font-bold">T - Treatment Administered:</span> 30:2 High-Quality CPR, AED pad placement, high-flow O2, hemorrhage control, C-spine precautions.
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <button 
                          onClick={() => {
                            setShowAtmistModal(false);
                            setAtmistGenerated(true);
                            setGauges(prev => ({ ...prev, lifeSafety: Math.min(100, prev.lifeSafety + 15) }));
                            addTacticalLog('ATMIST DOSSIER COMPILED: Prepared for arriving Civil Defense Paramedic handover at Ground ICP.', 'success');
                            playTacticalSound(560, 'sine', 0.2);
                          }}
                          className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-500 transition-all flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" /> LOCK & ATTACH DOSSIER
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* RESULT PHASE */}
          {phase === 'RESULT' && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto space-y-8 py-8"
            >
              <div className="text-center space-y-4">
                <div className="inline-flex p-4 bg-amber-500/10 rounded-full border border-amber-500/30 mb-2">
                  <CheckCircle2 className="w-12 h-12 text-amber-500" />
                </div>
                <div className="text-xs uppercase tracking-[0.3em] font-mono text-amber-500 font-bold">
                  Civil Defense Handover Executed
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  Airport Offices Mission Debrief
                </h2>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 mt-6">
                  <div className="text-center">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-1">
                      Final Readiness Score
                    </div>
                    <div className="text-6xl font-black text-amber-500 font-mono tracking-tighter">{score}</div>
                  </div>
                  <div className="hidden sm:block h-20 w-px bg-slate-800" />
                  <div className="text-center sm:text-left space-y-1">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">
                      GACA Certification Status
                    </div>
                    <div className={`text-xl font-bold font-mono ${score >= 80 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {score >= 80 ? 'GACA MISSION CERTIFIED (OFFICES)' : 'RE-DRILL REQUIRED'}
                    </div>
                    <div className="text-xs text-slate-400">
                      Evaluated against KSIA Airport Corporate Life-Safety & Evacuation Standards.
                    </div>
                  </div>
                </div>
              </div>

              {/* Decision Analysis */}
              <div className="bg-[#0a0f1a] border border-slate-800 rounded-2xl p-6 space-y-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" /> Office Tactical Decision Audit
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Compliant Decisions Executed
                    </div>
                    <div className="space-y-2">
                      {executedActions.filter(id => Object.values(TACTICAL_ACTIONS).flat().find(a => a.id === id)?.isCorrect).length > 0 ? (
                        executedActions.filter(id => Object.values(TACTICAL_ACTIONS).flat().find(a => a.id === id)?.isCorrect).map(id => {
                          const action = Object.values(TACTICAL_ACTIONS).flat().find(a => a.id === id);
                          return (
                            <div key={id} className="flex items-center gap-3 text-xs text-slate-200 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg font-mono">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              {action?.label}
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-xs text-slate-600 italic">No compliant actions logged.</div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-[10px] uppercase tracking-widest text-red-500 font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" /> Critical Tactical Errors & Omissions
                    </div>
                    <div className="space-y-2">
                      {executedActions.filter(id => !Object.values(TACTICAL_ACTIONS).flat().find(a => a.id === id)?.isCorrect).map(id => {
                        const action = Object.values(TACTICAL_ACTIONS).flat().find(a => a.id === id);
                        return (
                          <div key={id} className="flex items-center gap-3 text-xs text-red-300 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg font-mono">
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                            ERROR: {action?.label}
                          </div>
                        );
                      })}
                      {executedActions.filter(id => !Object.values(TACTICAL_ACTIONS).flat().find(a => a.id === id)?.isCorrect).length === 0 && (
                        <div className="text-xs text-emerald-400 italic">Zero critical tactical errors recorded. Excellent discipline!</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Plus/Delta Self-Evaluation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="bg-[#0a0f1a] border border-slate-800 rounded-2xl p-6 space-y-4">
                  <h3 className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Operational Strengths (+)
                  </h3>
                  <p className="text-[10px] text-slate-500 leading-tight">Key office emergency procedures and communications executed effectively.</p>
                  <div className="space-y-3">
                    {plusDelta.plus.map((p, i) => (
                      <input 
                        key={i}
                        type="text"
                        placeholder={`Success Area ${i + 1}`}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50"
                        value={p}
                        onChange={(e) => {
                          const next = [...plusDelta.plus];
                          next[i] = e.target.value;
                          setPlusDelta({ ...plusDelta, plus: next });
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-[#0a0f1a] border border-slate-800 rounded-2xl p-6 space-y-4">
                  <h3 className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <RefreshCcw className="w-4 h-4" /> Areas for Improvement (Δ)
                  </h3>
                  <p className="text-[10px] text-slate-500 leading-tight">Identify bottlenecks, evacuation hesitations, or communication delays.</p>
                  <div className="space-y-3">
                    {plusDelta.delta.map((d, i) => (
                      <input 
                        key={i}
                        type="text"
                        placeholder={`Improvement Area ${i + 1}`}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500/50"
                        value={d}
                        onChange={(e) => {
                          const next = [...plusDelta.delta];
                          next[i] = e.target.value;
                          setPlusDelta({ ...plusDelta, delta: next });
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-6">
                <button 
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-bold text-xs font-mono"
                >
                  <LogOut className="w-4 h-4" /> ABORT & RESTART
                </button>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <button 
                    onClick={() => setPhase('FINAL_DASHBOARD')}
                    disabled={plusDelta.plus.some(p => !p.trim()) || plusDelta.delta.some(d => !d.trim())}
                    className="w-full sm:w-auto px-10 py-3.5 bg-amber-500 text-amber-950 font-black rounded-xl hover:bg-amber-400 transition-all disabled:opacity-40 disabled:grayscale text-base shadow-[0_0_30px_rgba(245,158,11,0.2)]"
                  >
                    SUBMIT TO GACA DASHBOARD
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* FINAL DASHBOARD PHASE */}
          {phase === 'FINAL_DASHBOARD' && selectedScenario && (
            <motion.div 
              key="final"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-4xl mx-auto space-y-8 py-8 px-4"
            >
              <div className="text-center space-y-6">
                <div className="text-[10px] uppercase tracking-[0.4em] text-amber-500 font-bold font-mono">
                  General Authority of Civil Aviation - KSIA Directorate
                </div>
                <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase">
                  Airport Offices ERT Record
                </h2>
                
                <div className="bg-[#0a0f1a] border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-around gap-8">
                  <div className="text-center">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-mono">Performance Metric</div>
                    <div className="text-7xl sm:text-8xl font-black text-amber-500 font-mono tracking-tighter">{score}</div>
                    <div className="text-xs text-slate-400 font-mono mt-1">out of 100</div>
                  </div>
                  <div className="h-24 w-px bg-slate-800 hidden md:block" />
                  <div className="text-left space-y-2">
                    <div className="text-xs text-slate-500 uppercase tracking-widest font-mono">Certification Outcome</div>
                    <div className={`text-2xl sm:text-3xl font-black font-mono ${score >= 80 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {score >= 80 ? 'MISSION CERTIFIED' : 'RE-DRILL REQUIRED'}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-400 max-w-sm">
                      {score >= 80 
                        ? `Operational and life-safety metrics meet GACA Part 139 readiness standards for King Salman International Airport ${selectedScenario.buildingType}.` 
                        : 'Significant procedural omissions or tactical errors were detected. Syndicate must review the technical dossier and schedule remediation.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={downloadDossier}
                    className="flex items-center justify-center gap-3 p-5 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl transition-all shadow-xl text-sm"
                  >
                    <Download className="w-5 h-5 text-amber-400" />
                    DOWNLOAD TECHNICAL DOSSIER (PDF)
                  </button>
                  <button 
                    onClick={sendWhatsApp}
                    className="flex items-center justify-center gap-3 p-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all shadow-xl text-sm"
                  >
                    <Share2 className="w-5 h-5" />
                    DISPATCH VIA WHATSAPP
                  </button>
                </div>

                <button 
                  onClick={() => window.location.reload()}
                  className="text-slate-500 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest pt-4 font-mono"
                >
                  Return to Office Scenarios Selection
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(51, 65, 85, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(245, 158, 11, 0.3);
        }
      `}</style>
    </div>
  );
}
