<?php
/*
Plugin Name: WPB One Page Navigation
Description: Adds Elementor-style one-page anchor navigation to WPBakery rows.
Version: 1.0.0
Author: SK
*/

defined( 'ABSPATH' ) || exit;

define( 'WPB_ONE_PAGE_NAV_FILE', __FILE__ );
define( 'WPB_ONE_PAGE_NAV_PATH', plugin_dir_path( __FILE__ ) );
define( 'WPB_ONE_PAGE_NAV_URL', plugin_dir_url( __FILE__ ) );

class WPB_One_Page_Navigation {

    /**
     * Plugin instance.
     */
    private $plugin = null;

    public function __construct() {
        add_action( 'plugins_loaded', [ $this, 'init' ] );
    }

    /**
     * Runs after all plugins are loaded.
     */
    public function init() {

        if ( ! $this->requirements_met() ) {
            return;
        }

        require_once WPB_ONE_PAGE_NAV_PATH . 'main.php';

        $this->plugin = new OnePageNavPlugin();
    }

    /**
     * Check plugin requirements.
     */
    private function requirements_met() {

        // WPBakery not active.
        if ( ! defined( 'WPB_VC_VERSION' ) ) {
            $this->admin_notice(
                'WPB One Page Navigation requires <strong>WPBakery Page Builder</strong> to be installed and activated.'
            );
            return false;
        }

        // WPBakery not fully initialized.
        if ( ! class_exists( 'Vc_Manager' ) ) {
            $this->admin_notice(
                'WPBakery is installed but has not initialized correctly.'
            );
            return false;
        }

        // Optional: Ensure vc_map() exists.
        if ( ! function_exists( 'vc_map' ) ) {
            $this->admin_notice(
                'WPBakery initialization is incomplete.'
            );
            return false;
        }

        return true;
    }

    /**
     * Display admin notice.
     */
    private function admin_notice( $message ) {

        if ( ! is_admin() ) {
            return;
        }

        add_action( 'admin_notices', function () use ( $message ) {
            ?>
            <div class="notice notice-error">
                <p><?php echo wp_kses_post( $message ); ?></p>
            </div>
            <?php
        } );
    }

    /**
     * Activation hook.
     */
    public static function activate() {

        // Optional: prevent activation without WPBakery.
        if ( ! defined( 'WPB_VC_VERSION' ) ) {
            deactivate_plugins( plugin_basename( __FILE__ ) );

            wp_die(
                esc_html__( 'WPB One Page Navigation requires WPBakery Page Builder.', 'wpb-one-page-nav' )
            );
        }
    }

    /**
     * Deactivation hook.
     */
    public static function deactivate() {
        // Cleanup if necessary.
    }
}

register_activation_hook(
    __FILE__,
    [ 'WPB_One_Page_Navigation', 'activate' ]
);

register_deactivation_hook(
    __FILE__,
    [ 'WPB_One_Page_Navigation', 'deactivate' ]
);

new WPB_One_Page_Navigation();