<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<div class="theme-container">
    <!-- Sidebar Frame -->
    <aside class="theme-sidebar">
        <div class="theme-logo-container">
            <span class="theme-logo-title">🇮🇹 Italiano B2</span>
            <span class="theme-logo-sub">Tutor Platform</span>
        </div>

        <ul class="theme-nav-links">
            <li><a href="<?php echo esc_url(home_url('/')); ?>" class="theme-nav-btn">Dashboard</a></li>
            <li><a href="<?php echo esc_url(home_url('/syllabus')); ?>" class="theme-nav-btn">Syllabus</a></li>
            <li><a href="<?php echo esc_url(home_url('/writing-studio')); ?>" class="theme-nav-btn">Writing Studio</a></li>
            <li><a href="<?php echo esc_url(home_url('/speaking-lounge')); ?>" class="theme-nav-btn">Speaking Lounge</a></li>
            <li><a href="<?php echo esc_url(home_url('/readers-corner')); ?>" class="theme-nav-btn">Reader's Corner</a></li>
        </ul>
    </aside>

    <!-- Main Content Area -->
    <main class="theme-main-content">
