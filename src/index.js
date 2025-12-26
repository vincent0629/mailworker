import PostalMime from 'postal-mime';

export default {
  async email(message, env, ctx) {
    const mail = await PostalMime.parse(message.raw);
    const form = new FormData();
    form.append('sender', mail.from.address);
    form.append('recipient', mail.to[0].address);
    form.append('subject', mail.subject);
    if (mail.text)
      form.append('body-plain', mail.text);
    else if (mail.html)
      form.append('body-plain', mail.html);
    if (mail.attachments) {
      for (const attachment of mail.attachments) {
        let content = attachment.content;
        if (attachment.encoding === 'base64')
          content = atob(attachment.content);
        form.append('attachments', new Blob([content], { type: attachment.mimeType }), attachment.filename);
      }
    }
    await fetch(env.WEBHOOK_URL, {
        method: 'POST',
        body: form
      })
      .then(res => res.json())
      .then(json => console.log(JSON.stringify(json)));
  }
}
