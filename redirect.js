(() => {
  "use strict";

  const heading = document.querySelector("#heading");
  const status = document.querySelector("#status");
  const spinner = document.querySelector("#spinner");
  const actions = document.querySelector("#actions");
  const targetLink = document.querySelector("#target-link");
  const retryButton = document.querySelector("#retry");
  const previewMode = new URLSearchParams(window.location.search).get("preview") === "1";

  function comparableUrl(value) {
    const url = new URL(value);
    url.hash = "";
    url.search = "";
    url.pathname = url.pathname.replace(/\/index\.html$/i, "/");
    return url.href;
  }

  function validateTarget(value) {
    if (typeof value !== "string" || value.trim() === "") {
      throw new Error("config.json chưa có targetUrl hợp lệ.");
    }

    const target = new URL(value.trim());
    if (target.protocol !== "https:") {
      throw new Error("targetUrl phải bắt đầu bằng https://");
    }

    if (comparableUrl(target.href) === comparableUrl(window.location.href)) {
      throw new Error("targetUrl đang trỏ ngược về chính trang chuyển hướng.");
    }

    return target;
  }

  function showError(error) {
    console.error("Dynamic QR redirect failed:", error);
    document.title = "Không thể chuyển hướng";
    heading.textContent = "Chưa thể mở nội dung";
    status.textContent = "Vui lòng kiểm tra kết nối rồi thử lại. Nếu lỗi vẫn còn, quản trị viên cần kiểm tra file config.json.";
    spinner.hidden = true;
    targetLink.hidden = true;
    actions.hidden = false;
  }

  function showPreview(config, target) {
    const stageName = typeof config.stageName === "string" && config.stageName.trim()
      ? config.stageName.trim()
      : "Nội dung hiện tại";
    const updatedAt = typeof config.updatedAt === "string" && config.updatedAt.trim()
      ? `Cấu hình cập nhật: ${config.updatedAt.trim()}`
      : "Cấu hình chưa ghi thời điểm cập nhật.";

    document.title = `Kiểm tra — ${stageName}`;
    heading.textContent = stageName;
    status.textContent = `${updatedAt}. Chế độ kiểm tra đang bật nên trang chưa tự chuyển hướng.`;
    spinner.hidden = true;
    targetLink.href = target.href;
    targetLink.hidden = false;
    actions.hidden = false;
  }

  async function loadAndRedirect() {
    spinner.hidden = false;
    actions.hidden = true;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);

    try {
      const configUrl = new URL("config.json", document.baseURI);
      configUrl.searchParams.set("v", Date.now().toString());

      const response = await fetch(configUrl, {
        cache: "no-store",
        credentials: "same-origin",
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Không tải được config.json (HTTP ${response.status}).`);
      }

      const config = await response.json();
      const target = validateTarget(config.targetUrl);

      if (previewMode) {
        showPreview(config, target);
        return;
      }

      window.location.replace(target.href);
    } catch (error) {
      showError(error);
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  retryButton.addEventListener("click", loadAndRedirect);
  loadAndRedirect();
})();
