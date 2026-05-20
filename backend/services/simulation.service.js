const { query } = require('../db/db');
const { normalizeCoordinates, calculateDistanceKm } = require('./geo.service');
const { runOctaveCommand } = require('./octave.service');
const { buildSimulationReport } = require('./pdf.service');

const stats = {
  runs: 0,
  lastRunAt: null,
  lastDurationMs: 0
};

let databaseWarningShown = false;

async function persistSimulation(simulation) {
  try {
    await query(
      `INSERT INTO simulation_runs
        (request_payload, octave_command, result_payload, duration_ms)
       VALUES ($1, $2, $3, $4)`,
      [
        simulation.input,
        simulation.octaveResult.command,
        simulation,
        simulation.durationMs
      ]
    );

    await query(
      `INSERT INTO stats_snapshots
        (runs, last_run_at, last_duration_ms)
       VALUES ($1, $2, $3)`,
      [stats.runs, stats.lastRunAt, stats.lastDurationMs]
    );
  } catch (error) {
    if (!databaseWarningShown) {
      databaseWarningShown = true;
      console.warn(
        'Simulation persistence skipped because the PostgreSQL database is unavailable.'
      );
    }
  }
}

async function runSimulation(input = {}) {
  const startedAt = Date.now();
  const coordinates = input.coordinates
    ? normalizeCoordinates(input.coordinates)
    : null;
  const command = input.command || 'disp("hello from octave")';
  const octaveResult = await runOctaveCommand(command, input);
  const durationMs = Date.now() - startedAt;

  stats.runs += 1;
  stats.lastRunAt = new Date().toISOString();
  stats.lastDurationMs = durationMs;

  const simulation = {
    id: `${Date.now()}`,
    input,
    coordinates,
    distanceFromOriginKm: coordinates
      ? calculateDistanceKm(coordinates, { lat: 0, lng: 0 })
      : null,
    octaveResult,
    durationMs,
    reportBase64: buildSimulationReport({
      command,
      coordinates,
      durationMs,
      executedAt: octaveResult.executedAt
    }).toString('base64')
  };

  await persistSimulation(simulation);

  return simulation;
}

function getStats() {
  return {
    ...stats
  };
}

module.exports = {
  getStats,
  runSimulation
};
