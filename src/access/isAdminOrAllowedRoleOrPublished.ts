import {Access} from "payload/config";

export const isAdminOrAllowedRoleOrPublished = (): Access => ({req: {user}}) => {

    if (user?.role === "admin") return true;

    return {
        or: [
            {
                allowedRoles: {
                    in: user?.role,
                },
            },
            {
                _status: {
                    equals: 'published',
                },
            }
        ]

    }
}
