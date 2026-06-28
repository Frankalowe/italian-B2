<?php
if (!defined('ABSPATH')) {
    exit;
}

class IB2_Shortcodes {
    public function __construct() {
        add_shortcode('ib2_dashboard', array($this, 'render_dashboard'));
        add_shortcode('ib2_syllabus', array($this, 'render_syllabus'));
        add_shortcode('ib2_writing', array($this, 'render_writing'));
        add_shortcode('ib2_speaking', array($this, 'render_speaking'));
        add_shortcode('ib2_reading', array($this, 'render_reading'));
    }

    public function load_template($template_name) {
        $file = IB2_PLUGIN_DIR . 'templates/' . $template_name . '.php';
        if (file_exists($file)) {
            ob_start();
            include $file;
            return ob_get_clean();
        }
        return '<p>Template not found.</p>';
    }

    public function render_dashboard() {
        return $this->load_template('dashboard');
    }

    public function render_syllabus() {
        return $this->load_template('syllabus');
    }

    public function render_writing() {
        return $this->load_template('writing-studio');
    }

    public function render_speaking() {
        return $this->load_template('speaking-lounge');
    }

    public function render_reading() {
        return $this->load_template('readers-corner');
    }
}

new IB2_Shortcodes();
