/**
 * Base email template wrapper
 * Provides consistent styling and structure for all emails
 */
export const baseEmailTemplate = (content: string, appName: string): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
      ${content}
      <div style="text-align: center; margin-top: 30px;">
        <p style="color: #999999; font-size: 12px; margin: 0;">
          This is an automated message from ${appName}. Please do not reply to this email.
        </p>
      </div>
    </div>
  `;
};

/**
 * Code display box component
 */
export const codeBox = (code: string, expiryText: string): string => {
  return `
    <div style="background-color: #f8f9fa; border: 2px dashed #e9ecef; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
      <p style="color: #333333; font-size: 14px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Your Verification Code</p>
      <div style="font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 4px; font-family: 'Courier New', monospace;">
        ${code}
      </div>
      <p style="color: #666666; font-size: 12px; margin-top: 10px;">${expiryText}</p>
    </div>
  `;
};

/**
 * Security note component
 */
export const securityNote = (message: string): string => {
  return `
    <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px;">
      <p style="color: #666666; font-size: 12px; margin: 0;">
        <strong>Security Note:</strong> ${message}
      </p>
    </div>
  `;
};

/**
 * Primary button component
 */
export const primaryButton = (url: string, text: string): string => {
  return `
    <a 
      href="${url}" 
      style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; 
             text-decoration: none; border-radius: 6px; font-weight: 500;"
    >
      ${text}
    </a>
  `;
};

/**
 * Instructions list component
 */
export const instructionsList = (instructions: string[]): string => {
  const listItems = instructions.map(instruction => `<li>${instruction}</li>`).join('');
  return `
    <div style="margin: 30px 0;">
      <p style="color: #333333; font-size: 14px; margin-bottom: 10px;"><strong>Instructions:</strong></p>
      <ol style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
        ${listItems}
      </ol>
    </div>
  `;
};
