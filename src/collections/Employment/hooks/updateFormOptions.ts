import type { AfterChangeHook } from 'payload/dist/collections/config/types'
import type { Form } from '../../../payload-types'

// Reads env to determine which form and which field to update. Expects:
// - EMPLOYMENT_FORM_ID: the numeric ID of the target form (from the Forms collection)
// - EMPLOYMENT_FORM_FIELD_NAME: the name of the select field within that form to update
// Optionally supports EMPLOYMENT_FORM_TITLE to find by title if ID not provided.

export const updateFormOptions: AfterChangeHook = async ({ doc, operation, req }) => {
  try {
    if (operation !== 'create') return doc

    const title: string | undefined = (doc as any)?.title
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return doc
    }

    const formIdEnv = process.env.EMPLOYMENT_FORM_ID
    const formTitleEnv = process.env.EMPLOYMENT_FORM_TITLE
    const fieldName = process.env.EMPLOYMENT_FORM_FIELD_NAME

    if (!fieldName || (!formIdEnv && !formTitleEnv)) {
      // Not configured; silently skip
      return doc
    }

    const { payload } = req

    let form: Form | null = null

    if (formIdEnv) {
      try {
        const numericId = Number(formIdEnv)
        if (!Number.isNaN(numericId)) {
          // @ts-ignore Payload types allow string|number IDs depending on adapter; here it's number per generated types
          form = await payload.findByID({ collection: 'forms', id: numericId }) as unknown as Form
        }
      } catch (e) {
        // Ignore and fall back to title search if available
      }
    }

    if (!form && formTitleEnv) {
      const res = await payload.find({ collection: 'forms', where: { title: { equals: formTitleEnv } }, limit: 1 })
      if (res?.docs?.length) {
        form = res.docs[0] as unknown as Form
      }
    }

    if (!form) return doc

    // Find the target field (blockType 'select' recommended) by name
    const fields = Array.isArray(form.fields) ? [...form.fields] : []
    const targetIndex = fields.findIndex((f: any) => f?.name === fieldName)

    if (targetIndex === -1) return doc

    const targetField: any = { ...(fields[targetIndex] || {}) }

    // Ensure options array exists
    const existingOptions: { label: string; value: string }[] = Array.isArray(targetField.options)
      ? [...targetField.options]
      : []

    const alreadyExists = existingOptions.some(opt => opt?.value === title)
    if (alreadyExists) return doc

    existingOptions.push({ label: title, value: title })

    targetField.options = existingOptions
    fields[targetIndex] = targetField

    // Persist update
    await payload.update({
      collection: 'forms',
      // @ts-ignore see above note regarding ID type
      id: (form as any).id,
      data: { fields },
    })
  } catch (err) {
    // Do not block Employment creation if anything goes wrong; log for diagnostics
    try {
      req.payload.logger.warn({ err }, 'Failed to update form options from Employment hook')
    } catch (_) {
      // no-op
    }
  }

  return doc
}
