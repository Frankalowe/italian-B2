<?php
if (!defined('ABSPATH')) {
    exit;
}

function ib2_theme_setup() {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('woocommerce');
    
    // Register sidebar menu
    register_nav_menus(array(
        'sidebar-menu' => 'Sidebar Navigation Menu'
    ));
}
add_action('after_setup_theme', 'ib2_theme_setup');

function ib2_theme_scripts() {
    // Theme base layout styles
    wp_enqueue_style('ib2-theme-base', get_template_directory_uri() . '/assets/css/theme-layout.css', array(), '1.0.0');
}
add_action('wp_enqueue_scripts', 'ib2_theme_scripts');
