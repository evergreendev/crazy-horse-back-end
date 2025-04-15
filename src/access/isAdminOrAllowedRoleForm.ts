import {Access} from "payload/config";

export const isAdminOrAllowedRoleForm = (): Access => ({req: {user,collection}}) => {
    if (!user) return false;
    if (user.role === "admin") return true;
    if (user.allowedFormSubmissions?.length === 0) return false;

    let hasFormField = false;
    if (collection){
        if (collection.config.fields.find(x => x["name"] === "form")){
            hasFormField = true;
        }
    }



    if (collection && collection.config.fields.find(x => x["name"] === "associatedFormSubmission")){
        const allowedForms = user?.allowedFormSubmissions?.map((allowedForm: {id:number}) => {
            return {
                "associatedFormSubmission.form.id":{
                    equals: allowedForm.id
                }
            }
        });

        return {
            or: allowedForms
        }
    }

    if (!collection){//Not sure if this is correct,but this is here so you can access the actual file.
        return true;
    }


    if (collection && collection.config.slug === "form-submissions"){
        const allowedForms = user?.allowedFormSubmissions?.map((allowedForm: {id:number}) => {
            return {
                "form.id":{
                    equals: allowedForm.id
                }
            }
        });

        return {
            or: allowedForms
        }
    }


    const allowedFormsId = hasFormField ? user?.allowedFormSubmissions?.map((allowedForm: {id:number}) => {
        return {
            "form.id":{
                equals: allowedForm.id
            }
        }
    }): user?.allowedFormSubmissions?.map((allowedForm: { id: number }) => {
        return {
            id: {
                equals: allowedForm.id
            }
        }

    });

    return {
        or: allowedFormsId
    }
}
