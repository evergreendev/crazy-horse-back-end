import React, { useState } from 'react';
import { useConfig } from 'payload/components/utilities';
import {useDocumentInfo} from "payload/components/utilities";

export const ResendEmailButton: React.FC<{
  collection: {
    slug: string;
  };
}> = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { serverURL } = useConfig();

  const documentInfo = useDocumentInfo();
  // Pass in fields, and indicate if you'd like to "unflatten" field data.
  // The result below will reflect the data stored in the form at the given time

  const handleResendEmail = async () => {
    if (isLoading) return;

    const confirmed = window.confirm('Are you sure you want to resend the email for this submission?');
    if (!confirmed) return;

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${serverURL}/api/resend-form-email/${documentInfo.id}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage('Email resent successfully');
      } else {
        setMessage(`Error: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message || 'An unknown error occurred'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={handleResendEmail}
        disabled={isLoading}
        type="button"
        className="btn btn--style-primary"
      >
        {isLoading ? 'Sending...' : 'Resend Email'}
      </button>
      {message && (
        <div style={{ marginTop: '5px', color: message.includes('Error') ? 'red' : 'green' }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default ResendEmailButton;
