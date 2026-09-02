(() => {
  const root = document.documentElement;
  const media = window.matchMedia("(prefers-color-scheme: dark)");

  const applyTheme = () => {
    let theme = "auto";

    try {
      if (window.parent !== window) {
        theme = window.parent.document.documentElement.dataset.theme || "auto";
      }
    } catch {
      // Fall back to the visitor's system preference when embedded cross-origin.
    }

    const isDark = theme === "dark" || (theme === "auto" && media.matches);
    root.style.setProperty("--graph-background", isDark ? "rgb(29, 30, 32)" : "rgb(255, 255, 255)");
  };

  applyTheme();
  media.addEventListener("change", applyTheme);

  try {
    if (window.parent !== window) {
      window.parent.document.getElementById("theme-toggle")?.addEventListener("click", () => {
        window.setTimeout(applyTheme, 0);
      });
    }
  } catch {
    // The initial system-based theme remains valid when the parent is inaccessible.
  }
})();
