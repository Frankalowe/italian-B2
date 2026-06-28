jQuery(document).ready(function($) {
    if (!$('#ib2-speaking-start').length) return;

    const $startBtn = $('#ib2-speaking-start');
    const $submitBtn = $('#ib2-speaking-submit');
    const $placeholder = $('#ib2-speaking-placeholder');
    const $feed = $('#ib2-speaking-feed');
    const $bubble = $('#ib2-speaking-bubble');
    const $loader = $('#ib2-speaking-loader');
    const $replyText = $('#ib2-speaking-reply');

    let history = [];

    $startBtn.on('click', function() {
        const level = $('#ib2-speaking-level').val();
        const topic = $('#ib2-speaking-topic').val().trim() || 'Free Conversation';

        $loader.css('display', 'flex');
        $placeholder.hide();
        $feed.hide();

        history = [
            {
                role: 'system',
                content: `You are an Italian speaking tutor. Converse with the user in Italian at a ${level} level on the topic: "${topic}".
Ask one short question to start. Keep responses under 3 sentences.`
            }
        ];

        sendConversationTurn();
    });

    $submitBtn.on('click', function() {
        const reply = $replyText.val().trim();
        if (!reply) return;

        history.push({ role: 'user', content: reply });
        $replyText.val('');
        $loader.css('display', 'flex');

        sendConversationTurn();
    });

    function sendConversationTurn() {
        $.ajax({
            url: ib2_data.rest_url + '/ai',
            method: 'POST',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('X-WP-Nonce', ib2_data.nonce);
            },
            data: {
                messages: history
            },
            success: function(response) {
                $loader.hide();
                if (response.success) {
                    $feed.show();
                    $bubble.text(response.content);
                    history.push({ role: 'assistant', content: response.content });
                }
            },
            error: function(err) {
                $loader.hide();
                $placeholder.show().html(`<span style="color:red;">Conversation error: ${err.responseJSON ? err.responseJSON.message : 'Error.'}</span>`);
            }
        });
    }
});
