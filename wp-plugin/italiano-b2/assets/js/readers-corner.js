jQuery(document).ready(function($) {
    if (!$('#ib2-reading-generate').length) return;

    const $btn = $('#ib2-reading-generate');
    const $placeholder = $('#ib2-reading-placeholder');
    const $body = $('#ib2-reading-body');
    const $loader = $('#ib2-reading-loader');

    $btn.on('click', function() {
        const level = $('#ib2-reading-level').val();
        const topic = $('#ib2-reading-topic').val().trim() || 'Generico';

        $loader.css('display', 'flex');
        $placeholder.hide();
        $body.hide();

        const messages = [
            {
                role: 'system',
                content: `Write a short story or article in Italian at a ${level} level on the topic: "${topic}".
Following the story, provide a short vocabulary list of 5 key words with English meanings.`
            },
            {
                role: 'user',
                content: `Scrivi una lettura in italiano.`
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
                    $body.show();
                    // Simple crude formatting
                    let formatted = response.content.replace(/\n/g, '<br>');
                    $body.html(formatted);
                }
            },
            error: function(err) {
                $loader.hide();
                $placeholder.show().html(`<span style="color:red;">Error: ${err.responseJSON ? err.responseJSON.message : 'Error generating story.'}</span>`);
            }
        });
    });
});
