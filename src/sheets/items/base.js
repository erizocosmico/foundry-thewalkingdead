import { localize } from '../../helpers/i18n';

export class TWDBaseItemSheet extends ItemSheet {
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ['thewalkingdead', 'sheet', 'item'],
            height: 438,
            width: 468,
        });
    }

    /** @override */
    get template() {
        const path = 'systems/thewalkingdead/templates/item';
        return `${path}/item-${this.item.data.type}-sheet.hbs`;
    }

    /** @override */
    getData() {
        const context = super.getData();

        context.rollData = {};
        let actor = this.object?.parent ?? null;
        if (actor) {
            context.rollData = actor.getRollData();
        }

        context.system = context.item.system;
        // Skills meant for the dropdowns in the gear sheet.
        context.skills = CONFIG.THEWALKINGDEAD.skills().reduce(
            (obj, skill) => {
                obj[skill] = localize('skills', skill);
                return obj;
            },
            { '': '-' },
        );

        return context;
    }
}
