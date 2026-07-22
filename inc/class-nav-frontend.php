<?php
if (!defined('ABSPATH')) exit;

class WPB_OPN_Frontend {

     public static function init() {
          // Frontend
        // add_action('wp_enqueue_scripts', [__CLASS__, 'enqueue_assets']);

        // Admin (WPBakery editor)
        add_action('admin_enqueue_scripts', [__CLASS__, 'enqueue_assets']);    }

    public static  function enqueue_assets() {
         $plugin_url = plugin_dir_url(dirname(__FILE__));

        wp_enqueue_script(
            'wpb-opn-drag-drop-controller',
            $plugin_url . 'assets/js/drag-drop-controller.js',
            ['jquery'],
            '1.0',
            true
        );

        wp_enqueue_script(
            'wpb-opn-navbar-controller',
            $plugin_url . 'assets/js/navbar-controller.js',
            ['wpb-opn-drag-drop-controller'],
            '1.0',
            true
        );

        wp_enqueue_script(
            'wpb-opn-tree-manager',
            $plugin_url . 'assets/js/tree-manager.js',
            ['wpb-opn-navbar-controller'],
            '1.0',
            true
        );

        wp_enqueue_script(
            'wpb-opn-wpmove-adapter',
            $plugin_url . 'assets/js/wpmove-adapter.js',
            ['wpb-opn-tree-manager'],
            '1.0',
            true
        );

        wp_enqueue_script(
            'wpb-opn-drag-drop-manager',
            $plugin_url . 'assets/js/drag-drop-manager.js',
            ['wpb-opn-wpmove-adapter'],
            '1.0',
            true
        );

        wp_enqueue_script(
            'wpb-opn-main',
            $plugin_url . 'assets/js/main.js',
            ['wpb-opn-drag-drop-manager'],
            '1.0',
            true
        );

         wp_localize_script(
             'wpb-opn-main',
             'wpbOnePageNav',
              array(
                'plugin_url' => $plugin_url,
                'ajax_url' => admin_url('admin-ajax.php'),
                'icon_path' => $plugin_url ,
                'nonce' => wp_create_nonce('wpb_nav_nonce'),
                'post_id' => get_the_ID(),
              )
         );

        wp_enqueue_style(
            'wpb-opn-css',
            $plugin_url . 'assets/nav.css',
            [],
            '1.0'
        );
    }
}