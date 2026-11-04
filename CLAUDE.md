# CLAUDE.md — TVT Scanner Frontend Widget & WordPress Plugin

## Project Overview
This repository contains the client-side embeddable interactive widget and WordPress companion plugin for TVT Web Scanner 60s. It provides a drop-in web component for websites (`tvtagency.com`, `toilatung.com`, client sites) to allow users to scan their website, see real-time animated scanning progress, view an interactive scorecard, and unlock a 5-page branded PDF report by submitting contact information.

## Tech Stack & Architecture
- **Vanilla JavaScript**: Pure JS (ES2022/CommonJS), no framework dependencies, zero bundle overhead (<25KB minified).
- **CSS3**: BEM-like scoping with `tvt-sw-` prefix, CSS variables with TVT Agency Design Tokens.
- **WordPress Plugin**: Pure PHP 8.1+, registers shortcode `[tvt_scanner_widget]`, enqueue scripts, admin settings.
- **Testing**: Node.js built-in test runner (`node --test tests/*.test.js`).
- **Demo**: Standalone HTML page + mock server for local preview.

## Design Tokens (TVT Agency Brand)
- Navy Blue: `#003189`
- Amber Gold: `#FA8A1A`
- Dark Charcoal: `#0D0D1A`
- Off-White: `#F8FAFC`
- Emerald Green: `#16A34A`
- Danger Red: `#DC2626`

## Implementation Checklist
1. `src/widget.js`:
   - Global `TVTScanner.init({ containerId, apiUrl, zaloUrl, autoScroll })`
   - Data-attribute auto initialization (`[data-tvt-scanner]`)
   - State machine: `IDLE` -> `SCANNING` -> `POLLING` -> `COMPLETED` -> `LEAD_MODAL` -> `DOWNLOADED` / `ERROR`
   - URL normalization (auto prepends `https://`)
   - Real-time polling with 2.5s interval to `GET ${apiUrl}/api/v1/audit/:id/status`
   - Lead submission handler updating audit with name/phone/email before triggering PDF download
   - Zalo 1-1 CTA link integration
2. `src/widget.css`:
   - Scoped under `.tvt-sw-root` to avoid leaking styles to host pages
   - Responsive flex/grid layout
   - Animated progress bar & pulsating radar scan effect
   - Circular score indicators with color gradients
3. `src/i18n/vi.json`:
   - Vietnamese labels, step descriptions, tooltips, validation messages
4. `wordpress-plugin/tvt-scanner-widget.php`:
   - Valid WordPress plugin headers
   - Shortcode `[tvt_scanner_widget api_url="" zalo_url=""]`
   - Options page under Settings > TVT Scanner Widget
5. `demo/index.html` & `demo/mock-server.js`:
   - Working demo with toggle between Mock API and Live API
6. `tests/`:
   - `tests/widget-init.test.js`: DOM initialization and container checks
   - `tests/state-machine.test.js`: State changes during scan lifecycle
   - `tests/validation.test.js`: Domain and VN phone number validation

## Verification Command
```bash
npm test
```
All tests must pass with 0 failures before pushing.
