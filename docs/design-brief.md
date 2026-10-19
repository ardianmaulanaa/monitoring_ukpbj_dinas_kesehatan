# Design Brief SIMUKPBJ

## Direction

SIMUKPBJ should feel like a modern government operations application: clean, professional, institutional, readable, consistent, responsive, and grounded in verified data. White surfaces and emerald accents carry the brand; warning, danger, and muted blue appear only when they communicate meaning.

## Experience goals

- A leader can understand budget, realization, progress, and risk quickly.
- Operators can complete workflows without guessing required data or status.
- Navigation is identical across modules because it comes from one shared shell.
- Charts communicate real backend values and expose empty/error states honestly.
- Dense content remains usable on laptop and mobile without overflow.

## Dashboard hierarchy (implemented)

1. Shared AppHeader/navigation context.
2. Full-width “Jumlah Paket per Bulan” histogram based on RUP `createdAt`.
3. Six KPI cards: total pagu, realization, contract value, efficiency, completed, risk.
4. Three analytics: funding allocation, cumulative budget/realization, current stage.
5. Funding and procurement summaries.

The old large title/description hero and global filter bar are removed. Do not reintroduce them without a new approved requirement.

## Layout guardrail

Dashboard must fit inside the existing application shell. It must not create or restyle global Sidebar/AppHeader, duplicate navigation state, use `100vw` against the content area, or introduce a hard-coded sidebar margin.

## Visual system

- Background: very light green-gray.
- Cards: white, subtle `#dee9e2` borders, 12-16px radius, restrained shadows.
- Primary/active: emerald `#087f4f`; heading `#142d25`; muted text `#64796f`.
- Typography: application font; clear hierarchy; no excessive uppercase.
- Spacing: 4/8px rhythm; 16-20px card padding; 24-32px section rhythm.

## States

Every data surface must distinguish loading, empty, error, and success. Zero is shown only when it is a real calculated zero—not as a substitute for fetch failure or unsupported data.

## Responsive intent

Mobile uses the existing drawer and single-column analytics. Tablet/laptop grids wrap naturally. Wide desktop may show six KPI cards and three charts in one row. Legends, tooltips, and axes may not be clipped.

## Non-goals

- No independent dark Dashboard theme.
- No fake charts, random/demo values, or evenly distributed annual totals.
- No page-specific replacement for shared navigation.

Detailed tokens and component rules: [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).
