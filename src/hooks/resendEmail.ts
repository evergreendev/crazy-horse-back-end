import { PayloadRequest } from 'payload/types';
import sendEmail from './sendEmail';

const resendEmail = async (req: PayloadRequest, submissionId: string): Promise<any> => {
  const { payload } = req;
  
  try {
    // Fetch the form submission
    const submission = await payload.findByID({
      collection: 'form-submissions',
      id: submissionId,
      depth: 0,
      req,
    });

    if (!submission) {
      throw new Error(`Form submission with ID ${submissionId} not found`);
    }

    // Log the resend action
    payload.logger.info({
      msg: `Resending email for form submission: ${submissionId}`,
    });

    // Use the existing sendEmail function with the submission data
    const result = await sendEmail({
      data: submission,
      operation: 'create', // Reuse the create operation path in sendEmail
      req,
    });

    return {
      success: true,
      message: 'Email resent successfully',
      submissionId,
    };
  } catch (error) {
    payload.logger.error({
      err: `Error resending email for submission ${submissionId}: ${error.message}`,
    });
    
    throw error;
  }
};

export default resendEmail;
