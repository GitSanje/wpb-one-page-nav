<?php
/*
Plugin Name: WPB One Page Navigation
Description: Adds Elementor-style one-page anchor navigation to WPBakery rows.
Version: 1.0
Author: SK
*/

if (!defined('ABSPATH')) exit;
require_once('main.php');

$the_plugin = new OnePageNavPlugin();

register_activation_hook( __FILE__, [ $the_plugin, 'activate' ] );
register_deactivation_hook( __FILE__, [ $the_plugin, 'deactivate' ] );
