function buildSimulationReport(simulation) {
  const lines = [
    'WEBTE2 Simulation Report',
    `Generated: ${new Date().toISOString()}`,
    `Command: ${simulation.command}`,
    `Duration (ms): ${simulation.durationMs}`,
    `Coordinates: ${JSON.stringify(simulation.coordinates)}`
  ];

  return Buffer.from(lines.join('\n'), 'utf8');
}

module.exports = {
  buildSimulationReport
};
