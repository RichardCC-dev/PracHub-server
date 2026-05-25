const nodemailer = require('nodemailer');

const createTransporter = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendPasswordResetEmail = async ({ email, resetUrl }) => {
  const transporter = createTransporter();

  return transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Recuperación de contraseña - PracHub',
    text: `Solicitaste restablecer tu contraseña en PracHub. Usa este enlace válido por 30 minutos: ${resetUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h2 style="color: #065f46;">Recuperación de contraseña</h2>
        <p>Solicitaste restablecer tu contraseña en PracHub.</p>
        <p>Este enlace es válido por 30 minutos y solo puede usarse una vez.</p>
        <p>
          <a href="${resetUrl}" style="display: inline-block; background: #065f46; color: #ffffff; padding: 12px 18px; border-radius: 12px; text-decoration: none; font-weight: 700;">
            Restablecer contraseña
          </a>
        </p>
        <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
      </div>
    `,
  });
};

module.exports = {
  sendPasswordResetEmail,
};
