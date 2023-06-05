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
        // Retrieve base data structure.
        const context = super.getData();

        // Use a safe clone of the item data for further operations.
        const itemData = context.item.data;

        // Retrieve the roll data for TinyMCE editors.
        context.rollData = {};
        let actor = this.object?.parent ?? null;
        if (actor) {
            context.rollData = actor.getRollData();
        }

        // Add the actor's data to context.data for easier access, as well as flags.
        context.data = itemData.data;
        context.flags = itemData.flags;

        return context;
    }
}
