# TVT Scanner Frontend Widget

Embeddable interactive web audit scanner widget and WordPress companion plugin for **TVT Web Scanner 60s**. Drop a single `<script>` tag onto any website to let visitors scan their domain for performance, security, AEO (AI Engine Optimization), and mobile issues — all in 60 seconds.

## Features

- **Zero dependencies** — Pure Vanilla JS + CSS, under 25KB minified
- **Universal embed** — Works on any site: static HTML, Astro, Next.js, Webflow, Shopify, WordPress
- **Real-time scanning** — Animated radar progress with 4-step status indicator
- **Interactive scorecard** — Overall score badge + 4 category breakdowns with color-coded bars
- **Lead capture** — Gated PDF download with name, phone (VN validation), and email fields
- **Zalo CTA** — Direct 1-1 consultation button after download
- **WordPress plugin** — Shortcode `[tvt_scanner_widget]` with admin settings page
- **100% mobile responsive** — Flexbox/grid layout with scoped CSS (`tvt-sw-` prefix)

## Quick Start

### HTML Embed (Any Website)

```html
<link rel="stylesheet" href="https://cdn.tvtagency.com/widget/widget.css" />
<script src="https://cdn.tvtagency.com/widget/widget.js"></script>

<!-- Option 1: Declarative (auto-init) -->
<div data-tvt-scanner
     data-api-url="https://api.tvtagency.com"
     data-zalo-url="https://zalo.me/tvtagency">
</div>

<!-- Option 2: Programmatic -->
<div id="my-scanner"></div>
<script>
  TVTScanner.init({
    containerId: 'my-scanner',
    apiUrl: 'https://api.tvtagency.com',
    zaloUrl: 'https://zalo.me/tvtagency',
    autoScroll: true
  });
</script>
```

### WordPress

1. Upload the `wordpress-plugin/` folder to `/wp-content/plugins/tvt-scanner-widget/`
2. Activate via **Plugins** menu
3. Configure API URL at **Settings > TVT Scanner Widget**
4. Add the shortcode to any page or post:

```
[tvt_scanner_widget]
```

Override per-shortcode:

```
[tvt_scanner_widget api_url="https://api.tvtagency.com" zalo_url="https://zalo.me/tvtagency"]
```

Compatible with Elementor, Gutenberg, and Divi.

## Configuration Options

| Option | Type | Default | Description |
|---|---|---|---|
| `containerId` | string | *required* | ID of the DOM element to mount the widget |
| `apiUrl` | string | `''` | Backend API base URL (TVT Web Scanner 60s) |
| `zaloUrl` | string | `'https://zalo.me/tvtagency'` | Zalo chat link for 1-1 CTA |
| `autoScroll` | boolean | `true` | Auto-scroll to widget on scan completion |

## Architecture

```
tvt-scanner-frontend-widget/
├── src/
│   ├── widget.js          # Core SDK (UMD, global TVTScanner)
│   ├── widget.css          # Scoped styles with CSS variables
│   └── i18n/
│       └── vi.json         # Vietnamese translations
├── wordpress-plugin/
│   ├── tvt-scanner-widget.php   # WP plugin with shortcode + admin page
│   └── readme.txt               # WP plugin metadata
├── demo/
│   ├── index.html          # Interactive demo page
│   └── mock-server.js      # Local mock API server
└── tests/
    ├── widget-init.test.js      # Initialization tests
    ├── state-machine.test.js    # State transition tests
    └── validation.test.js       # URL & phone validation tests
```

### State Machine

```
IDLE → SCANNING → POLLING → COMPLETED → LEAD_GATE → DOWNLOADED
                                ↗                        ↓
                          ERROR ←←←←←←←←←←←←←←←←←← (retry → IDLE)
```

### API Endpoints Used

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/audit` | Start a new audit (body: `{url}`) |
| `GET` | `/api/v1/audit/:id/status` | Poll scan progress (every 2.5s) |
| `PATCH` | `/api/v1/audit/:id` | Submit lead contact info |
| `GET` | `/api/v1/audit/:id/pdf` | Download PDF report |

### Design Tokens

| Token | Color | Usage |
|---|---|---|
| Navy Blue | `#003189` | Primary brand, headings |
| Amber Gold | `#FA8A1A` | CTA buttons, accents |
| Dark Charcoal | `#0D0D1A` | Body text |
| Off-White | `#F8FAFC` | Card backgrounds |
| Emerald Green | `#16A34A` | Good scores, success |
| Danger Red | `#DC2626` | Poor scores, errors |

## Development

### Local Demo

```bash
npm run demo
```

Opens mock server at `http://localhost:3000` with full API simulation.

### Run Tests

```bash
npm test
```

Uses Node.js built-in test runner with jsdom for DOM simulation.

## License

MIT — TVT Agency
