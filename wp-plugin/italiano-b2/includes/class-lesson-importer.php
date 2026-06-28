<?php
if (!defined('ABSPATH')) {
    exit;
}

class IB2_Lesson_Importer {
    public function __construct() {
        add_action('init', array($this, 'register_lesson_cpt'));
        add_action('admin_post_ib2_import_lessons', array($this, 'handle_lesson_import'));
    }

    public function register_lesson_cpt() {
        register_post_type('ib2_lesson', array(
            'labels' => array(
                'name' => 'Italian Lessons',
                'singular_name' => 'Italian Lesson',
            ),
            'public' => false,
            'show_ui' => true,
            'capability_type' => 'post',
            'hierarchical' => false,
            'supports' => array('title', 'editor', 'custom-fields'),
            'show_in_rest' => false
        ));
    }

    public function handle_lesson_import() {
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized user.');
        }

        check_admin_referer('ib2_import_nonce', 'ib2_nonce');

        $lessons_dir = IB2_PLUGIN_DIR . 'lessons/';
        if (!is_dir($lessons_dir)) {
            wp_redirect(admin_url('admin.php?page=italiano-b2&status=no_directory'));
            exit;
        }

        $files = glob($lessons_dir . '*.md');
        $imported = 0;

        foreach ($files as $file) {
            $filename = basename($file); // e.g. a1_u1_grammar.md
            if (preg_match('/^([a-z0-9_]+)_u(\d+)_([a-z]+)\.md$/', $filename, $matches)) {
                $level = strtoupper($matches[1]);
                $unit_num = intval($matches[2]);
                $tab = $matches[3];

                $title = sprintf('%s - Unit %d - %s', $level, $unit_num, ucfirst($tab));
                $content = file_get_contents($file);

                // Find existing lesson
                $existing = get_posts(array(
                    'post_type' => 'ib2_lesson',
                    'meta_query' => array(
                        array('key' => 'ib2_level', 'value' => $level),
                        array('key' => 'ib2_unit_num', 'value' => $unit_num),
                        array('key' => 'ib2_tab', 'value' => $tab)
                    ),
                    'posts_per_page' => 1
                ));

                $post_data = array(
                    'post_title'   => $title,
                    'post_content' => $content,
                    'post_status'  => 'publish',
                    'post_type'    => 'ib2_lesson',
                );

                if (!empty($existing)) {
                    $post_data['ID'] = $existing[0]->ID;
                    wp_update_post($post_data);
                    $post_id = $existing[0]->ID;
                } else {
                    $post_id = wp_insert_post($post_data);
                }

                update_post_meta($post_id, 'ib2_level', $level);
                update_post_meta($post_id, 'ib2_unit_num', $unit_num);
                update_post_meta($post_id, 'ib2_tab', $tab);
                $imported++;
            }
        }

        wp_redirect(admin_url('admin.php?page=italiano-b2&status=success&imported=' . $imported));
        exit;
    }
}

new IB2_Lesson_Importer();
