import {Block} from "payload/types";
import {ArrayRowLabel} from "../../components/ArrayRowLabel";
import navItemFields from "../../fields/navItemFields";

const MenuWithSubMenuBlock: Block = {
    slug: 'MenuWithSubMenu', // required
    fields: [
        {
            name: "headerItem",
            type: "group",
            fields: navItemFields
        },
        {
            name: "items",
            type: "array",
            admin: {
                components: {
                    RowLabel: ArrayRowLabel
                }
            },
            fields: navItemFields
        }
    ],
}

export default MenuWithSubMenuBlock;
