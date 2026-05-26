// /api/contact.js
// Vercel serverless function that receives the contact form and sends
// an email via Resend. Honeypot + basic validation included.

export default async function handler(req, res) {
  // CORS / method guard
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { name, email, message, company } = body;

    // Honeypot — if a bot filled this field, silently succeed
    if (company && company.length > 0) {
      return res.status(200).json({ ok: true });
    }

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
      return res.status(400).json({ error: 'Invalid field types.' });
    }
    if (name.length > 200 || email.length > 200 || message.length > 5000) {
      return res.status(400).json({ error: 'Field too long.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    // TO_EMAIL can be a single address or a comma-separated list
    // e.g. "mads@conviviumco.com,admin@conviviumco.com"
    const TO_EMAIL_RAW = process.env.TO_EMAIL || 'mads@conviviumco.com,admin@conviviumco.com';
    const TO_EMAIL = TO_EMAIL_RAW.split(',').map(e => e.trim()).filter(Boolean);
    const FROM_EMAIL = process.env.FROM_EMAIL || 'website@conviviumco.com';

    if (!RESEND_API_KEY) {
      console.error('Missing RESEND_API_KEY env variable');
      return res.status(500).json({ error: 'Server is not configured to send mail.' });
    }

    // Simple HTML escape
    const esc = (s) => String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const subject = `New inquiry from ${name} — Convivium Co.`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1C1410; max-width: 560px;">
        <h2 style="font-family: Georgia, serif; color: #6B2737; border-bottom: 1px solid #eee; padding-bottom: 8px;">New inquiry from the Convivium site</h2>
        <p><strong>Name:</strong> ${esc(name)}</p>
        <p><strong>Email:</strong> <a href="mailto:${esc(email)}">${esc(email)}</a></p>
        <p><strong>Message:</strong></p>
        <div style="white-space: pre-wrap; padding: 16px; background: #F5EFE6; border-left: 3px solid #6B2737; border-radius: 4px;">${esc(message)}</div>
      </div>
    `;

    const text = `New inquiry from the Convivium site\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n`;

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Convivium Site <${FROM_EMAIL}>`,
        to: TO_EMAIL,
        reply_to: email,
        subject,
        html,
        text,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error('Resend error:', resp.status, err);
      return res.status(502).json({ error: 'Could not send email. Please try again.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Contact handler error:', err);
    return res.status(500).json({ error: 'Unexpected error.' });
  }
}
