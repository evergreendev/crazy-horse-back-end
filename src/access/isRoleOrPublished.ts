import {Access} from "payload/config";

export const isRoleOrPublished = (role:"admin"|"museum-manager"|"employment-manager"): Access => ({req: {user}}) => {

    if (user?.role === "admin") return true;

    if (user?.role === role) return true;

    return {
        _status: {
            equals: 'published',
        },
    }
}
