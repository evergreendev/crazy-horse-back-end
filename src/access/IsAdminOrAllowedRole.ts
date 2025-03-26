import {Access} from "payload/config";

export const isAdminOrAllowedRole = (): Access => ({req: {user}}) => {

    if (user?.role === "admin") return true;

    return {
        allowedRoles: {
            in  : user?.role,
        },
    }
}
