import type { AfterChangeHook, AfterDeleteHook } from 'payload/dist/collections/config/types'
import type { Form } from '../../../payload-types'

// Reads env to determine which form and which field to update. Expects:
// - EMPLOYMENT_FORM_ID: the numeric ID of the target form (from the Forms collection)
// - EMPLOYMENT_FORM_FIELD_NAME: the name of the select field within that form to update
// Optionally supports EMPLOYMENT_FORM_TITLE to find by title if ID not provided.

const resolveTargetForm = async (payload: any): Promise<Form | null> => {
  const formIdEnv = process.env.EMPLOYMENT_FORM_ID
  const formTitleEnv = process.env.EMPLOYMENT_FORM_TITLE

  let form: Form | null = null

  if (formIdEnv) {
    try {
      const numericId = Number(formIdEnv)
      if (!Number.isNaN(numericId)) {
        // @ts-ignore ID type depends on adapter; generated types show number
        form = await payload.findByID({ collection: 'forms', id: numericId }) as unknown as Form
      }
    } catch (e) {
      // ignore; fall through to title search
    }
  }

  if (!form && formTitleEnv) {
    const res = await payload.find({ collection: 'forms', where: { title: { equals: formTitleEnv } }, limit: 1 })
    if (res?.docs?.length) {
      form = res.docs[0] as unknown as Form
    }
  }

  return form
}

const upsertOption = async (payload: any, form: Form, fieldName: string, value: string) => {
  const fields = Array.isArray(form.fields) ? [...form.fields] : []
  const idx = fields.findIndex((f: any) => f?.name === fieldName)
  if (idx === -1) return

  const field: any = { ...(fields[idx] || {}) }
  const options: { label: string; value: string }[] = Array.isArray(field.options) ? [...field.options] : []
  const exists = options.some(opt => opt?.value === value)
  if (exists) return

  options.push({ label: value, value })
  // Ensure options are alphabetized by label (case-insensitive) after adding
  options.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))
  field.options = options
  fields[idx] = field

  await payload.update({ collection: 'forms', id: (form as any).id, data: { fields } })
}

const removeOption = async (payload: any, form: Form, fieldName: string, value: string) => {
  const fields = Array.isArray(form.fields) ? [...form.fields] : []
  const idx = fields.findIndex((f: any) => f?.name === fieldName)
  if (idx === -1) return

  const field: any = { ...(fields[idx] || {}) }
  const options: { label: string; value: string }[] = Array.isArray(field.options) ? [...field.options] : []
  const next = options.filter(opt => opt?.value !== value)
  if (next.length === options.length) return // no change

  field.options = next
  fields[idx] = field

  await payload.update({ collection: 'forms', id: (form as any).id, data: { fields } })
}

export const updateFormOptions: AfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  try {
    // Only act on create/update operations
    if (operation !== 'create' && operation !== 'update') return doc

    const fieldName = process.env.EMPLOYMENT_FORM_FIELD_NAME
    if (!fieldName) return doc

    const { payload } = req
    const form = await resolveTargetForm(payload)
    if (!form) return doc

    const currTitle: string | undefined = (doc as any)?.title
    const prevTitle: string | undefined = (previousDoc as any)?.title

    const currStatus: string | undefined = (doc as any)?._status
    const prevStatus: string | undefined = (previousDoc as any)?._status

    const isNowPublished = currStatus === 'published'
    const wasPublished = prevStatus === 'published'

    // If the doc just became published, add the option
    if (isNowPublished && !wasPublished) {
      if (currTitle && typeof currTitle === 'string' && currTitle.trim()) {
        await upsertOption(payload, form, fieldName, currTitle)
      }
      return doc
    }

    // If the doc just became unpublished (draft), remove the option
    if (!isNowPublished && wasPublished) {
      const titleToRemove = prevTitle || currTitle
      if (titleToRemove && typeof titleToRemove === 'string' && titleToRemove.trim()) {
        await removeOption(payload, form, fieldName, titleToRemove)
      }
      return doc
    }

    // If it remains published and the title changed, update the option accordingly
    if (isNowPublished && wasPublished && currTitle !== prevTitle) {
      if (prevTitle && prevTitle.trim()) {
        await removeOption(payload, form, fieldName, prevTitle)
      }
      if (currTitle && currTitle.trim()) {
        await upsertOption(payload, form, fieldName, currTitle)
      }
      return doc
    }
  } catch (err) {
    try {
      req.payload.logger.warn({ err }, 'Failed to sync Employment option with Form on change')
    } catch (_) {}
  }

  return doc
}

export const removeFormOptionOnDelete: AfterDeleteHook = async ({ doc, req }) => {
  try {
    const fieldName = process.env.EMPLOYMENT_FORM_FIELD_NAME
    if (!fieldName) return

    const { payload } = req
    const form = await resolveTargetForm(payload)
    if (!form) return

    const title: string | undefined = (doc as any)?.title
    if (title && title.trim()) {
      await removeOption(payload, form, fieldName, title)
    }
  } catch (err) {
    try {
      req.payload.logger.warn({ err }, 'Failed to remove Employment option from Form on delete')
    } catch (_) {}
  }
}
