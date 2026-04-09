# Landing page snapshot (`/`)

Structural outline aligned with `apps/web/src/app/page.tsx` and landing components (static HTML order). Refs are illustrative (e.g. Playwright accessibility tree style), not stable IDs.

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    # LandingTopNav — sticky header
    - banner [ref=e3]:
      - link "Ivano IQ home" [ref=e4] [cursor=pointer]:
        - /url: /
        - img [ref=e5]
        - generic [ref=e6]: Ivano IQ
      - navigation [ref=e7]:
        # Signed-out
        - button "Login" [ref=e8]
        - button "Sign up" [ref=e9]
        # Signed-in (alternate): link "Dashboard", UserButton menu

    # LandingHero
    - region [ref=e10]:
      - link "Explore the Platform" [ref=e11] [cursor=pointer]:
        - /url: /dashboard

    # LandingFeatures — id="platform"
    - region [ref=e12]:
      - generic [ref=e13]:
        - generic [ref=e14]:
          - img [ref=e15]
          - heading "Unified Visibility" [level=3] [ref=e16]
          - paragraph [ref=e17]: One lens across licences and assets — turn fragmented data into a single operational picture.
        - generic [ref=e18]:
          - img [ref=e19]
          - heading "Intelligent Risk Detection" [level=3] [ref=e20]
          - paragraph [ref=e21]: Prioritize what matters with explainable signals, not just raw counts.
        - generic [ref=e22]:
          - img [ref=e23]
          - heading "Audit-Ready Intelligence" [level=3] [ref=e24]
          - paragraph [ref=e25]: Export evidence and narratives stakeholders can defend — insight first, spreadsheets second.

    # LandingShowcase — region "Product showcase"
    - region "Product showcase" [ref=e26]:
      - generic [ref=e27]:
        - generic [ref=e28]:
          - heading "See all your licences in one place" [level=2] [ref=e29]
          - paragraph [ref=e30]: Unified visibility across assets, vendors, and licence types.
        - img "Dashboard overview with KPIs and risk summary" [ref=e31]
      - generic [ref=e32]:
        - generic [ref=e33]:
          - heading "Identify risks before regulators do" [level=2] [ref=e34]
          - paragraph [ref=e35]: Ranked risk scores and expiry signals so you act first.
        - img "Risk ranking and alerts" [ref=e36]
      - generic [ref=e37]:
        - generic [ref=e38]:
          - heading "Generate reports in seconds" [level=2] [ref=e39]
          - paragraph [ref=e40]: Export-ready PDFs and email delivery for audit workflows.
        - img "Reports and export options" [ref=e41]

    # LandingAiLayer
    - region [ref=e42]:
      - heading "Smart insights powered by your data" [level=2] [ref=e43]
      - paragraph [ref=e44]: Tie operational signals to decisions — weekly digests, risk ranks, and proactive alerts in one place.
      - list [ref=e45]:
        - listitem [ref=e46]:
          - img [ref=e47]
          - heading "Weekly insights" [level=3] [ref=e48]
          - paragraph [ref=e49]: Digest what changed in your licence portfolio without manual triage.
        - listitem [ref=e50]:
          - img [ref=e51]
          - heading "Risk scoring" [level=3] [ref=e52]
          - paragraph [ref=e53]: Prioritize vendors and expiries using consistent, explainable signals.
        - listitem [ref=e54]:
          - img [ref=e55]
          - heading "Alerts" [level=3] [ref=e56]
          - paragraph [ref=e57]: Surface what needs attention before it becomes an audit finding.

    # LandingFinalCta — signed-out shows Sign up modal trigger; signed-in shows dashboard link
    - region [ref=e58]:
      - button "Get Started" [ref=e59]   # signed-out (SignUpButton)
      # or link "Open Dashboard" [ref=e60]  # signed-in

    - contentinfo [ref=e61]:
      - note [ref=e62]: Powered by Techivano

  # Outside main: notifications, dev overlays in local dev only
  - region "Notifications alt+T"
```

## Removed sections (no longer on the page)

- Trust / social proof strip (“Trusted by regulators…”, tags, stat counters) — was `LandingTrustStrip`.
- “Who it’s for” block (subtitle and three audience cards) — was `LandingWhoItsFor`.

## Source order

`HomePage`: `LandingTopNav` → `LandingHero` → `LandingFeatures` → `LandingShowcase` → `LandingAiLayer` → `LandingFinalCta` → `footer` (`PoweredByTechivano`).

Last refreshed: 2026-04-08 (matches repo after removal of trust strip + who-it’s-for).
