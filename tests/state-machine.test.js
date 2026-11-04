const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

function loadWidget() {
  const dom = new JSDOM('<!DOCTYPE html><html><body><div id="scanner"></div></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true
  });
  global.window = dom.window;
  global.document = dom.window.document;
  global.XMLHttpRequest = dom.window.XMLHttpRequest;

  delete require.cache[require.resolve('../src/widget.js')];
  const TVTScanner = require('../src/widget.js');
  return { TVTScanner, dom };
}

function cleanup() {
  delete global.window;
  delete global.document;
  delete global.XMLHttpRequest;
}

describe('State Machine', () => {
  beforeEach(() => cleanup());

  it('should start in IDLE state', () => {
    const { TVTScanner } = loadWidget();
    const widget = TVTScanner.init({ containerId: 'scanner', apiUrl: 'http://localhost:3000' });
    assert.equal(widget.state, TVTScanner.STATES.IDLE);
    widget.destroy();
    cleanup();
  });

  it('should transition from IDLE to SCANNING', () => {
    const { TVTScanner } = loadWidget();
    const widget = TVTScanner.init({ containerId: 'scanner', apiUrl: 'http://localhost:3000' });
    widget.setState(TVTScanner.STATES.SCANNING, { progress: 0 });
    assert.equal(widget.state, TVTScanner.STATES.SCANNING);
    assert.ok(document.querySelector('.tvt-sw-scanning'));
    widget.destroy();
    cleanup();
  });

  it('should transition from SCANNING to POLLING', () => {
    const { TVTScanner } = loadWidget();
    const widget = TVTScanner.init({ containerId: 'scanner', apiUrl: 'http://localhost:3000' });
    widget.setState(TVTScanner.STATES.POLLING, { auditId: '123', progress: 20 });
    assert.equal(widget.state, TVTScanner.STATES.POLLING);
    assert.equal(widget.auditId, '123');
    widget.destroy();
    cleanup();
  });

  it('should render radar animation during scanning', () => {
    const { TVTScanner } = loadWidget();
    const widget = TVTScanner.init({ containerId: 'scanner', apiUrl: 'http://localhost:3000' });
    widget.setState(TVTScanner.STATES.SCANNING, { progress: 35 });
    assert.ok(document.querySelector('.tvt-sw-radar'));
    assert.ok(document.querySelector('.tvt-sw-radar__sweep'));
    assert.ok(document.querySelector('.tvt-sw-radar__pct'));
    widget.destroy();
    cleanup();
  });

  it('should show progress percentage during scanning', () => {
    const { TVTScanner } = loadWidget();
    const widget = TVTScanner.init({ containerId: 'scanner', apiUrl: 'http://localhost:3000' });
    widget.setState(TVTScanner.STATES.SCANNING, { progress: 42 });
    const pct = document.querySelector('.tvt-sw-radar__pct');
    assert.equal(pct.textContent, '42%');
    widget.destroy();
    cleanup();
  });

  it('should render scan steps during polling', () => {
    const { TVTScanner } = loadWidget();
    const widget = TVTScanner.init({ containerId: 'scanner', apiUrl: 'http://localhost:3000' });
    widget.setState(TVTScanner.STATES.POLLING, { progress: 60 });
    const steps = document.querySelectorAll('.tvt-sw-step');
    assert.equal(steps.length, 4);
    widget.destroy();
    cleanup();
  });

  it('should transition to COMPLETED with audit data', () => {
    const { TVTScanner } = loadWidget();
    const widget = TVTScanner.init({ containerId: 'scanner', apiUrl: 'http://localhost:3000' });
    const mockData = {
      overall_score: 72,
      scores: { performance: 80, security: 65, aeo: 60, mobile: 75 }
    };
    widget.setState(TVTScanner.STATES.COMPLETED, { auditData: mockData, progress: 100 });
    assert.equal(widget.state, TVTScanner.STATES.COMPLETED);
    assert.ok(document.querySelector('.tvt-sw-scorecard'));
    assert.ok(document.querySelector('.tvt-sw-badge'));
    widget.destroy();
    cleanup();
  });

  it('should render 4 category cards in scorecard', () => {
    const { TVTScanner } = loadWidget();
    const widget = TVTScanner.init({ containerId: 'scanner', apiUrl: 'http://localhost:3000' });
    const mockData = {
      overall_score: 72,
      scores: { performance: 80, security: 65, aeo: 60, mobile: 75 }
    };
    widget.setState(TVTScanner.STATES.COMPLETED, { auditData: mockData });
    const cats = document.querySelectorAll('.tvt-sw-cat');
    assert.equal(cats.length, 4);
    widget.destroy();
    cleanup();
  });

  it('should apply green badge for scores >= 80', () => {
    const { TVTScanner } = loadWidget();
    const widget = TVTScanner.init({ containerId: 'scanner', apiUrl: 'http://localhost:3000' });
    widget.setState(TVTScanner.STATES.COMPLETED, {
      auditData: { overall_score: 85, scores: { performance: 90, security: 80, aeo: 80, mobile: 85 } }
    });
    assert.ok(document.querySelector('.tvt-sw-badge--green'));
    widget.destroy();
    cleanup();
  });

  it('should apply gold badge for scores 50-79', () => {
    const { TVTScanner } = loadWidget();
    const widget = TVTScanner.init({ containerId: 'scanner', apiUrl: 'http://localhost:3000' });
    widget.setState(TVTScanner.STATES.COMPLETED, {
      auditData: { overall_score: 65, scores: { performance: 70, security: 60, aeo: 55, mobile: 65 } }
    });
    assert.ok(document.querySelector('.tvt-sw-badge--gold'));
    widget.destroy();
    cleanup();
  });

  it('should apply red badge for scores < 50', () => {
    const { TVTScanner } = loadWidget();
    const widget = TVTScanner.init({ containerId: 'scanner', apiUrl: 'http://localhost:3000' });
    widget.setState(TVTScanner.STATES.COMPLETED, {
      auditData: { overall_score: 35, scores: { performance: 40, security: 30, aeo: 25, mobile: 45 } }
    });
    assert.ok(document.querySelector('.tvt-sw-badge--red'));
    widget.destroy();
    cleanup();
  });

  it('should transition to LEAD_GATE and show modal', () => {
    const { TVTScanner } = loadWidget();
    const widget = TVTScanner.init({ containerId: 'scanner', apiUrl: 'http://localhost:3000' });
    widget.setState(TVTScanner.STATES.COMPLETED, {
      auditData: { overall_score: 72, scores: { performance: 80, security: 65, aeo: 60, mobile: 75 } }
    });
    widget.setState(TVTScanner.STATES.LEAD_GATE);
    assert.equal(widget.state, TVTScanner.STATES.LEAD_GATE);
    assert.ok(document.querySelector('.tvt-sw-modal-overlay'));
    assert.ok(document.querySelector('.tvt-sw-modal'));
    widget.destroy();
    cleanup();
  });

  it('should render lead form fields in modal', () => {
    const { TVTScanner } = loadWidget();
    const widget = TVTScanner.init({ containerId: 'scanner', apiUrl: 'http://localhost:3000' });
    widget.setState(TVTScanner.STATES.COMPLETED, {
      auditData: { overall_score: 72, scores: { performance: 80, security: 65, aeo: 60, mobile: 75 } }
    });
    widget.setState(TVTScanner.STATES.LEAD_GATE);
    const inputs = document.querySelectorAll('.tvt-sw-modal .tvt-sw-input');
    assert.equal(inputs.length, 3);
    widget.destroy();
    cleanup();
  });

  it('should transition to DOWNLOADED state', () => {
    const { TVTScanner } = loadWidget();
    const widget = TVTScanner.init({ containerId: 'scanner', apiUrl: 'http://localhost:3000' });
    widget.setState(TVTScanner.STATES.DOWNLOADED);
    assert.equal(widget.state, TVTScanner.STATES.DOWNLOADED);
    assert.ok(document.querySelector('.tvt-sw-success'));
    widget.destroy();
    cleanup();
  });

  it('should show Zalo CTA in downloaded state', () => {
    const { TVTScanner } = loadWidget();
    const widget = TVTScanner.init({
      containerId: 'scanner',
      apiUrl: 'http://localhost:3000',
      zaloUrl: 'https://zalo.me/test'
    });
    widget.setState(TVTScanner.STATES.DOWNLOADED);
    const link = document.querySelector('.tvt-sw-btn--zalo');
    assert.ok(link);
    assert.equal(link.getAttribute('href'), 'https://zalo.me/test');
    widget.destroy();
    cleanup();
  });

  it('should transition to ERROR state', () => {
    const { TVTScanner } = loadWidget();
    const widget = TVTScanner.init({ containerId: 'scanner', apiUrl: 'http://localhost:3000' });
    widget.setState(TVTScanner.STATES.ERROR, { errorMessage: 'Test error' });
    assert.equal(widget.state, TVTScanner.STATES.ERROR);
    assert.ok(document.querySelector('.tvt-sw-error-state'));
    widget.destroy();
    cleanup();
  });

  it('should show error message in error state', () => {
    const { TVTScanner } = loadWidget();
    const widget = TVTScanner.init({ containerId: 'scanner', apiUrl: 'http://localhost:3000' });
    widget.setState(TVTScanner.STATES.ERROR, { errorMessage: 'Connection failed' });
    const desc = document.querySelector('.tvt-sw-error-state__desc');
    assert.equal(desc.textContent, 'Connection failed');
    widget.destroy();
    cleanup();
  });

  it('should reset to IDLE from ERROR via retry', () => {
    const { TVTScanner } = loadWidget();
    const widget = TVTScanner.init({ containerId: 'scanner', apiUrl: 'http://localhost:3000' });
    widget.setState(TVTScanner.STATES.ERROR, { errorMessage: 'Test error' });
    widget.setState(TVTScanner.STATES.IDLE);
    assert.equal(widget.state, TVTScanner.STATES.IDLE);
    assert.ok(document.querySelector('.tvt-sw-input'));
    widget.destroy();
    cleanup();
  });

  it('should clear poll timer on destroy', () => {
    const { TVTScanner } = loadWidget();
    const widget = TVTScanner.init({ containerId: 'scanner', apiUrl: 'http://localhost:3000' });
    widget.pollTimer = setInterval(() => {}, 10000);
    widget.destroy();
    assert.equal(widget.pollTimer, null);
    cleanup();
  });
});
