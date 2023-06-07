import { localize } from '../helpers/i18n';

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class TWDItem extends Item {
    /** @override */
    _preCreate() {
        this.updateSource({ img: `systems/thewalkingdead/assets/items/${this.type}.jpg` });
        return Promise.resolve();
    }

    /**
     * Prepare a data object which is passed to any Roll formulas which are created related to this Item
     * @private
     */
    getRollData() {
        // If present, return the actor's roll data.
        if (!this.actor) return null;
        const rollData = this.actor.getRollData();
        rollData.item = foundry.utils.deepClone(this.system);

        return rollData;
    }

    async show() {
        const speaker = ChatMessage.getSpeaker({ actor: this.actor });
        const rollMode = game.settings.get('core', 'rollMode');

        const content = await renderTemplate(
            'systems/thewalkingdead/templates/roll/item.hbs',
            this,
        );

        return await ChatMessage.create({
            speaker: speaker,
            rollMode: rollMode,
            content,
        });
    }

    async roll() {
        if (!this.actor) {
            return ui.notifications.error(localize('errors', 'item_no_actor'));
        }
        switch (this.type) {
            case 'gear':
                return await this._rollGear();
            case 'weapon':
            case 'armor':
            default:
                return await this.show();
        }
    }

    async _rollGear() {
        if (!this.system.skill) {
            return ui.notifications.error(localize('errors', 'gear_no_skill'));
        }

        await this.actor.rollSkill(this.system.skill, this.system.bonus);
    }
}
