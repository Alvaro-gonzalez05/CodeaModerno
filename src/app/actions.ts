'use server';

import nodemailer from 'nodemailer';

interface ProjectFormData {
  name: string;
  email: string;
  phone: string;
  projectType: string;
  budget: string;
  details: string;
  date: string;
  time: string;
}

export async function sendProjectEmail(data: ProjectFormData) {
  const transporter = nodemailer.createTransport({
    service: 'gmail', // You can change this to your preferred email service
    auth: {
      user: process.env.EMAIL_USER, // Add these to your .env file
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'desarrolloscodeade@gmail.com',
    subject: `Nueva Solicitud de Proyecto: ${data.name}`,
    html: `
      <h1>Nueva Solicitud de Proyecto</h1>
      <h2>Detalles del Cliente</h2>
      <p><strong>Nombre:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Teléfono:</strong> ${data.phone}</p>
      
      <h2>Detalles del Proyecto</h2>
      <p><strong>Tipo de Proyecto:</strong> ${data.projectType}</p>
      <p><strong>Presupuesto:</strong> ${data.budget}</p>
      <p><strong>Detalles:</strong> ${data.details}</p>
      
      <h2>Agenda de Llamada</h2>
      <p><strong>Fecha:</strong> ${data.date}</p>
      <p><strong>Hora:</strong> ${data.time}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}
