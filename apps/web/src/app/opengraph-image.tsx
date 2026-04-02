import { readFile } from "fs/promises";
import { join } from "path";

import { ImageResponse } from "next/og";

import { BRAND_TAGLINE, PRODUCT_NAME } from "@/lib/brand";

export const runtime = "nodejs";

export const alt = `${PRODUCT_NAME} — Operational intelligence for enterprise infrastructure`;

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

/**
 * 1200×630 social preview — dark canvas, official mark, gold headline, faux dashboard panel.
 */
export default async function OpenGraphImage() {
  const markPath = join(process.cwd(), "public", "brand", "techivano-mark.png");
  const markBuf = await readFile(markPath);
  const markDataUrl = `data:image/png;base64,${markBuf.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(155deg, #050505 0%, #14100d 45%, #0a192f 100%)",
          padding: 48,
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 36
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- OG image pipeline */}
          <img
            src={markDataUrl}
            width={56}
            height={56}
            alt=""
            style={{
              borderRadius: 12,
              objectFit: "contain"
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 28, fontWeight: 700 }}>
              <span style={{ color: "#ffffff" }}>Ivano </span>
              <span
                style={{
                  color: "#D4AF37",
                  textShadow: "0 0 6px rgba(212,175,55,0.35)"
                }}
              >
                IQ
              </span>
            </span>
            <span style={{ color: "#94a3b8", fontSize: 14 }}>{BRAND_TAGLINE}</span>
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, gap: 40, alignItems: "stretch" }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 20,
              maxWidth: "52%"
            }}
          >
            <span
              style={{
                color: "#D4AF37",
                fontSize: 46,
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: "-0.02em"
              }}
            >
              Regulatory Compliance, Simplified
            </span>
            <span style={{ color: "#cbd5e1", fontSize: 22, lineHeight: 1.4 }}>
              Turn compliance data into actionable operational intelligence with {PRODUCT_NAME}.
            </span>
          </div>

          <div
            style={{
              flex: 1,
              borderRadius: 16,
              border: "1px solid rgba(212,175,55,0.25)",
              background: "rgba(15, 15, 15, 0.85)",
              overflow: "hidden",
              display: "flex",
              alignItems: "stretch",
              justifyContent: "center",
              minHeight: 320,
              padding: 24
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                width: "100%",
                height: "100%"
              }}
            >
              <div style={{ display: "flex", gap: 8 }}>
                <div
                  style={{
                    flex: 1,
                    height: 56,
                    borderRadius: 8,
                    background: "linear-gradient(90deg, #1a1410, #2a211c)"
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    height: 56,
                    borderRadius: 8,
                    background: "linear-gradient(90deg, #1a1410, #2a211c)"
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    height: 56,
                    borderRadius: 8,
                    background: "linear-gradient(90deg, #1a1410, #2a211c)"
                  }}
                />
              </div>
              <div
                style={{
                  flex: 1,
                  borderRadius: 12,
                  background: "linear-gradient(180deg, #14100d 0%, #0a0807 100%)",
                  border: "1px solid rgba(255,255,255,0.06)"
                }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <div
                  style={{
                    flex: 2,
                    height: 12,
                    borderRadius: 4,
                    background: "#3d2e26"
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    height: 12,
                    borderRadius: 4,
                    background: "#D4AF37",
                    opacity: 0.45
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size
    }
  );
}
