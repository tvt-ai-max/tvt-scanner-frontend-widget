=== TVT Scanner Widget ===
Contributors: nguyenthanhtung
Tags: website audit, scanner, performance, security, seo, lead generation
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 8.1
Stable tag: 1.0.0
License: MIT

Embeddable web audit scanner widget for TVT Web Scanner 60s. Scan websites for performance, security, AEO & mobile issues in 60 seconds.

== Description ==

TVT Scanner Widget lets you embed an interactive website audit scanner on any WordPress page. Visitors enter their domain, see a real-time scanning animation, receive an interactive scorecard, and can download a detailed 5-page PDF report after submitting their contact information.

Features:

* One-click scan with animated radar progress
* Interactive scorecard with 4 category scores (Performance, Security, AEO, Mobile)
* Lead capture form gating PDF download
* Direct Zalo 1-1 consultation CTA
* 100% mobile responsive
* Zero external dependencies
* Compatible with Elementor, Gutenberg, and Divi

== Installation ==

1. Upload the plugin folder to `/wp-content/plugins/`
2. Activate through the Plugins menu
3. Go to Settings > TVT Scanner Widget to configure the API URL
4. Add `[tvt_scanner_widget]` shortcode to any page or post

== Shortcode ==

Basic usage:
`[tvt_scanner_widget]`

With custom API and Zalo URLs:
`[tvt_scanner_widget api_url="https://api.tvtagency.com" zalo_url="https://zalo.me/tvtagency"]`

== Changelog ==

= 1.0.0 =
* Initial release
* Core scanning widget with real-time progress
* Interactive scorecard display
* Lead capture and PDF download
* Zalo CTA integration
* Admin settings page
