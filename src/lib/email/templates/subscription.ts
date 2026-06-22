import { baseEmailTemplate } from './base';

/**
 * Subscription purchase confirmation email template
 */
export const subscriptionPurchaseTemplate = (
  name: string,
  planName: string,
  amount: number,
  purchaseDate: Date,
  appName: string
): string => {
  const formattedDate = purchaseDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #333333; font-size: 24px; margin-bottom: 10px;">Subscription Purchase Confirmation</h1>
      <p style="color: #666666; font-size: 16px; margin: 0;">Hi ${name || 'there'}, thank you for your subscription purchase!</p>
    </div>
    
    <div style="background-color: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
      <h2 style="color: #333333; font-size: 20px; margin-bottom: 15px;">Your Subscription Details</h2>
      <p style="color: #666666; font-size: 16px; margin-bottom: 5px;"><strong>Plan:</strong> ${planName}</p>
      <p style="color: #666666; font-size: 16px; margin-bottom: 5px;"><strong>Amount:</strong> $${amount.toFixed(2)}</p>
      <p style="color: #666666; font-size: 16px;"><strong>Purchase Date:</strong> ${formattedDate}</p>
    </div>
    
    <div style="margin-top: 30px;">
      <h3 style="color: #333333; font-size: 16px; margin-bottom: 15px;">What happens next?</h3>
      <ul style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
        <li>Your subscription is now active and you can start enjoying all the benefits of your plan</li>
        <li>You will receive a confirmation receipt shortly</li>
      </ul>
    </div>

    <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px;">
      <p style="color: #666666; font-size: 12px; margin: 0; line-height: 1.5;">
        <strong>Why am I receiving this?</strong> This email confirms your subscription purchase. If you did not make this purchase, please contact our support team.
      </p>
    </div>
  `;

  return baseEmailTemplate(content, appName);
};
