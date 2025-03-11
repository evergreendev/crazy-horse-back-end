import {Access} from "payload/config";
import {FieldAccess} from "payload/types";
import {User} from "payload/generated-types";

export const isAtLeastMuseumManager = (): Access => ({req: {user}}) => {

    return Boolean(user?.role === "admin" || user?.role === "museum-manager");
}

export const isAtLeastMuseumManagerFieldLevel: FieldAccess<{id: string}, unknown, User> = ({req: {user}}) => {

    return Boolean(user?.role === "admin" || user?.role === "museum-manager");
}
