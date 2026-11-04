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

describe('Widget Initialization', () => {
  beforeEach(() => cleanup());

  it('should expose init function', () => {
    const { TVTScanner } = loadWidget();
    assert.equal(typeof TVTScanner.init, 'function');
    cleanup();
  });

  it('should expose STATES object', () => {
    const { TVTScanner } = loadWidget();
    assert.deepEqual(Object.keys(TVTScanner.STATES).sort(), [
      'COMPLETED', 'DOWNLOADED', 'ERROR', 'IDLE', 'LEAD_GATE', 'POLLING', 'SCANNING'
    ]);
    cleanup();
  });

  it('should create widget in specified container', () => {
    const { TVTScanner } = loadWidget();
    const widget = TVTScanner.init({ containerId: 'scanner', apiUrl: 'http://localhost:3000' });
    const container = document.getElementById('scanner');
    assert.ok(container.classList.contains('tvt-sw-root'));
    assert.ok(container.querySelector('.tvt-sw-card'));
    widget.destroy();
    cleanup();
  });

  it('should render title and subtitle in IDLE state', () => {
    const { TVTScanner } = loadWidget();
    const widget = TVTScanner.init({ containerId: 'scanner', apiUrl: 'http://localhost:3000' });
    const title = document.querySelector('.tvt-sw-title');
    const subtitle = document.querySelector('.tvt-sw-subtitle');
    assert.ok(title);
    assert.ok(subtitle);
    assert.ok(title.textContent.length > 0);
    widget.destroy();
    cleanup();
  });

  it('should render input field and scan button', () => {
    const { TVTScanner } = loadWidget();
    const widget = TVTScanner.init({ containerId: 'scanner', apiUrl: 'http://localhost:3000' });
    const input = document.querySelector('.tvt-sw-input');
    const btn = document.querySelector('.tvt-sw-btn--primary');
    assert.ok(input);
    assert.ok(btn);
    assert.equal(input.tagName, 'INPUT');
    widget.destroy();
    cleanup();
  });

  it('should throw if containerId is missing', () => {
    loadWidget();
    const TVTScanner = require('../src/widget.js');
    assert.throws(() => TVTScanner.init({}), /containerId is required/);
    cleanup();
  });

  it('should throw if container element not found', () => {
    loadWidget();
    const TVTScanner = require('../src/widget.js');
    assert.throws(() => TVTScanner.init({ containerId: 'nonexistent' }), /not found/);
    cleanup();
  });

  it('should accept custom apiUrl', () => {
    const { TVTScanner } = loadWidget();
    const widget = TVTScanner.init({
      containerId: 'scanner',
      apiUrl: 'https://api.example.com'
    });
    assert.equal(widget.apiUrl, 'https://api.example.com');
    widget.destroy();
    cleanup();
  });

  it('should accept custom zaloUrl', () => {
    const { TVTScanner } = loadWidget();
    const widget = TVTScanner.init({
      containerId: 'scanner',
      apiUrl: 'http://localhost:3000',
      zaloUrl: 'https://zalo.me/custom'
    });
    assert.equal(widget.zaloUrl, 'https://zalo.me/custom');
    widget.destroy();
    cleanup();
  });

  it('should default autoScroll to true', () => {
    const { TVTScanner } = loadWidget();
    const widget = TVTScanner.init({ containerId: 'scanner', apiUrl: 'http://localhost:3000' });
    assert.equal(widget.autoScroll, true);
    widget.destroy();
    cleanup();
  });

  it('should allow disabling autoScroll', () => {
    const { TVTScanner } = loadWidget();
    const widget = TVTScanner.init({
      containerId: 'scanner',
      apiUrl: 'http://localhost:3000',
      autoScroll: false
    });
    assert.equal(widget.autoScroll, false);
    widget.destroy();
    cleanup();
  });

  it('should strip trailing slash from apiUrl', () => {
    const { TVTScanner } = loadWidget();
    const widget = TVTScanner.init({
      containerId: 'scanner',
      apiUrl: 'http://localhost:3000/'
    });
    assert.equal(widget.apiUrl, 'http://localhost:3000');
    widget.destroy();
    cleanup();
  });

  it('should clean up DOM on destroy', () => {
    const { TVTScanner } = loadWidget();
    const widget = TVTScanner.init({ containerId: 'scanner', apiUrl: 'http://localhost:3000' });
    widget.destroy();
    const container = document.getElementById('scanner');
    assert.equal(container.innerHTML, '');
    cleanup();
  });
});
