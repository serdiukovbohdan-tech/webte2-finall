const { createSession, runCommand } = require('./octave.service');

const PENDULUM_DEFAULTS = {
  M: 0.5,
  m: 0.2,
  b: 0.1,
  I: 0.006,
  g: 9.8,
  l: 0.3,
  r: 0.2,
  initPozicia: 0,
  initUhol: 0
};

const BALL_BEAM_DEFAULTS = {
  m: 0.111,
  R: 0.015,
  g: -9.8,
  J: 9.99e-6,
  r: 0.25,
  initRychlost: 0,
  initZrychlenie: 0
};

let octaveSessionId = null;

function getOctaveSessionId() {
  if (!octaveSessionId) {
    octaveSessionId = createSession();
  }

  return octaveSessionId;
}

async function runPendulum(input = {}) {
  const params = normalizeParams(PENDULUM_DEFAULTS, input);
  const command = buildPendulumScript(params);
  const { output, error } = await runCommand(getOctaveSessionId(), command);

  if (error) {
    throw new Error(error);
  }

  return parseSimulationOutput(output, {
    time: 'TIME',
    position: 'POSITION',
    angle: 'ANGLE'
  });
}

async function runBallBeam(input = {}) {
  const params = normalizeParams(BALL_BEAM_DEFAULTS, input);
  const command = buildBallBeamScript(params);
  const { output, error } = await runCommand(getOctaveSessionId(), command);

  if (error) {
    throw new Error(error);
  }

  return parseSimulationOutput(output, {
    time: 'TIME',
    position: 'POSITION',
    beamAngle: 'BEAM_ANGLE'
  });
}

function buildPendulumScript(params) {
  return [
    'pkg load control;',
    'format long g;',
    `M = ${toOctaveNumber(params.M)};`,
    `m = ${toOctaveNumber(params.m)};`,
    `b = ${toOctaveNumber(params.b)};`,
    `I = ${toOctaveNumber(params.I)};`,
    `g = ${toOctaveNumber(params.g)};`,
    `l = ${toOctaveNumber(params.l)};`,
    'p = I*(M+m)+M*m*l^2;',
    'A = [0 1 0 0; 0 -(I+m*l^2)*b/p (m^2*g*l^2)/p 0; 0 0 0 1; 0 -(m*l*b)/p m*g*l*(M+m)/p 0];',
    'B = [0; (I+m*l^2)/p; 0; m*l/p];',
    'C = [1 0 0 0; 0 0 1 0];',
    'D = [0; 0];',
    "K = lqr(A, B, C' * C, 1);",
    'Ac = A - B * K;',
    'N = -inv(C(1,:) * inv(A - B * K) * B);',
    'sys = ss(Ac, B * N, C, D);',
    't = 0:0.05:10;',
    `r = ${toOctaveNumber(params.r)};`,
    'r2 = 0.5;',
    `initPozicia = ${toOctaveNumber(params.initPozicia)};`,
    `initUhol = ${toOctaveNumber(params.initUhol)};`,
    '[y1, t1, x1] = lsim(sys, r * ones(size(t)), t, [initPozicia; 0; initUhol; 0]);',
    '[y2, t2, x2] = lsim(sys, r2 * ones(size(t)), t, x1(size(x1, 1), :));',
    'dt = t(2) - t(1);',
    'timeCombined = [t1(:); t2(:) + t1(end) + dt];',
    'positionCombined = [y1(:,1); y2(:,1)];',
    'angleCombined = [y1(:,2); y2(:,2)];',
    "printf('TIME=%s\\n', strjoin(arrayfun(@(value) sprintf('%.15g', value), timeCombined(:), 'UniformOutput', false), ','));",
    "printf('POSITION=%s\\n', strjoin(arrayfun(@(value) sprintf('%.15g', value), positionCombined(:), 'UniformOutput', false), ','));",
    "printf('ANGLE=%s\\n', strjoin(arrayfun(@(value) sprintf('%.15g', value), angleCombined(:), 'UniformOutput', false), ','));"
  ].join('\n');
}

function buildBallBeamScript(params) {
  return [
    'pkg load control;',
    'format long g;',
    `m = ${toOctaveNumber(params.m)};`,
    `R = ${toOctaveNumber(params.R)};`,
    `g = ${toOctaveNumber(params.g)};`,
    `J = ${toOctaveNumber(params.J)};`,
    'H = -m * g / (J / (R^2) + m);',
    'A = [0 1 0 0; 0 0 H 0; 0 0 0 1; 0 0 0 0];',
    'B = [0; 0; 0; 1];',
    'C = [1 0 0 0];',
    'D = [0];',
    "K = place(A, B, [-2 + 2i, -2 - 2i, -20, -80]);",
    'N = -inv(C * inv(A - B * K) * B);',
    'sys = ss(A - B * K, B, C, D);',
    't = 0:0.01:5;',
    `r = ${toOctaveNumber(params.r)};`,
    'r2 = 0.5;',
    `initRychlost = ${toOctaveNumber(params.initRychlost)};`,
    `initZrychlenie = ${toOctaveNumber(params.initZrychlenie)};`,
    '[y1, t1, x1] = lsim(N * sys, r * ones(size(t)), t, [initRychlost; 0; initZrychlenie; 0]);',
    '[y2, t2, x2] = lsim(N * sys, r2 * ones(size(t)), t, x1(size(x1, 1), :));',
    'dt = t(2) - t(1);',
    'timeCombined = [t1(:); t2(:) + t1(end) + dt];',
    'positionCombined = [y1(:); y2(:)];',
    'beamAngleCombined = [x1(:,3); x2(:,3)];',
    "printf('TIME=%s\\n', strjoin(arrayfun(@(value) sprintf('%.15g', value), timeCombined(:), 'UniformOutput', false), ','));",
    "printf('POSITION=%s\\n', strjoin(arrayfun(@(value) sprintf('%.15g', value), positionCombined(:), 'UniformOutput', false), ','));",
    "printf('BEAM_ANGLE=%s\\n', strjoin(arrayfun(@(value) sprintf('%.15g', value), beamAngleCombined(:), 'UniformOutput', false), ','));"
  ].join('\n');
}

function parseSimulationOutput(output, fields) {
  const result = {};

  Object.entries(fields).forEach(([resultKey, marker]) => {
    const match = output.match(new RegExp(`^${marker}=(.*)$`, 'm'));

    if (!match) {
      throw new Error(`Failed to parse ${marker} from Octave output.`);
    }

    result[resultKey] = match[1]
      .split(',')
      .filter((value) => value.length > 0)
      .map((value) => {
        const parsed = Number(value);

        if (!Number.isFinite(parsed)) {
          throw new Error(`Invalid numeric value "${value}" in ${marker}.`);
        }

        return parsed;
      });
  });

  return result;
}

function normalizeParams(defaults, input) {
  const merged = {
    ...defaults,
    ...input
  };

  Object.keys(merged).forEach((key) => {
    const value = Number(merged[key]);

    if (!Number.isFinite(value)) {
      throw new Error(`Invalid numeric parameter: ${key}`);
    }

    merged[key] = value;
  });

  return merged;
}

function toOctaveNumber(value) {
  return Number(value).toString();
}

module.exports = {
  runBallBeam,
  runPendulum
};
