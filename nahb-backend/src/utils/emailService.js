const { Resend } = require("resend");
const logger = require("./logger");

// Configuration de Resend
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || "onboarding@resend.dev";

/**
 * Envoyer un email de réinitialisation de mot de passe
 * @param {string} to - Email du destinataire
 * @param {string} resetToken - Token de réinitialisation
 * @param {string} pseudo - Pseudo de l'utilisateur
 */
const sendPasswordResetEmail = async (to, resetToken, pseudo) => {
  const resetUrl = `${process.env.CORS_ORIGIN}/reset-password?token=${resetToken}`;

  try {
    await resend.emails.send({
      from: `NAHB <${FROM_EMAIL}>`,
      to,
      subject: "Réinitialise ton mot de passe",
      html: `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation de mot de passe</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 60px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff;">
                
                <!-- Header -->
                <tr>
                  <td style="padding: 48px 40px 32px 40px; text-align: center;">
                    <h1 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 24px; font-weight: 600; letter-spacing: -0.3px;">
                      Réinitialisation du mot de passe
                    </h1>
                    <p style="margin: 0; color: #6b7280; font-size: 15px;">
                      NAHB
                    </p>
                  </td>
                </tr>
                
                <!-- Contenu -->
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 16px 0; color: #374151; font-size: 15px; line-height: 1.6;">
                      Bonjour <strong>${pseudo}</strong>,
                    </p>
                    
                    <p style="margin: 0 0 32px 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                      Nous avons reçu une demande de réinitialisation de mot de passe pour ton compte. Clique sur le bouton ci-dessous pour créer un nouveau mot de passe.
                    </p>
                    
                    <!-- Bouton -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 32px 0;">
                      <tr>
                        <td align="center">
                          <a href="${resetUrl}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 500; font-size: 15px;">
                            Réinitialiser mon mot de passe
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Info expiration -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0; background-color: #fef3c7; border-radius: 8px; padding: 16px;">
                      <tr>
                        <td>
                          <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                            Ce lien expire dans 1 heure pour des raisons de sécurité.
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Lien alternatif -->
                    <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 13px;">
                      Ou copie ce lien :
                    </p>
                    <div style="background-color: #f3f4f6; border-radius: 6px; padding: 12px; word-break: break-all;">
                      <p style="margin: 0; font-size: 12px; color: #6b7280; font-family: 'Courier New', monospace;">
                        ${resetUrl}
                      </p>
                    </div>
                    
                    <!-- Sécurité -->
                    <p style="margin: 32px 0 0 0; color: #9ca3af; font-size: 13px; line-height: 1.5;">
                      Si tu n'as pas demandé cette réinitialisation, tu peux ignorer cet email en toute sécurité.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 32px 40px; text-align: center; border-top: 1px solid #f3f4f6;">
                    <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 13px;">
                      Des histoires interactives sans pub ✨
                    </p>
                    <p style="margin: 0; color: #d1d5db; font-size: 12px;">
                      © 2025 NAHB
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `,
    });
    
    logger.info(`Email de réinitialisation envoyé à ${to}`);
    return true;
  } catch (error) {
    logger.error(`Erreur envoi email à ${to}: ${error.message}`);
    throw error;
  }
};

/**
 * Envoie un email de bienvenue à un nouvel utilisateur
 * @param {string} to - Adresse email du destinataire
 * @param {string} pseudo - Pseudo de l'utilisateur
 */
const sendWelcomeEmail = async (to, pseudo) => {
  try {
    await resend.emails.send({
      from: `NAHB <${FROM_EMAIL}>`,
      to,
      subject: "Bienvenue sur NAHB",
      html: `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue sur NAHB</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 60px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff;">
                
                <!-- Header -->
                <tr>
                  <td style="padding: 48px 40px 32px 40px; text-align: center;">
                    <h1 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 24px; font-weight: 600; letter-spacing: -0.3px;">
                      Bienvenue sur NAHB
                    </h1>
                    <p style="margin: 0; color: #6b7280; font-size: 15px;">
                      Merci de ta confiance
                    </p>
                  </td>
                </tr>
                
                <!-- Contenu -->
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 16px 0; color: #374151; font-size: 15px; line-height: 1.6;">
                      Bonjour <strong>${pseudo}</strong>,
                    </p>
                    
                    <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                      Nous sommes ravis de t'accueillir dans la communauté NAHB. Tu fais maintenant partie d'une plateforme où les histoires prennent vie et où l'imagination n'a pas de limites.
                    </p>
                    
                    <!-- Suggestions -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 32px 0; background-color: #f9fafb; border-radius: 8px; padding: 24px;">
                      <tr>
                        <td>
                          <p style="margin: 0 0 12px 0; color: #374151; font-size: 14px; font-weight: 500;">
                            Pour commencer :
                          </p>
                          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                            • <a href="${
                              process.env.FRONTEND_URL ||
                              "http://localhost:5173"
                            }" style="color: #1a1a1a; text-decoration: none;">Explore les histoires de la communauté</a>
                          </p>
                          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                            • <a href="${
                              process.env.FRONTEND_URL ||
                              "http://localhost:5173"
                            }/create" style="color: #1a1a1a; text-decoration: none;">Crée ta première histoire interactive</a>
                          </p>
                          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                            • <a href="${
                              process.env.FRONTEND_URL ||
                              "http://localhost:5173"
                            }/profile" style="color: #1a1a1a; text-decoration: none;">Personnalise ton profil</a>
                          </p>
                          <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                            • Partage tes créations
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Bouton -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
                      <tr>
                        <td align="center">
                          <a href="${
                            process.env.FRONTEND_URL || "http://localhost:5173"
                          }" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 500; font-size: 15px;">
                            Commencer
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 0; color: #9ca3af; font-size: 14px; line-height: 1.5;">
                      Profite bien de l'expérience.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 32px 40px; text-align: center; border-top: 1px solid #f3f4f6;">
                    <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 13px;">
                      Des histoires interactives sans pub ✨
                    </p>
                    <p style="margin: 0; color: #d1d5db; font-size: 12px;">
                      © 2025 NAHB
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `,
    });
    
    logger.info(`Email de bienvenue envoyé à ${to}`);
    return true;
  } catch (error) {
    logger.error(`Erreur envoi email de bienvenue à ${to}: ${error.message}`);
    // On ne throw pas l'erreur pour ne pas bloquer l'inscription
    return false;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail,
};
