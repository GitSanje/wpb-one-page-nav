<?php
if (!defined('ABSPATH')) exit;


Class WPB_OPN_Settings {
    function  __construct() {
        add_action('vc_after_init', [$this, 'add_row_params']);
    }

    public  function add_row_params() {
        // Navigation Label
        vc_add_param('vc_row', [
            'type' => 'textfield',
            'heading' => 'Navigation Label',
            'param_name' => 'nav_label',
            'description' => 'Name displayed in the navbar'
        ]);

         // Navigation ID
        vc_add_param('vc_row', [
            'type' => 'textfield',
            'heading' => 'Navigation ID',
            'param_name' => 'nav_id',
            'description' => 'Unique ID for anchor link'
        ]);

        // Enable/disable in nav
        vc_add_param('vc_row', [
            'type' => 'checkbox',
            'heading' => 'Show in Navigation',
            'param_name' => 'show_in_nav',
            'value' => ['Yes' => 'yes'],
            'description' => 'Check to include this row in the one-page navigation'
        ]);
    }
}