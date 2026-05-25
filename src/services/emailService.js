const nodemailer = require('nodemailer');

let cachedTransporter = null;

const getTransporter = async () => {
  if (cachedTransporter) return cachedTransporter;

  if (process.env.NODE_ENV !== 'production') {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log(`[EmailService] Cuenta Ethereal: ${testAccount.user}`);
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return cachedTransporter;
};

const logPreview = (info) => {
  if (process.env.NODE_ENV !== 'production') {
    const url = nodemailer.getTestMessageUrl(info);
    if (url) console.log(`[EmailService] Vista previa: ${url}`);
  }
};

const emailBase = (content) => `
  <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6;max-width:600px;margin:auto;">
    <div style="background:#064E3B;padding:20px 32px;border-radius:16px 16px 0 0;">
      <span style="color:#fff;font-size:20px;font-weight:900;letter-spacing:-0.5px;">PracHub</span>
    </div>
    <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;">
      ${content}
      <p style="color:#9ca3af;font-size:12px;margin-top:24px;">Este correo fue enviado automáticamente por PracHub. Por favor no respondas a este mensaje.</p>
    </div>
  </div>`;

const sendEmailVerificationEmail = async ({ email, verifyUrl, firstName }) => {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || '"PracHub" <noreply@prachub.pe>',
    to: email,
    subject: 'Verifica tu correo en PracHub',
    text: `Hola ${firstName}, verifica tu correo en PracHub: ${verifyUrl}`,
    html: emailBase(`
      <h2 style="color:#064E3B;margin-top:0;">Verifica tu correo electrónico</h2>
      <p>Hola ${firstName},</p>
      <p>Gracias por registrarte en PracHub. Para activar tu cuenta, haz clic en el siguiente enlace:</p>
      <a href="${verifyUrl}" style="display:inline-block;background:#065f46;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:700;margin-top:8px;">
        Verificar correo
      </a>
      <p style="margin-top:16px;color:#6b7280;font-size:13px;">Este enlace expirará en 30 minutos. Si no solicitaste este registro, puedes ignorar este correo.</p>
    `),
  });

  logPreview(info);
  return info;
};

const sendWelcomeEmail = async ({ email, firstName }) => {
  const transporter = await getTransporter();
  const appUrl = process.env.APP_URL || process.env.CLIENT_URL || 'http://localhost:5173';

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || '"PracHub" <noreply@prachub.pe>',
    to: email,
    subject: '¡Bienvenido a PracHub, ' + firstName + '!',
    text: `¡Hola ${firstName}! Tu cuenta en PracHub fue creada. Ingresa en: ${appUrl}`,
    html: emailBase(`
      <h2 style="color:#064E3B;margin-top:0;">¡Bienvenido, ${firstName}!</h2>
      <p>Tu cuenta en PracHub fue creada exitosamente. Ya puedes ingresar y completar tu perfil profesional.</p>
      <a href="${appUrl}" style="display:inline-block;background:#065f46;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:700;margin-top:8px;">
        Ir a PracHub
      </a>
    `),
  });

  logPreview(info);
  return info;
};

const sendPasswordResetEmail = async ({ email, resetUrl }) => {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || '"PracHub" <noreply@prachub.pe>',
    to: email,
    subject: 'Recuperación de contraseña - PracHub',
    text: `Solicitaste restablecer tu contraseña. Enlace válido 30 min: ${resetUrl}`,
    html: emailBase(`
      <h2 style="color:#064E3B;margin-top:0;">Recuperación de contraseña</h2>
      <p>Solicitaste restablecer tu contraseña en PracHub.</p>
      <p>Este enlace es <strong>válido por 30 minutos</strong> y solo puede usarse una vez.</p>
      <a href="${resetUrl}" style="display:inline-block;background:#065f46;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:700;margin-top:8px;">
        Restablecer contraseña
      </a>
      <p style="margin-top:16px;color:#6b7280;font-size:13px;">Si no solicitaste este cambio, ignora este correo.</p>
    `),
  });

  logPreview(info);
  return info;
};

module.exports = {
  sendEmailVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
};
