(function () {
  var DEFAULT_LANGUAGE = "sk";
  var LANGUAGE_KEY = "language";

  function getPageDepth() {
    return window.location.pathname.indexOf("/pages/") !== -1 ? ".." : ".";
  }

  function getCurrentPageName() {
    var path = window.location.pathname;
    var fileName = path.substring(path.lastIndexOf("/") + 1);
    return fileName || "index.html";
  }

  function getNavItems(basePath) {
    return [
      { href: basePath + "/index.html", key: "nav.home", match: ["", "index.html"] },
      { href: basePath + "/pages/compute.html", key: "nav.terminal", match: ["compute.html"] },
      { href: basePath + "/pages/pendulum.html", key: "nav.pendulum", match: ["pendulum.html"] },
      { href: basePath + "/pages/ballbeam.html", key: "nav.ballbeam", match: ["ballbeam.html"] },
      { href: basePath + "/pages/logs.html", key: "nav.logs", match: ["logs.html"] },
      { href: basePath + "/pages/stats.html", key: "nav.statistics", match: ["stats.html"] },
      { href: basePath + "/pages/docs.html", key: "nav.documentation", match: ["docs.html"] }
    ];
  }

  function createNavbarMarkup() {
    var basePath = getPageDepth();
    var currentPage = getCurrentPageName();
    var navItems = getNavItems(basePath);
    var linksMarkup = navItems
      .map(function (item) {
        var isActive = item.match.indexOf(currentPage) !== -1;
        return (
          '<li><a class="navbar__link' +
          (isActive ? " is-active" : "") +
          '" href="' +
          item.href +
          '" data-i18n="' +
          item.key +
          '">' +
          item.key +
          "</a></li>"
        );
      })
      .join("");

    return (
      '<header class="site-header">' +
      '  <nav class="navbar" aria-label="Main navigation">' +
      '    <a class="navbar__brand" href="' +
      basePath +
      '/index.html">' +
      '      <span class="navbar__badge">W</span>' +
      "      <span>WEBTE2</span>" +
      "    </a>" +
      '    <button class="navbar__toggle" type="button" aria-expanded="false" aria-controls="navbar-menu">' +
      '      <span class="sr-only">Toggle navigation</span>' +
      '      <span class="navbar__toggle-line"></span>' +
      '      <span class="navbar__toggle-line"></span>' +
      '      <span class="navbar__toggle-line"></span>' +
      "    </button>" +
      '    <div class="navbar__menu" id="navbar-menu">' +
      '      <ul class="navbar__links">' +
      linksMarkup +
      "      </ul>" +
      '      <div class="language-switcher">' +
      '        <span class="language-switcher__label" data-i18n="general.language">Language</span>' +
      '        <div class="language-switcher__buttons">' +
      '          <button class="lang-btn" type="button" data-lang="sk">SK</button>' +
      '          <button class="lang-btn" type="button" data-lang="en">EN</button>' +
      "        </div>" +
      "      </div>" +
      "    </div>" +
      "  </nav>" +
      "</header>"
    );
  }

  function syncLanguageButtons(activeLanguage) {
    document.querySelectorAll(".lang-btn").forEach(function (button) {
      var isActive = button.getAttribute("data-lang") === activeLanguage;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function getStoredLanguage() {
    return localStorage.getItem(LANGUAGE_KEY) || DEFAULT_LANGUAGE;
  }

  function initNavbar() {
    var mountPoint = document.querySelector("[data-navbar]") || document.getElementById("navbar-root");

    if (mountPoint) {
      mountPoint.innerHTML = createNavbarMarkup();
    } else if (!document.querySelector(".site-header")) {
      document.body.insertAdjacentHTML("afterbegin", createNavbarMarkup());
    }

    var navbar = document.querySelector(".navbar");
    var toggleButton = document.querySelector(".navbar__toggle");
    var menu = document.querySelector(".navbar__menu");

    if (!navbar || !toggleButton || !menu) {
      return;
    }

    toggleButton.addEventListener("click", function () {
      var isOpen = navbar.classList.toggle("is-open");
      toggleButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    menu.querySelectorAll("a, button[data-lang]").forEach(function (element) {
      element.addEventListener("click", function () {
        if (window.innerWidth < 768) {
          navbar.classList.remove("is-open");
          toggleButton.setAttribute("aria-expanded", "false");
        }
      });
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 768) {
        navbar.classList.remove("is-open");
        toggleButton.setAttribute("aria-expanded", "false");
      }
    });

    document.querySelectorAll(".lang-btn").forEach(function (button) {
      button.addEventListener("click", function () {
        var lang = button.getAttribute("data-lang");
        syncLanguageButtons(lang);
        if (typeof window.setLanguage === "function") {
          window.setLanguage(lang);
        } else {
          localStorage.setItem(LANGUAGE_KEY, lang);
        }
      });
    });

    syncLanguageButtons(getStoredLanguage());
  }

  function showLoading(elementId) {
    var element = document.getElementById(elementId);

    if (!element) {
      return;
    }

    if (!element.dataset.loadingOriginal) {
      element.dataset.loadingOriginal = element.innerHTML;
    }

    var loadingLabel = typeof window.t === "function" ? window.t("general.loading") : "Loading...";

    element.innerHTML =
      '<div class="loading-state"><span class="spinner" aria-hidden="true"></span><span>' +
      loadingLabel +
      "</span></div>";
    element.setAttribute("aria-busy", "true");
  }

  function hideLoading(elementId) {
    var element = document.getElementById(elementId);

    if (!element) {
      return;
    }

    if (element.dataset.loadingOriginal !== undefined) {
      element.innerHTML = element.dataset.loadingOriginal;
      delete element.dataset.loadingOriginal;
    }

    element.setAttribute("aria-busy", "false");
  }

  function ensureToastStack() {
    var stack = document.querySelector(".toast-stack");

    if (!stack) {
      stack = document.createElement("div");
      stack.className = "toast-stack";
      document.body.appendChild(stack);
    }

    return stack;
  }

  function createToast(type, message) {
    var stack = ensureToastStack();
    var toast = document.createElement("div");
    toast.className = "toast toast--" + type;
    toast.setAttribute("role", "alert");
    toast.innerHTML =
      '<span class="toast__message"></span>' +
      '<button class="toast__close" type="button" aria-label="Close">&times;</button>';

    toast.querySelector(".toast__message").textContent = message;
    stack.appendChild(toast);

    requestAnimationFrame(function () {
      toast.classList.add("is-visible");
    });

    function removeToast() {
      toast.classList.remove("is-visible");
      window.setTimeout(function () {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 180);
    }

    toast.querySelector(".toast__close").addEventListener("click", removeToast);
    window.setTimeout(removeToast, 3200);
  }

  function showError(message) {
    createToast("error", message);
  }

  function showSuccess(message) {
    createToast("success", message);
  }

  document.addEventListener("languageChanged", function (event) {
    syncLanguageButtons(event.detail.language);
  });

  document.addEventListener("DOMContentLoaded", function () {
    initNavbar();

    if (typeof window.setLanguage === "function") {
      window.setLanguage(getStoredLanguage());
    } else {
      syncLanguageButtons(getStoredLanguage());
    }
  });

  window.initNavbar = initNavbar;
  window.showLoading = showLoading;
  window.hideLoading = hideLoading;
  window.showError = showError;
  window.showSuccess = showSuccess;
})();
