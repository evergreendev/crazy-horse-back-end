import {Access} from "payload/config";
import {FieldAccess} from "payload/types";
import {User} from "payload/generated-types";

export const isAtLeastEmployeeManager = (): Access => ({req: {user}}) => {

    return Boolean(user?.role === "admin" || user?.role === "employment-manager");
}

export const isAtLeastEmployeeManagerFieldLevel: FieldAccess<{id: string}, unknown, User> = ({req: {user}}) => {

    return Boolean(user?.role === "admin" || user?.role === "employment-manager");
}
