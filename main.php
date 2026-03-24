<?php

if (!defined('ABSPATH')) exit;
// Include classes
require_once plugin_dir_path(__FILE__) . 'inc/class-nav-settings.php';
require_once plugin_dir_path(__FILE__) . 'inc/class-nav-render.php';
require_once plugin_dir_path(__FILE__) . 'inc/class-nav-frontend.php';

class OnePageNavPlugin {
    
     function  __construct(){
         $this->init();
     }

     public function activate() {}
	public function deactivate() {}

     
    /**
	 * Initialize plugin
	 */

    private function init() {

        new WPB_OPN_Settings ();
        // Init row render hooks
        WPB_OPN_Render::init();
        // Init frontend assets
        WPB_OPN_Frontend::init();
      

    }


}