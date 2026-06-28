<?php
if (!defined('ABSPATH')) {
    exit;
}

$user_id = get_current_user_id();
$progress = get_user_meta($user_id, 'ib2_progress', true) ?: array();

// Parse syllabus file to get total unit counts
$syllabus_file = IB2_PLUGIN_DIR . 'lessons/syllabus.json';
if (!file_exists($syllabus_file)) {
    $syllabus_file = plugin_dir_path(dirname(dirname(__FILE__))) . 'server/syllabus.json';
}
$syllabus = array();
if (file_exists($syllabus_file)) {
    $syllabus = json_decode(file_get_contents($syllabus_file), true);
}

$total_units = 0;
foreach ($syllabus as $lvl => $data) {
    if (isset($data['units'])) {
        $total_units += count($data['units']);
    }
}
$completed_count = is_array($progress) ? count($progress) : 0;
$percent = $total_units > 0 ? round(($completed_count / $total_units) * 100) : 0;

$proverbs = array(
    array("italian" => "Chi cerca trova.", "english" => "He who seeks, finds.", "explanation" => "Encouraging persistence in your study!"),
    array("italian" => "Meglio tardi che mai.", "english" => "Better late than never.", "explanation" => "Even 5 minutes of study today counts."),
    array("italian" => "L'abito non fa il monaco.", "english" => "The habit does not make the monk.", "explanation" => "Don't judge by appearances - Italian grammar is easier than it looks!")
);
$day_index = date('j') % count($proverbs);
$proverb = $proverbs[$day_index];
?>

<div class="ib2-app">
    <div class="page-header">
        <h1 class="page-title">Benvenuto!</h1>
        <p class="page-subtitle">Welcome to your personal Italian learning workspace. Let's aim for B2!</p>
    </div>

    <div class="nb-grid">
        <!-- Main stats card -->
        <div class="nb-card accent-green" style="grid-column: span 2;">
            <h2 class="nb-card-title">Syllabus Completion</h2>
            <div class="progress-bar-container">
                <div class="progress-bar-fill" style="width: <?php echo esc_attr($percent); ?>%;"></div>
                <span class="progress-text"><?php echo esc_html($percent); ?>% Completed (<?php echo esc_html($completed_count); ?> / <?php echo esc_html($total_units); ?> Units)</span>
            </div>
            <p style="font-weight: 600;">
                You have mastered basic structure elements. Continue your journey through the interactive Syllabus Tree!
            </p>
            <a href="?view=syllabus" class="nb-btn btn-yellow" style="margin-top: 1.2rem; text-decoration: none;">
                Open Syllabus Tree
            </a>
        </div>

        <!-- Proverb card -->
        <div class="nb-card accent-purple">
            <h3 class="nb-card-title">Proverbio del Giorno</h3>
            <p style="font-size: 1.3rem; font-weight: 900; margin-bottom: 0.5rem;">"<?php echo esc_html($proverb['italian']); ?>"</p>
            <p style="font-weight: 600; color: #333; margin-bottom: 0.8rem;"><em><?php echo esc_html($proverb['english']); ?></em></p>
            <p style="font-size: 0.9rem; color: #555;"><?php echo esc_html($proverb['explanation']); ?></p>
        </div>
    </div>
</div>
