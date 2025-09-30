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

export async function sendAdminWelcomeMail({ to, nomEntreprise, emailAdmin, motDePasse }) {
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
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email admin:', error);
    throw new Error('Impossible d\'envoyer l\'email à l\'administrateur.');
  }
}
