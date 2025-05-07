import { Endpoint } from 'payload/config';
import resendEmail from '../hooks/resendEmail';

export const resendFormEmailEndpoint: Endpoint = {
  path: '/resend-form-email/:id',
  method: 'post',
  handler: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Form submission ID is required',
        });
      }

      const result = await resendEmail(req, id);
      
      return res.status(200).json(result);
    } catch (error) {
      req.payload.logger.error({
        err: `Error in resend email endpoint: ${error.message}`,
      });
      
      return res.status(500).json({
        success: false,
        message: error.message || 'An error occurred while resending the email',
      });
    }
  },
};
