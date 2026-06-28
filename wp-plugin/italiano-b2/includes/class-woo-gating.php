<?php
if (!defined('ABSPATH')) {
    exit;
}

class IB2_Woo_Gating {
    public static function user_has_access() {
        if (current_user_can('manage_options') || current_user_can('edit_posts')) {
            return true;
        }

        $user_id = get_current_user_id();
        if (!$user_id) {
            return false;
        }

        $product_id = get_option('ib2_gated_product_id');
        if (!$product_id) {
            return true; // No gating configured, allow access
        }

        if (function_exists('wc_customer_bought_product')) {
            $user = get_userdata($user_id);
            return wc_customer_bought_product($user->user_email, $user_id, $product_id);
        }

        return false;
    }

    public static function get_buy_url() {
        $product_id = get_option('ib2_gated_product_id');
        if (!$product_id) {
            return '#';
        }
        if (function_exists('wc_get_checkout_url')) {
            return esc_url(add_query_arg('add-to-cart', $product_id, wc_get_checkout_url()));
        }
        return get_permalink($product_id);
    }
}
