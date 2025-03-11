import {GlobalConfig} from "payload/types";
import {ArrayRowLabel} from "../../components/ArrayRowLabel";
import {fixDuplicationHook} from "../../hooks/fixDuplicationHook";
import {useField} from "payload/components/forms";
import {revalidateSiteOptions} from "../hooks/revalidateSiteOptions";
import {isAtLeastMuseumManager} from "../../access/isAtLeastMuseumManager";

export const Calendar: GlobalConfig = {
    slug: "calendar",
    admin: {
        hidden: ({user}) => !(user.role === "admin" || user.role === "museum-manager"),
    },
    hooks:{
        afterChange: [revalidateSiteOptions]
    },
    access: {
        read: () => true,
        update: isAtLeastMuseumManager(),
    },
    fields: [
        {
            name: "calendarItems",
            type: "array",
            admin: {
                components: {
                    RowLabel: ArrayRowLabel
                },
            },
            hooks: {
                beforeChange: [
                    fixDuplicationHook
                ]
            },
            fields: [
                {
                    name: "title",
                    type: "text"
                },
                {
                    name: "description",
                    type: "textarea"
                },
                {
                    name: "eventPage",
                    label: "Link to event page (optional)",
                    type: "relationship",
                    relationTo: ["event"]
                },
                {
                    name: "location",
                    type: "select",
                    options: [
                        "Cultural Center",
                        "Covered Porch",
                        "Museum Galleries",
                        "Veranda Stage",
                        "Sign up in WC Lobby"
                    ]
                },
                {
                    type: "row",
                    fields: [
                        {
                            name: "monthLongEvent",
                            label: "This event is for the entire month",
                            type: "checkbox",
                            admin: {
                                width: "100%",
                                description: "This is helpful for items that last the entire month such as an artist in residence"
                            }
                        },
                        {
                            name: "dates",
                            type: "array",
                            admin: {
                                components: {
                                    RowLabel: ({ data, index, path: arrayFieldPath }) => {
                                        // arrayFieldPath example: "Navs.0"
                                        const path = `${arrayFieldPath}.date`
                                        const { value } = useField({ path })

                                        if (value) {
                                            const dateObj = new Date(value as string);
                                            return dateObj.getMonth()+1 +"/"+ dateObj.getDate() +"/" +dateObj.getFullYear();
                                        }

                                        return `Item ${index + 1}`;
                                    }
                                },
                                width: "100%",
                                condition: (siblingData) => {
                                    return !siblingData?.monthLongEvent;
                                },
                            },
                            fields: [
                                {
                                    name: "date",
                                    type: "date",
                                }
                            ],

                        },
                        {
                            name: "times",
                            type: "array",
                            admin: {
                                width: "100%"
                            },
                            fields: [
                                {
                                    type: "row",
                                    fields: [{
                                        name: "hour_start",
                                        label: "Start Time",
                                        type: "date",
                                        admin: {
                                            width: '50%',
                                            condition: (siblingData) => {
                                                return !siblingData?.monthLongEvent;
                                            },
                                            date: {
                                                timeIntervals: 5,
                                                pickerAppearance: 'timeOnly',
                                                displayFormat: 'h:mm a',
                                            },
                                        },
                                    },
                                        {
                                            name: "hour_end",
                                            label: "End Time",
                                            type: "date",
                                            admin: {
                                                width: '50%',
                                                condition: (siblingData) => {
                                                    return !siblingData?.monthLongEvent;
                                                },
                                                date: {
                                                    timeIntervals: 5,
                                                    pickerAppearance: 'timeOnly',
                                                    displayFormat: 'h:mm a',
                                                },
                                            },
                                        },
                                    ]
                                }

                            ]
                        },

                    ]
                },
            ]
        },
    ]
}
