import nodemailer from "nodemailer";
import validator from "validator";

export const sendVerificationEmail = async (email, verificationCode) => {
  try {
    if (!email || !validator.isEmail(email)) {
      throw new Error("Email es requerido y debe ser válido");
    }

    // Configurar transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: process.env.EMAIL_PORT || 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
      secure: true,
    });

    // Configurar opciones del email
    const mailOptions = {
      from: `"NutriTrack" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔐 Código de Verificación - NutriTrack",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #065f46, #047857); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">NutriTrack</h1>
            <p style="color: #d1fae5; margin: 10px 0 0 0;">Tu compañero de nutrición</p>
          </div>
          <div style="padding: 30px; background: white; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <h2 style="color: #065f46; margin-top: 0;">Verifica tu cuenta</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              Hola, hemos recibido una solicitud para crear una cuenta en NutriTrack. 
              Utiliza el siguiente código para completar tu registro:
            </p>
            <div style="background: #f0fdf4; border: 2px dashed #10b981; padding: 20px; text-align: center; margin: 25px 0; border-radius: 8px;">
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #065f46;">
                ${verificationCode}
              </div>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              ⏰ Este código expirará en 15 minutos.<br>
              🔒 No compartas este código con nadie.
            </p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px;">
                Si no solicitaste este código, puedes ignorar este mensaje.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    // Enviar email
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`Código de verificación enviado a: ${email}`);

    return {
      status: "success",
      message: "Código de verificación enviado a tu email",
      email: email,
    };

  } catch (error) {
    console.error("Error enviando email de verificación:", error);
    throw new Error("Error al enviar el código de verificación");
  }
};