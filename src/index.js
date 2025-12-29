import PostalMime from 'postal-mime';
import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage } from 'mimetext';

export default {
  async email(message, env, ctx) {
    const mail = await PostalMime.parse(message.raw);
    const form = new FormData();
    form.append('sender', mail.to[0].address);
    form.append('recipient', message.to);
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
        form.append('attachment', new Blob([content], { type: attachment.mimeType }), attachment.filename);
      }
    }
    await fetch(env.WEBHOOK_URL, {
        method: 'POST',
        body: form
      })
      .then(res => res.json())
      .then(json => console.log(JSON.stringify(json)));
  },

  async fetch(request, env, ctx) {
    const form = await request.formData();
    const from = form.get('from');
    const to = form.get('to');

    const msg = createMimeMessage();
    msg.setSender(from);
    msg.setRecipient(to);
    msg.setSubject(form.get('subject'));
    msg.addMessage({
      contentType: 'text/plain',
      data: form.get('text'),
    });
    const attachment = form.get('attachment');
    if (attachment) {
      msg.addAttachment({
        filename: attachment.name,
        contentType: attachment.type,
        data: btoa(await attachment.arrayBuffer()),
      });
    }

    try {
      await env.EMAIL.send(new EmailMessage(from, to, msg.asRaw()));
    } catch (e) {
      return new Response(e.message);
    }
    return new Response('Email sent successfully');
  },
}
