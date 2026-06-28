<?php
if (!defined('ABSPATH')) {
    exit;
}

$has_access = IB2_Woo_Gating::user_has_access();
?>
<div class="ib2-app">
    <div class="page-header">
        <h1 class="page-title">Writing Studio</h1>
        <p class="page-subtitle">Submit custom writings, essays, or paragraph translations to receive real-time grammatical feedback and spelling suggestions.</p>
    </div>

    <?php if (!$has_access): ?>
        <div class="nb-card accent-red" style="text-align: center; padding: 3rem 1.5rem;">
            <span style="font-size: 4rem; display: block; margin-bottom: 1rem;">🔒</span>
            <h2 class="nb-card-title" style="border: none;">Feature Gated</h2>
            <p style="font-weight: 600; font-size: 1.1rem; margin-bottom: 2rem;">Unlock the complete Italian B2 course to access the Writing Studio feedback engine.</p>
            <a href="<?php echo esc_url(IB2_Woo_Gating::get_buy_url()); ?>" class="nb-btn btn-green" style="text-decoration: none;">
                Buy Course Now
            </a>
        </div>
    <?php else: ?>
        <div class="nb-grid">
            <div class="nb-card" style="padding: 1.5rem;">
                <h3 class="nb-card-title">Compose Essay</h3>
                <div style="margin-bottom: 1.5rem;">
                    <label style="font-weight: 800; display: block; margin-bottom: 0.5rem;">Level Focus</label>
                    <select id="ib2-writing-level" class="nb-select">
                        <option value="A1">A1 - Beginner</option>
                        <option value="A2">A2 - Elementary</option>
                        <option value="B1">B1 - Intermediate</option>
                        <option value="B2">B2 - Upper-Intermediate</option>
                    </select>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <label style="font-weight: 800; display: block; margin-bottom: 0.5rem;">Your Writing (in Italian)</label>
                    <textarea id="ib2-writing-input" class="nb-textarea" placeholder="Scrivi qualcosa qui in italiano... (e.g. Scrivi una lettera ad un amico...)"></textarea>
                </div>

                <button class="nb-btn btn-blue" id="ib2-submit-writing" style="width: 100%; justify-content: center;">
                    Submit Essay for Review
                </button>
            </div>

            <div class="nb-card" style="padding: 1.5rem; position: relative;">
                <h3 class="nb-card-title">Analysis & Feedback</h3>
                <div id="ib2-writing-placeholder" style="font-weight: 600; color: #666; text-align: center; margin-top: 3rem;">
                    Submit your writing to receive immediate grammar suggestions and corrections.
                </div>

                <div id="ib2-writing-results" style="display: none;">
                    <div id="ib2-writing-feedback" class="markdown-content" style="border: 3px solid #000; padding: 1rem; background-color: #f9f9f9; box-shadow: 3px 3px 0 #000; margin-top: 1rem;">
                        <!-- Filled by response -->
                    </div>
                </div>

                <!-- Loader overlay -->
                <div id="ib2-writing-loader" style="display: none; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(255,255,255,0.85); align-items: center; justify-content: center; flex-direction: column;">
                    <div class="nb-loader"></div>
                    <p style="font-weight: 900; text-transform: uppercase; font-size: 0.95rem; margin-top: 0.5rem;">Professore AI is reviewing your text...</p>
                </div>
            </div>
        </div>
    <?php endif; ?>
</div>
