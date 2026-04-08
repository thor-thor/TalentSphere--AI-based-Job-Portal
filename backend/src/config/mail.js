const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendApplicationConfirmation = async (userEmail, userName, jobTitle, companyName) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || process.env.SMTP_USER === 'your-email@gmail.com') {
      console.log('Email not configured. Would send:', { userEmail, userName, jobTitle, companyName });
      return true;
    }

    const mailOptions = {
      from: `"TalentSphere" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `Application Submitted - ${jobTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px;">
            <h1 style="color: white; margin: 0;">Application Submitted!</h1>
          </div>
          <div style="padding: 20px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333;">Hi ${userName},</p>
            <p style="font-size: 16px; color: #333;">Thank you for applying to the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
            <p style="font-size: 16px; color: #333;">Your application has been successfully submitted. The employer will review your profile and get back to you if you're shortlisted.</p>
            <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 5px; border-left: 4px solid #667eea;">
              <p style="margin: 0; color: #666; font-size: 14px;">You can track your application status in your dashboard.</p>
            </div>
            <p style="margin-top: 20px; color: #888; font-size: 14px;">Best regards,<br>The TalentSphere Team</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Application confirmation email sent to:', userEmail);
    return true;
  } catch (error) {
    console.error('Error sending email:', error.message);
    return false;
  }
};

const sendNewApplicationToEmployer = async (employerEmail, employerName, applicantName, jobTitle, companyName) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || process.env.SMTP_USER === 'your-email@gmail.com') {
      console.log('Email not configured. Would send:', { employerEmail, applicantName, jobTitle });
      return true;
    }

    const mailOptions = {
      from: `"TalentSphere" <${process.env.SMTP_USER}>`,
      to: employerEmail,
      subject: `New Application for ${jobTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px;">
            <h1 style="color: white; margin: 0;">New Application Received!</h1>
          </div>
          <div style="padding: 20px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333;">Hi ${employerName},</p>
            <p style="font-size: 16px; color: #333;">You have received a new application for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
            <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 5px; border-left: 4px solid #667eea;">
              <p style="margin: 0; color: #666; font-size: 14px;"><strong>Applicant:</strong> ${applicantName}</p>
            </div>
            <p style="margin-top: 20px; color: #888; font-size: 14px;">Log in to your employer dashboard to review the application.</p>
            <p style="margin-top: 20px; color: #888; font-size: 14px;">Best regards,<br>The TalentSphere Team</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('New application email sent to employer:', employerEmail);
    return true;
  } catch (error) {
    console.error('Error sending email:', error.message);
    return false;
  }
};

const sendJobPostedConfirmation = async (employerEmail, employerName, jobTitle, companyName) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || process.env.SMTP_USER === 'your-email@gmail.com') {
      console.log('Email not configured. Would send:', { employerEmail, jobTitle });
      return true;
    }

    const mailOptions = {
      from: `"TalentSphere" <${process.env.SMTP_USER}>`,
      to: employerEmail,
      subject: `Job Posted Successfully - ${jobTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px;">
            <h1 style="color: white; margin: 0;">Job Posted Successfully!</h1>
          </div>
          <div style="padding: 20px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333;">Hi ${employerName},</p>
            <p style="font-size: 16px; color: #333;">Your job posting for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been published successfully!</p>
            <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 5px; border-left: 4px solid #667eea;">
              <p style="margin: 0; color: #666; font-size: 14px;">You can now start receiving applications from job seekers. Check your dashboard to manage applications.</p>
            </div>
            <p style="margin-top: 20px; color: #888; font-size: 14px;">Best regards,<br>The TalentSphere Team</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Job posted confirmation email sent to:', employerEmail);
    return true;
  } catch (error) {
    console.error('Error sending email:', error.message);
    return false;
  }
};

module.exports = {
  sendApplicationConfirmation,
  sendNewApplicationToEmployer,
  sendJobPostedConfirmation,
};