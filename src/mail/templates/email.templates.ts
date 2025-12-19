import { MailService } from "../mail.service";

export const sendAccountVerificationEmail = async (
  mailService: MailService,
  email: string,
  otp: string
): Promise<boolean> => {
  try {
    const mailContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; border: 1px solid #e1e4e8;">
    
    <h1 style="color: #2c3e50; text-align: center; margin-bottom: 25px;">
      Verify Your Email Address
    </h1>
    
    <p style="margin-bottom: 20px;">Hello,</p>
    
    <p style="margin-bottom: 20px;">
      Thank you for signing up with <strong>My Journals</strong>!  
      To complete your registration, please use the following One-Time Password (OTP) to verify your email address:
    </p>
    
    <div style="background-color: #f1f3f5; padding: 15px; border-radius: 4px; text-align: center; margin: 25px 0; font-size: 24px; font-weight: bold; letter-spacing: 2px;">
      ${otp}
    </div>
    
    <p style="margin-bottom: 20px;">
      This OTP will expire in 10 minutes.  
      If you didn’t request this verification, you can safely ignore this email or contact our support team.
    </p>
    
    <p style="margin-bottom: 5px;">Best regards,</p>
    <p style="margin-top: 0; color: #6c757d;">
      The My Journals Team
    </p>
    
    <div style="text-align: center; margin-top: 30px;">
      <img 
        src="https://png.pngtree.com/png-vector/20230324/ourmid/pngtree-brown-journaling-book-with-sticky-notes-vector-png-image_6666791.png" 
        alt="My Journals Logo" 
        style="width: 100px;" 
      />
    </div>
    
  </div>
</div>
    `;

    const isMailSent = await mailService.sendMail({
      to: email,
      subject: 'My Journals - Your OTP Code',
      html: mailContent,
    });

    return isMailSent || false;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};