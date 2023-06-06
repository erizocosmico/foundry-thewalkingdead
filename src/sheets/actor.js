import { labelFor } from '../helpers/i18n';
import { rollStatDialog } from '../rolls/roll';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class TWDActorSheet extends ActorSheet {
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ['thewalkingdead', 'sheet', 'actor'],
            template: 'systems/thewalkingdead/templates/actor/actor-sheet.hbs',
            width: 700,
            height: 600,
            tabs: [
                { navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'features' },
            ],
        });
    }

    /** @override */
    get template() {
        return `systems/thewalkingdead/templates/actor/actor-${this.actor.data.type}-sheet.hbs`;
    }

    /** @override */
    async _onDropItemCreate(itemData) {
        const type = itemData.type;
        const allowedItems = {
            character: ['gear', 'weapon', 'armor', 'talent', 'injury'],
            vehicle: [],
            npc: ['gear', 'weapon', 'armor'],
            haven: ['project'],
        };

        if (!allowedItems[this.actor.type].includes(type)) {
            return false;
        }

        return super._onDropItemCreate(itemData);
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        // Retrieve the data structure from the base sheet. You can inspect or log
        // the context variable to see the structure, but some key properties for
        // sheets are the actor object, the data object, whether or not it's
        // editable, the items array, and the effects array.
        const context = super.getData();

        context.system = context.actor.system;
        context.flags = context.actor.flags;

        // Prepare character data and items.
        if (this.actor.type == 'character') {
            this._prepareItems(context);
            this._prepareCharacterData(context);
        }

        // Prepare NPC data and items.
        if (this.actor.type == 'npc') {
            this._prepareItems(context);
        }

        // Add roll data for TinyMCE editors.
        context.rollData = context.actor.getRollData();

        return context;
    }

    /**
     * Organize and classify Items for Character sheets.
     *
     * @param {Object} actorData The actor to prepare.
     *
     * @return {undefined}
     */
    _prepareCharacterData(context) {}

    /**
     * Organize and classify Items for Character sheets.
     *
     * @param {Object} actorData The actor to prepare.
     *
     * @return {undefined}
     */
    _prepareItems(context) {
        context.gear = [];
        context.talents = [];
        context.injuries = [];
        context.weapons = [];
        context.armor = [];
        context.storedGear = [];

        for (let i of context.items) {
            i.img = i.img || DEFAULT_TOKEN;
            switch (i.type) {
                case 'injury':
                    context.injuries.push(i);
                    break;
                case 'gear':
                case 'weapon':
                case 'armor':
                    if (!i.data.equipped) context.storedGear.push(i);
                    else if (i.type === 'gear') context.gear.push(i);
                    else if (i.type === 'weapon') context.weapons.push(i);
                    else if (i.type === 'armor') context.armor.push(i);
                    break;
                case 'talent':
                    context.talents.push(i);
            }
        }
    }

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        html.find('.roll-attr').click(async (e) => await this._rollAttribute(e));
        html.find('.roll-skill').click(async (e) => await this._rollSkill(e));

        if (this.actor.type === 'character') {
            html.find('.drive-check').click(async () => await this._toggleDrive());
            html.find('.char-box').click(async (e) => await this._setTrackBoxValue(e));
        }

        html.find('.item-edit').click((ev) => {
            const li = $(ev.currentTarget).parents('.item');
            const item = this.actor.items.get(li.data('itemId'));
            item.sheet.render(true);
        });
        html.find('.item-expand').click((e) => {
            const li = $(e.currentTarget).parents('.item');
            const item = this.actor.items.get(li.data('itemId'));
            item.update({ 'system.expanded': !item.system.expanded });
        });

        // -------------------------------------------------------------
        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable) return;

        // Add Inventory Item
        html.find('.item-create').click(this._onItemCreate.bind(this));

        // Delete Inventory Item
        html.find('.item-delete').click((ev) => {
            const li = $(ev.currentTarget).parents('.item');
            const item = this.actor.items.get(li.data('itemId'));
            item.delete();
            li.slideUp(200, () => this.render(false));
        });
        html.find('.item-roll').click((e) => {
            const li = $(e.currentTarget).parents('.item');
            const item = this.actor.items.get(li.data('itemId'));
            item.roll();
        });

        if (this.actor.isOwner) {
            html.find('li.item').each((i, li) => {
                if (li.classList.contains('item-header')) return;
                li.setAttribute('draggable', true);
                li.addEventListener('dragstart', (e) => this._onDragStart(e), false);
            });
        }
    }

    penalties(stat) {
        let armorPenalty = 0;
        if (stat === 'mobility') {
            armorPenalty = this.actor.items
                .filter((i) => i.type === 'armor' && i.system.equipped)
                .reduce((acc, i) => acc + i.system.penalty, 0);
        }

        return (
            this.actor.items
                .filter((i) => i.type === 'injury')
                .reduce((acc, i) => acc + i.system.penalty, 0) + armorPenalty
        );
    }

    async _setTrackBoxValue(e) {
        e.preventDefault();
        e.stopPropagation();
        const key = e.target.dataset.key;
        let n = Number(e.target.dataset.value);
        const prop = getProperty(this.actor.data, key);
        if (n === 1 && prop > 0 && key !== 'system.health.value') {
            n = 0;
        }

        await this.actor.update({ [key]: n });
    }

    async _toggleDrive() {
        await this.actor.update({ 'system.drive.used': !this.actor.system.drive.used });
    }

    async _rollAttribute(e) {
        e.preventDefault();
        const attr = e.target.dataset.attr;
        const data = this.actor.system;
        await rollStatDialog({
            actor: this.actor,
            pool: data.attributes[attr].value,
            stress: data.stress?.value || 0,
            penalties: this.penalties(attr),
            label: game.i18n.localize(labelFor('attributes', attr)),
        });
    }

    async _rollSkill(e) {
        e.preventDefault();
        const skill = e.target.dataset.skill;
        const data = this.actor.system;
        await rollStatDialog({
            actor: this.actor,
            pool: data.skills[skill].value + data.attributes[data.skills[skill].attribute].value,
            stress: data.stress?.value || 0,
            penalties: this.penalties(skill),
            label: game.i18n.localize(labelFor('skills', skill)),
        });
    }

    async _onItemCreate(event) {
        event.preventDefault();
        const type = event.currentTarget.dataset.type;
        const name = `New ${type.capitalize()}`;
        const itemData = { name, type, data: {} };
        return await this.actor
            .createEmbeddedDocuments('Item', [itemData], { render: true })
            .then((items) => items[0].sheet.render(true));
    }
}
