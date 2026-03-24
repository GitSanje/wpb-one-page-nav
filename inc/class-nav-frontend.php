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
            'wpb-opn-js',
             $plugin_url . 'assets/nav.js',
            ['jquery'], // jQuery dependency
            '1.0',
            true
        );
         // Add localized data 
         wp_localize_script(
             'wpb-opn-js',
             'wpbOnePageNav',
              array(
                'plugin_url' => $plugin_url,
                'ajax_url' => admin_url('admin-ajax.php'),
                'icon_path' => $plugin_url 
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