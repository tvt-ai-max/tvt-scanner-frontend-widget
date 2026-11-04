# PRODUCT REQUIREMENT DOCUMENT (PRD) & SPECIFICATION
## TVT Scanner Frontend Widget & WordPress Plugin (Client-Side Embed SDK)

**Organization**: TVT Agency (`tvtagency.com` / `toilatung.com`)  
**Project**: `tvt-scanner-frontend-widget`  
**Architecture Lead**: Nguyễn Thanh Tùng (Founder)  
**Operations Lead**: Lexi AI (Senior Operations Manager)  
**Target Repository**: `https://github.com/tvt-ai-max/tvt-scanner-frontend-widget`  
**Design Tokens**: Dark Navy `#003189`, Amber Gold `#FA8A1A`, Charcoal `#0D0D1A`, Off-White `#F8FAFC`, Emerald `#16A34A`

---

## 1. MỤC TIÊU SẢN PHẨM (MISSION & GOALS)
- Xây dựng **Embeddable Web Audit Widget** chạy độc lập (Vanilla JavaScript + CSS, zero-dependency, bundle < 25KB).
- Có thể nhúng vào bất kỳ website nào (HTML tĩnh, Astro, Next.js, Webflow, Shopify) chỉ bằng 1 thẻ `<script>` và `<div data-tvt-scanner></div>`.
- Kèm theo **WordPress Plugin** hoàn chỉnh (`wordpress-plugin/tvt-scanner-widget.php`) cung cấp shortcode `[tvt_scanner_widget]` tương thích 100% với Elementor, Gutenberg, Divi.
- Đóng vai trò là **Đầu phễu thu hút khách hàng tiềm năng (Lead Magnet)** cho TVT Agency kết nối trực tiếp với backend `tvt-web-scanner-60s`.

---

## 2. KIẾN TRÚC & QUY TRÌNH HOẠT ĐỘNG (INTERACTION FLOW)

```
[Khách truy cập Web / Landing Page]
         │
         ▼
[Giao diện Widget TVT Scanner: Nhập tên miền (VD: doanhnghiep.vn)]
         │
         ▼ (Bấm "QUÉT MIỄN PHÍ TRONG 60 GIÂY")
[Gọi API POST /api/v1/audit] ───► [Lấy audit_id & status: PROCESSING]
         │
         ▼ (Polling GET /api/v1/audit/:id/status mỗi 2.5s)
[Hiển thị Thanh tiến trình quét động (Progress Bar 0-100%)]
  ├── 0-15s: Kiểm tra SSL & Tiêu chuẩn An ninh Headers
  ├── 15-30s: Đo lường Core Web Vitals (LCP, TTFB, CLS) & Tốc độ Di động
  ├── 30-45s: Phân tích Cấu trúc Schema JSON-LD & Độ sẵn sàng AEO/AI Search
  └── 45-60s: Tính toán chỉ số 4 chiều & Kết xuất PDF Báo cáo 5 trang
         │
         ▼ (Status: COMPLETED)
[Hiển thị Bảng Điểm Tương Tác (Interactive Scorecard)]
  ├── Điểm Tổng quan (0-100 Badge) với dải màu (Xanh/Vàng/Đỏ)
  ├── 4 Thẻ Phân tích: Hiệu năng (40%), Bảo mật (25%), AEO (20%), Mobile (15%)
  └── Form Mở khóa Tải Báo cáo (Lead Gating Form):
        ├── Họ tên khách hàng
        ├── Số điện thoại Zalo (Bắt buộc)
        └── Email nhận file
         │
         ▼ (Bấm "TẢI BÁO CÁO PDF CHI TIẾT 5 TRANG")
  ├── Kích hoạt tải trực tiếp file GET /api/v1/audit/:id/pdf
  ├── Bắn thông tin Lead cập nhật về backend /api/v1/audit hoặc Telegram
  └── Hiển thị nút CTA: "Tư vấn 1-1 với Founder Nguyễn Thanh Tùng qua Zalo"
```

---

## 3. CÁC THÀNH PHẦN CẦN TRIỂN KHAI (FILE STRUCTURE)

```
tvt-scanner-frontend-widget/
├── PRD_SPEC_TVT_SCANNER_WIDGET.md
├── CLAUDE.md
├── README.md
├── package.json
├── src/
│   ├── widget.js                # Core Widget SDK (Vanilla JS, UMD / Global TVTScanner)
│   ├── widget.css               # TVT Design Tokens styling, responsive, animations
│   └── i18n/
│       └── vi.json              # Vietnamese copy texts & error messages
├── wordpress-plugin/
│   ├── tvt-scanner-widget.php   # Main WordPress plugin file
│   └── readme.txt               # WordPress plugin metadata
├── demo/
│   ├── index.html               # Demo page for live testing
│   └── mock-server.js           # Lightweight mock server for local test
└── tests/
    ├── widget-init.test.js      # Testing widget mounting and options
    ├── state-machine.test.js    # Testing transitions (IDLE -> SCANNING -> COMPLETED)
    └── validation.test.js       # URL format & VN phone validation tests
```

---

## 4. QUY CHUẨN KỸ THUẬT & DESIGN TOKENS
- **Màu sắc thương hiệu TVT Agency**:
  - Dark Navy (Chủ đạo): `#003189`
  - Amber Gold (Nhấn mạnh / CTA): `#FA8A1A`
  - Charcoal (Nền text đậm): `#0D0D1A`
  - Off-White (Nền thẻ): `#F8FAFC`
  - Emerald Green (Điểm cao / An toàn): `#16A34A`
  - Crimson Red (Cảnh báo / Lỗi): `#DC2626`
- **Typography**: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif.
- **Tương thích**: 100% Mobile responsive, không đè vỡ CSS của trang chủ (Bọc tất cả class trong tiền tố `tvt-sw-`).
- **Tests**: 100% tests pass bằng Node.js built-in test runner (`node --test tests/*.test.js`).
