import type { Robot } from './types';

// Plain-language sentence explaining what AVA is doing right now.
export function describeActivity(r: Robot): { headline: string; detail: string } {
  const clearing = r.obstacles.find((o) => o.state === 'clearing');
  const pct = r.job.completionPercent.toFixed(0);

  if (r.status === 'estop')
    return {
      headline: 'Emergency stop — everything is frozen',
      detail: 'Clear the hazard, release the E-Stop, then reset faults to re-enable motion.',
    };
  if (clearing)
    return {
      headline: `Something is in the way — moving the ${clearing.type} aside`,
      detail: 'AVA paused painting, is clearing the object, then it will carry on.',
    };
  if (r.status === 'paused')
    return { headline: 'Paused by operator', detail: `Job held at ${pct}%. Press Resume to continue.` };
  if (r.status === 'returning' || r.status === 'homing')
    return { headline: 'Driving back to its dock', detail: 'Returning home before the next job.' };
  if (r.status === 'running')
    return {
      headline: `Stripping old coating off the ${shortName(r.job.name)}`,
      detail: `${pct}% cleaned · moving at ${r.actualSpeed}% speed · spraying at ${r.sprayIntensity}%.`,
    };
  if (r.job.completionPercent >= 100)
    return { headline: 'Job finished — surface fully prepared', detail: 'Press Start to run the next panel.' };
  return { headline: 'Idle — ready for a job', detail: 'Press Start Job to begin surface preparation.' };
}

function shortName(name: string) {
  return name.split('—')[0].trim();
}
