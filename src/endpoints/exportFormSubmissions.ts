import { Endpoint } from 'payload/config';

export const exportFormSubmissionsEndpoint: Endpoint = {
  path: '/export-form-submissions',
  method: 'post',
  handler: async (req, res, next) => {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({
          success: false,
          message: 'Selection is required',
        });
      }

      const submissions = await req.payload.find({
        collection: 'form-submissions',
        where: {
          id: {
            in: ids,
          },
        },
        limit: 1000,
      });

      if (!submissions.docs || submissions.docs.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No submissions found',
        });
      }

      // Extract all possible field names from all submissions to create headers
      const fieldNames = new Set<string>();
      submissions.docs.forEach((doc: any) => {
        if (doc.submissionData && Array.isArray(doc.submissionData)) {
          doc.submissionData.forEach((data: any) => {
            fieldNames.add(data.field);
          });
        }
      });

      const headers = ['id', 'form', 'createdAt', ...Array.from(fieldNames)];

      const csvRows = submissions.docs.map((doc: any) => {
        const rowData: any = {
          id: doc.id,
          form: typeof doc.form === 'object' ? doc.form.title : doc.form,
          createdAt: doc.createdAt,
        };

        if (doc.submissionData && Array.isArray(doc.submissionData)) {
          doc.submissionData.forEach((data: any) => {
            rowData[data.field] = data.value;
          });
        }

        return headers.map(header => {
          const value = rowData[header] || '';
          // Escape quotes and wrap in quotes if contains comma or quote
          const stringValue = String(value).replace(/"/g, '""');
          return `"${stringValue}"`;
        }).join(',');
      });

      const csvContent = [headers.join(','), ...csvRows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=form-submissions.csv');
      return res.status(200).send(csvContent);
    } catch (error) {
      req.payload.logger.error({
        err: `Error in export form submissions endpoint: ${error.message}`,
      });

      return res.status(500).json({
        success: false,
        message: error.message || 'An error occurred while exporting submissions',
      });
    }
  },
};
