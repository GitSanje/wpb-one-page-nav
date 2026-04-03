<?php
if (!defined('ABSPATH')) exit;

class WPB_OPN_Render {

    
    public static function init() {
        // Run after VC is loaded
        add_action('vc_after_init', [__CLASS__, 'setup_hooks']);
    }

      public static function setup_hooks() {
        add_filter('vc_shortcode_output', [__CLASS__, 'add_nav_attributes'], 10, 3);
    }

    public static function add_nav_attributes($output, $obj, $atts) {
        // error_log("shortcut atts: " . print_r($atts, true));
        // error_log("shortcut output: " . print_r($output, true));

        if ($obj->settings('base') !== 'vc_row') return $output;

        $nav_label = $atts['nav_label'] ?? '';
        $nav_id = $atts['nav_id'] ?? '';
        $show_nav = !empty($atts['show_in_nav']) && $atts['show_in_nav'] === 'yes';

        if ($show_nav && $nav_id) {
            $output = preg_replace(
                '/class="([^"]*)"/',
                'id="' . esc_attr($nav_id) . '" data-nav-label="' . esc_attr($nav_label) . '" class="$1"',
                $output,
                1
            );
        }

        return $output;
    }

}