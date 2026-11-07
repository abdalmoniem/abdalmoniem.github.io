(function () {
  "use strict";

  var root = document.documentElement;
  var media = window.matchMedia("(prefers-color-scheme: dark)");

  function storedTheme() {
    try {
      return localStorage.getItem("theme");
    } catch (error) {
      return null;
    }
  }

  function currentTheme() {
    return root.dataset.theme || "light";
  }

  function sync() {
    var button = document.getElementById("theme-toggle");
    var dark = currentTheme() === "dark";

    if (button) {
      button.setAttribute("aria-pressed", String(dark));
      button.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
      var icon = button.querySelector(".theme-icon");
      if (icon) {
        icon.textContent = dark ? "☀" : "☾";
      }
    }

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", dark ? "#0b1120" : "#f8fafc");
    }
  }

  function apply(theme, persist) {
    root.dataset.theme = theme;
    if (persist) {
      try {
        localStorage.setItem("theme", theme);
      } catch (error) {
        /* Storage may be unavailable in private mode. */
      }
    }
    sync();
  }

  sync();

  var button = document.getElementById("theme-toggle");
  if (button) {
    button.addEventListener("click", function () {
      apply(currentTheme() === "dark" ? "light" : "dark", true);
    });
  }

  media.addEventListener("change", function (event) {
    if (!storedTheme()) {
      apply(event.matches ? "dark" : "light", false);
    }
  });

  window.addEventListener("storage", function (event) {
    if (event.key === "theme" && (event.newValue === "dark" || event.newValue === "light")) {
      apply(event.newValue, false);
    }
  });
})();
