const { spawn } = require('child_process');
const { randomUUID } = require('crypto');

const config = require('../config/config');

const sessions = new Map();

function createSession() {
  const sessionId = randomUUID();
  ensureSession(sessionId);
  return sessionId;
}

function ensureSession(sessionId) {
  if (sessions.has(sessionId)) {
    return sessions.get(sessionId);
  }

  const process = spawn('octave', ['--no-gui', '--interactive']);
  const session = {
    id: sessionId,
    process,
    pending: null,
    queue: Promise.resolve(),
    closed: false,
    startupError: null,
    ready: null
  };

  process.stdout.setEncoding('utf8');
  process.stderr.setEncoding('utf8');

  process.stdout.on('data', (chunk) => {
    handleStreamData(session, 'stdout', chunk);
  });

  process.stderr.on('data', (chunk) => {
    handleStreamData(session, 'stderr', chunk);
  });

  process.on('error', (error) => {
    session.startupError = error;

    if (session.pending) {
      finishPending(session, {
        output: '',
        error: `Failed to start Octave: ${error.message}`
      });
    }
  });

  process.on('exit', (code, signal) => {
    session.closed = true;
    sessions.delete(session.id);

    if (session.pending) {
      finishPending(session, {
        output: sanitizeOutput(session.pending.stdout),
        error:
          sanitizeOutput(session.pending.stderr) ||
          `Octave session exited unexpectedly (code: ${code}, signal: ${signal}).`
      });
    }
  });

  session.ready = enqueueInternalCommand(
    session,
    [
      'PS1("");',
      'PS2("");',
      'more off;',
      'page_screen_output(0);'
    ].join('\n')
  );

  sessions.set(sessionId, session);
  return session;
}

function handleStreamData(session, stream, chunk) {
  if (!session.pending) {
    return;
  }

  session.pending[stream] += chunk;

  if (stream === 'stdout' && session.pending.stdout.includes(session.pending.marker)) {
    const [outputBeforeMarker] = session.pending.stdout.split(session.pending.marker);

    finishPending(session, {
      output: sanitizeOutput(outputBeforeMarker),
      error: sanitizeOutput(session.pending.stderr) || null
    });
  }
}

function finishPending(session, result) {
  if (!session.pending || session.pending.completed) {
    return;
  }

  const pending = session.pending;
  pending.completed = true;
  session.pending = null;

  setTimeout(() => {
    pending.resolve({
      output: result.output,
      error: result.error
    });
  }, config.slowdownMs);
}

function enqueueInternalCommand(session, command) {
  const task = session.queue.then(() => executeCommand(session, command));
  session.queue = task.catch(() => {});
  return task;
}

function executeCommand(session, command) {
  return new Promise((resolve) => {
    if (session.closed) {
      resolve({
        output: '',
        error: 'Octave session is closed.'
      });
      return;
    }

    if (session.startupError) {
      resolve({
        output: '',
        error: `Failed to start Octave: ${session.startupError.message}`
      });
      return;
    }

    const marker = `__CODEX_END__${randomUUID()}__`;
    session.pending = {
      marker,
      stdout: '',
      stderr: '',
      resolve,
      completed: false
    };

    const payload = `${command}\nfprintf('${marker}\\n');\n`;

    session.process.stdin.write(payload, 'utf8', (error) => {
      if (error) {
        finishPending(session, {
          output: '',
          error: `Failed to write to Octave stdin: ${error.message}`
        });
      }
    });
  });
}

async function runCommand(sessionId, command) {
  const resolvedSessionId = sessionId || randomUUID();
  const session = ensureSession(resolvedSessionId);

  await session.ready;

  const task = session.queue.then(() => executeCommand(session, command));
  session.queue = task.catch(() => {});
  return task;
}

function deleteSession(sessionId) {
  const session = sessions.get(sessionId);

  if (!session) {
    return;
  }

  session.closed = true;
  sessions.delete(sessionId);

  if (!session.process.killed) {
    session.process.stdin.end();
    session.process.kill();
  }
}

function sanitizeOutput(value) {
  return value
    .replace(/\r/g, '')
    .replace(/^\s+|\s+$/g, '');
}

module.exports = {
  createSession,
  deleteSession,
  runCommand
};
