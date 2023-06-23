import { localize } from '../helpers/i18n';
import { rollWeapon, simpleRoll } from '../rolls/roll';

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
                return await this._rollWeapon();
            case 'armor':
                return await this._rollArmor();
            default:
                return await this.show();
        }
    }

    async _rollArmor() {
        await simpleRoll(this.system.protection, this.name, this.prepareChatData());
    }

    async _rollGear() {
        if (!this.system.skill) {
            return ui.notifications.error(localize('errors', 'gear_no_skill'));
        }

        await this.actor.rollSkill(this.system.skill, this.system.bonus, this.prepareChatData());
    }

    prepareChatData() {
        return {
            img: this.img,
            name: this.name,
            data: JSON.stringify({
                img: this.img,
                name: this.name,
                system: this.system,
            }),
            system: this.system,
        };
    }

    async _rollWeapon() {
        await rollWeapon(this.actor, this.prepareChatData());
    }
}
