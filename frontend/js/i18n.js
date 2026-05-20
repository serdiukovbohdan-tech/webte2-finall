(function () {
  var DEFAULT_LANGUAGE = "sk";
  var STORAGE_KEY = "language";
  var currentLanguage = DEFAULT_LANGUAGE;
  var dictionaries = {};

  var currentScript = document.currentScript;
  var localesBaseUrl = currentScript && currentScript.src
    ? new URL("../locales/", currentScript.src)
    : new URL(
        window.location.pathname.indexOf("/pages/") !== -1 ? "../locales/" : "locales/",
        window.location.href
      );

  function getSavedLanguage() {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE;
  }

  async function loadDictionary(lang) {
    if (dictionaries[lang]) {
      return dictionaries[lang];
    }

    var response = await fetch(new URL(lang + ".json", localesBaseUrl), {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Failed to load locale: " + lang);
    }

    dictionaries[lang] = await response.json();
    return dictionaries[lang];
  }

  function applyTranslations() {
    var dictionary = dictionaries[currentLanguage] || {};
    var elements = document.querySelectorAll("[data-i18n]");

    elements.forEach(function (element) {
      var key = element.getAttribute("data-i18n");
      var translated = dictionary[key];

      if (typeof translated === "string") {
        element.textContent = translated;
      }
    });

    document.querySelectorAll("[data-i18n-attr]").forEach(function (element) {
      var definition = element.getAttribute("data-i18n-attr");

      if (!definition) {
        return;
      }

      definition.split(";").forEach(function (mapping) {
        var parts = mapping.split(":");
        var attributeName = parts[0] ? parts[0].trim() : "";
        var key = parts[1] ? parts[1].trim() : "";

        if (!attributeName || !key || typeof dictionary[key] !== "string") {
          return;
        }

        element.setAttribute(attributeName, dictionary[key]);
      });
    });

    if (document.body) {
      var pageTitleKey = document.body.getAttribute("data-page-title");

      if (pageTitleKey && typeof dictionary[pageTitleKey] === "string") {
        document.title = dictionary[pageTitleKey] + " | WEBTE2";
      }
    }

    document.documentElement.lang = currentLanguage;
  }

  async function setLanguage(lang) {
    try {
      var dictionary = await loadDictionary(lang);
      currentLanguage = lang;
      dictionaries[lang] = dictionary;
      localStorage.setItem(STORAGE_KEY, lang);
      applyTranslations();
      document.dispatchEvent(
        new CustomEvent("languageChanged", {
          detail: {
            language: lang,
            dictionary: dictionary
          }
        })
      );
    } catch (error) {
      console.error("Unable to switch language.", error);
    }
  }

  function t(key) {
    var dictionary = dictionaries[currentLanguage] || {};
    return dictionary[key] || key;
  }

  window.setLanguage = setLanguage;
  window.t = t;
  window.applyTranslations = applyTranslations;

  document.addEventListener("DOMContentLoaded", function () {
    setLanguage(getSavedLanguage());
  });
})();
