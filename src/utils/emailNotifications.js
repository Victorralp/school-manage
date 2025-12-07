/**
 * Email Notifications Utility
 * Handles sending confirmation emails and notifications
 * 
 * Note: In production, email sending should be handled by Cloud Functions
 * to keep API keys secure and ensure reliable delivery.
 */

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { formatCurrency } from './monnifyConfig';

/**
 * Queue email notification in Firestore
 * Cloud Functions will pick up and send the email
 * @param {Object} emailData - Email details
 * @returns {Promise<string>} Email queue ID
 */
export const queueEmail = async (emailData) => {
  try {
    const { to, subject, template, data } = emailData;

    // Create a document in the email queue collection
    const emailRef = doc(db, 'emailQueue', `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

    await setDoc(emailRef, {
      to,
      subject,
      template,
      data,
      status: 'pending',
      createdAt: serverTimestamp(),
      attempts: 0
    });

    return emailRef.id;
  } catch (error) {
    console.error('Error queueing email:', error);
    throw new Error('Failed to queue email notification');
  }
};

/**
 * Send payment confirmation email
 * @param {Object} params - Email parameters
 * @returns {Promise<string>} Email queue ID
 */
export const sendPaymentConfirmationEmail = async ({
  userEmail,
  userName,
  transactionId,
  planName,
  planTier,
  amount,
  currency,
  subjectLimit,
  studentLimit,
  paymentDate
}) => {
  try {
    const formattedAmount = formatCurrency(amount, currency);
    const formattedDate = new Date(paymentDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const emailData = {
      to: userEmail,
      subject: `Payment Confirmation - ${planName}`,
      template: 'payment_confirmation',
      data: {
        userName: userName || 'Valued Teacher',
        planName,
        planTier,
        transactionId,
        amount: formattedAmount,
        currency,
        subjectLimit,
        studentLimit,
        paymentDate: formattedDate,
        // Receipt details
        receipt: {
          transactionId,
          date: formattedDate,
          description: `${planName} - Monthly Subscription`,
          amount: formattedAmount,
          paymentMethod: 'Monnify',
          status: 'Paid'
        }
      }
    };

    const emailId = await queueEmail(emailData);

    console.log('Payment confirmation email queued:', emailId);

    return emailId;
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
    // Don't throw error - email failure shouldn't block payment processing
    return null;
  }
};

/**
 * Send subscription renewal reminder email
 * @param {Object} params - Email parameters
 * @returns {Promise<string>} Email queue ID
 */
export const sendRenewalReminderEmail = async ({
  userEmail,
  userName,
  planName,
  expiryDate,
  amount,
  currency
}) => {
  try {
    const formattedAmount = formatCurrency(amount, currency);
    const formattedExpiryDate = new Date(expiryDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const emailData = {
      to: userEmail,
      subject: `Subscription Renewal Reminder - ${planName}`,
      template: 'renewal_reminder',
      data: {
        userName: userName || 'Valued Teacher',
        planName,
        expiryDate: formattedExpiryDate,
        amount: formattedAmount,
        currency,
        daysUntilExpiry: Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
      }
    };

    const emailId = await queueEmail(emailData);

    console.log('Renewal reminder email queued:', emailId);

    return emailId;
  } catch (error) {
    console.error('Error sending renewal reminder email:', error);
    return null;
  }
};

/**
 * Send grace period notification email
 * @param {Object} params - Email parameters
 * @returns {Promise<string>} Email queue ID
 */
export const sendGracePeriodEmail = async ({
  userEmail,
  userName,
  planName,
  gracePeriodEndDate
}) => {
  try {
    const formattedEndDate = new Date(gracePeriodEndDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const emailData = {
      to: userEmail,
      subject: `Action Required - Subscription Payment Failed`,
      template: 'grace_period',
      data: {
        userName: userName || 'Valued Teacher',
        planName,
        gracePeriodEndDate: formattedEndDate,
        daysRemaining: Math.ceil((new Date(gracePeriodEndDate) - new Date()) / (1000 * 60 * 60 * 24))
      }
    };

    const emailId = await queueEmail(emailData);

    console.log('Grace period email queued:', emailId);

    return emailId;
  } catch (error) {
    console.error('Error sending grace period email:', error);
    return null;
  }
};

/**
 * Send downgrade notification email
 * @param {Object} params - Email parameters
 * @returns {Promise<string>} Email queue ID
 */
export const sendDowngradeEmail = async ({
  userEmail,
  userName,
  oldPlanName,
  newPlanName,
  newSubjectLimit,
  newStudentLimit
}) => {
  try {
    const emailData = {
      to: userEmail,
      subject: `Subscription Downgraded to ${newPlanName}`,
      template: 'downgrade_notification',
      data: {
        userName: userName || 'Valued Teacher',
        oldPlanName,
        newPlanName,
        newSubjectLimit,
        newStudentLimit
      }
    };

    const emailId = await queueEmail(emailData);

    console.log('Downgrade notification email queued:', emailId);

    return emailId;
  } catch (error) {
    console.error('Error sending downgrade email:', error);
    return null;
  }
};

/**
 * Create receipt document in Firestore
 * @param {Object} receiptData - Receipt details
 * @returns {Promise<string>} Receipt ID
 */
export const createReceipt = async (receiptData) => {
  try {
    const {
      teacherId,
      transactionId,
      planName,
      amount,
      currency,
      paymentDate
    } = receiptData;

    const receiptRef = doc(db, 'receipts', transactionId);

    await setDoc(receiptRef, {
      teacherId,
      transactionId,
      planName,
      amount,
      currency,
      paymentDate,
      description: `${planName} - Monthly Subscription`,
      paymentMethod: 'Monnify',
      status: 'paid',
      createdAt: serverTimestamp()
    });

    return transactionId;
  } catch (error) {
    console.error('Error creating receipt:', error);
    throw new Error('Failed to create receipt');
  }
};

export default {
  queueEmail,
  sendPaymentConfirmationEmail,
  sendRenewalReminderEmail,
  sendGracePeriodEmail,
  sendDowngradeEmail,
  createReceipt
};
