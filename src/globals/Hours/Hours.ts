import {GlobalConfig} from "payload/types";
import {isAdmin} from "../../access/isAdmin";
import {ArrayRowLabel} from "../../components/ArrayRowLabel";
import {fixDuplicationHook} from "../../hooks/fixDuplicationHook";
import {revalidateSiteOptions} from "../hooks/revalidateSiteOptions";
import {useField} from "payload/components/forms";

export const Hours: GlobalConfig = {
    slug: "hours",
    admin: {
        hidden: ({user}) => user.role !== "admin"
    },
    hooks:{
        afterChange: [revalidateSiteOptions]
    },
    access: {
        read: () => true,
        update: isAdmin(),
    },
    fields: [
        {
            name: "Schedules",
            type: "array",
            admin: {
                components: {
                    RowLabel: ({ data, index, path: arrayFieldPath }) => {
                        // arrayFieldPath example: "Navs.0"
                        const path = `${arrayFieldPath}.schedule_start`
                        const start  = useField({ path })
                        const end = useField({path:`${arrayFieldPath}.schedule_end`})

                        if (start.value && end.value) {
                            const dateObj = new Date(start.value as string);
                            const endDateObj = new Date(end.value as string);
                            return dateObj.getMonth()+1 +"/"+ dateObj.getDate() +"/" +dateObj.getFullYear() + " - "
                                + (endDateObj.getMonth()+1) +"/"+endDateObj.getDate()+"/"+dateObj.getFullYear();
                        }

                        return `Item ${index + 1}`;
                    }
                },
            },
            hooks: {
                beforeChange: [
                    fixDuplicationHook
                ]
            },
            fields: [{
                type: "row",
                fields: [
                    {
                        name: "schedule_start",
                        label: "Schedule Start",
                        type: "date",
                        required: true,
                        admin: {
                            width: '50%',
                        },
                    },
                    {
                        name: "schedule_end",
                        label: "Schedule End",
                        type: "date",
                        required: true,
                        admin: {
                            width: '50%',
                        },
                    },
                    {
                        name: "hours",
                        type: "array",
                        admin: {
                            components: {
                                RowLabel: ArrayRowLabel
                            }
                        },
                        fields: [
                            {
                                name: "title",
                                type: "text"
                            },
                            {
                                type: "row",
                                fields: [
                                    {
                                        name: "hour_start",
                                        label: "Start",
                                        type: "text",
                                        admin: {
                                            width: '50%',
                                        },
                                    },
                                    {
                                        name: "hour_end",
                                        label: "End",
                                        type: "text",
                                        admin: {
                                            width: '50%',
                                        },
                                    },
                                ]
                            },

                        ]
                    }
                ]
            },]
        }

    ]
}
