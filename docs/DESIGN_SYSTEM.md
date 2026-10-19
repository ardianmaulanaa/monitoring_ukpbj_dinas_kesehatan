# Design System SIMUKPBJ

> Audited 2026-10-17 from current Dashboard and shared navigation components. Tokens are currently expressed as Tailwind arbitrary colors, not global CSS variables.

## Principles

Clean, institutional, readable, responsive, and data-driven. Dense operational information should remain scannable; semantic warning colors are reserved for status/risk.

## Dashboard palette

| Purpose | Value used |
|---|---|
| Page background | `#f4f7f5` / dashboard content `#f6f9f7` family |
| Surface | `#ffffff` |
| Primary | `#087f4f` |
| Primary light | `#e8f7ee` |
| Heading | `#142d25` |
| Text/muted | `#253d34` / `#64796f` |
| Border/divider | `#dee9e2` / `#e9efeb` |
| Success | `#16834c` |
| Danger | `#c24141` |
| Chart blue/teal/amber | `#2563a8`, `#0f766e`, `#d29a38` |

Do not apply Dashboard palette through generic `aside`, `header`, `main`, or `nav` selectors. Scope styles to the component/page.

## Shared application shell

All protected pages use `ProtectedDashboardLayout`, `DashboardShell`, shared `Sidebar`, and shared `AppHeader`. A page must not instantiate a second sidebar/header or add hard-coded sidebar offsets. Changes to navigation components require regression checks on Dashboard, SIRUP/RUP, Perencanaan, Verifikasi, E-Purchasing, Tender/Non-Tender, and Kontrak/SP.

## Dashboard composition

1. AppHeader shared.
2. Monthly package histogram card.
3. Six KPI cards.
4. Analytics grid: funding donut, monthly cumulative trend, current-stage donut.
5. Funding and procurement summary cards.

The former hero and Dashboard filter bar are no longer rendered. Data scope uses backend defaults.

### Charts

- Chart cards: white surface, subtle green-gray border, 16px radius, fixed chart height.
- Histogram: green bars; 12 months; integer Y axis; `createdAt` input count.
- Trend: blue pagu and teal realization; cumulative; Chart.js `tension: 0` for linear segments; exact-currency tooltip.
- Donuts: coordinated non-neon palette; actual data only; empty state when no values.
- Parent canvas container must have explicit height and `min-width:0` to avoid clipping/overflow.

### KPI cards

Uniform white cards with label, small icon, large value, helper, and progress only when a valid denominator exists. Risk uses red accent only where semantically relevant. Currency display may be compact; tooltip/detail must preserve meaning.

## Other components

- Tables: responsive wrapper, readable header, explicit empty/loading/error states.
- SIRUP/RUP package list: compact two-section cards with a flexible identity/finance header and wrapping metadata/actions footer. Cards use `min-width: 0`, `minmax(0, 1fr)`, and wrapping actions; the list must not require horizontal scrolling. Full administrative data remains available from Detail.
- Forms/wizards: visible labels, server error feedback, consistent control height, no client-only validation trust.
- Modal/drawer: focusable close action, correct backdrop/z-index, body state restored on close.
- Notifications: shared header UI and dedicated route.
- Skeletons: mirror final geometry using light neutral colors.

## Responsive rules

- Mobile (<768): one-column charts; KPI 1-2 columns as space permits; navigation uses shared drawer.
- Tablet (768-1023): two-column cards where readable; charts 1-2 columns.
- Laptop (1024-1439): shared desktop navigation behavior; KPI generally 2-3 columns; chart grid wraps.
- Wide desktop: six KPI columns only when cards remain readable; three analytics columns.
- No horizontal page overflow; allow filters/controls to wrap instead of shrinking headings.

## Accessibility

Maintain sufficient contrast, keyboard actions, visible focus, semantic labels, canvas chart titles/adjacent text, and textual empty states. Do not encode status by color alone.
