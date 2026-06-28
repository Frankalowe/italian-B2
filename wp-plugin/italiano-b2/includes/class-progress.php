<?php
if (!defined('ABSPATH')) {
    exit;
}

class IB2_Progress {
    public function __construct() {
        add_action('rest_api_init', array($this, 'register_rest_routes'));
    }

    public function register_rest_routes() {
        register_rest_route('ib2/v1', '/progress', array(
            'methods' => 'POST',
            'callback' => array($this, 'toggle_progress'),
            'permission_callback' => array($this, 'check_auth')
        ));

        register_rest_route('ib2/v1', '/last-visited', array(
            'methods' => 'POST',
            'callback' => array($this, 'save_last_visited'),
            'permission_callback' => array($this, 'check_auth')
        ));

        register_rest_route('ib2/v1', '/lesson-content', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_lesson_content'),
            'permission_callback' => array($this, 'check_auth')
        ));
    }

    public function check_auth() {
        return is_user_logged_in();
    }

    public function toggle_progress(WP_REST_Request $request) {
        $user_id = get_current_user_id();
        $unit_id = sanitize_text_field($request->get_param('unit_id'));
        if (!$unit_id) {
            return new WP_Error('missing_param', 'Missing unit_id parameter.', array('status' => 400));
        }

        $progress = get_user_meta($user_id, 'ib2_progress', true);
        if (!is_array($progress)) {
            $progress = array();
        }

        if (in_array($unit_id, $progress)) {
            $progress = array_values(array_diff($progress, array($unit_id)));
            $completed = false;
        } else {
            $progress[] = $unit_id;
            $completed = true;
        }

        update_user_meta($user_id, 'ib2_progress', $progress);

        return rest_ensure_response(array(
            'success' => true,
            'completed' => $completed,
            'progress' => $progress
        ));
    }

    public function save_last_visited(WP_REST_Request $request) {
        $user_id = get_current_user_id();
        $level = sanitize_text_field($request->get_param('level'));
        $unit_id = sanitize_text_field($request->get_param('unit_id'));
        $tab = sanitize_text_field($request->get_param('tab'));

        if ($level) update_user_meta($user_id, 'ib2_last_level', $level);
        if ($unit_id) update_user_meta($user_id, 'ib2_last_unit_id', $unit_id);
        if ($tab) update_user_meta($user_id, 'ib2_last_tab', $tab);

        return rest_ensure_response(array('success' => true));
    }

    public function get_lesson_content(WP_REST_Request $request) {
        $level = sanitize_text_field($request->get_param('level'));
        $unit_num = intval($request->get_param('unit_num'));
        $tab = sanitize_text_field($request->get_param('tab'));

        // Gate access to higher levels (A1 preview is always free)
        if (strtoupper($level) !== 'A1' && !IB2_Woo_Gating::user_has_access()) {
            return new WP_Error('gated_content', 'This level is locked. Please purchase the course to unlock.', array('status' => 403));
        }

        $posts = get_posts(array(
            'post_type' => 'ib2_lesson',
            'meta_query' => array(
                array('key' => 'ib2_level', 'value' => strtoupper($level)),
                array('key' => 'ib2_unit_num', 'value' => $unit_num),
                array('key' => 'ib2_tab', 'value' => $tab)
            ),
            'posts_per_page' => 1
        ));

        if (empty($posts)) {
            return rest_ensure_response(array('found' => false, 'content' => ''));
        }

        // Return parsed markdown content if needed
        $content = $posts[0]->post_content;
        return rest_ensure_response(array(
            'found' => true,
            'content' => $content
        ));
    }
}

new IB2_Progress();
