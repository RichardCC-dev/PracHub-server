const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

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
    logger.info(`[EmailService] Cuenta Ethereal: ${testAccount.user}`);
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
    if (url) logger.info(`[EmailService] Vista previa: ${url}`);
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

const sendOfferApprovedNotification = async ({ to, offerTitle, offerId }) => {
  const transporter = await getTransporter();
  const appUrl = process.env.APP_URL || process.env.CLIENT_URL || 'http://localhost:5173';

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || '"PracHub" <noreply@prachub.pe>',
    to,
    subject: 'Tu oferta fue aprobada - PracHub',
    text: `Tu oferta "${offerTitle}" fue aprobada y ya está visible en el catálogo.`,
    html: emailBase(`
      <h2 style="color:#064E3B;margin-top:0;">¡Oferta aprobada!</h2>
      <p>Tu oferta <strong>"${offerTitle}"</strong> fue revisada y aprobada por nuestro equipo.</p>
      <p>La oferta ya está visible en el catálogo y los estudiantes pueden postular.</p>
      <a href="${appUrl}/company/offers/${offerId}" style="display:inline-block;background:#065f46;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:700;margin-top:8px;">
        Ver oferta
      </a>
    `),
  });

  logPreview(info);
  return info;
};

const sendOfferRejectedNotification = async ({ to, offerTitle, offerId, rejectionReason }) => {
  const transporter = await getTransporter();
  const appUrl = process.env.APP_URL || process.env.CLIENT_URL || 'http://localhost:5173';

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || '"PracHub" <noreply@prachub.pe>',
    to,
    subject: 'Tu oferta necesita ajustes - PracHub',
    text: `Tu oferta "${offerTitle}" no fue aprobada. Motivo: ${rejectionReason}`,
    html: emailBase(`
      <h2 style="color:#dc2626;margin-top:0;">Oferta no aprobada</h2>
      <p>Tu oferta <strong>"${offerTitle}"</strong> fue revisada pero no puede publicarse en este momento.</p>
      <div style="background:#fef2f2;border:1px solid #fecaca;padding:16px;border-radius:8px;margin:16px 0;">
        <p style="margin:0;color:#7f1d1d;font-weight:600;">Motivo:</p>
        <p style="margin:8px 0 0 0;color:#991b1b;">${rejectionReason}</p>
      </div>
      <p>Puedes editar la oferta y volver a enviarla para revisión.</p>
      <a href="${appUrl}/company/offers/${offerId}/edit" style="display:inline-block;background:#065f46;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:700;margin-top:8px;">
        Editar oferta
      </a>
    `),
  });

  logPreview(info);
  return info;
};

const sendCompanyPublishingEnabledNotification = async ({ to, companyName }) => {
  const transporter = await getTransporter();
  const appUrl = process.env.APP_URL || process.env.CLIENT_URL || 'http://localhost:5173';

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || '"PracHub" <noreply@prachub.pe>',
    to,
    subject: '¡Tu empresa ahora puede publicar ofertas! - PracHub',
    text: `Felicidades ${companyName}, tu empresa ha sido verificada y ahora puede publicar ofertas de prácticas en PracHub.`,
    html: emailBase(`
      <h2 style="color:#059669;margin-top:0;">¡Tu empresa está verificada!</h2>
      <p>Hola <strong>${companyName}</strong>,</p>
      <p>Nos complace informarte que tu empresa ha sido verificada y <strong>ahora puede publicar ofertas de prácticas profesionales</strong> en PracHub.</p>
      <div style="background:#ecfdf5;border:1px solid #a7f3d0;padding:16px;border-radius:8px;margin:16px 0;">
        <p style="margin:0;color:#065f46;font-weight:600;">¿Qué puedes hacer ahora?</p>
        <ul style="margin:8px 0 0 0;color:#047857;padding-left:20px;">
          <li>Crear y gestionar ofertas de prácticas</li>
          <li>Recibir postulaciones de estudiantes calificados</li>
          <li>Administrar el proceso de selección</li>
        </ul>
      </div>
      <a href="${appUrl}/company/offers" style="display:inline-block;background:#065f46;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:700;margin-top:8px;">
        Crear mi primera oferta
      </a>
    `),
  });

  logPreview(info);
  return info;
};

const sendAdminLoginAlert = async ({ email, ip, status, adminEmail }) => {
  const transporter = await getTransporter();
  const to = adminEmail || process.env.ADMIN_ALERT_EMAIL || email;

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || '"PracHub" <noreply@prachub.pe>',
    to,
    subject: `[PracHub Seguridad] Intento de acceso admin - ${status}`,
    text: `Se detectó un intento de inicio de sesión administrativo.\nEmail: ${email}\nIP: ${ip}\nEstado: ${status}\nFecha: ${new Date().toISOString()}`,
    html: emailBase(`
      <h2 style="color:${status === 'Éxito' ? '#059669' : '#dc2626'};margin-top:0;">Alerta de seguridad - Panel Admin</h2>
      <p>Se detectó un intento de inicio de sesión administrativo:</p>
      <div style="background:#f3f4f6;border:1px solid #e5e7eb;padding:16px;border-radius:8px;margin:16px 0;">
        <p style="margin:4px 0;"><strong>Email:</strong> ${email}</p>
        <p style="margin:4px 0;"><strong>IP:</strong> ${ip}</p>
        <p style="margin:4px 0;"><strong>Estado:</strong> <span style="color:${status === 'Éxito' ? '#059669' : '#dc2626'};font-weight:700;">${status}</span></p>
        <p style="margin:4px 0;"><strong>Fecha:</strong> ${new Date().toLocaleString('es-PE')}</p>
      </div>
      ${status === 'Éxito'
        ? '<p style="color:#059669;">El acceso fue exitoso.</p>'
        : '<p style="color:#dc2626;">Este intento fue bloqueado. Revisa la actividad si no reconoces este acceso.</p>'}
    `),
  });

  logPreview(info);
  return info;
};

const sendOfferMatchAlert = async ({
  to,
  firstName,
  offerTitle,
  companyName,
  isFromFollowedCompany,
  offerId,
}) => {
  const transporter = await getTransporter();
  const appUrl = process.env.APP_URL || process.env.CLIENT_URL || 'http://localhost:5173';

  const priorityBadge = isFromFollowedCompany
    ? `<div style="background:#fef3c7;border:1px solid #f59e0b;padding:8px 16px;border-radius:8px;display:inline-block;margin-bottom:16px;">
       <span style="color:#92400e;font-weight:600;">★ Empresa que sigues</span>
     </div>`
    : '';

  const subject = isFromFollowedCompany
    ? `¡${companyName} tiene una oferta para ti! - PracHub`
    : 'Nueva oferta compatible con tu perfil - PracHub';

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || '"PracHub" <noreply@prachub.pe>',
    to,
    subject,
    text: `Hola ${firstName}, encontramos una oferta compatible: "${offerTitle}" en ${companyName}. Ver en: ${appUrl}/offers/${offerId}`,
    html: emailBase(`
      ${priorityBadge}
      <h2 style="color:#064E3B;margin-top:0;">¡Hola ${firstName}!</h2>
      <p>Encontramos una oferta que coincide con tu perfil:</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:20px;border-radius:12px;margin:16px 0;">
        <p style="margin:0 0 8px 0;font-weight:600;color:#064E3B;font-size:18px;">${offerTitle}</p>
        <p style="margin:0 0 12px 0;color:#047857;">${companyName}</p>
      </div>
      <p style="color:#374151;">Esta oferta tiene un alto grado de coincidencia con tus habilidades y experiencia. ¡No dejes pasar esta oportunidad!</p>
      <a href="${appUrl}/offers/${offerId}" style="display:inline-block;background:#065f46;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:700;margin-top:8px;">
        Ver oferta y postular
      </a>
    `),
  });

  logPreview(info);
  return info;
};

const sendDailyDigest = async ({ to, firstName, offers }) => {
  const transporter = await getTransporter();
  const appUrl = process.env.APP_URL || process.env.CLIENT_URL || 'http://localhost:5173';

  const offersList = offers
    .map(
      (item) => `
    <div style="background:#f9fafb;border:1px solid #e5e7eb;padding:16px;border-radius:8px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
        <div>
          <p style="margin:0;font-weight:600;color:#111827;">${item.offer.title}</p>
          <p style="margin:4px 0 0 0;color:#6b7280;font-size:14px;">${item.offer.company?.legalName || 'Empresa'}</p>
        </div>
        ${item.isFromFollowedCompany ? '<span style="color:#f59e0b;font-size:18px;">★</span>' : ''}
      </div>
      <div style="display:flex;align-items:center;justify-content:flex-end;">
        <a href="${appUrl}/offers/${item.offer.id}" style="color:#065f46;text-decoration:none;font-weight:600;font-size:14px;">
          Ver oferta →
        </a>
      </div>
    </div>
  `
    )
    .join('');

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || '"PracHub" <noreply@prachub.pe>',
    to,
    subject: `Resumen diario: ${offers.length} ofertas compatibles - PracHub`,
    text: `Hola ${firstName}, hoy tenemos ${offers.length} ofertas compatibles con tu perfil. Revisalas en: ${appUrl}/offers`,
    html: emailBase(`
      <h2 style="color:#064E3B;margin-top:0;">Resumen diario de ofertas</h2>
      <p>Hola ${firstName},</p>
      <p>Hoy encontramos <strong>${offers.length} ofertas</strong> compatibles con tu perfil:</p>
      <div style="margin:20px 0;">
        ${offersList}
      </div>
      <a href="${appUrl}/offers" style="display:inline-block;background:#065f46;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:700;margin-top:8px;">
        Ver todas las ofertas
      </a>
    `),
  });

  logPreview(info);
  return info;
};

const sendWeeklyDigest = async ({ to, firstName, offers }) => {
  const transporter = await getTransporter();
  const appUrl = process.env.APP_URL || process.env.CLIENT_URL || 'http://localhost:5173';

  const followedOffers = offers.filter((o) => o.isFromFollowedCompany);
  const regularOffers = offers.filter((o) => !o.isFromFollowedCompany);

  const renderOfferList = (list) =>
    list
      .map(
        (item) => `
    <div style="background:#f9fafb;border:1px solid #e5e7eb;padding:16px;border-radius:8px;margin-bottom:12px;">
      <p style="margin:0 0 4px 0;font-weight:600;color:#111827;">${item.offer.title}</p>
      <p style="margin:0 0 8px 0;color:#6b7280;font-size:14px;">${item.offer.company?.legalName || 'Empresa'}</p>
      <div style="display:flex;align-items:center;justify-content:flex-end;">
        <a href="${appUrl}/offers/${item.offer.id}" style="color:#065f46;text-decoration:none;font-weight:600;font-size:14px;">
          Ver oferta →
        </a>
      </div>
    </div>
  `
      )
      .join('');

  let content = `
    <h2 style="color:#064E3B;margin-top:0;">Resumen semanal de ofertas</h2>
    <p>Hola ${firstName},</p>
    <p>Esta semana encontramos <strong>${offers.length} ofertas</strong> compatibles con tu perfil.</p>
  `;

  if (followedOffers.length > 0) {
    content += `
      <div style="margin:20px 0;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
          <span style="color:#f59e0b;font-size:20px;">★</span>
          <h3 style="margin:0;color:#92400e;font-size:16px;">De empresas que sigues (${followedOffers.length})</h3>
        </div>
        ${renderOfferList(followedOffers)}
      </div>
    `;
  }

  if (regularOffers.length > 0) {
    content += `
      <div style="margin:20px 0;">
        <h3 style="margin:0 0 12px 0;color:#374151;font-size:16px;">Otras ofertas recomendadas (${regularOffers.length})</h3>
        ${renderOfferList(regularOffers)}
      </div>
    `;
  }

  content += `
    <a href="${appUrl}/offers" style="display:inline-block;background:#065f46;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:700;margin-top:8px;">
      Explorar todas las ofertas
    </a>
  `;

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || '"PracHub" <noreply@prachub.pe>',
    to,
    subject: `Resumen semanal: ${offers.length} ofertas compatibles - PracHub`,
    text: `Hola ${firstName}, esta semana tenemos ${offers.length} ofertas compatibles con tu perfil. Revisalas en: ${appUrl}/offers`,
    html: emailBase(content),
  });

  logPreview(info);
  return info;
};

const sendApplicationStatusChanged = async ({ to, offerTitle, companyName, newStatus, message }) => {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || '"PracHub" <noreply@prachub.pe>',
    to,
    subject: `Actualización de postulación: ${offerTitle}`,
    html: emailBase(`
      <h2 style="margin-top:0;">Tu postulación ha cambiado de estado</h2>
      <p>Hola,</p>
      <p>La empresa <strong>${companyName}</strong> ha cambiado el estado de tu postulación para la oferta <strong>${offerTitle}</strong>.</p>
      <p>Nuevo estado: <strong>${newStatus}</strong></p>
      ${message ? `<p>Mensaje de la empresa: <em>"${message}"</em></p>` : ''}
      <p>Revisa tu tablero de postulaciones para más detalles.</p>
      <div style="margin-top:24px;">
        <a href="${process.env.FRONTEND_URL}/applications" style="background:#064E3B;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;display:inline-block;">Ver Postulaciones</a>
      </div>
    `),
  });
  logPreview(info);
};

const sendNewMessageReceived = async ({ to, senderName, messagePreview, conversationUrl }) => {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || '"PracHub" <noreply@prachub.pe>',
    to,
    subject: `Nuevo mensaje de ${senderName}`,
    html: emailBase(`
      <h2 style="margin-top:0;">Tienes un nuevo mensaje</h2>
      <p>Hola,</p>
      <p><strong>${senderName}</strong> te ha enviado un mensaje:</p>
      <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0;">
        <p style="margin:0;color:#374151;">"${messagePreview}..."</p>
      </div>
      <div style="margin-top:24px;">
        <a href="${conversationUrl}" style="background:#064E3B;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;display:inline-block;">Responder Mensaje</a>
      </div>
    `),
  });
  logPreview(info);
};

const sendNewOfferFromFollowedCompany = async ({ to, companyName, offerTitle, offerUrl }) => {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || '"PracHub" <noreply@prachub.pe>',
    to,
    subject: `${companyName} ha publicado una nueva oferta`,
    html: emailBase(`
      <h2 style="margin-top:0;">Nueva oferta de una empresa que sigues</h2>
      <p>Hola,</p>
      <p>La empresa <strong>${companyName}</strong> acaba de publicar una nueva oferta de prácticas: <strong>${offerTitle}</strong>.</p>
      <p>¡No pierdas la oportunidad de postular!</p>
      <div style="margin-top:24px;">
        <a href="${offerUrl}" style="background:#064E3B;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;display:inline-block;">Ver Oferta</a>
      </div>
    `),
  });
  logPreview(info);
};

const sendCVViewedByCompany = async ({ to, companyName }) => {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || '"PracHub" <noreply@prachub.pe>',
    to,
    subject: `${companyName} ha visto tu CV`,
    html: emailBase(`
      <h2 style="margin-top:0;">¡Tu perfil está llamando la atención!</h2>
      <p>Hola,</p>
      <p>La empresa <strong>${companyName}</strong> ha revisado tu currículum recientemente.</p>
      <p>Sigue mejorando tu perfil para aumentar tus oportunidades.</p>
      <div style="margin-top:24px;">
        <a href="${process.env.FRONTEND_URL}/profile" style="background:#064E3B;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;display:inline-block;">Ver Mi Perfil</a>
      </div>
    `),
  });
  logPreview(info);
};

module.exports = {
  sendEmailVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendCompanyEmailVerificationEmail,
  sendCompanyRegistrationConfirmationEmail,
  sendCompanyWelcomeEmail,
  sendOfferApprovedNotification,
  sendOfferRejectedNotification,
  sendCompanyPublishingEnabledNotification,
  sendAdminLoginAlert,
  sendOfferMatchAlert,
  sendDailyDigest,
  sendWeeklyDigest,
  sendApplicationStatusChanged,
  sendNewMessageReceived,
  sendNewOfferFromFollowedCompany,
  sendCVViewedByCompany,
};
