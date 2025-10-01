import axios from "axios";
import nodemailer from "nodemailer";
import validator from "validator";

export const send_email = async (req, res) => {
  const { email, subject, text } = req.body;
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
    logger: true,
  });
  try {
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({
        status: "error",
        message: "Email es requerido y debe ser válido",
      });
    }
    if (!subject || !text) {
      return res.status(400).json({
        status: "error",
        message: "Asunto y cuerpo del mensaje son requeridos",
      });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject,
      text: text,
    };
    const info = await transporter.sendMail(mailOptions);
    return res.status(200).json({
      status: "success",
      message: "Email enviado correctamente",
      details: process.env.NODE_ENV === "development" ? info : undefined,
    });
  } catch (error) {
    console.error("Error creating transporter:", error);
    return res.status(500).json({
      status: "error",
      message: "Error al crear el transportador de correo",
      details:
        process.env.NODE_ENV === "desarrollo" ? error.message : undefined,
    });
  }
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
