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
    console.log(`[EMAIL] Attempting to send application confirmation to: ${userEmail}`);
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || process.env.SMTP_USER === 'your-email@gmail.com') {
      console.log('[EMAIL] Email not configured. Would send confirmation to seeker:', { userEmail, userName, jobTitle, companyName });
      return false;
    }

    const applicationDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const mailOptions = {
      from: `"TalentSphere" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `Application Submitted - ${jobTitle}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Success!</h1>
            <p style="color: rgba(255,255,255,0.9); margin-top: 10px; font-size: 16px;">Your application has been received.</p>
          </div>
          <div style="padding: 30px; line-height: 1.6;">
            <p style="font-size: 18px; color: #1f2937; margin-bottom: 20px;">Hi ${userName},</p>
            <p style="font-size: 16px; color: #4b5563;">Thank you for your interest in the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.</p>
            
            <div style="margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px; border-left: 5px solid #4f46e5;">
              <p style="margin: 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Application Details</p>
              <p style="margin: 10px 0 0 0; font-size: 16px; color: #1f2937;"><strong>Position:</strong> ${jobTitle}</p>
              <p style="margin: 5px 0 0 0; font-size: 16px; color: #1f2937;"><strong>Company:</strong> ${companyName}</p>
              <p style="margin: 5px 0 0 0; font-size: 16px; color: #1f2937;"><strong>Date:</strong> ${applicationDate}</p>
            </div>

            <p style="font-size: 16px; color: #4b5563;">What happens next? The recruitment team will review your application. If your profile matches their requirements, they will contact you directly for the next steps.</p>
            
            <div style="text-align: center; margin-top: 40px;">
              <a href="${process.env.FRONTEND_URL}/applications" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Track Application Status</a>
            </div>

            <p style="margin-top: 40px; color: #9ca3af; font-size: 14px; border-top: 1px solid #e5e7eb; pt-20px;">
              Best regards,<br>
              <strong>The TalentSphere Team</strong>
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Application confirmation email sent to:', userEmail);
    return true;
  } catch (error) {
    console.error('Error sending confirmation email:', error.message);
    return false;
  }
};

const sendNewApplicationToEmployer = async (employerEmail, employerName, applicantName, applicantEmail, jobTitle, companyName, applicationId) => {
  try {
    console.log(`[EMAIL] Attempting to send new application notification to employer: ${employerEmail}`);
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || process.env.SMTP_USER === 'your-email@gmail.com') {
      console.log('[EMAIL] Email not configured. Would send notification to employer:', { employerEmail, applicantName, jobTitle });
      return false;
    }

    const applicationUrl = `${process.env.FRONTEND_URL}/applications`;

    const mailOptions = {
      from: `"TalentSphere" <${process.env.SMTP_USER}>`,
      to: employerEmail,
      subject: `New Candidate - ${applicantName} Applied for ${jobTitle}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">New Application!</h1>
            <p style="color: rgba(255,255,255,0.9); margin-top: 10px; font-size: 16px;">A new candidate has applied for your job posting.</p>
          </div>
          <div style="padding: 30px; line-height: 1.6;">
            <p style="font-size: 18px; color: #1f2937; margin-bottom: 20px;">Hi ${employerName},</p>
            <p style="font-size: 16px; color: #4b5563;">You have a new applicant for the position of <strong>${jobTitle}</strong>.</p>
            
            <div style="margin: 30px 0; padding: 20px; background-color: #ecfdf5; border-radius: 8px; border-left: 5px solid #10b981;">
              <p style="margin: 0; font-size: 14px; color: #059669; text-transform: uppercase; letter-spacing: 0.05em;">Candidate Profile</p>
              <p style="margin: 10px 0 0 0; font-size: 16px; color: #1f2937;"><strong>Name:</strong> ${applicantName}</p>
              <p style="margin: 5px 0 0 0; font-size: 16px; color: #1f2937;"><strong>Email:</strong> ${applicantEmail}</p>
              <p style="margin: 5px 0 0 0; font-size: 16px; color: #1f2937;"><strong>Job:</strong> ${jobTitle}</p>
            </div>

            <p style="font-size: 16px; color: #4b5563;">Log in to your dashboard to review their resume and manage the application process.</p>
            
            <div style="text-align: center; margin-top: 40px;">
              <a href="${applicationUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Review Application</a>
            </div>

            <p style="margin-top: 40px; color: #9ca3af; font-size: 14px; border-top: 1px solid #e5e7eb; pt-20px;">
              Best regards,<br>
              <strong>The TalentSphere Team</strong>
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('New application email sent to employer:', employerEmail);
    return true;
  } catch (error) {
    console.error('Error sending employer notification email:', error.message);
    return false;
  }
};

const sendJobPostedConfirmation = async (employerEmail, employerName, jobTitle, companyName) => {
  try {
    console.log(`[EMAIL] Attempting to send job posted confirmation to: ${employerEmail}`);
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || process.env.SMTP_USER === 'your-email@gmail.com') {
      console.log('[EMAIL] Email not configured. Would send job posting confirmation:', { employerEmail, jobTitle });
      return false;
    }

    const mailOptions = {
      from: `"TalentSphere" <${process.env.SMTP_USER}>`,
      to: employerEmail,
      subject: `Job Posted Successfully - ${jobTitle}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Live Now!</h1>
            <p style="color: rgba(255,255,255,0.9); margin-top: 10px; font-size: 16px;">Your job posting has been published.</p>
          </div>
          <div style="padding: 30px; line-height: 1.6;">
            <p style="font-size: 18px; color: #1f2937; margin-bottom: 20px;">Hi ${employerName},</p>
            <p style="font-size: 16px; color: #4b5563;">Your job posting for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been published successfully!</p>
            
            <div style="margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px; border-left: 5px solid #4f46e5;">
              <p style="margin: 0; color: #666; font-size: 14px;">You can now start receiving applications from job seekers. Candidates matching your requirements will be notified shortly.</p>
            </div>

            <div style="text-align: center; margin-top: 40px;">
              <a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Manage Postings</a>
            </div>

            <p style="margin-top: 40px; color: #9ca3af; font-size: 14px; border-top: 1px solid #e5e7eb; pt-20px;">
              Best regards,<br>
              <strong>The TalentSphere Team</strong>
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Job posted confirmation email sent to:', employerEmail);
    return true;
  } catch (error) {
    console.error('Error sending job posted email:', error.message);
    return false;
  }
};

const sendStatusUpdateEmail = async (userEmail, userName, jobTitle, companyName, status, note) => {
  try {
    console.log(`[EMAIL] Attempting to send status update to: ${userEmail}`);
    console.log(`[EMAIL] SMTP_USER configured: ${!!process.env.SMTP_USER}, value: ${process.env.SMTP_USER}`);
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || process.env.SMTP_USER === 'your-email@gmail.com') {
      console.log('[EMAIL] Email not configured. Would send status update to seeker:', { userEmail, userName, status });
      return false;
    }

    const statusLabels = {
      viewed: 'Viewed',
      shortlisted: 'Shortlisted',
      rejected: 'Rejected',
      interview_scheduled: 'Interview Scheduled',
      offer_extended: 'Offer Extended',
      hired: 'Hired'
    };

    const statusColors = {
      viewed: '#3b82f6',
      shortlisted: '#8b5cf6',
      rejected: '#ef4444',
      interview_scheduled: '#f59e0b',
      offer_extended: '#10b981',
      hired: '#059669'
    };

    const statusLabel = statusLabels[status] || status;
    const statusColor = statusColors[status] || '#6b7280';

    const mailOptions = {
      from: `"TalentSphere" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `Application Status Update - ${jobTitle}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, ${statusColor} 0%, ${statusColor}99 100%); padding: 40px 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Status Update!</h1>
            <p style="color: rgba(255,255,255,0.9); margin-top: 10px; font-size: 16px;">Your application status has been updated.</p>
          </div>
          <div style="padding: 30px; line-height: 1.6;">
            <p style="font-size: 18px; color: #1f2937; margin-bottom: 20px;">Hi ${userName},</p>
            <p style="font-size: 16px; color: #4b5563;">Your application for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been updated.</p>
            
            <div style="margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px; border-left: 5px solid ${statusColor};">
              <p style="margin: 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Current Status</p>
              <p style="margin: 10px 0 0 0; font-size: 24px; color: ${statusColor}; font-weight: 700;">${statusLabel}</p>
              ${note ? `<p style="margin: 15px 0 0 0; font-size: 14px; color: #4b5563;"><strong>Note:</strong> ${note}</p>` : ''}
            </div>

            <p style="font-size: 16px; color: #4b5563;">${getStatusMessage(status)}</p>
            
            <div style="text-align: center; margin-top: 40px;">
              <a href="${process.env.FRONTEND_URL}/applications" style="background-color: ${statusColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">View Application Details</a>
            </div>

            <p style="margin-top: 40px; color: #9ca3af; font-size: 14px; border-top: 1px solid #e5e7eb; pt-20px;">
              Best regards,<br>
              <strong>The TalentSphere Team</strong>
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Status update email sent to:', userEmail);
    return true;
  } catch (error) {
    console.error('Error sending status update email:', error.message);
    return false;
  }
};

const getStatusMessage = (status) => {
  const messages = {
    viewed: 'The employer has reviewed your application. Please wait for further updates.',
    shortlisted: 'Congratulations! You have been shortlisted. The employer may contact you soon.',
    rejected: 'We regret to inform you that your application was not selected this time. Keep applying!',
    interview_scheduled: 'Great news! An interview has been scheduled. Check your application details for more information.',
    offer_extended: 'Congratulations! An offer has been extended to you. Please respond at the earliest.',
    hired: 'Congratulations on your new job! We wish you all the best in your new role.'
  };
  return messages[status] || 'Your application status has been updated.';
};

const sendApplicationCancelled = async (employerEmail, employerName, applicantName, jobTitle, companyName) => {
  try {
    console.log(`[EMAIL] Attempting to send application cancelled notification to: ${employerEmail}`);
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || process.env.SMTP_USER === 'your-email@gmail.com') {
      console.log('[EMAIL] Email not configured. Would send cancellation to employer:', { employerEmail, applicantName, jobTitle });
      return false;
    }

    const mailOptions = {
      from: `"TalentSphere" <${process.env.SMTP_USER}>`,
      to: employerEmail,
      subject: `Application Withdrawn - ${applicantName} withdrew application for ${jobTitle}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Application Withdrawn</h1>
            <p style="color: rgba(255,255,255,0.9); margin-top: 10px; font-size: 16px;">A candidate has withdrawn their application.</p>
          </div>
          <div style="padding: 30px; line-height: 1.6;">
            <p style="font-size: 18px; color: #1f2937; margin-bottom: 20px;">Hi ${employerName},</p>
            <p style="font-size: 16px; color: #4b5563;"><strong>${applicantName}</strong> has withdrawn their application for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
            
            <div style="margin: 30px 0; padding: 20px; background-color: #fef2f2; border-radius: 8px; border-left: 5px solid #ef4444;">
              <p style="margin: 0; font-size: 14px; color: #991b1b;">The candidate has decided to withdraw their application. You may continue reviewing other candidates.</p>
            </div>

            <p style="margin-top: 40px; color: #9ca3af; font-size: 14px; border-top: 1px solid #e5e7eb; pt-20px;">
              Best regards,<br>
              <strong>The TalentSphere Team</strong>
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Application cancelled email sent to employer:', employerEmail);
    return true;
  } catch (error) {
    console.error('Error sending cancellation email:', error.message);
    return false;
  }
};

module.exports = {
  sendApplicationConfirmation,
  sendNewApplicationToEmployer,
  sendJobPostedConfirmation,
  sendStatusUpdateEmail,
  sendApplicationCancelled,
};