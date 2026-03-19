import React, { useState } from 'react';
import { useSelection } from 'payload/dist/admin/components/views/collections/List/SelectionProvider';
import { useConfig } from 'payload/components/utilities';

export const ExportCSVButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { selected, count } = useSelection();
  const { serverURL } = useConfig();

  const handleExport = async () => {
    if (isLoading || count === 0) return;

    setIsLoading(true);

    try {
      // selected is a Record<string | number, boolean>
      const selectedIds = Object.keys(selected).filter(id => selected[id]);

      const response = await fetch(`${serverURL}/api/export-form-submissions`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `form-submissions-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error exporting CSV');
    } finally {
      setIsLoading(false);
    }
  };

  if (count === 0) return null;

  return (
    <div style={{ marginBottom: '20px' }}>
      <button 
        onClick={handleExport}
        disabled={isLoading}
        type="button"
        className="btn btn--style-primary"
      >
        {isLoading ? 'Exporting...' : `Export ${count} to CSV`}
      </button>
    </div>
  );
};

export default ExportCSVButton;
