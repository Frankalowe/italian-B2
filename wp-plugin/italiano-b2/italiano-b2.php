<?php
/**
 * Plugin Name: Italiano B2 Learning Platform
 * Description: All-in-one Italian learning platform using local/cloud precompiled lessons and live OpenAI-powered studios gated by WooCommerce.
 * Version: 1.0.0
 * Author: Antigravity
 * Text Domain: italiano-b2
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

define('IB2_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('IB2_PLUGIN_URL', plugin_dir_url(__FILE__));

// Load required modules
require_once IB2_PLUGIN_DIR . 'includes/class-lesson-importer.php';
require_once IB2_PLUGIN_DIR . 'includes/class-woo-gating.php';
require_once IB2_PLUGIN_DIR . 'includes/class-progress.php';
require_once IB2_PLUGIN_DIR . 'includes/class-ai-proxy.php';
require_once IB2_PLUGIN_DIR . 'includes/class-shortcodes.php';

// Bootstrap the plugin
class Italiano_B2_Plugin {
    public function __construct() {
        add_action('admin_menu', array($this, 'add_settings_page'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));
    }

    public function add_settings_page() {
        add_menu_page(
            'Italiano B2 Settings',
            'Italiano B2',
            'manage_options',
            'italiano-b2',
            array($this, 'render_settings_page'),
            'dashicons-translation'
        );
    }

    public function register_settings() {
        register_setting('ib2_settings_group', 'ib2_openai_key');
        register_setting('ib2_settings_group', 'ib2_gated_product_id');
    }

    public function render_settings_page() {
        ?>
        <div class="wrap">
            <h1>Italiano B2 Settings</h1>
            <form method="post" action="options.php">
                <?php settings_fields('ib2_settings_group'); ?>
                <?php do_settings_sections('ib2_settings_group'); ?>
                <table class="form-table">
                    <tr valign="top">
                        <th scope="row">OpenAI API Key</th>
                        <td>
                            <input type="password" name="ib2_openai_key" value="<?php echo esc_attr(get_option('ib2_openai_key')); ?>" style="width: 400px;" />
                            <p class="description">Used to run the Writing Studio and Speaking Lounge features.</p>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">WooCommerce Course Product ID</th>
                        <td>
                            <input type="number" name="ib2_gated_product_id" value="<?php echo esc_attr(get_option('ib2_gated_product_id')); ?>" />
                            <p class="description">One-time purchase product ID to unlock levels A2 through B2 Mastery.</p>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>

            <hr/>
            <h2>Lesson Data Control</h2>
            <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                <input type="hidden" name="action" value="ib2_import_lessons" />
                <?php wp_nonce_field('ib2_import_nonce', 'ib2_nonce'); ?>
                <p>Click below to import or refresh the precompiled syllabus lessons from the plugin directory into your database.</p>
                <?php submit_button('Sync / Import Lessons', 'secondary'); ?>
            </form>
        </div>
        <?php
    }

    public function enqueue_assets() {
        // Enqueue Google Fonts
        wp_enqueue_style('ib2-google-fonts', 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&display=swap', array(), null);
        
        // Enqueue CSS
        wp_enqueue_style('ib2-styles', IB2_PLUGIN_URL . 'assets/css/italiano-b2.css', array(), '1.0.0');

        // Enqueue JS
        wp_enqueue_script('ib2-syllabus-js', IB2_PLUGIN_URL . 'assets/js/syllabus.js', array('jquery'), '1.0.0', true);
        wp_enqueue_script('ib2-writing-js', IB2_PLUGIN_URL . 'assets/js/writing-studio.js', array('jquery'), '1.0.0', true);
        wp_enqueue_script('ib2-speaking-js', IB2_PLUGIN_URL . 'assets/js/speaking-lounge.js', array('jquery'), '1.0.0', true);
        wp_enqueue_script('ib2-reading-js', IB2_PLUGIN_URL . 'assets/js/readers-corner.js', array('jquery'), '1.0.0', true);

        // Localize script with REST details and progress values
        $user_id = get_current_user_id();
        $progress = get_user_meta($user_id, 'ib2_progress', true);
        if (!is_array($progress)) {
            $progress = array();
        }

        wp_localize_script('ib2-syllabus-js', 'ib2_data', array(
            'rest_url' => esc_url_raw(rest_url('ib2/v1')),
            'nonce'    => wp_create_nonce('wp_rest'),
            'progress' => $progress,
            'last_level' => get_user_meta($user_id, 'ib2_last_level', true) ?: 'A1',
            'last_unit_id' => get_user_meta($user_id, 'ib2_last_unit_id', true) ?: '',
            'last_tab' => get_user_meta($user_id, 'ib2_last_tab', true) ?: 'grammar'
        ));
    }
}

new Italiano_B2_Plugin();
