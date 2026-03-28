(function () {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const apiBaseParam = params.get("api");
  const API_ROOT =
    apiBaseParam && apiBaseParam.trim()
      ? apiBaseParam.replace(/\/+$/, "")
      : "";
  const API_PREFIX = API_ROOT ? `${API_ROOT}/api` : "/api";

  const $ = function (id) {
    return document.getElementById(id);
  };

  const showBanner = function (message) {
    const el = $("banner-error");
    if (!el) {
      return;
    }
    el.textContent = message;
    el.classList.remove("hidden");
  };

  const hideBanner = function () {
    const el = $("banner-error");
    if (el) {
      el.classList.add("hidden");
    }
  };

  const setHealth = function (ok, detail) {
    const pill = $("health-pill");
    if (!pill) {
      return;
    }
    pill.textContent = detail;
    pill.classList.remove("pill-muted", "pill-ok", "pill-bad");
    pill.classList.add(ok ? "pill-ok" : "pill-bad");
  };

  const jsonOrThrow = async function (res) {
    const text = await res.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = null;
    }
    if (!res.ok) {
      const msg =
        body && typeof body.error === "string"
          ? body.error
          : `Request failed (${res.status})`;
      const err = new Error(msg);
      err.status = res.status;
      err.body = body;
      throw err;
    }
    return body;
  };

  const fetchJson = function (path) {
    return fetch(`${API_PREFIX}${path}`, {
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    }).then(jsonOrThrow);
  };

  const countRows = function (data) {
    return (
      (data.expired && data.expired.length) +
      (data.critical && data.critical.length) +
      (data.warning && data.warning.length)
    );
  };

  const renderExpiring = function (data) {
    const loading = $("expiring-loading");
    const content = $("expiring-content");
    const meta = $("expiring-meta");
    if (loading) {
      loading.classList.add("hidden");
    }
    if (content) {
      content.classList.remove("hidden");
    }
    if (meta) {
      const n = countRows(data);
      meta.textContent = n ? `${n} licence(s) in monitored buckets` : "No rows in buckets (empty dataset)";
    }

    const buckets = [
      { key: "expired", label: "Expired", className: "expired" },
      { key: "critical", label: "Critical", className: "critical" },
      { key: "warning", label: "Warning", className: "warning" }
    ];

    const parts = buckets
      .map(function (b) {
        const rows = data[b.key] || [];
        return (
          '<div class="bucket ' +
          b.className +
          '"><h3>' +
          b.label +
          '</h3><div class="num">' +
          rows.length +
          "</div></div>"
        );
      })
      .join("");

    const sampleRows = []
      .concat(data.critical || [], data.warning || [])
      .slice(0, 8);

    let tableHtml = "";
    if (sampleRows.length) {
      tableHtml =
        '<div class="table-wrap"><table><thead><tr><th>Vendor</th><th>Licence</th><th>Expires</th><th>Status</th></tr></thead><tbody>' +
        sampleRows
          .map(function (r) {
            var exp =
              r.expiryDateEnGb !== undefined && r.expiryDateEnGb !== null
                ? String(r.expiryDateEnGb)
                : formatIsoDateEnGb(String(r.expiryDate || ""));
            return (
              "<tr><td>" +
              escapeHtml(String(r.vendorName || "—")) +
              "</td><td>" +
              escapeHtml(String(r.licenseType)) +
              "</td><td>" +
              escapeHtml(exp) +
              "</td><td>" +
              escapeHtml(String(r.expiryStatus)) +
              "</td></tr>"
            );
          })
          .join("") +
        "</tbody></table></div>";
    } else {
      tableHtml = '<p class="empty">No critical or warning rows to preview.</p>';
    }

    if (content) {
      content.innerHTML = '<div class="bucket-grid">' + parts + "</div>" + tableHtml;
    }
  };

  const escapeHtml = function (s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };

  /** YYYY-MM-DD → en-GB in UTC (matches API / CSV formatting). */
  const formatIsoDateEnGb = function (isoDate) {
    var parts = String(isoDate || "")
      .trim()
      .split("-");
    if (parts.length !== 3) {
      return String(isoDate || "");
    }
    var y = Number(parts[0]);
    var m = Number(parts[1]);
    var d = Number(parts[2]);
    if (!y || !m || !d) {
      return String(isoDate || "");
    }
    var dt = new Date(Date.UTC(y, m - 1, d));
    return dt.toLocaleDateString("en-GB", { timeZone: "UTC" });
  };

  const renderRisk = function (rows) {
    const loading = $("risk-loading");
    const content = $("risk-content");
    if (loading) {
      loading.classList.add("hidden");
    }
    if (content) {
      content.classList.remove("hidden");
    }
    if (!rows || !rows.length) {
      if (content) {
        content.innerHTML = '<p class="empty">No risk ranking data.</p>';
      }
      return;
    }
    const slice = rows.slice(0, 12);
    const tableHtml =
      '<div class="table-wrap"><table><thead><tr><th>Vendor</th><th>Licence</th><th>Risk</th><th>Days</th></tr></thead><tbody>' +
      slice
        .map(function (r) {
          return (
            "<tr><td>" +
            escapeHtml(String(r.vendorName)) +
            "</td><td>" +
            escapeHtml(String(r.licenseType)) +
            "</td><td>" +
            escapeHtml(String(r.riskScore)) +
            "</td><td>" +
            escapeHtml(String(r.daysToExpiry)) +
            "</td></tr>"
          );
        })
        .join("") +
      "</tbody></table></div>";
    if (content) {
      content.innerHTML = tableHtml;
    }
  };

  const setExportLinks = function () {
    const csv = $("link-csv");
    const pdf = $("link-pdf");
    const base = API_PREFIX;
    if (csv) {
      csv.href = base + "/licenses/export.csv";
    }
    if (pdf) {
      pdf.href = base + "/reports/mvp.pdf";
    }
  };

  const pingHealth = async function () {
    const url = API_ROOT ? `${API_ROOT}/health` : "/health";
    try {
      const res = await fetch(url, { credentials: "same-origin" });
      const body = await jsonOrThrow(res);
      const v = body && body.version ? " v" + body.version : "";
      const cx = body && body.convexConfigured ? " · Convex OK" : " · Convex not set";
      setHealth(true, "API healthy" + v + cx);
      hideBanner();
    } catch (e) {
      setHealth(false, "API unreachable");
      showBanner(
        "Health check failed. If the UI is opened from another origin, pass ?api=http://host:port."
      );
    }
  };

  const loadAll = async function () {
    hideBanner();
    const loadingE = $("expiring-loading");
    const loadingR = $("risk-loading");
    const contentE = $("expiring-content");
    const contentR = $("risk-content");
    if (loadingE) {
      loadingE.classList.remove("hidden");
    }
    if (loadingR) {
      loadingR.classList.remove("hidden");
    }
    if (contentE) {
      contentE.classList.add("hidden");
    }
    if (contentR) {
      contentR.classList.add("hidden");
    }

    try {
      const [expiring, risk] = await Promise.all([
        fetchJson("/licenses/expiring"),
        fetchJson("/licenses/risk-ranking")
      ]);
      renderExpiring(expiring);
      renderRisk(risk);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load licence data";
      showBanner(msg + " — check CONVEX_URL and ingested data.");
      if (loadingE) {
        loadingE.classList.add("hidden");
      }
      if (loadingR) {
        loadingR.classList.add("hidden");
      }
    }
  };

  const foot = $("api-foot");
  if (foot) {
    foot.textContent = API_PREFIX;
  }

  setExportLinks();

  $("btn-refresh")?.addEventListener("click", function () {
    loadAll();
    pingHealth();
  });

  pingHealth();
  loadAll();
})();
