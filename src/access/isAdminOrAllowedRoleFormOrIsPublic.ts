import {Access} from "payload/config";

export const isAdminOrAllowedRoleFormOrIsPublic = (): Access => ({req: {user,collection}}) => {
    if (!user || user.role === "admin") return true;

    if (user.allowedFormSubmissions.length === 0) return false;

    let hasFormField = false;
    if (collection){
        if (collection.config.fields.find(x => x["name"] === "form")){
            hasFormField = true;
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
