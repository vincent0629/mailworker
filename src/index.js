import PostalMime from 'postal-mime';

export default {
  async email(message, env, ctx) {
    const mail = await PostalMime.parse(message.raw);
    console.log(mail);
    const form = new FormData();
    form.append('from', mail.from.address);
    form.append('to', mail.to.address);
    form.append('subject', mail.subject);
    if (mail.text)
      form.append('text', mail.text);
    if (mail.html)
      form.append('html', mail.html);
    if (mail.attachments) {
      for (const attachment of mail.attachments) {
        let content = attachment.content;
        if (attachment.encoding === 'base64')
          content = atob(attachment.content);
        form.append('attachments', new Blob([content], { type: attachment.mimeType }), attachment.filename);
      }
    }
    fetch(env.WEBHOOK_URL, {
      method: 'POST',
      body: form
    });
  }
}
