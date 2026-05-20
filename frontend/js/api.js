(function () {
  var API_BASE_URL = "http://localhost:3000";
  var API_KEY = "secret123";
  var DEFAULT_LOADING_TARGET = "global-loading";

  function getMessage(key, fallback) {
    return typeof window.t === "function" ? window.t(key) : fallback;
  }

  function getAuthHeaders(includeJson) {
    var headers = {
      Authorization: "Bearer " + API_KEY
    };

    if (includeJson) {
      headers["Content-Type"] = "application/json";
    }

    return headers;
  }

  function setLoadingState(isLoading, elementId) {
    var targetId = elementId || DEFAULT_LOADING_TARGET;

    if (!document.getElementById(targetId)) {
      return;
    }

    if (isLoading && typeof window.showLoading === "function") {
      window.showLoading(targetId);
    }

    if (!isLoading && typeof window.hideLoading === "function") {
      window.hideLoading(targetId);
    }
  }

  function notifyError(message) {
    if (typeof window.showError === "function") {
      window.showError(message);
    } else {
      console.error(message);
    }
  }

  async function parseResponse(response) {
    var contentType = response.headers.get("content-type") || "";
    var isJson = contentType.indexOf("application/json") !== -1;
    var payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      var errorMessage =
        isJson && payload && payload.error
          ? payload.error
          : typeof payload === "string" && payload
            ? payload
            : getMessage("api.requestFailedStatus", "Request failed with status") + " " + response.status;

      throw new Error(errorMessage);
    }

    return payload;
  }

  async function request(path, options, loadingElementId) {
    setLoadingState(true, loadingElementId);

    try {
      var response = await fetch(API_BASE_URL + path, options);
      return await parseResponse(response);
    } finally {
      setLoadingState(false, loadingElementId);
    }
  }

  async function createSession() {
    try {
      var data = await request(
        "/api/session/new",
        {
          method: "POST",
          headers: getAuthHeaders(false)
        }
      );

      return data.sessionId || data.id || null;
    } catch (error) {
      notifyError(error.message || getMessage("api.createSessionError", "Failed to create session."));
      return null;
    }
  }

  async function compute(sessionId, command) {
    try {
      var data = await request(
        "/api/compute",
        {
          method: "POST",
          headers: getAuthHeaders(true),
          body: JSON.stringify({
            sessionId: sessionId,
            command: command
          })
        }
      );

      return {
        result: data.result || "",
        error: data.error || null
      };
    } catch (error) {
      notifyError(error.message || getMessage("api.computeError", "Compute request failed."));
      return {
        result: "",
        error: error.message || getMessage("api.computeError", "Compute request failed.")
      };
    }
  }

  async function runPendulum(params) {
    try {
      var data = await request(
        "/api/simulation/pendulum",
        {
          method: "POST",
          headers: getAuthHeaders(true),
          body: JSON.stringify({
            M: params.M,
            m: params.m,
            b: params.b,
            I: params.I,
            g: params.g,
            l: params.l,
            r: params.r,
            r2: params.r2,
            initPozicia: params.initPozicia,
            initUhol: params.initUhol
          })
        }
      );

      return {
        time: data.time || [],
        position: data.position || [],
        angle: data.angle || []
      };
    } catch (error) {
      notifyError(error.message || getMessage("api.pendulumError", "Pendulum simulation failed."));
      return {
        time: [],
        position: [],
        angle: []
      };
    }
  }

  async function runBallBeam(params) {
    try {
      var data = await request(
        "/api/simulation/ballbeam",
        {
          method: "POST",
          headers: getAuthHeaders(true),
          body: JSON.stringify({
            m: params.m,
            R: params.R,
            g: params.g,
            J: params.J,
            r: params.r,
            r2: params.r2,
            initRychlost: params.initRychlost,
            initZrychlenie: params.initZrychlenie
          })
        }
      );

      return {
        time: data.time || [],
        position: data.position || [],
        beamAngle: data.beamAngle || []
      };
    } catch (error) {
      notifyError(error.message || getMessage("api.ballbeamError", "Ball-Beam simulation failed."));
      return {
        time: [],
        position: [],
        beamAngle: []
      };
    }
  }

  async function getLogs(page, limit) {
    try {
      var query = new URLSearchParams({
        page: String(page || 1),
        limit: String(limit || 10)
      });

      var data = await request(
        "/api/logs?" + query.toString(),
        {
          method: "GET",
          headers: getAuthHeaders(false)
        }
      );

      return {
        logs: data.logs || [],
        total: data.total || 0,
        page: data.page || page || 1,
        limit: data.limit || limit || 10
      };
    } catch (error) {
      notifyError(error.message || getMessage("api.logsError", "Failed to load logs."));
      return {
        logs: [],
        total: 0,
        page: page || 1,
        limit: limit || 10
      };
    }
  }

  function extractFilename(response) {
    var disposition = response.headers.get("content-disposition") || "";
    var match = disposition.match(/filename="?([^"]+)"?/i);
    return match ? match[1] : "logs.csv";
  }

  async function exportLogs() {
    setLoadingState(true);

    try {
      var response = await fetch(API_BASE_URL + "/api/logs/export", {
        method: "GET",
        headers: getAuthHeaders(false)
      });

      if (!response.ok) {
        throw new Error(getMessage("api.exportError", "Failed to export logs."));
      }

      var blob = await response.blob();
      var downloadUrl = window.URL.createObjectURL(blob);
      var link = document.createElement("a");

      link.href = downloadUrl;
      link.download = extractFilename(response);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      if (typeof window.showSuccess === "function") {
        window.showSuccess(getMessage("api.exportStarted", "CSV download started."));
      }
    } catch (error) {
      notifyError(error.message || getMessage("api.exportError", "Failed to export logs."));
    } finally {
      setLoadingState(false);
    }
  }

  async function trackAnimation(animationType) {
    try {
      await request(
        "/api/stats/track",
        {
          method: "POST",
          headers: getAuthHeaders(true),
          body: JSON.stringify({
            animationType: animationType
          })
        }
      );

      return true;
    } catch (error) {
      notifyError(error.message || getMessage("api.trackError", "Failed to track animation."));
      return false;
    }
  }

  async function getStats() {
    try {
      var data = await request(
        "/api/stats",
        {
          method: "GET",
          headers: getAuthHeaders(false)
        }
      );

      return {
        pendulum: data.pendulum || 0,
        ballbeam: data.ballbeam || 0
      };
    } catch (error) {
      notifyError(error.message || getMessage("api.statsError", "Failed to load statistics."));
      return {
        pendulum: 0,
        ballbeam: 0
      };
    }
  }

  async function getStatsDetails() {
    try {
      var data = await request(
        "/api/stats/details",
        {
          method: "GET",
          headers: getAuthHeaders(false)
        }
      );

      return Array.isArray(data) ? data : [];
    } catch (error) {
      notifyError(error.message || getMessage("api.statsDetailsError", "Failed to load statistics details."));
      return [];
    }
  }

  window.API_BASE_URL = API_BASE_URL;
  window.API_KEY = API_KEY;
  window.createSession = createSession;
  window.compute = compute;
  window.runPendulum = runPendulum;
  window.runBallBeam = runBallBeam;
  window.getLogs = getLogs;
  window.exportLogs = exportLogs;
  window.trackAnimation = trackAnimation;
  window.getStats = getStats;
  window.getStatsDetails = getStatsDetails;
  window.api = {
    createSession: createSession,
    compute: compute,
    runPendulum: runPendulum,
    runBallBeam: runBallBeam,
    getLogs: getLogs,
    exportLogs: exportLogs,
    trackAnimation: trackAnimation,
    getStats: getStats,
    getStatsDetails: getStatsDetails
  };
})();
