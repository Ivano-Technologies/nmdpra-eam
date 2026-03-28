export type ExpiryBandCounts = {
  expired: number;
  critical: number;
  warning: number;
  safe: number;
};

/**
 * QuickChart URL for a pie chart (renders in PDF when Puppeteer can reach quickchart.io).
 * @see https://quickchart.io/documentation/
 */
export const generateExpiryPieChartUrl = (counts: ExpiryBandCounts): string => {
  const config = {
    type: "pie",
    data: {
      labels: ["Expired", "Critical (0–30d)", "Warning (31–60d)", "Safe"],
      datasets: [
        {
          data: [counts.expired, counts.critical, counts.warning, counts.safe],
          backgroundColor: ["#991b1b", "#c2410c", "#ca8a04", "#15803d"]
        }
      ]
    },
    options: {
      plugins: {
        legend: { position: "bottom" },
        title: { display: true, text: "Licence expiry distribution", font: { size: 14 } }
      }
    }
  };

  return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(config))}&width=520&height=340&devicePixelRatio=2`;
};
