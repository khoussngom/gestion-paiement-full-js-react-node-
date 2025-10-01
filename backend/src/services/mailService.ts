import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendAdminWelcomeMail({ to, nomEntreprise, emailAdmin, motDePasse }: {
  to: string;
  nomEntreprise: string;
  emailAdmin: string;
  motDePasse: string;
}) {
  console.log('📧 [EMAIL SERVICE] Début envoi email admin welcome');
  console.log('📧 [EMAIL SERVICE] Destinataire:', to);
  console.log('📧 [EMAIL SERVICE] Entreprise:', nomEntreprise);
  console.log('📧 [EMAIL SERVICE] Configuration SMTP:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    from: process.env.SMTP_FROM
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || 'no-reply@gestion-paie.com',
    to,
    subject: `Bienvenue sur la plateforme - ${nomEntreprise}`,
    html: `
      <h2>Bienvenue sur la plateforme de gestion salariale !</h2>
      <p>Votre accès administrateur pour l'entreprise <b>${nomEntreprise}</b> a été créé.</p>
      <p><b>Login :</b> ${emailAdmin}<br/>
      <b>Mot de passe temporaire :</b> ${motDePasse}</p>
      <p>Veuillez changer votre mot de passe dès votre première connexion.</p>
      <hr/>
      <small>Cet email est généré automatiquement, merci de ne pas répondre.</small>
    `,
  };

  console.log('📧 [EMAIL SERVICE] Options email préparées:', {
    from: mailOptions.from,
    to: mailOptions.to,
    subject: mailOptions.subject
  });

  try {
    console.log('📧 [EMAIL SERVICE] Tentative d\'envoi...');
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ [EMAIL SERVICE] Email envoyé avec succès!');
    console.log('📧 [EMAIL SERVICE] Résultat:', result);
    return result;
  } catch (error) {
    console.error('❌ [EMAIL SERVICE] Erreur lors de l\'envoi de l\'email admin:', error);
    throw new Error('Impossible d\'envoyer l\'email à l\'administrateur.');
  }
}
