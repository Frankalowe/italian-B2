<?php
if (!defined('ABSPATH')) {
    exit;
}

class IB2_AI_Proxy {
    public function __construct() {
        add_action('rest_api_init', array($this, 'register_rest_routes'));
    }

    public function register_rest_routes() {
        register_rest_route('ib2/v1', '/ai', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_ai_query'),
            'permission_callback' => array($this, 'check_gated_auth')
        ));
    }

    public function check_gated_auth() {
        return is_user_logged_in() && IB2_Woo_Gating::user_has_access();
    }

    public function handle_ai_query(WP_REST_Request $request) {
        $messages = $request->get_param('messages');
        if (!is_array($messages)) {
            return new WP_Error('invalid_param', 'Messages parameter must be an array.', array('status' => 400));
        }

        $api_key = get_option('ib2_openai_key');
        if (!$api_key) {
            return new WP_Error('missing_key', 'OpenAI API key is not configured in WordPress settings.', array('status' => 500));
        }

        $payload = array(
            'model' => 'gpt-4o-mini',
            'messages' => $messages,
            'temperature' => 0.3
        );

        $response = wp_remote_post('https://api.openai.com/v1/chat/completions', array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $api_key
            ),
            'body' => json_encode($payload),
            'timeout' => 30
        ));

        if (is_wp_error($response)) {
            return new WP_Error('api_error', $response->get_error_message(), array('status' => 500));
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (isset($data['error'])) {
            return new WP_Error('openai_error', $data['error']['message'], array('status' => 400));
        }

        $text = $data['choices'][0]['message']['content'] ?? '';
        return rest_ensure_response(array(
            'success' => true,
            'content' => $text
        ));
    }
}

new IB2_AI_Proxy();
