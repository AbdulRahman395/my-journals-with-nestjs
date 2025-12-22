import { MailService } from "../mail.service";

// Account Verification Email
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
      subject: 'My Journals - Verify Your OTP Code',
      html: mailContent,
    });

    return isMailSent || false;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

// Password Reset Email
export const sendPasswordResetEmail = async (
  mailService: MailService,
  email: string,
  otp: string
): Promise<boolean> => {
  try {
    const mailContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; border: 1px solid #e1e4e8;">
    
    <h1 style="color: #2c3e50; text-align: center; margin-bottom: 25px;">
      Reset Your Password
    </h1>
    
    <p style="margin-bottom: 20px;">Hello,</p>
    
    <p style="margin-bottom: 20px;">
      You are receiving this email because you (or someone else) have requested a password reset for your account.
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
      subject: 'My Journals - Reset Your Password',
      html: mailContent,
    });

    return isMailSent || false;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};

// Resend OTP Email
export const sendResendOtpEmail = async (
  mailService: MailService,
  email: string,
  otp: string
): Promise<boolean> => {
  try {
    const mailContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; border: 1px solid #e1e4e8;">
          
          <h1 style="color: #2c3e50; text-align: center; margin-bottom: 25px;">
            Your Verification Code
          </h1>
          
          <p style="margin-bottom: 20px;">Hello,</p>
          
          <p style="margin-bottom: 20px;">
            You requested a One-Time Password (OTP) for verification with My Journals. 
            Here is your verification code:
          </p>
          
          <div style="background-color: #f1f3f5; padding: 15px; border-radius: 4px; text-align: center; margin: 25px 0; font-size: 24px; font-weight: bold; letter-spacing: 2px;">
            ${otp}
          </div>
          
          <p style="margin-bottom: 20px;">
            <strong>Important:</strong> This OTP will expire in <strong>10 minutes</strong>.
            Please enter this code in the verification page to complete your request.
          </p>
          
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #856404;">
              <strong>Security Notice:</strong> 
              You received this email because you requested an OTP. 
              If you did not make this request, please ignore this email or contact our support team immediately.
            </p>
          </div>
          
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
      subject: 'My Journals - Your Verification Code',
      html: mailContent,
    });

    return isMailSent || false;
  } catch (error) {
    console.error('Error sending OTP verification email:', error);
    return false;
  }
};