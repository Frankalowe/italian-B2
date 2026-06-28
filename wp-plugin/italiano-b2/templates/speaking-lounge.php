<?php
if (!defined('ABSPATH')) {
    exit;
}

$has_access = IB2_Woo_Gating::user_has_access();
?>
<div class="ib2-app">
    <div class="page-header">
        <h1 class="page-title">Speaking Lounge</h1>
        <p class="page-subtitle">Interactive speech simulation. Practice speaking Italian by having a guided topic dialogue with Professore AI.</p>
    </div>

    <?php if (!$has_access): ?>
        <div class="nb-card accent-red" style="text-align: center; padding: 3rem 1.5rem;">
            <span style="font-size: 4rem; display: block; margin-bottom: 1rem;">🔒</span>
            <h2 class="nb-card-title" style="border: none;">Feature Gated</h2>
            <p style="font-weight: 600; font-size: 1.1rem; margin-bottom: 2rem;">Unlock the complete Italian B2 course to access the Speaking Lounge voice session proxy.</p>
            <a href="<?php echo esc_url(IB2_Woo_Gating::get_buy_url()); ?>" class="nb-btn btn-green" style="text-decoration: none;">
                Buy Course Now
            </a>
        </div>
    <?php else: ?>
        <div class="nb-grid">
            <!-- Left inputs panel -->
            <div class="nb-card" style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; height: fit-content;">
                <h3 class="nb-card-title">Setup Dialogue</h3>
                
                <div>
                    <label style="font-weight: 800; display: block; margin-bottom: 0.5rem;">CEFR Target</label>
                    <select id="ib2-speaking-level" class="nb-select">
                        <option value="A1">A1 - Beginner</option>
                        <option value="A2">A2 - Elementary</option>
                        <option value="B1">B1 - Intermediate</option>
                        <option value="B2">B2 - Upper-Intermediate</option>
                    </select>
                </div>

                <div>
                    <label style="font-weight: 800; display: block; margin-bottom: 0.5rem;">Conversation Theme</label>
                    <input type="text" id="ib2-speaking-topic" class="nb-input" value="Al ristorante - Ordering food" placeholder="E.g. In hotel, Al mercato..." />
                </div>

                <button class="nb-btn btn-green" id="ib2-speaking-start" style="width: 100%; justify-content: center;">
                    Start Live Conversation
                </button>
            </div>

            <!-- Right interactive feed -->
            <div class="nb-card" style="padding: 1.5rem; position: relative;">
                <h3 class="nb-card-title">Professor Response</h3>
                <div id="ib2-speaking-placeholder" style="font-weight: 600; color: #666; text-align: center; margin-top: 3rem;">
                    Configure a theme and start the conversation to interact.
                </div>

                <div id="ib2-speaking-feed" style="display: none; display: flex; flex-direction: column; gap: 1rem;">
                    <!-- Chat box bubble -->
                    <div id="ib2-speaking-bubble" style="border: 3px solid #000; padding: 1.5rem; background-color: #fff; box-shadow: 3px 3px 0 #000; font-size: 1.25rem; font-weight: 800; line-height: 1.6;">
                        <!-- AI question -->
                    </div>

                    <!-- User input text -->
                    <div style="margin-top: 1rem;">
                        <label style="font-weight: 800; display: block; margin-bottom: 0.5rem;">Your Reply (in Italian)</label>
                        <textarea id="ib2-speaking-reply" class="nb-textarea" placeholder="Rispondi al professore in italiano..."></textarea>
                    </div>

                    <button class="nb-btn btn-blue" id="ib2-speaking-submit" style="width: 100%; justify-content: center;">
                        Send Response
                    </button>
                </div>

                <!-- Loader overlay -->
                <div id="ib2-speaking-loader" style="display: none; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(255,255,255,0.85); align-items: center; justify-content: center; flex-direction: column;">
                    <div class="nb-loader"></div>
                    <p style="font-weight: 900; text-transform: uppercase; font-size: 0.95rem; margin-top: 0.5rem;">Professore is thinking...</p>
                </div>
            </div>
        </div>
    <?php endif; ?>
</div>
