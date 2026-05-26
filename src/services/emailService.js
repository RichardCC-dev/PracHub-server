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

const sendCompanyEmailVerificationEmail = async ({ email, verifyUrl, companyName }) => {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || '"PracHub" <noreply@prachub.pe>',
    to: email,
    subject: 'Verifica el correo de tu empresa en PracHub',
    text: `Verifica el correo de ${companyName} en PracHub: ${verifyUrl}`,
    html: emailBase(`
      <h2 style="color:#064E3B;margin-top:0;">Verificación de correo empresarial</h2>
      <p>Hola,</p>
      <p>Gracias por registrar <strong>${companyName}</strong> en PracHub. Para activar la cuenta de tu empresa, haz clic en el siguiente enlace:</p>
      <a href="${verifyUrl}" style="display:inline-block;background:#065f46;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:700;margin-top:8px;">
        Verificar correo
      </a>
      <p style="margin-top:16px;color:#6b7280;font-size:13px;">Este enlace expirará en 30 minutos. Si no solicitaste este registro, puedes ignorar este correo.</p>
    `),
  });

  logPreview(info);
  return info;
};

const sendCompanyRegistrationConfirmationEmail = async ({ email, companyName, responsibleName }) => {
  const transporter = await getTransporter();
  const appUrl = process.env.APP_URL || process.env.CLIENT_URL || 'http://localhost:5173';

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || '"PracHub" <noreply@prachub.pe>',
    to: email,
    subject: `${companyName} - Registro recibido en PracHub`,
    text: `Hola ${responsibleName}, hemos recibido el registro de ${companyName}. Verifica tu correo para continuar.`,
    html: emailBase(`
      <h2 style="color:#064E3B;margin-top:0;">Registro de empresa recibido</h2>
      <p>Hola ${responsibleName},</p>
      <p>Hemos recibido el registro de <strong>${companyName}</strong> en PracHub.</p>
      <p><strong>Próximos pasos:</strong></p>
      <ul style="color:#374151;">
        <li>Verifica tu correo electrónico mediante el enlace que enviamos</li>
        <li>Nuestro equipo revisará la documentación legal de tu empresa (RUC)</li>
        <li>Recibirás una confirmación en menos de 24 horas hábiles</li>
        <li>Una vez verificada, podrás publicar ofertas de prácticas</li>
      </ul>
      <p style="margin-top:16px;color:#6b7280;font-size:13px;">Mientras tanto, puedes ingresar y preparar borradores de ofertas que se publicarán automáticamente tras la verificación.</p>
      <a href="${appUrl}" style="display:inline-block;background:#065f46;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:700;margin-top:8px;">
        Ir a PracHub
      </a>
    `),
  });

  logPreview(info);
  return info;
};

const sendCompanyWelcomeEmail = async ({ email, companyName, responsibleName }) => {
  const transporter = await getTransporter();
  const appUrl = process.env.APP_URL || process.env.CLIENT_URL || 'http://localhost:5173';

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || '"PracHub" <noreply@prachub.pe>',
    to: email,
    subject: `¡Bienvenido a PracHub, ${companyName}!`,
    text: `Hola ${responsibleName}, el correo de ${companyName} fue verificado. Espera la verificación legal para publicar ofertas.`,
    html: emailBase(`
      <h2 style="color:#064E3B;margin-top:0;">¡Correo verificado!</h2>
      <p>Hola ${responsibleName},</p>
      <p>El correo de <strong>${companyName}</strong> fue verificado correctamente.</p>
      <p><strong>Estado actual:</strong> Pendiente de verificación legal</p>
      <p>Mientras nuestro equipo valida la información de tu empresa (RUC), puedes:</p>
      <ul style="color:#374151;">
        <li>Completar el perfil de tu empresa</li>
        <li>Preparar borradores de ofertas de prácticas</li>
        <li>Explorar candidatos potenciales</li>
      </ul>
      <p style="margin-top:16px;color:#6b7280;font-size:13px;">Te notificaremos por correo cuando la verificación legal esté completa (máximo 24 horas hábiles).</p>
      <a href="${appUrl}" style="display:inline-block;background:#065f46;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:700;margin-top:8px;">
        Ir al panel de empresa
      </a>
    `),
  });

  logPreview(info);
  return info;
};

module.exports = {
  sendEmailVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendCompanyEmailVerificationEmail,
  sendCompanyRegistrationConfirmationEmail,
  sendCompanyWelcomeEmail,
};
