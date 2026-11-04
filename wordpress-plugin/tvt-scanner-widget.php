<?php
/**
 * Plugin Name: TVT Scanner Widget
 * Plugin URI: https://tvtagency.com
 * Description: Embeddable web audit scanner widget. Add [tvt_scanner_widget] shortcode to any page to let visitors scan their website for performance, security, AEO & mobile issues.
 * Version: 1.0.0
 * Author: Nguyen Thanh Tung - TVT Agency
 * Author URI: https://tvtagency.com
 * License: MIT
 * Text Domain: tvt-scanner-widget
 * Requires PHP: 8.1
 * Requires at least: 6.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

final class TVT_Scanner_Widget {

    private static ?self $instance = null;
    private bool $enqueue = false;

    public static function instance(): self {
        if ( self::$instance === null ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action( 'admin_menu', [ $this, 'add_settings_page' ] );
        add_action( 'admin_init', [ $this, 'register_settings' ] );
        add_shortcode( 'tvt_scanner_widget', [ $this, 'render_shortcode' ] );
        add_action( 'wp_footer', [ $this, 'maybe_enqueue_assets' ] );
    }

    public function add_settings_page(): void {
        add_options_page(
            __( 'TVT Scanner Widget', 'tvt-scanner-widget' ),
            __( 'TVT Scanner Widget', 'tvt-scanner-widget' ),
            'manage_options',
            'tvt-scanner-widget',
            [ $this, 'settings_page_html' ]
        );
    }

    public function register_settings(): void {
        register_setting( 'tvt_scanner_widget', 'tvt_scanner_api_url', [
            'type'              => 'string',
            'sanitize_callback' => 'esc_url_raw',
            'default'           => 'https://api.tvtagency.com/scanner',
        ] );
        register_setting( 'tvt_scanner_widget', 'tvt_scanner_zalo_url', [
            'type'              => 'string',
            'sanitize_callback' => 'esc_url_raw',
            'default'           => 'https://zalo.me/tvtagency',
        ] );
    }

    public function settings_page_html(): void {
        if ( ! current_user_can( 'manage_options' ) ) {
            return;
        }
        $api_url  = get_option( 'tvt_scanner_api_url', '' );
        $zalo_url = get_option( 'tvt_scanner_zalo_url', 'https://zalo.me/tvtagency' );
        ?>
        <div class="wrap">
            <h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
            <form method="post" action="options.php">
                <?php settings_fields( 'tvt_scanner_widget' ); ?>
                <table class="form-table" role="presentation">
                    <tr>
                        <th scope="row">
                            <label for="tvt_scanner_api_url"><?php esc_html_e( 'API URL', 'tvt-scanner-widget' ); ?></label>
                        </th>
                        <td>
                            <input type="url" id="tvt_scanner_api_url" name="tvt_scanner_api_url"
                                   value="<?php echo esc_attr( $api_url ); ?>" class="regular-text"
                                   placeholder="https://api.tvtagency.com" />
                            <p class="description"><?php esc_html_e( 'Backend API endpoint for TVT Web Scanner 60s.', 'tvt-scanner-widget' ); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="tvt_scanner_zalo_url"><?php esc_html_e( 'Zalo URL', 'tvt-scanner-widget' ); ?></label>
                        </th>
                        <td>
                            <input type="url" id="tvt_scanner_zalo_url" name="tvt_scanner_zalo_url"
                                   value="<?php echo esc_attr( $zalo_url ); ?>" class="regular-text"
                                   placeholder="https://zalo.me/tvtagency" />
                            <p class="description"><?php esc_html_e( 'Zalo chat link for 1-1 consultation CTA.', 'tvt-scanner-widget' ); ?></p>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
            <hr />
            <h2><?php esc_html_e( 'Usage', 'tvt-scanner-widget' ); ?></h2>
            <p><?php esc_html_e( 'Place the shortcode on any page or post:', 'tvt-scanner-widget' ); ?></p>
            <code>[tvt_scanner_widget]</code>
            <p><?php esc_html_e( 'Or override settings per shortcode:', 'tvt-scanner-widget' ); ?></p>
            <code>[tvt_scanner_widget api_url="https://api.example.com" zalo_url="https://zalo.me/example"]</code>
        </div>
        <?php
    }

    public function render_shortcode( array|string $atts = [] ): string {
        $atts = shortcode_atts( [
            'api_url'  => get_option( 'tvt_scanner_api_url', 'https://api.tvtagency.com/scanner' ),
            'zalo_url' => get_option( 'tvt_scanner_zalo_url', 'https://zalo.me/tvtagency' ),
        ], $atts, 'tvt_scanner_widget' );

        $this->enqueue = true;
        $container_id = 'tvt-scanner-' . wp_unique_id();

        return sprintf(
            '<div id="%s" data-tvt-scanner data-api-url="%s" data-zalo-url="%s"></div>',
            esc_attr( $container_id ),
            esc_attr( $atts['api_url'] ),
            esc_attr( $atts['zalo_url'] )
        );
    }

    public function maybe_enqueue_assets(): void {
        if ( ! $this->enqueue ) {
            return;
        }
        $plugin_dir_url = plugin_dir_url( __FILE__ );
        if ( file_exists( plugin_dir_path( __FILE__ ) . 'assets/widget.js' ) ) {
            $base_url = $plugin_dir_url . 'assets/';
        } elseif ( file_exists( plugin_dir_path( __FILE__ ) . 'src/widget.js' ) ) {
            $base_url = $plugin_dir_url . 'src/';
        } else {
            $base_url = trailingslashit( dirname( $plugin_dir_url ) ) . 'src/';
        }
        $version = '1.0.0';

        wp_enqueue_style(
            'tvt-scanner-widget',
            $base_url . 'widget.css',
            [],
            $version
        );
        wp_enqueue_script(
            'tvt-scanner-widget',
            $base_url . 'widget.js',
            [],
            $version,
            true
        );
    }
}

TVT_Scanner_Widget::instance();
