// server.js
import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// JSON parsing
app.use(express.json());

// Serve static frontend files from "public" folder
app.use(express.static('public'));

// Create Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true', // false for TLS (587)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// New order notification
app.post('/api/new-order', async (req, res) => {
  try {
    const {
      id,
      createdAt,
      total,
      paymentMethod,
      upiName,
      upiTxnId,
      customer,
      items
    } = req.body;

    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;

    const itemsText = (items || [])
      .map(it => `${it.name} x ${it.qty} = ₹${it.qty * it.price}`)
      .join('\n');

    const textBody = `
New order from Neelam's Kitchen

Order ID: ${id}
Time: ${createdAt}

Customer:
  Name: ${customer?.name || ''}
  Phone: ${customer?.phone || ''}
  Address: ${customer?.address || ''}
  Notes: ${customer?.notes || ''}

Items:
${itemsText}

Total: ₹${total}

Payment Method: ${paymentMethod ? paymentMethod.toUpperCase() : ''}

${paymentMethod === 'upi' ? `UPI Name: ${upiName || ''}
UPI Transaction ID: ${upiTxnId || ''}` : 'COD (Cash on Delivery)'}
`.trim();

    await transporter.sendMail({
      from: `"Neelam's Kitchen" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `New Order - ${customer?.name || ''} - ₹${total}`,
      text: textBody
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('Error sending order email:', err);
    res.status(500).json({ ok: false, error: 'Failed to send email' });
  }
});

// New feedback notification
app.post('/api/new-feedback', async (req, res) => {
  try {
    const { id, rating, name, message, createdAt } = req.body || {};
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;

    const textBody = `
New feedback received for Neelam's Kitchen

ID: ${id}
Time: ${createdAt}
Rating: ${rating}/5
Name: ${name || 'Anonymous'}

Message:
${message}
`.trim();

    await transporter.sendMail({
      from: `"Neelam's Kitchen" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `New Feedback - ${rating}/5 from ${name || 'Anonymous'}`,
      text: textBody
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('Error sending feedback email:', err);
    res.status(500).json({ ok: false, error: 'Failed to send email' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Neelam's Kitchen server running at http://localhost:${PORT}`);
});
