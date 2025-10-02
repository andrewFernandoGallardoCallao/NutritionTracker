import axios from "axios";

import validator from "validator";
import nodemailer from 'nodemailer';

export const send_email = async (email, code) => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timeout: Email service took too long'));
    }, 10000); // 10 segundos timeout

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      secure: true,
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Código de verificación - NutriTrack",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Verificación de cuenta</h2>
          <p>Tu código de verificación es:</p>
          <h1 style="font-size: 32px; color: #16a34a; text-align: center; letter-spacing: 5px;">
            ${code}
          </h1>
          <p>Este código expirará en 15 minutos.</p>
          <p>Si no solicitaste este código, ignora este mensaje.</p>
        </div>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      clearTimeout(timeout);
      
      if (error) {
        console.error('❌ Error enviando email:', error);
        reject(error);
      } else {
        console.log('✅ Email enviado:', info.response);
        resolve(info);
      }
    });
  });
};

export const send_whatsapp = async (req, res) => {
  const { recipient_number, message } = req.body;
  if (!recipient_number || !message) {
    return res.status(400).json({
      status: "error",
      message: "Número de destinatario y mensaje son requeridos",
    });
  }

  if (
    !validator.isMobilePhone(recipient_number, "any", { strictMode: false })
  ) {
    return res.status(400).json({
      status: "error",
      message: "Número de destinatario no es válido",
    });
  }

  try {
    const response = await axios({
      method: "POST",
      url: `https://graph.facebook.com/v22.0/${process.env.ID_WHATSAPP}/messages`,
      data: {
        messaging_product: "whatsapp",
        to: recipient_number,
        type: "text",
        text: { body: message },
      },
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    console.log("Mensaje enviado:", response.data);
    return res.status(200).json({
      status: "success",
      message: "Mensaje enviado correctamente",
      details:
        process.env.NODE_ENV === "development" ? response.data : undefined,
      data: response.data || [],
    });
  } catch (err) {
    console.error("Error al enviar mensaje:", err.response?.data || err);
    return res.status(500).json({
      status: "error",
      message: "Error al enviar mensaje de WhatsApp",
      details:
        process.env.NODE_ENV === "development"
          ? err.response?.data || err.message
          : undefined,
    });
  }
};
