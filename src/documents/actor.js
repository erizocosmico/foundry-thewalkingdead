import { labelFor } from '../helpers/i18n';
import { rollStatDialog } from '../rolls/roll';

/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class TWDActor extends Actor {
    static async create(data, options = {}) {
        data.prototypeToken = data.prototypeToken || {};
        let defaults = {};
        if (data.type === 'character') {
            defaults = {
                actorLink: true,
                disposition: 1,
                vision: true,
            };
        }
        mergeObject(data.prototypeToken, defaults, { overwrite: false });
        return super.create(data, options);
    }

    /** @override */
    _preCreate() {
        this.updateSource({ img: `systems/thewalkingdead/assets/actors/${this.type}.jpg` });
        return Promise.resolve();
    }

    /**
     * @override
     * Augment the basic actor data with additional dynamic data. Typically,
     * you'll want to handle most of your calculated/derived data in this step.
     * Data calculated in this step should generally not exist in template.json
     * (such as ability modifiers rather than ability scores) and should be
     * available both inside and outside of character sheets (such as if an actor
     * is queried and has a roll executed directly from it).
     */
    prepareDerivedData() {
        const actorData = this.data;
        const flags = actorData.flags.thewalkingdead || {};

        this._prepareStats(actorData);
    }

    async createDocuments(data, context) {
        super.createDocuments(data, context);
    }

    _prepareStats(actorData) {
        if (actorData.type !== 'character' && actorData.type !== 'npc') return;
        const data = actorData.system;

        const skills = Object.keys(data.skills).map((k) => ({
            ...data.skills[k],
            value: data.skills[k].value || 0,
            label: labelFor('skills', k),
            key: k,
        }));
        data.stats = Object.keys(data.attributes).map((k) => ({
            key: k,
            label: labelFor('attributes', k),
            value: data.attributes[k].value || 0,
            skills: skills.filter((s) => s.attribute === k),
        }));
    }

    penalties(stat) {
        let armorPenalty = 0;
        if (stat === 'mobility') {
            armorPenalty = this.items
                .filter((i) => i.type === 'armor' && i.system.equipped)
                .reduce((acc, i) => acc + i.system.penalty, 0);
        }

        return (
            this.items
                .filter((i) => i.type === 'injury')
                .reduce((acc, i) => acc + i.system.penalty, 0) + armorPenalty
        );
    }

    pool(skill) {
        return (
            this.system.skills[skill].value +
            this.system.attributes[this.system.skills[skill].attribute].value
        );
    }

    async rollSkill(skill, bonus = 0, item = undefined) {
        const data = this.system;
        await rollStatDialog({
            actor: this,
            pool: this.pool(skill) + bonus,
            stress: data.stress?.value || 0,
            penalties: this.penalties(skill),
            label: item ? item.name : game.i18n.localize(labelFor('skills', skill)),
            item,
        });
    }

    async rollAttribute(attr) {
        const data = this.system;
        await rollStatDialog({
            actor: this,
            pool: data.attributes[attr].value,
            stress: data.stress?.value || 0,
            penalties: this.penalties(attr),
            label: game.i18n.localize(labelFor('attributes', attr)),
        });
    }
}
