(() => {
  "use strict";

  const QUIET_ZONE_MODULES = 4;
  const form = document.querySelector("#qr-form");
  const urlInput = document.querySelector("#qr-url");
  const errorLevelInput = document.querySelector("#error-level");
  const pngSizeInput = document.querySelector("#png-size");
  const preview = document.querySelector("#qr-preview");
  const encodedUrl = document.querySelector("#encoded-url");
  const status = document.querySelector("#status");
  const svgButton = document.querySelector("#download-svg");
  const pngButton = document.querySelector("#download-png");
  const printButton = document.querySelector("#print-qr");
  const copyButton = document.querySelector("#copy-url");

  let currentQr = null;
  let currentSvg = "";
  let currentUrl = "";

  function setStatus(message, state = "ok") {
    status.textContent = message;
    status.dataset.state = state;
  }

  function detectPublishedEntryUrl() {
    if (!/^https?:$/.test(window.location.protocol)) return "";

    const url = new URL(window.location.href);
    url.hash = "";
    url.search = "";
    url.pathname = url.pathname.replace(/\/(?:qr|index)\.html$/i, "/");
    return url.href;
  }

  function normalizeEntryUrl(rawValue) {
    const url = new URL(rawValue.trim());
    if (url.protocol !== "https:") {
      throw new Error("URL cố định phải bắt đầu bằng https://");
    }

    url.hash = "";
    url.search = "";
    url.pathname = url.pathname.replace(/\/(?:qr|index)\.html$/i, "/");
    return url.href;
  }

  function buildSvg(qr) {
    const count = qr.getModuleCount();
    const total = count + QUIET_ZONE_MODULES * 2;
    const commands = [];

    for (let row = 0; row < count; row += 1) {
      for (let column = 0; column < count; column += 1) {
        if (qr.isDark(row, column)) {
          const x = column + QUIET_ZONE_MODULES;
          const y = row + QUIET_ZONE_MODULES;
          commands.push(`M${x} ${y}h1v1h-1z`);
        }
      }
    }

    return [
      `<svg xmlns="http://www.w3.org/2000/svg" width="50mm" height="50mm" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">`,
      "<title>Dynamic QR</title>",
      `<rect width="${total}" height="${total}" fill="#fff"/>`,
      `<path d="${commands.join("")}" fill="#000"/>`,
      "</svg>"
    ].join("");
  }

  function safeFilename() {
    try {
      const url = new URL(currentUrl);
      const path = url.pathname.replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9]+/gi, "-");
      return `${path || url.hostname}-dynamic-qr`;
    } catch (_) {
      return "dynamic-qr";
    }
  }

  function downloadBlob(blob, filename) {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  function generate() {
    if (typeof window.qrcode !== "function") {
      throw new Error("Không tải được thư viện tạo QR. Hãy kiểm tra kết nối Internet rồi tải lại trang.");
    }

    currentUrl = normalizeEntryUrl(urlInput.value);
    urlInput.value = currentUrl;

    const qr = window.qrcode(0, errorLevelInput.value);
    qr.addData(currentUrl, "Byte");
    qr.make();

    currentQr = qr;
    currentSvg = buildSvg(qr);
    preview.innerHTML = currentSvg;
    encodedUrl.textContent = currentUrl;

    svgButton.disabled = false;
    pngButton.disabled = false;
    printButton.disabled = false;
    copyButton.disabled = false;
    setStatus(`Đã tạo QR cấp ${errorLevelInput.value}, vùng trắng 4 module.`);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      generate();
    } catch (error) {
      setStatus(error.message || "Không thể tạo QR.", "error");
    }
  });

  svgButton.addEventListener("click", () => {
    if (!currentSvg) return;
    downloadBlob(new Blob([currentSvg], { type: "image/svg+xml;charset=utf-8" }), `${safeFilename()}.svg`);
    setStatus("Đã tải SVG vector.");
  });

  pngButton.addEventListener("click", () => {
    if (!currentQr) return;

    const count = currentQr.getModuleCount();
    const totalModules = count + QUIET_ZONE_MODULES * 2;
    const requestedPixels = Number.parseInt(pngSizeInput.value, 10) || 2048;
    const modulePixels = Math.max(1, Math.ceil(requestedPixels / totalModules));
    const actualPixels = totalModules * modulePixels;
    const canvas = document.createElement("canvas");
    canvas.width = actualPixels;
    canvas.height = actualPixels;

    const context = canvas.getContext("2d", { alpha: false });
    context.imageSmoothingEnabled = false;
    context.fillStyle = "#fff";
    context.fillRect(0, 0, actualPixels, actualPixels);
    context.fillStyle = "#000";

    for (let row = 0; row < count; row += 1) {
      for (let column = 0; column < count; column += 1) {
        if (currentQr.isDark(row, column)) {
          context.fillRect(
            (column + QUIET_ZONE_MODULES) * modulePixels,
            (row + QUIET_ZONE_MODULES) * modulePixels,
            modulePixels,
            modulePixels
          );
        }
      }
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        setStatus("Trình duyệt không thể xuất PNG.", "error");
        return;
      }
      downloadBlob(blob, `${safeFilename()}-${actualPixels}px.png`);
      setStatus(`Đã tải PNG ${actualPixels} × ${actualPixels} px, không nội suy.`);
    }, "image/png");
  });

  printButton.addEventListener("click", () => window.print());

  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setStatus("Đã sao chép URL cố định.");
    } catch (_) {
      setStatus("Không thể sao chép tự động; hãy chọn và sao chép URL hiển thị bên dưới QR.", "error");
    }
  });

  const detectedUrl = detectPublishedEntryUrl();
  if (detectedUrl) {
    urlInput.value = detectedUrl;
    try {
      generate();
    } catch (error) {
      setStatus(error.message || "Không thể tạo QR.", "error");
    }
  } else {
    setStatus("Hãy mở trang này từ GitHub Pages hoặc nhập URL cố định để tạo QR.");
  }
})();
