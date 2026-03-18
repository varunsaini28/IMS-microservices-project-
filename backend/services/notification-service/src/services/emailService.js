import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { EmailLog } from '../models/EmailLog.js';

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: true, // true for 465
  auth: {
    user: env.smtp.user,
    pass: env.smtp.pass
  }
});

export const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: env.smtp.from,
      to,
      subject,
      html
    });
    console.log('Email sent:', info.messageId);
    await EmailLog.create({ to, subject, body: html, status: 'sent' });
    return info;
  } catch (error) {
    console.error('Email send error:', error);
    await EmailLog.create({ to, subject, body: html, status: 'failed', error: error.message });
    throw error;
  }
};
