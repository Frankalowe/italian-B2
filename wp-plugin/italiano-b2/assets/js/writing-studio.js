jQuery(document).ready(function($) {
    if (!$('#ib2-submit-writing').length) return;

    const $submitBtn = $('#ib2-submit-writing');
    const $input = $('#ib2-input-writing');
    const $placeholder = $('#ib2-writing-placeholder');
    const $results = $('#ib2-writing-results');
    const $feedbackBox = $('#ib2-writing-feedback');
    const $loader = $('#ib2-writing-loader');

    $submitBtn.on('click', function() {
        const text = $('#ib2-writing-input').val().trim();
        const level = $('#ib2-writing-level').val();

        if (!text) {
            alert('Per favore, scrivi qualcosa prima di inviare.');
            return;
        }

        $loader.css('display', 'flex');
        $placeholder.hide();

        const messages = [
            {
                role: 'system',
                content: `You are an expert Italian language teacher. Analyze the user's Italian text (targeted at CEFR level ${level}).
Provide grammatical corrections, highlighting errors with explanations, vocabulary suggestions, and constructive feedback.`
            },
            {
                role: 'user',
                content: text
            }
        ];

        $.ajax({
            url: ib2_data.rest_url + '/ai',
            method: 'POST',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('X-WP-Nonce', ib2_data.nonce);
            },
            data: {
                messages: messages
            },
            success: function(response) {
                $loader.hide();
                if (response.success) {
                    $results.show();
                    // Simple formatting
                    let formatted = response.content.replace(/\n/g, '<br>');
                    $feedbackBox.html(formatted);
                }
            },
            error: function(err) {
                $loader.hide();
                $placeholder.show().html(`<span style="color:red;">Error: ${err.responseJSON ? err.responseJSON.message : 'Failed to query OpenAI.'}</span>`);
            }
        });
    });
});
