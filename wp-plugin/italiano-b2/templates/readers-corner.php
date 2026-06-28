<?php
if (!defined('ABSPATH')) {
    exit;
}

$has_access = IB2_Woo_Gating::user_has_access();
?>
<div class="ib2-app">
    <div class="page-header">
        <h1 class="page-title">Reader's Corner</h1>
        <p class="page-subtitle">Generate custom short stories, news articles, or essays in Italian matched specifically to your learning level.</p>
    </div>

    <?php if (!$has_access): ?>
        <div class="nb-card accent-red" style="text-align: center; padding: 3rem 1.5rem;">
            <span style="font-size: 4rem; display: block; margin-bottom: 1rem;">🔒</span>
            <h2 class="nb-card-title" style="border: none;">Feature Gated</h2>
            <p style="font-weight: 600; font-size: 1.1rem; margin-bottom: 2rem;">Unlock the complete Italian B2 course to access the Reader's Corner story engine.</p>
            <a href="<?php echo esc_url(IB2_Woo_Gating::get_buy_url()); ?>" class="nb-btn btn-green" style="text-decoration: none;">
                Buy Course Now
            </a>
        </div>
    <?php else: ?>
        <div class="nb-grid" style="grid-template-columns: 1fr 2fr;">
            <!-- Left panel configs -->
            <div class="nb-card" style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; height: fit-content;">
                <h3 class="nb-card-title">Story Config</h3>

                <div>
                    <label style="font-weight: 800; display: block; margin-bottom: 0.5rem;">CEFR Target</label>
                    <select id="ib2-reading-level" class="nb-select">
                        <option value="A1">A1 - Beginner</option>
                        <option value="A2">A2 - Elementary</option>
                        <option value="B1">B1 - Intermediate</option>
                        <option value="B2">B2 - Upper-Intermediate</option>
                    </select>
                </div>

                <div>
                    <label style="font-weight: 800; display: block; margin-bottom: 0.5rem;">Subject / Topic</label>
                    <input type="text" id="ib2-reading-topic" class="nb-input" value="La cucina toscana" placeholder="E.g. Storia di Roma, Una giornata al mare..." />
                </div>

                <button class="nb-btn btn-blue" id="ib2-reading-generate" style="width: 100%; justify-content: center;">
                    Generate Reading
                </button>
            </div>

            <!-- Right display container -->
            <div class="nb-card" style="padding: 1.5rem; position: relative;">
                <h3 class="nb-card-title">Lezione di Lettura</h3>
                <div id="ib2-reading-placeholder" style="font-weight: 600; color: #666; text-align: center; margin-top: 3rem;">
                    Configure a topic on the left to generate reading material.
                </div>

                <div id="ib2-reading-body" class="markdown-content" style="display: none; border: 3px solid #000; padding: 1.5rem; background-color: #fff; box-shadow: 3px 3px 0 #000;">
                    <!-- Filled by REST response -->
                </div>

                <!-- Loader overlay -->
                <div id="ib2-reading-loader" style="display: none; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(255,255,255,0.85); align-items: center; justify-content: center; flex-direction: column;">
                    <div class="nb-loader"></div>
                    <p style="font-weight: 900; text-transform: uppercase; font-size: 0.95rem; margin-top: 0.5rem;">Writing your story in Italian...</p>
                </div>
            </div>
        </div>
    <?php endif; ?>
</div>
