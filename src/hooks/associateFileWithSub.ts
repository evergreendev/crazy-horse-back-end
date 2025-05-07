import {CollectionAfterChangeHook} from 'payload/types'
import {FormSubmission} from "payload/generated-types";

const associateFileWithSub: CollectionAfterChangeHook = async ({
                                                                   doc, // full document data
                                                                   req, // full express request
                                                                   previousDoc, // document data before updating the collection
                                                                   operation, // name of the operation ie. 'create', 'update'
                                                               }) => {
    const typedDoc = doc as FormSubmission
    const docsToFind = typedDoc.submissionData.filter(x => x.value && typeof x.value === 'string' && x.value.includes('upload:-'));

    if (docsToFind.length > 0) {
        // Capture necessary data outside of setTimeout
        const submissionId = Number(doc.id);
        const payload = req.payload;
        const documentsToUpdate = docsToFind.map(item => ({
            docId: item.value.split('upload:-')[1]
        }));
        
        console.log(`Will associate ${documentsToUpdate.length} documents with submission ${submissionId} after a delay`);
        
        // Process after a small delay to allow transaction to complete
        setTimeout(async () => {
            try {
                const updatePromises = documentsToUpdate.map(async ({ docId }) => {
                    console.log(`Associating document ${docId} with submission ${submissionId}`);
                    try {
                        await payload.update({
                            collection: 'userUploadedFormDocuments',
                            where: {
                                filename: {
                                    equals: docId
                                }
                            },
                            data: {
                                associatedFormSubmission: submissionId
                            }
                        });
                        console.log(`Successfully associated document ${docId} with submission ${submissionId}`);
                    } catch (error) {
                        console.error(`Failed to update document ${docId}:`, error);
                    }
                });

                await Promise.all(updatePromises);
                console.log(`Completed all document associations for submission ${submissionId}`);
            } catch (error) {
                console.error('Error in deferred update:', error);
            }
        }, 200); // 200ms delay should be enough for the transaction to complete
    }
    return doc
}

export default associateFileWithSub;
