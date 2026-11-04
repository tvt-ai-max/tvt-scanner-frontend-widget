(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.TVTScanner = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  var STATES = {
    IDLE: 'IDLE',
    SCANNING: 'SCANNING',
    POLLING: 'POLLING',
    COMPLETED: 'COMPLETED',
    LEAD_GATE: 'LEAD_GATE',
    DOWNLOADED: 'DOWNLOADED',
    ERROR: 'ERROR'
  };

  var POLL_INTERVAL = 2500;

  var defaultI18n = {
    title: 'Kiểm Tra Website Miễn Phí',
    subtitle: 'Phân tích toàn diện hiệu năng, bảo mật, SEO & tương thích di động trong 60 giây',
    placeholder: 'Nhập tên miền (VD: doanhnghiep.vn)',
    scanButton: 'QUÉT MIỄN PHÍ TRONG 60 GIÂY',
    scanning: 'Đang quét...',
    steps: [
      'Kiểm tra SSL & Tiêu chuẩn An ninh Headers',
      'Đo lường Core Web Vitals (LCP, TTFB, CLS) & Tốc độ Di động',
      'Phân tích Cấu trúc Schema JSON-LD & Độ sẵn sàng AEO/AI Search',
      'Tính toán chỉ số 4 chiều & Kết xuất PDF Báo cáo 5 trang'
    ],
    completed: 'Hoàn tất quét!',
    overallScore: 'Điểm Tổng Quan',
    categories: {
      performance: 'Hiệu Năng',
      security: 'Bảo Mật',
      aeo: 'AEO / AI Search',
      mobile: 'Di Động'
    },
    weights: { performance: '40%', security: '25%', aeo: '20%', mobile: '15%' },
    leadGate: {
      heading: 'Mở Khóa Báo Cáo Chi Tiết 5 Trang',
      description: 'Nhập thông tin để tải báo cáo PDF chi tiết phân tích website của bạn',
      namePlaceholder: 'Họ và tên',
      phonePlaceholder: 'Số điện thoại Zalo (bắt buộc)',
      emailPlaceholder: 'Email nhận file',
      submitButton: 'TẢI BÁO CÁO PDF CHI TIẾT 5 TRANG',
      submitting: 'Đang xử lý...'
    },
    downloaded: {
      heading: 'Báo cáo đã được tải!',
      description: 'Cảm ơn bạn đã sử dụng TVT Scanner. Kiểm tra file PDF trong thư mục tải về.',
      zaloCta: 'Tư vấn 1-1 với Founder Nguyễn Thanh Tùng qua Zalo',
      scanAgain: 'Quét website khác'
    },
    errors: {
      emptyUrl: 'Vui lòng nhập tên miền website',
      invalidUrl: 'Tên miền không hợp lệ',
      invalidPhone: 'Số điện thoại không hợp lệ (VD: 0912345678)',
      invalidEmail: 'Email không hợp lệ',
      requiredPhone: 'Số điện thoại Zalo là bắt buộc',
      requiredName: 'Vui lòng nhập họ và tên',
      scanFailed: 'Quét thất bại. Vui lòng thử lại.',
      networkError: 'Lỗi kết nối mạng. Vui lòng kiểm tra và thử lại.'
    }
  };

  function normalizeUrl(input) {
    if (typeof input !== 'string') return '';
    var url = input.trim();
    if (!url) return '';
    url = url.replace(/^(https?:\/\/)/i, '');
    url = url.replace(/\/+$/, '');
    if (!url) return '';
    return 'https://' + url;
  }

  function validatePhone(phone) {
    if (typeof phone !== 'string') return false;
    var cleaned = phone.replace(/[\s\-().]/g, '');
    return /^(\+84|84|0)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])\d{7}$/.test(cleaned);
  }

  function validateEmail(email) {
    if (typeof email !== 'string' || !email.trim()) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  function validateDomain(url) {
    if (typeof url !== 'string') return false;
    var normalized = normalizeUrl(url);
    if (!normalized) return false;
    try {
      var hostname = normalized.replace(/^https?:\/\//, '');
      return /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/.test(hostname);
    } catch (_) {
      return false;
    }
  }

  function scoreColor(score) {
    if (score >= 80) return 'green';
    if (score >= 50) return 'gold';
    return 'red';
  }

  function scoreLabel(score, i18n) {
    if (score >= 80) return i18n.scoreLabels ? i18n.scoreLabels.excellent : 'Xuất sắc';
    if (score >= 60) return i18n.scoreLabels ? i18n.scoreLabels.good : 'Tốt';
    if (score >= 40) return i18n.scoreLabels ? i18n.scoreLabels.average : 'Trung bình';
    return i18n.scoreLabels ? i18n.scoreLabels.poor : 'Yếu';
  }

  function el(tag, className, attrs) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'textContent') node.textContent = attrs[k];
        else if (k === 'innerHTML') node.innerHTML = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    return node;
  }

  function ScannerWidget(options) {
    if (!options || !options.containerId) {
      throw new Error('TVTScanner: containerId is required');
    }
    this.container = typeof document !== 'undefined' ? document.getElementById(options.containerId) : null;
    if (!this.container) {
      throw new Error('TVTScanner: container element "#' + options.containerId + '" not found');
    }
    this.apiUrl = (options.apiUrl || '').replace(/\/+$/, '');
    this.zaloUrl = options.zaloUrl || 'https://zalo.me/tvtagency';
    this.autoScroll = options.autoScroll !== false;
    this.i18n = options.i18n || defaultI18n;
    this.state = STATES.IDLE;
    this.auditId = null;
    this.auditData = null;
    this.progress = 0;
    this.pollTimer = null;
    this.errorMessage = '';
    this.scannedUrl = '';
    this._render();
  }

  ScannerWidget.prototype.setState = function (newState, data) {
    this.state = newState;
    if (data) {
      if (data.auditId !== undefined) this.auditId = data.auditId;
      if (data.auditData !== undefined) this.auditData = data.auditData;
      if (data.progress !== undefined) this.progress = data.progress;
      if (data.errorMessage !== undefined) this.errorMessage = data.errorMessage;
    }
    this._render();
  };

  ScannerWidget.prototype._render = function () {
    this.container.innerHTML = '';
    this.container.className = 'tvt-sw-root';
    var card = el('div', 'tvt-sw-card');

    switch (this.state) {
      case STATES.IDLE:
        this._renderIdle(card);
        break;
      case STATES.SCANNING:
      case STATES.POLLING:
        this._renderScanning(card);
        break;
      case STATES.COMPLETED:
        this._renderScorecard(card);
        break;
      case STATES.LEAD_GATE:
        this._renderScorecard(card);
        this._renderLeadModal();
        break;
      case STATES.DOWNLOADED:
        this._renderDownloaded(card);
        break;
      case STATES.ERROR:
        this._renderError(card);
        break;
    }

    this.container.appendChild(card);
  };

  ScannerWidget.prototype._renderIdle = function (card) {
    var self = this;
    var i18n = this.i18n;

    var header = el('div', 'tvt-sw-header');
    header.appendChild(el('h2', 'tvt-sw-title', { textContent: i18n.title }));
    header.appendChild(el('p', 'tvt-sw-subtitle', { textContent: i18n.subtitle }));
    card.appendChild(header);

    var group = el('div', 'tvt-sw-input-group');
    var input = el('input', 'tvt-sw-input', {
      type: 'text',
      placeholder: i18n.placeholder
    });
    var btn = el('button', 'tvt-sw-btn tvt-sw-btn--primary', {
      textContent: i18n.scanButton
    });
    group.appendChild(input);
    group.appendChild(btn);
    card.appendChild(group);

    var errEl = el('div', 'tvt-sw-error-msg');
    card.appendChild(errEl);

    function handleScan() {
      var val = input.value.trim();
      if (!val) {
        errEl.textContent = i18n.errors.emptyUrl;
        input.classList.add('tvt-sw-input--error');
        return;
      }
      if (!validateDomain(val)) {
        errEl.textContent = i18n.errors.invalidUrl;
        input.classList.add('tvt-sw-input--error');
        return;
      }
      self.scannedUrl = val;
      self.startScan(val);
    }

    btn.addEventListener('click', handleScan);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') handleScan();
    });
    input.addEventListener('input', function () {
      input.classList.remove('tvt-sw-input--error');
      errEl.textContent = '';
    });
  };

  ScannerWidget.prototype._renderScanning = function (card) {
    var i18n = this.i18n;
    var pct = this.progress;

    var wrap = el('div', 'tvt-sw-scanning');

    var radar = el('div', 'tvt-sw-radar');
    var circle = el('div', 'tvt-sw-radar__circle');
    circle.appendChild(el('div', 'tvt-sw-radar__sweep'));
    circle.appendChild(el('div', 'tvt-sw-radar__glow'));
    var pctEl = el('span', 'tvt-sw-radar__pct', { textContent: pct + '%' });
    circle.appendChild(pctEl);
    radar.appendChild(circle);
    wrap.appendChild(radar);

    wrap.appendChild(el('p', '', { textContent: i18n.scanning, style: 'font-weight:600;color:#003189;margin-bottom:8px;' }));

    var prog = el('div', 'tvt-sw-progress');
    var track = el('div', 'tvt-sw-progress__track');
    var fill = el('div', 'tvt-sw-progress__fill');
    fill.style.width = pct + '%';
    track.appendChild(fill);
    prog.appendChild(track);
    wrap.appendChild(prog);

    var steps = el('ul', 'tvt-sw-steps');
    var stepIdx = pct < 25 ? 0 : pct < 50 ? 1 : pct < 75 ? 2 : 3;
    for (var s = 0; s < i18n.steps.length; s++) {
      var li = el('li', 'tvt-sw-step');
      if (s < stepIdx) li.classList.add('tvt-sw-step--done');
      else if (s === stepIdx) li.classList.add('tvt-sw-step--active');

      var icon = el('span', 'tvt-sw-step__icon');
      icon.textContent = s < stepIdx ? '✓' : (s + 1);
      li.appendChild(icon);
      li.appendChild(el('span', '', { textContent: i18n.steps[s] }));
      steps.appendChild(li);
    }
    wrap.appendChild(steps);
    card.appendChild(wrap);
  };

  ScannerWidget.prototype._renderScorecard = function (card) {
    var self = this;
    var i18n = this.i18n;
    var data = this.auditData || {};
    var overall = data.overall_score || 0;
    var color = scoreColor(overall);
    var label = scoreLabel(overall, i18n);

    var sc = el('div', 'tvt-sw-scorecard');

    sc.appendChild(el('p', '', { textContent: i18n.completed, style: 'font-weight:600;color:#16A34A;margin-bottom:16px;' }));

    var ov = el('div', 'tvt-sw-overall');
    var badge = el('div', 'tvt-sw-badge tvt-sw-badge--' + color, { textContent: overall });
    badge.appendChild(el('span', 'tvt-sw-badge__ring'));
    ov.appendChild(badge);
    ov.appendChild(el('div', 'tvt-sw-score-label', { textContent: i18n.overallScore + ' - ' + label }));
    ov.appendChild(el('div', 'tvt-sw-domain-label', { textContent: this.scannedUrl }));
    sc.appendChild(ov);

    var cats = el('div', 'tvt-sw-categories');
    var catKeys = ['performance', 'security', 'aeo', 'mobile'];
    catKeys.forEach(function (key) {
      var score = (data.scores && data.scores[key]) || 0;
      var c = scoreColor(score);
      var catCard = el('div', 'tvt-sw-cat');
      catCard.appendChild(el('div', 'tvt-sw-cat__score tvt-sw-cat__score--' + c, { textContent: score }));
      catCard.appendChild(el('div', 'tvt-sw-cat__name', { textContent: i18n.categories[key] }));
      catCard.appendChild(el('div', 'tvt-sw-cat__weight', { textContent: i18n.weights[key] }));
      var bar = el('div', 'tvt-sw-cat__bar');
      var barFill = el('div', 'tvt-sw-cat__bar-fill tvt-sw-cat__bar-fill--' + c);
      barFill.style.width = score + '%';
      bar.appendChild(barFill);
      catCard.appendChild(bar);
      cats.appendChild(catCard);
    });
    sc.appendChild(cats);

    var btn = el('button', 'tvt-sw-btn tvt-sw-btn--primary tvt-sw-btn--full', {
      textContent: i18n.leadGate.submitButton
    });
    btn.addEventListener('click', function () {
      self.setState(STATES.LEAD_GATE);
    });
    sc.appendChild(btn);

    card.appendChild(sc);
  };

  ScannerWidget.prototype._renderLeadModal = function () {
    var self = this;
    var i18n = this.i18n;

    var overlay = el('div', 'tvt-sw-modal-overlay');
    var modal = el('div', 'tvt-sw-modal');

    modal.appendChild(el('h3', 'tvt-sw-modal__heading', { textContent: i18n.leadGate.heading }));
    modal.appendChild(el('p', 'tvt-sw-modal__desc', { textContent: i18n.leadGate.description }));

    var nameGroup = el('div', 'tvt-sw-form-group');
    var nameInput = el('input', 'tvt-sw-input', { type: 'text', placeholder: i18n.leadGate.namePlaceholder });
    nameGroup.appendChild(nameInput);
    modal.appendChild(nameGroup);

    var phoneGroup = el('div', 'tvt-sw-form-group');
    var phoneInput = el('input', 'tvt-sw-input', { type: 'tel', placeholder: i18n.leadGate.phonePlaceholder });
    phoneGroup.appendChild(phoneInput);
    modal.appendChild(phoneGroup);

    var emailGroup = el('div', 'tvt-sw-form-group');
    var emailInput = el('input', 'tvt-sw-input', { type: 'email', placeholder: i18n.leadGate.emailPlaceholder });
    emailGroup.appendChild(emailInput);
    modal.appendChild(emailGroup);

    var errEl = el('div', 'tvt-sw-error-msg');
    modal.appendChild(errEl);

    var submitBtn = el('button', 'tvt-sw-btn tvt-sw-btn--primary tvt-sw-btn--full', {
      textContent: i18n.leadGate.submitButton
    });
    submitBtn.addEventListener('click', function () {
      var name = nameInput.value.trim();
      var phone = phoneInput.value.trim();
      var email = emailInput.value.trim();

      if (!name) { errEl.textContent = i18n.errors.requiredName; return; }
      if (!phone) { errEl.textContent = i18n.errors.requiredPhone; return; }
      if (!validatePhone(phone)) { errEl.textContent = i18n.errors.invalidPhone; return; }
      if (email && !validateEmail(email)) { errEl.textContent = i18n.errors.invalidEmail; return; }

      submitBtn.disabled = true;
      submitBtn.textContent = i18n.leadGate.submitting;
      self.submitLead(name, phone, email);
    });
    modal.appendChild(submitBtn);

    overlay.appendChild(modal);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        self.setState(STATES.COMPLETED);
      }
    });

    this.container.appendChild(overlay);
  };

  ScannerWidget.prototype._renderDownloaded = function (card) {
    var self = this;
    var i18n = this.i18n;

    var wrap = el('div', 'tvt-sw-success');
    var icon = el('div', 'tvt-sw-success__icon', { textContent: '✓' });
    wrap.appendChild(icon);
    wrap.appendChild(el('h3', 'tvt-sw-success__heading', { textContent: i18n.downloaded.heading }));
    wrap.appendChild(el('p', 'tvt-sw-success__desc', { textContent: i18n.downloaded.description }));

    var btns = el('div', 'tvt-sw-btn-group');
    var zaloBtn = el('a', 'tvt-sw-btn tvt-sw-btn--zalo tvt-sw-btn--full', {
      textContent: i18n.downloaded.zaloCta,
      href: this.zaloUrl,
      target: '_blank',
      rel: 'noopener'
    });
    btns.appendChild(zaloBtn);

    var againBtn = el('button', 'tvt-sw-btn tvt-sw-btn--outline tvt-sw-btn--full', {
      textContent: i18n.downloaded.scanAgain
    });
    againBtn.addEventListener('click', function () {
      self.auditId = null;
      self.auditData = null;
      self.progress = 0;
      self.scannedUrl = '';
      self.setState(STATES.IDLE);
    });
    btns.appendChild(againBtn);

    wrap.appendChild(btns);
    card.appendChild(wrap);
  };

  ScannerWidget.prototype._renderError = function (card) {
    var self = this;
    var i18n = this.i18n;

    var wrap = el('div', 'tvt-sw-error-state');
    wrap.appendChild(el('div', 'tvt-sw-error-state__icon', { textContent: '!' }));
    wrap.appendChild(el('h3', 'tvt-sw-error-state__heading', { textContent: i18n.errors.scanFailed }));
    wrap.appendChild(el('p', 'tvt-sw-error-state__desc', { textContent: this.errorMessage || i18n.errors.networkError }));

    var retryBtn = el('button', 'tvt-sw-btn tvt-sw-btn--primary', {
      textContent: i18n.downloaded.scanAgain
    });
    retryBtn.addEventListener('click', function () {
      self.auditId = null;
      self.auditData = null;
      self.progress = 0;
      self.errorMessage = '';
      self.setState(STATES.IDLE);
    });
    wrap.appendChild(retryBtn);
    card.appendChild(wrap);
  };

  ScannerWidget.prototype.startScan = function (url) {
    var self = this;
    var normalized = normalizeUrl(url);
    this.setState(STATES.SCANNING, { progress: 0 });

    var xhr = new XMLHttpRequest();
    xhr.open('POST', this.apiUrl + '/api/v1/audit');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var res = JSON.parse(xhr.responseText);
          self.setState(STATES.POLLING, { auditId: res.id || res.audit_id });
          self._startPolling();
        } catch (_) {
          self.setState(STATES.ERROR, { errorMessage: self.i18n.errors.scanFailed });
        }
      } else {
        self.setState(STATES.ERROR, { errorMessage: self.i18n.errors.scanFailed });
      }
    };
    xhr.onerror = function () {
      self.setState(STATES.ERROR, { errorMessage: self.i18n.errors.networkError });
    };
    xhr.send(JSON.stringify({ url: normalized }));
  };

  ScannerWidget.prototype._startPolling = function () {
    var self = this;
    if (this.pollTimer) clearInterval(this.pollTimer);

    this.pollTimer = setInterval(function () {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', self.apiUrl + '/api/v1/audit/' + self.auditId + '/status');
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            var res = JSON.parse(xhr.responseText);
            var pct = res.progress || 0;

            if (res.status === 'COMPLETED' || res.status === 'completed') {
              clearInterval(self.pollTimer);
              self.pollTimer = null;
              self.setState(STATES.COMPLETED, {
                progress: 100,
                auditData: res.result || res
              });
              if (self.autoScroll) {
                self.container.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            } else if (res.status === 'FAILED' || res.status === 'failed') {
              clearInterval(self.pollTimer);
              self.pollTimer = null;
              self.setState(STATES.ERROR, { errorMessage: res.message || self.i18n.errors.scanFailed });
            } else {
              self._updateProgress(pct);
            }
          } catch (_) {
            clearInterval(self.pollTimer);
            self.pollTimer = null;
            self.setState(STATES.ERROR, { errorMessage: self.i18n.errors.scanFailed });
          }
        }
      };
      xhr.onerror = function () {
        clearInterval(self.pollTimer);
        self.pollTimer = null;
        self.setState(STATES.ERROR, { errorMessage: self.i18n.errors.networkError });
      };
      xhr.send();
    }, POLL_INTERVAL);
  };

  ScannerWidget.prototype._updateProgress = function (pct) {
    this.progress = pct;
    var pctEl = this.container.querySelector('.tvt-sw-radar__pct');
    if (pctEl) pctEl.textContent = pct + '%';
    var fill = this.container.querySelector('.tvt-sw-progress__fill');
    if (fill) fill.style.width = pct + '%';

    var stepIdx = pct < 25 ? 0 : pct < 50 ? 1 : pct < 75 ? 2 : 3;
    var stepEls = this.container.querySelectorAll('.tvt-sw-step');
    for (var i = 0; i < stepEls.length; i++) {
      stepEls[i].classList.remove('tvt-sw-step--done', 'tvt-sw-step--active');
      if (i < stepIdx) stepEls[i].classList.add('tvt-sw-step--done');
      else if (i === stepIdx) stepEls[i].classList.add('tvt-sw-step--active');

      var iconEl = stepEls[i].querySelector('.tvt-sw-step__icon');
      if (iconEl) iconEl.textContent = i < stepIdx ? '✓' : (i + 1);
    }
  };

  ScannerWidget.prototype.submitLead = function (name, phone, email) {
    var self = this;
    var xhr = new XMLHttpRequest();
    xhr.open('PATCH', this.apiUrl + '/api/v1/audit/' + this.auditId);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        self._downloadPdf();
      } else {
        self.setState(STATES.ERROR, { errorMessage: self.i18n.errors.scanFailed });
      }
    };
    xhr.onerror = function () {
      self.setState(STATES.ERROR, { errorMessage: self.i18n.errors.networkError });
    };
    xhr.send(JSON.stringify({ lead: { name: name, phone: phone, email: email } }));
  };

  ScannerWidget.prototype._downloadPdf = function () {
    var url = this.apiUrl + '/api/v1/audit/' + this.auditId + '/pdf';
    var a = document.createElement('a');
    a.href = url;
    a.download = 'tvt-scanner-report.pdf';
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    this.setState(STATES.DOWNLOADED);
  };

  ScannerWidget.prototype.destroy = function () {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.container) this.container.innerHTML = '';
  };

  function autoInit() {
    if (typeof document === 'undefined') return;
    var elements = document.querySelectorAll('[data-tvt-scanner]');
    var instances = [];
    for (var i = 0; i < elements.length; i++) {
      var elem = elements[i];
      if (!elem.id) elem.id = 'tvt-scanner-' + i;
      instances.push(new ScannerWidget({
        containerId: elem.id,
        apiUrl: elem.getAttribute('data-api-url') || '',
        zaloUrl: elem.getAttribute('data-zalo-url') || '',
        autoScroll: elem.getAttribute('data-auto-scroll') !== 'false'
      }));
    }
    return instances;
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', autoInit);
    } else {
      autoInit();
    }
  }

  return {
    init: function (options) {
      return new ScannerWidget(options);
    },
    STATES: STATES,
    normalizeUrl: normalizeUrl,
    validatePhone: validatePhone,
    validateEmail: validateEmail,
    validateDomain: validateDomain,
    _autoInit: autoInit,
    _ScannerWidget: ScannerWidget
  };
});
