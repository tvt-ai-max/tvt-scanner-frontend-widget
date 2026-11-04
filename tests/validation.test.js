const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { JSDOM } = require('jsdom');

function getModule() {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true
  });
  global.window = dom.window;
  global.document = dom.window.document;
  global.XMLHttpRequest = dom.window.XMLHttpRequest;

  delete require.cache[require.resolve('../src/widget.js')];
  const mod = require('../src/widget.js');

  delete global.window;
  delete global.document;
  delete global.XMLHttpRequest;
  return mod;
}

describe('URL Normalization', () => {
  const mod = getModule();

  it('should prepend https:// to bare domain', () => {
    assert.equal(mod.normalizeUrl('example.com'), 'https://example.com');
  });

  it('should prepend https:// to domain with www', () => {
    assert.equal(mod.normalizeUrl('www.example.com'), 'https://www.example.com');
  });

  it('should replace http:// with https://', () => {
    assert.equal(mod.normalizeUrl('http://example.com'), 'https://example.com');
  });

  it('should keep https:// as is', () => {
    assert.equal(mod.normalizeUrl('https://example.com'), 'https://example.com');
  });

  it('should strip trailing slashes', () => {
    assert.equal(mod.normalizeUrl('example.com/'), 'https://example.com');
  });

  it('should strip multiple trailing slashes', () => {
    assert.equal(mod.normalizeUrl('example.com///'), 'https://example.com');
  });

  it('should trim whitespace', () => {
    assert.equal(mod.normalizeUrl('  example.com  '), 'https://example.com');
  });

  it('should return empty for empty input', () => {
    assert.equal(mod.normalizeUrl(''), '');
  });

  it('should return empty for whitespace only', () => {
    assert.equal(mod.normalizeUrl('   '), '');
  });

  it('should return empty for non-string', () => {
    assert.equal(mod.normalizeUrl(null), '');
    assert.equal(mod.normalizeUrl(undefined), '');
    assert.equal(mod.normalizeUrl(123), '');
  });

  it('should handle Vietnamese domain', () => {
    assert.equal(mod.normalizeUrl('doanhnghiep.vn'), 'https://doanhnghiep.vn');
  });

  it('should handle subdomain', () => {
    assert.equal(mod.normalizeUrl('blog.example.com'), 'https://blog.example.com');
  });
});

describe('Domain Validation', () => {
  const mod = getModule();

  it('should accept valid domain', () => {
    assert.equal(mod.validateDomain('example.com'), true);
  });

  it('should accept domain with subdomain', () => {
    assert.equal(mod.validateDomain('www.example.com'), true);
  });

  it('should accept .vn domain', () => {
    assert.equal(mod.validateDomain('doanhnghiep.vn'), true);
  });

  it('should accept domain with https://', () => {
    assert.equal(mod.validateDomain('https://example.com'), true);
  });

  it('should reject single word without TLD', () => {
    assert.equal(mod.validateDomain('localhost'), false);
  });

  it('should reject empty string', () => {
    assert.equal(mod.validateDomain(''), false);
  });

  it('should reject non-string', () => {
    assert.equal(mod.validateDomain(null), false);
  });
});

describe('Vietnamese Phone Validation', () => {
  const mod = getModule();

  it('should accept valid Viettel number 09x', () => {
    assert.equal(mod.validatePhone('0912345678'), true);
  });

  it('should accept valid Viettel number 03x', () => {
    assert.equal(mod.validatePhone('0321234567'), true);
  });

  it('should accept valid Mobifone 07x', () => {
    assert.equal(mod.validatePhone('0761234567'), true);
  });

  it('should accept valid Vinaphone 08x', () => {
    assert.equal(mod.validatePhone('0812345678'), true);
  });

  it('should accept number with +84 prefix', () => {
    assert.equal(mod.validatePhone('+84912345678'), true);
  });

  it('should accept number with 84 prefix', () => {
    assert.equal(mod.validatePhone('84912345678'), true);
  });

  it('should accept number with spaces', () => {
    assert.equal(mod.validatePhone('091 234 5678'), true);
  });

  it('should accept number with dashes', () => {
    assert.equal(mod.validatePhone('091-234-5678'), true);
  });

  it('should reject too short number', () => {
    assert.equal(mod.validatePhone('091234'), false);
  });

  it('should reject too long number', () => {
    assert.equal(mod.validatePhone('091234567890'), false);
  });

  it('should reject non-VN number', () => {
    assert.equal(mod.validatePhone('1234567890'), false);
  });

  it('should reject empty string', () => {
    assert.equal(mod.validatePhone(''), false);
  });

  it('should reject non-string', () => {
    assert.equal(mod.validatePhone(null), false);
    assert.equal(mod.validatePhone(123), false);
  });

  it('should accept 05x Vietnamobile numbers', () => {
    assert.equal(mod.validatePhone('0561234567'), true);
  });
});

describe('Email Validation', () => {
  const mod = getModule();

  it('should accept valid email', () => {
    assert.equal(mod.validateEmail('test@example.com'), true);
  });

  it('should accept email with subdomain', () => {
    assert.equal(mod.validateEmail('user@mail.example.com'), true);
  });

  it('should accept email with plus', () => {
    assert.equal(mod.validateEmail('user+tag@example.com'), true);
  });

  it('should reject email without @', () => {
    assert.equal(mod.validateEmail('userexample.com'), false);
  });

  it('should reject email without domain', () => {
    assert.equal(mod.validateEmail('user@'), false);
  });

  it('should reject empty string', () => {
    assert.equal(mod.validateEmail(''), false);
  });

  it('should reject non-string', () => {
    assert.equal(mod.validateEmail(null), false);
    assert.equal(mod.validateEmail(undefined), false);
  });

  it('should trim whitespace', () => {
    assert.equal(mod.validateEmail('  test@example.com  '), true);
  });
});
