import { baseEmailTemplate } from './base';

export const refundRequestedTemplate = (
  appName: string,
  amount: string,
  planName: string,
  reason: string
): string => {
  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="color: #333333; margin: 0;">Refund Request Submitted</h2>
    </div>
    
    <div style="color: #666666; font-size: 16px; line-height: 1.6;">
      <p>Hello,</p>
      <p>We have received your refund request for the <strong>${planName}</strong> plan.</p>
      
      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #333333;">Request Details:</h3>
        <ul style="list-style: none; padding: 0; margin: 0;">
          <li style="margin-bottom: 10px;"><strong>Amount Requested:</strong> ${amount}</li>
          <li style="margin-bottom: 10px;"><strong>Plan:</strong> ${planName}</li>
          <li><strong>Reason:</strong> ${reason || 'Not provided'}</li>
        </ul>
      </div>

      <p>Our team is currently reviewing your request. We will notify you once a decision has been made. In the meantime, your subscription access has been temporarily paused.</p>
      <p>Please note that this review process typically takes 1-2 business days.</p>
    </div>
  `;

  return baseEmailTemplate(content, appName);
};

export const refundApprovedTemplate = (
  appName: string,
  amount: string,
  planName: string,
  timeline: string = "5-7 business days"
): string => {
  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="color: #10B981; margin: 0;">Refund Request Approved</h2>
    </div>
    
    <div style="color: #666666; font-size: 16px; line-height: 1.6;">
      <p>Hello,</p>
      <p>Good news! Your refund request for the <strong>${planName}</strong> plan has been approved and is now being processed.</p>
      
      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <ul style="list-style: none; padding: 0; margin: 0;">
          <li style="margin-bottom: 10px;"><strong>Approved Amount:</strong> ${amount}</li>
          <li><strong>Estimated Timeline:</strong> ${timeline}</li>
        </ul>
      </div>

      <p>The funds will be returned to your original payment method. Depending on your bank or card issuer, it may take ${timeline} for the refund to reflect in your account.</p>
    </div>
  `;

  return baseEmailTemplate(content, appName);
};

export const refundCompletedTemplate = (
  appName: string,
  amount: string,
  planName: string,
  gatewayRefundId: string
): string => {
  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="color: #10B981; margin: 0;">Refund Completed</h2>
    </div>
    
    <div style="color: #666666; font-size: 16px; line-height: 1.6;">
      <p>Hello,</p>
      <p>Your refund of <strong>${amount}</strong> for the <strong>${planName}</strong> plan has been successfully completed by our payment processor.</p>
      
      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <ul style="list-style: none; padding: 0; margin: 0;">
          <li style="margin-bottom: 10px;"><strong>Refund Amount:</strong> ${amount}</li>
          <li style="margin-bottom: 10px;"><strong>Refund ID:</strong> ${gatewayRefundId}</li>
        </ul>
      </div>

      <p>If you don't see the funds in your account within a few business days, please contact your bank with the Refund ID above for further assistance.</p>
    </div>
  `;

  return baseEmailTemplate(content, appName);
};

export const refundRejectedTemplate = (
  appName: string,
  planName: string,
  reason: string
): string => {
  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="color: #EF4444; margin: 0;">Refund Request Declined</h2>
    </div>
    
    <div style="color: #666666; font-size: 16px; line-height: 1.6;">
      <p>Hello,</p>
      <p>We have reviewed your refund request for the <strong>${planName}</strong> plan, but unfortunately, we are unable to approve it at this time.</p>
      
      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #EF4444;">
        <h3 style="margin-top: 0; color: #333333;">Reason:</h3>
        <p style="margin: 0;">${reason || 'Your request did not meet our refund policy criteria.'}</p>
      </div>

      <p>Your subscription access has been restored. If you have any questions or feel this decision was made in error, please reply to this email to contact our support team.</p>
    </div>
  `;

  return baseEmailTemplate(content, appName);
};
