import {replaceDoubleCurlys} from "@payloadcms/plugin-form-builder/dist/utilities/replaceDoubleCurlys";
import {Email} from "@payloadcms/plugin-form-builder/types";
import {serializeLexical} from "@payloadcms/plugin-form-builder/dist/utilities/lexical/serializeLexical";
import {serializeSlate} from "@payloadcms/plugin-form-builder/dist/utilities/slate/serializeSlate";


const sendEmail = async (beforeChangeData: any): Promise<any> => {
    const {data, operation, req} = beforeChangeData

    if (operation === 'create') {
        const {
            data: {id: formSubmissionID},
            req: {locale, payload},
        } = beforeChangeData

        const {form: formID, submissionData} = data || {}

        try {
            const form = await payload.findByID({
                id: formID,
                collection: 'forms',
                locale,
                req,
            })

            const {emails,showFieldTable} = form
            let fieldTable = "";

            if (showFieldTable){
                submissionData.forEach((field: any) => {

                    const formField = form.fields.find(x => {
                        return x.name === field.field
                    })

                    const label = formField?.label || field.field

                        fieldTable += "<div>";
                    fieldTable += `<span style='font-weight: bold'>${label}:</span>`;
                    fieldTable += ` <span>${field.value}</span>`;
                    fieldTable += "</div>";
                })
            }

            if (emails && emails.length) {
                const formattedEmails: any[] = await Promise.all(
                    emails.map(async (email: Email): Promise<any | null> => {
                        const {
                            bcc: emailBCC,
                            cc: emailCC,
                            emailFrom,
                            emailTo,
                            message,
                            replyTo: emailReplyTo,
                            subject,
                        } = email

                        const to = replaceDoubleCurlys(emailTo, submissionData)
                        const cc = emailCC ? replaceDoubleCurlys(emailCC, submissionData) : ''
                        const bcc = emailBCC ? replaceDoubleCurlys(emailBCC, submissionData) : ''
                        const from = replaceDoubleCurlys(emailFrom, submissionData)
                        const replyTo = replaceDoubleCurlys(emailReplyTo || emailFrom, submissionData)
                        const attachments = [];

                        for (let i = 0; i < submissionData.length; i++) {
                            const curr = submissionData[i].value;
                            const fileNameArr = curr.split('pload:-')

                            if (fileNameArr.length > 1 && fileNameArr[1] !== "") {
                                attachments.push({
                                    filename: fileNameArr[1],
                                    path: process.env.NODE_ENV === "production" ? "./dist/" + "user-uploaded-documents/" + fileNameArr[1] : "./src/" + "user-uploaded-documents/" + fileNameArr[1],
                                })
                            }
                        }

                        const isLexical = message && !Array.isArray(message) && 'root' in message

                        const serializedMessage = isLexical
                            ? await serializeLexical(message, submissionData)
                            : serializeSlate(message, submissionData)

                        return {
                            bcc,
                            cc,
                            from,
                            html: `<div>${serializedMessage||""}${showFieldTable ? fieldTable : ""}</div>`,
                            replyTo,
                            subject: replaceDoubleCurlys(subject, submissionData),
                            to,
                            attachments: attachments
                        }
                    }),
                )

                // const log = emailsToSend.map(({ html, ...rest }) => ({ ...rest }))

                await Promise.all(
                    formattedEmails.map(async (email) => {
                        const {to} = email
                        try {
                            return await payload.sendEmail(email)
                        } catch (err: unknown) {
                            payload.logger.error({
                                err: `Error while sending email to address: ${to}. Email not sent: ${JSON.stringify(
                                    err,
                                )}`,
                            })
                        }
                    }),
                )
            } else {
                payload.logger.info({msg: 'No emails to send.'})
            }
        } catch (err: unknown) {
            const msg = `Error while sending one or more emails in form submission id: ${formSubmissionID}.`
            payload.logger.error({err: msg})
        }
    }

    return data
}

export default sendEmail
