(() => {
  // <stdin>
  (() => {
    const palettes = {
      spectrum: { name: "Muted spectrum", colors: ["#b96560", "#bb8358", "#b6a15e", "#739080", "#678da3", "#8c769e"] },
      clear: { name: "Clear spectrum", colors: ["#d66d70", "#d99a61", "#d2bd69", "#83b28a", "#6fadd2", "#aa89c5"] },
      earth: { name: "Earth & ochre", colors: ["#b27358", "#c19962", "#afaa76", "#858d68", "#728781", "#978075"] },
      dusk: { name: "Nordic dusk", colors: ["#788ba4", "#9caeb5", "#6e999e", "#777d9d", "#a18a9e", "#b3a592"] },
      glass: { name: "Sea glass", colors: ["#669795", "#85aca0", "#aab79b", "#7091a9", "#8fabc0", "#b8bdaf"] },
      ember: { name: "Ember & plum", colors: ["#b25e66", "#c58965", "#af9a6c", "#975b76", "#7d6c98", "#a78c9d"] },
      mono: { name: "Warm monochrome", colors: ["#777672", "#8c8a82", "#a3a093", "#b9b3a1", "#cec6b1", "#dfd6bf"] }
    };
    const arrangements = {
      honeycomb: { name: "Honeycomb", rotation: 30 },
      staggered: { name: "Staggered rows", rotation: 0 },
      pinwheel: { name: "Pinwheel clusters", rotation: 0 },
      weave: { name: "Diagonal weave", rotation: 45 }
    };
    const defaults = {
      background: "#252629",
      palette: "spectrum",
      arrangement: "honeycomb",
      size: 32,
      quirk: 55,
      gap: 24,
      seed: 14,
      width: 1600,
      height: 900
    };
    const settings = { ...defaults };
    const namespace = "http://www.w3.org/2000/svg";
    const style = document.createElement("style");
    style.textContent = `
    * { box-sizing: border-box; }
    body { margin: 0; background: #1c1d20; color: #e4e0d5; font: 14px/1.5 system-ui, sans-serif; }
    main { max-width: 1800px; margin: auto; padding: 24px; }
    header { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
    h1 { margin: 0; font-size: 20px; font-weight: 500; letter-spacing: -.025em; }
    header p { margin: 0; color: #a8a7a4; font-size: 12px; }
    .wallpaper { background: ${defaults.background}; border-radius: 5px; overflow: hidden; }
    .wallpaper svg { display: block; width: 100%; height: auto; }
    form { display: flex; flex-wrap: wrap; align-items: end; gap: 20px 28px; margin-top: 20px; }
    label { display: grid; gap: 8px; min-width: 150px; flex: 1; }
    label span { display: flex; justify-content: space-between; gap: 15px; }
    output { color: #aaa9a5; font-variant-numeric: tabular-nums; }
    input { width: 100%; margin: 0; accent-color: #b6a15e; }
    select { width: 100%; padding: 7px 10px; border: 1px solid #55565a; border-radius: 4px; background: #303136; color: inherit; font: inherit; }
    .palette-control, .arrangement-control { min-width: 200px; }
    .swatches { display: flex; gap: 5px; }
    .swatches i { height: 5px; flex: 1; border-radius: 2px; }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; }
    button { border: 1px solid #55565a; border-radius: 4px; background: #303136; color: inherit; font: inherit; padding: 8px 12px; cursor: pointer; }
    button:hover { background: #3d3e43; }
    :focus-visible { outline: 2px solid #d2be7b; outline-offset: 5px; }
    .note { color: #a8a7a4; font-size: 12px; margin: 18px 0 0; }
    body.clean main { max-width: none; padding: 0; }
    body.clean header, body.clean form, body.clean .note { display: none; }
    body.clean .wallpaper { border-radius: 0; }
    body.clean .wallpaper svg { width: 100vw; height: 100dvh; object-fit: cover; }
    .preview-close { display: none; position: fixed; bottom: max(16px, env(safe-area-inset-bottom)); right: 16px; background: #252629; }
    body.clean .preview-close { display: block; }
    @media (max-width: 600px) {
      main { padding: 16px; }
      header { display: block; }
      header p { margin-top: 5px; }
      label { min-width: 130px; }
      form { gap: 18px; }
      .actions { width: 100%; }
    }
  `;
    document.head.append(style);
    const main = document.createElement("main");
    main.innerHTML = `
    <header><h1>Y wallpaper study</h1><p>Six colors \xB7 charcoal \xB7 repeating Ys</p></header>
    <div class="wallpaper"></div>
    <form aria-label="Wallpaper controls"></form>
    <p class="note">Size zooms around the center. Preview hides the controls; Escape brings them back. Export saves just the artwork.</p>
  `;
    document.body.append(main);
    const frame = main.querySelector(".wallpaper");
    const form = main.querySelector("form");
    let svg;
    let pendingFrame = 0;
    const requestDraw = () => {
      if (pendingFrame) return;
      pendingFrame = requestAnimationFrame(() => {
        pendingFrame = 0;
        draw();
      });
    };
    const mix = (hex, charcoal, amount) => {
      const rgb = (value) => value.match(/[\da-f]{2}/gi).map((channel) => parseInt(channel, 16));
      return "#" + rgb(hex).map((channel, index) => Math.round(channel * (1 - amount) + rgb(charcoal)[index] * amount).toString(16).padStart(2, "0")).join("");
    };
    const noise = (x, y) => {
      const value = Math.sin(x * 127.1 + y * 311.7 + settings.seed * 74.7) * 43758.5453;
      return value - Math.floor(value);
    };
    const element = (name, attributes) => {
      const node = document.createElementNS(namespace, name);
      for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
      return node;
    };
    function draw() {
      const { width, height, size, quirk, gap, background } = settings;
      const root = element("svg", { xmlns: namespace, viewBox: `0 0 ${width} ${height}`, role: "img", "aria-labelledby": "wallpaper-title" });
      const palette = palettes[settings.palette];
      const arrangement = arrangements[settings.arrangement];
      const title = element("title", { id: "wallpaper-title" });
      title.textContent = `${arrangement.name} arrangement of Y shapes in the ${palette.name} palette on charcoal.`;
      root.append(title, element("rect", { width, height, fill: background }));
      const scale = size;
      const pattern = element("g", { transform: `translate(${width / 2} ${height / 2}) scale(${scale}) rotate(${arrangement.rotation})` });
      root.append(pattern);
      const radians = arrangement.rotation * Math.PI / 180;
      const extentX = (Math.abs(Math.cos(radians)) * width + Math.abs(Math.sin(radians)) * height) / (2 * scale) + 2;
      const extentY = (Math.abs(Math.sin(radians)) * width + Math.abs(Math.cos(radians)) * height) / (2 * scale) + 2;
      const vertices = /* @__PURE__ */ new Map();
      if (settings.arrangement === "honeycomb") {
        const columnWidth = Math.sqrt(3);
        const rows = Math.ceil(extentY / 1.5);
        const columns = Math.ceil(extentX / columnWidth);
        for (let row = -rows; row <= rows; row++) {
          for (let column = -columns; column <= columns; column++) {
            const cx = (column + row % 2 / 2) * columnWidth;
            const cy = row * 1.5;
            for (let corner = 0; corner < 6; corner++) {
              const angle = Math.PI / 6 + corner * Math.PI / 3;
              const x = cx + Math.cos(angle);
              const y = cy + Math.sin(angle);
              const key = `${Math.round(x * 100)},${Math.round(y * 100)}`;
              if (!vertices.has(key)) vertices.set(key, { x, y, angle: angle + Math.PI });
            }
          }
        }
      } else if (settings.arrangement === "pinwheel") {
        const rows = Math.ceil(extentY / 2.03);
        const columns = Math.ceil(extentX / 2.35);
        for (let row = -rows; row <= rows; row++) {
          const odd = Math.abs(row % 2);
          for (let column = -columns; column <= columns; column++) {
            for (let arm = 0; arm < 3; arm++) {
              const angle = -Math.PI / 2 + arm * Math.PI * 2 / 3;
              vertices.set(`${row},${column},${arm}`, {
                x: (column + odd / 2) * 2.35 + Math.cos(angle) * 0.62,
                y: row * 2.03 + Math.sin(angle) * 0.62,
                angle: angle + Math.PI / 2
              });
            }
          }
        }
      } else {
        const staggered = settings.arrangement === "staggered";
        const stepX = staggered ? 1.38 : 1.4;
        const stepY = staggered ? 1.12 : 1.05;
        const rows = Math.ceil(extentY / stepY);
        const columns = Math.ceil(extentX / stepX);
        for (let row = -rows; row <= rows; row++) {
          const odd = Math.abs(row % 2);
          for (let column = -columns; column <= columns; column++) {
            vertices.set(`${row},${column}`, {
              // Offset both grids so opposing stems meet an arm or a gap,
              // rather than lining up end-to-end in the diagonal weave.
              x: (column + odd / 2) * stepX,
              y: row * stepY,
              angle: Math.PI / 2 + (staggered ? odd : Math.abs((row + column) % 2)) * Math.PI
            });
          }
        }
      }
      const warp = ([x, y]) => {
        const amplitude = quirk / 100 * 0.18;
        return [
          x + amplitude * Math.sin(y * 1.7 + settings.seed) * Math.cos(x * 0.8),
          y + amplitude * Math.sin(x * 1.5 + settings.seed * 0.7) * Math.cos(y * 0.9)
        ];
      };
      const between = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      const point = (p) => `${p[0].toFixed(3)} ${p[1].toFixed(3)}`;
      const shades = palette.colors.flatMap((color) => Array.from(
        { length: 8 },
        (_, index) => mix(color, background, index / 7 * 0.09)
      ));
      const paths = shades.map(() => []);
      const outlines = /* @__PURE__ */ new Map();
      for (const vertex of vertices.values()) {
        const screenX = vertex.x * Math.cos(radians) - vertex.y * Math.sin(radians);
        const screenY = vertex.x * Math.sin(radians) + vertex.y * Math.cos(radians);
        if (Math.abs(screenX) > width / (2 * scale) + 1 || Math.abs(screenY) > height / (2 * scale) + 1) continue;
        const center = warp([vertex.x, vertex.y]);
        if (!outlines.has(vertex.angle)) {
          const outline = [];
          for (let arm = 0; arm < 3; arm++) {
            const angle = vertex.angle + arm * Math.PI * 2 / 3;
            for (const side of [-1, 1]) outline.push([
              0.72 * Math.cos(angle) - side * 0.21 * Math.sin(angle),
              0.72 * Math.sin(angle) + side * 0.21 * Math.cos(angle)
            ]);
            const elbow = angle + Math.PI / 3;
            outline.push([Math.cos(elbow) * 0.25, Math.sin(elbow) * 0.25]);
          }
          outlines.set(vertex.angle, outline);
        }
        const corners = outlines.get(vertex.angle).map(([x, y]) => warp([vertex.x + x, vertex.y + y]));
        for (let index = 0; index < corners.length; index++) {
          corners[index] = between(center, corners[index], 1 - gap / 100);
        }
        const rounding = 0.24;
        let path = `M ${point(between(corners[corners.length - 1], corners[0], 1 - rounding))}`;
        corners.forEach((corner, index) => {
          const next = corners[(index + 1) % corners.length];
          path += ` Q ${point(corner)} ${point(between(corner, next, rounding))}`;
          path += ` L ${point(between(corner, next, 1 - rounding))}`;
        });
        const colorIndex = Math.floor(noise(Math.round(vertex.x * 2), Math.round(vertex.y * 2)) * 6);
        const shadeIndex = Math.floor(noise(vertex.y, vertex.x) * 8);
        paths[colorIndex * 8 + shadeIndex].push(path + " Z");
      }
      for (let index = 0; index < paths.length; index++) {
        if (paths[index].length) pattern.append(element("path", {
          d: paths[index].join(" "),
          fill: shades[index]
        }));
      }
      frame.replaceChildren(root);
      svg = root;
    }
    const arrangementLabel = document.createElement("label");
    arrangementLabel.className = "arrangement-control";
    arrangementLabel.innerHTML = '<span>Arrangement</span><select aria-label="Arrangement"></select>';
    const arrangementSelect = arrangementLabel.querySelector("select");
    for (const [key, arrangement] of Object.entries(arrangements)) {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = arrangement.name;
      arrangementSelect.append(option);
    }
    arrangementSelect.value = settings.arrangement;
    arrangementSelect.addEventListener("change", () => {
      settings.arrangement = arrangementSelect.value;
      requestDraw();
    });
    form.append(arrangementLabel);
    const paletteLabel = document.createElement("label");
    paletteLabel.className = "palette-control";
    paletteLabel.innerHTML = '<span>Color scheme</span><select aria-label="Color scheme"></select><span class="swatches" aria-hidden="true"></span>';
    const paletteSelect = paletteLabel.querySelector("select");
    const swatches = paletteLabel.querySelector(".swatches");
    for (const [key, palette] of Object.entries(palettes)) {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = palette.name;
      paletteSelect.append(option);
    }
    paletteSelect.value = settings.palette;
    const showSwatches = () => {
      swatches.replaceChildren(...palettes[settings.palette].colors.map((color) => {
        const swatch = document.createElement("i");
        swatch.style.backgroundColor = color;
        return swatch;
      }));
    };
    paletteSelect.addEventListener("change", () => {
      settings.palette = paletteSelect.value;
      showSwatches();
      requestDraw();
    });
    showSwatches();
    form.append(paletteLabel);
    for (const [key, title, min, max, unit] of [
      ["size", "Shape size", 8, 240, ""],
      ["quirk", "Quirkiness", 0, 100, "%"],
      ["gap", "Charcoal seams", 0, 70, "%"]
    ]) {
      const label = document.createElement("label");
      label.innerHTML = `<span>${title}<output for="wallpaper-${key}"></output></span><input id="wallpaper-${key}" type="range" min="${min}" max="${max}" value="${settings[key]}">`;
      const input = label.querySelector("input");
      const output = label.querySelector("output");
      output.value = `${settings[key]}${unit}`;
      input.addEventListener("input", () => {
        settings[key] = Number(input.value);
        output.value = `${input.value}${unit}`;
        requestDraw();
      });
      form.append(label);
    }
    const actions = document.createElement("div");
    actions.className = "actions";
    const button = (title, handler) => {
      const node = document.createElement("button");
      node.type = "button";
      node.textContent = title;
      node.addEventListener("click", handler);
      actions.append(node);
      return node;
    };
    button("Shuffle colors", () => {
      settings.seed++;
      requestDraw();
    });
    const preview = button("Preview", () => {
      document.body.classList.add("clean");
      closePreview.focus();
    });
    const leavePreview = () => {
      document.body.classList.remove("clean");
      preview.focus();
    };
    const closePreview = document.createElement("button");
    closePreview.type = "button";
    closePreview.className = "preview-close";
    closePreview.textContent = "Back to controls";
    closePreview.addEventListener("click", leavePreview);
    main.append(closePreview);
    button("Export SVG", () => {
      if (pendingFrame) {
        cancelAnimationFrame(pendingFrame);
        pendingFrame = 0;
        draw();
      }
      const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "y-wallpaper.svg";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1e3);
    });
    form.append(actions);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && document.body.classList.contains("clean")) {
        leavePreview();
      }
    });
    draw();
  })();
})();
