<?php
if (!defined('ABSPATH')) {
    exit;
}

$user_id = get_current_user_id();
$progress = get_user_meta($user_id, 'ib2_progress', true) ?: array();
$has_access = IB2_Woo_Gating::user_has_access();

$syllabus_file = IB2_PLUGIN_DIR . 'lessons/syllabus.json';
if (!file_exists($syllabus_file)) {
    $syllabus_file = plugin_dir_path(dirname(dirname(__FILE__))) . 'server/syllabus.json';
}
$syllabus = array();
if (file_exists($syllabus_file)) {
    $syllabus = json_decode(file_get_contents($syllabus_file), true);
}
?>

<div class="ib2-app">
    <div class="page-header">
        <h1 class="page-title">Syllabus Tree</h1>
        <p class="page-subtitle">Track your learning units, explore study guides, grammar chapters, and test your knowledge.</p>
    </div>

    <!-- Layout Grid -->
    <div class="nb-grid" style="grid-template-columns: 1fr 3fr;">
        <!-- Left Sidebar: Level & Unit Selector -->
        <div class="nb-card accent-yellow" style="padding: 1.5rem; height: fit-content;">
            <!-- CEFR Selector -->
            <div style="margin-bottom: 1.5rem;">
                <label style="font-weight: 900; text-transform: uppercase; font-size: 0.95rem; margin-bottom: 0.8rem; display: block; color: #000;">
                    Select CEFR Level
                </label>
                <select id="ib2-level-select" class="nb-select">
                    <?php foreach ($syllabus as $lvl => $data): ?>
                        <option value="<?php echo esc_attr($lvl); ?>">
                            <?php echo esc_html($lvl); ?>: <?php echo esc_html($data['title']); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>

            <!-- Unit Selector -->
            <div>
                <label style="font-weight: 900; text-transform: uppercase; font-size: 0.95rem; margin-bottom: 0.8rem; display: block; color: #000;">
                    Select Unit Module
                </label>
                <select id="ib2-unit-select" class="nb-select">
                    <!-- Loaded dynamically via JS -->
                </select>
            </div>
        </div>

        <!-- Right Panels: Content Display -->
        <div class="nb-card" id="ib2-content-card" style="padding: 2rem; position: relative;">
            <div id="ib2-welcome-panel">
                <h2 class="nb-card-title">Seleziona un'unità</h2>
                <p style="font-weight: 600;">Please select a unit from the left panel dropdowns to begin reading guides, dialogues, and exercises.</p>
            </div>

            <!-- Locked Screen overlay -->
            <div id="ib2-locked-panel" style="display: none; text-align: center; padding: 3rem 1.5rem;">
                <span style="font-size: 4rem; display: block; margin-bottom: 1rem;">🔒</span>
                <h2 class="nb-card-title" style="border: none;">Level Locked</h2>
                <p style="font-weight: 600; font-size: 1.1rem; margin-bottom: 2rem;">Unlock the complete Italian B2 masterclass course (levels A2 to B2 Mastery) to access this unit.</p>
                <a href="<?php echo esc_url(IB2_Woo_Gating::get_buy_url()); ?>" class="nb-btn btn-green" style="text-decoration: none;">
                    Buy Course Now
                </a>
            </div>

            <!-- Main active lesson tabs and content container -->
            <div id="ib2-lesson-panel" style="display: none;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #000; padding-bottom: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <h2 id="ib2-active-title" style="margin: 0; font-weight: 900; font-size: 1.8rem; text-transform: uppercase;">Unit Title</h2>
                        <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                            <span class="nb-badge" id="ib2-badge-level">A1</span>
                            <span style="font-weight: 700; color: #555;" id="ib2-active-sub">Grammar details</span>
                        </div>
                    </div>

                    <!-- Complete button -->
                    <button class="nb-btn" id="ib2-complete-btn"></button>
                </div>

                <!-- Tabs header -->
                <div class="study-tabs" style="display: flex; gap: 0.8rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
                    <button class="nb-btn tab-btn active" data-tab="grammar" style="background-color: var(--color-accent-blue);">Grammar</button>
                    <button class="nb-btn tab-btn" data-tab="vocabulary" style="background-color: #fff;">Vocabulary</button>
                    <button class="nb-btn tab-btn" data-tab="dialogue" style="background-color: #fff;">Dialogue</button>
                    <button class="nb-btn tab-btn" data-tab="exercises" style="background-color: #fff;">Exercises</button>
                </div>

                <!-- Markdown Content Loader -->
                <div class="markdown-content study-content-card" id="ib2-markdown-body" style="border: 3px solid #000; padding: 2rem; background-color: #fff; min-height: 300px;">
                    <!-- Filled by REST API query -->
                </div>

                <!-- Loader overlay inside study card -->
                <div id="ib2-lesson-loader" style="display: none; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(255,255,255,0.85); align-items: center; justify-content: center; flex-direction: column;">
                    <div class="nb-loader"></div>
                    <p style="font-weight: 900; text-transform: uppercase; font-size: 0.95rem; margin-top: 0.5rem;">Loading study guide content...</p>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
    // Embed the syllabus JSON safely so vanilla JS can use it to build dynamic selectors
    window.ib2_syllabus_data = <?php echo json_encode($syllabus); ?>;
    window.ib2_has_access = <?php echo $has_access ? 'true' : 'false'; ?>;
</script>
