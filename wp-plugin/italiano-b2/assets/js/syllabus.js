jQuery(document).ready(function($) {
    if (!$('#ib2-level-select').length) return;

    const $levelSelect = $('#ib2-level-select');
    const $unitSelect = $('#ib2-unit-select');
    const $welcomePanel = $('#ib2-welcome-panel');
    const $lockedPanel = $('#ib2-locked-panel');
    const $lessonPanel = $('#ib2-lesson-panel');
    const $loader = $('#ib2-lesson-loader');
    const $markdownBody = $('#ib2-markdown-body');
    const $completeBtn = $('#ib2-complete-btn');

    let currentLevel = ib2_data.last_level || 'A1';
    let currentUnit = null;
    let currentTab = ib2_data.last_tab || 'grammar';
    let progress = ib2_data.progress || [];

    // Set initial select values from history
    $levelSelect.val(currentLevel);

    // Populate units dropdown based on selected level
    function populateUnits(level, selectUnitId = null) {
        $unitSelect.empty();
        $unitSelect.append('<option value="">-- Select Unit --</option>');

        const levelData = window.ib2_syllabus_data[level];
        if (levelData && levelData.units) {
            levelData.units.forEach(unit => {
                $unitSelect.append(`<option value="${unit.id}">${unit.title}</option>`);
            });
        }

        if (selectUnitId) {
            $unitSelect.val(selectUnitId);
            const foundUnit = levelData.units.find(u => u.id === selectUnitId);
            if (foundUnit) {
                currentUnit = foundUnit;
                loadLessonContent();
            }
        }
    }

    // Load dynamic content from CPT using REST API
    function loadLessonContent() {
        if (!currentUnit) {
            $welcomePanel.show();
            $lessonPanel.hide();
            $lockedPanel.hide();
            return;
        }

        $welcomePanel.hide();

        // Check WooCommerce Gating (A1 is always free/preview)
        if (currentLevel !== 'A1' && !window.ib2_has_access) {
            $lessonPanel.hide();
            $lockedPanel.show();
            return;
        }

        $lockedPanel.hide();
        $lessonPanel.show();
        $loader.css('display', 'flex');

        // Update active headers/metadata
        $('#ib2-active-title').text(currentUnit.title);
        $('#ib2-active-sub').text(`${currentTab.toUpperCase()} Chapter`);
        $('#ib2-badge-level').text(currentLevel).attr('class', `nb-badge level-${currentLevel.toLowerCase()}`);

        updateCompleteButtonState();

        // Save history state to user meta
        $.ajax({
            url: ib2_data.rest_url + '/last-visited',
            method: 'POST',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('X-WP-Nonce', ib2_data.nonce);
            },
            data: {
                level: currentLevel,
                unit_id: currentUnit.id,
                tab: currentTab
            }
        });

        // Fetch lesson text
        const unitNum = currentUnit.id.split('_u')[1];
        $.ajax({
            url: ib2_data.rest_url + '/lesson-content',
            method: 'GET',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('X-WP-Nonce', ib2_data.nonce);
            },
            data: {
                level: currentLevel,
                unit_num: unitNum,
                tab: currentTab
            },
            success: function(response) {
                $loader.hide();
                if (response.found) {
                    // Quick crude markdown-to-html conversion for display
                    $markdownBody.html(formatMarkdown(response.content));
                } else {
                    $markdownBody.html(`<p><em>Study notes for this section are compiling. Please re-run precompilation.</em></p>`);
                }
            },
            error: function(err) {
                $loader.hide();
                $markdownBody.html(`<p style="color:red;">Error loading lesson content: ${err.responseJSON ? err.responseJSON.message : 'Unknown error'}</p>`);
            }
        });
    }

    // Toggle unit complete
    $completeBtn.on('click', function() {
        if (!currentUnit) return;
        
        $completeBtn.prop('disabled', true);
        $.ajax({
            url: ib2_data.rest_url + '/progress',
            method: 'POST',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('X-WP-Nonce', ib2_data.nonce);
            },
            data: {
                unit_id: currentUnit.id
            },
            success: function(response) {
                $completeBtn.prop('disabled', false);
                if (response.success) {
                    progress = response.progress;
                    updateCompleteButtonState();
                }
            },
            error: function() {
                $completeBtn.prop('disabled', false);
            }
        });
    });

    function updateCompleteButtonState() {
        if (!currentUnit) return;
        const isCompleted = progress.includes(currentUnit.id);
        if (isCompleted) {
            $completeBtn.text('✅ Completed').attr('class', 'nb-btn btn-green');
        } else {
            $completeBtn.text('Mark Complete').attr('class', 'nb-btn btn-blue');
        }
    }

    // Change handlers
    $levelSelect.on('change', function() {
        currentLevel = $(this).val();
        currentUnit = null;
        populateUnits(currentLevel);
        $welcomePanel.show();
        $lessonPanel.hide();
        $lockedPanel.hide();
    });

    $unitSelect.on('change', function() {
        const unitId = $(this).val();
        if (!unitId) {
            currentUnit = null;
            loadLessonContent();
            return;
        }
        const levelData = window.ib2_syllabus_data[currentLevel];
        currentUnit = levelData.units.find(u => u.id === unitId);
        loadLessonContent();
    });

    // Tab buttons click handler
    $('.tab-btn').on('click', function() {
        $('.tab-btn').removeClass('active').css('background-color', '#fff');
        $(this).addClass('active').css('background-color', 'var(--color-accent-blue)');
        currentTab = $(this).data('tab');
        loadLessonContent();
    });

    // Run initial load setup
    populateUnits(currentLevel, ib2_data.last_unit_id);

    // Markdown conversion parser helper
    function formatMarkdown(md) {
        if (!md) return '';
        let html = md;
        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        // Bold
        html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
        // Unordered lists
        html = html.replace(/^\s*-\s+(.*)$/gim, '<li>$1</li>');
        // Convert double returns to paragraphs
        html = html.replace(/\n\n/g, '</p><p>');
        return html;
    }
});
