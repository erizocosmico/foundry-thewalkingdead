import { labelFor, localize } from '../helpers/i18n';
import { TWDBaseDie, TWDStressDie } from './dice';

export async function rollStatDialog({
    actor,
    pool,
    stress = 0,
    penalties = 0,
    label = '',
    item = undefined,
}) {
    const template = await renderTemplate('systems/thewalkingdead/templates/dialogs/roll.hbs', {
        showPassive: !item,
    });
    const buttons = {
        roll: {
            icon: '<i class="fas fa-check"></i>',
            label: localize('rolls', 'roll'),
            callback: async (html) => {
                const modifier = parseInt(html.find('#twd-roll-mod')[0].value) || 0;
                const passive = !item ? html.find('#twd-roll-passive')[0].checked : false;

                await rollStat({
                    actor,
                    pool,
                    stress,
                    penalties,
                    label,
                    modifier,
                    passive,
                    item,
                });
            },
        },
        cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: localize('cancel'),
        },
    };

    new Dialog({
        title: `${localize('rolls', 'roll')}: ${label}`,
        content: template,
        buttons: buttons,
        default: 'roll',
    }).render(true);
}

export async function rollWeapon(actor, weapon) {
    const template = await renderTemplate('systems/thewalkingdead/templates/dialogs/roll.hbs', {
        showRange: weapon.system.ranged,
    });
    const buttons = {
        roll: {
            icon: '<i class="fas fa-check"></i>',
            label: localize('rolls', 'roll'),
            callback: async (html) => {
                const modifier = parseInt(html.find('#twd-roll-mod')[0].value) || 0;
                let skill;
                if (!weapon.system.ranged) {
                    skill = 'close_combat';
                } else {
                    skill = html.find('#twd-roll-close-combat')[0].checked
                        ? 'close_combat'
                        : 'ranged_combat';
                }

                await rollStat({
                    actor,
                    pool: actor.pool(skill) + (weapon.system.bonus || 0),
                    stress: actor.system.stress.value,
                    penalties: actor.penalties(skill),
                    label: weapon.name,
                    modifier,
                    item: weapon,
                });
            },
        },
        cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: localize('cancel'),
        },
    };

    new Dialog({
        title: `${localize('rolls', 'roll')}: ${weapon.name}`,
        content: template,
        buttons: buttons,
        default: 'roll',
    }).render(true);
}

export async function rollStat({
    actor,
    pool,
    stress = 0,
    penalties = 0,
    label = '',
    modifier = 0,
    passive = false,
    item = undefined,
}) {
    pool = (Number(pool) || 0) + (Number(penalties) || 0) + modifier;
    stress = Number(stress) || 0;
    if (pool <= 0) pool = 1;

    const roll = await new Roll(`${pool}dw + ${stress}ds`, {}).evaluate();
    const numSuccesses = successes(roll);
    const messedUp = walkers(roll) > 0;

    if (item) {
        label = item.name;
    }

    const rollData = {
        label: modifier ? `${label} (${modifier > 0 ? '+' : ''}${modifier})` : label,
        results: resultsFromRoll(roll),
        successes: numSuccesses,
        successLabel:
            numSuccesses === 1 ? labelFor('rolls', 'success') : labelFor('rolls', 'successes'),
        success: numSuccesses > 0,
        messedUp,
        fail: numSuccesses === 0,
        canPush: actor.type === 'character' && numSuccesses < pool + stress && !passive,
        item,
    };

    const html = await renderTemplate('systems/thewalkingdead/templates/roll/stat.hbs', rollData);

    let chatData = {
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({
            alias: actor.data.name,
            actor,
        }),
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        roll,
        rollMode: game.settings.get('core', 'rollMode'),
        content: html,
    };

    if (['gmroll', 'blindroll'].includes(chatData.rollMode)) {
        chatData.whisper = ChatMessage.getWhisperRecipients('GM');
    } else if (chatData.rollMode === 'selfroll') {
        chatData.whisper = [game.user];
    }

    ChatMessage.create(chatData);
    return null;
}

async function rerollStat(message, previousRoll, label, item = undefined) {
    const pool = misses(previousRoll, TWDBaseDie);
    const stress = misses(previousRoll, TWDStressDie) + 1;

    const roll = await new Roll(`${pool}dw + ${stress}ds`, {}).evaluate();
    const numSuccesses = successes(roll) + successes(previousRoll);
    const messedUp = walkers(roll) > 0;

    const rollData = {
        label,
        results: resultsFromRoll(previousRoll),
        pushResults: resultsFromRoll(roll),
        successes: numSuccesses,
        successLabel:
            numSuccesses === 1 ? labelFor('rolls', 'success') : labelFor('rolls', 'successes'),
        success: numSuccesses > 0,
        messedUp,
        fail: numSuccesses === 0,
        canPush: false,
        pushed: true,
        item,
    };

    if (game.dice3d) {
        await game.dice3d.showForRoll(
            roll,
            message.user,
            true,
            message.whisper,
            message.blind,
            message._id,
            message.speaker,
        );
    }

    const html = await renderTemplate('systems/thewalkingdead/templates/roll/stat.hbs', rollData);

    message.update({ content: html });
}

export async function handleRollPush(message, html) {
    html.find('button.twd-roll-push').click(async (e) => {
        e.preventDefault();
        const actor = game.actors.get(message.speaker.actor);
        if (!actor) return;

        if (actor.type === 'character' && actor.system.stress.value < 5) {
            actor.update({ 'system.stress.value': actor.system.stress.value + 1 });
        }
        const label = html.find('h3').text();
        const itemElem = html.find('.twd-roll-item');
        const item = itemElem.length > 0 ? JSON.parse(itemElem[0].dataset.item) : undefined;

        await rerollStat(message, message.rolls[0], label, item);
    });
}

function successes(roll) {
    let successes = 0;
    for (let term of roll.terms) {
        if (term instanceof TWDBaseDie || term instanceof TWDStressDie) {
            for (let r of term.results) {
                if (r.result === 6) successes++;
            }
        }
    }

    return successes;
}

function misses(roll, diceType) {
    let misses = 0;
    for (let term of roll.terms) {
        if (term instanceof diceType) {
            for (let r of term.results) {
                if (r.result < 6) misses++;
            }
        }
    }
    return misses;
}

function walkers(roll) {
    let walkers = 0;
    for (let term of roll.terms) {
        if (term instanceof TWDStressDie) {
            for (let r of term.results) {
                if (r.result === 1) walkers++;
            }
        }
    }
    return walkers;
}

function resultsFromRoll(roll) {
    const results = { base: [], stress: [] };
    for (let term of roll.terms) {
        if (term instanceof TWDBaseDie) {
            results.base.push(...term.results.map((r) => r.result));
        }
        if (term instanceof TWDStressDie) {
            results.stress.push(...term.results.map((r) => r.result));
        }
    }
    return results;
}

export async function simpleRoll(pool, label = localize('rolls', 'custom_roll'), item = undefined) {
    const roll = await new Roll(`${pool}dw`, {}).evaluate();
    const numSuccesses = successes(roll);
    const messedUp = walkers(roll) > 0;

    const rollData = {
        label,
        results: resultsFromRoll(roll),
        successes: numSuccesses,
        successLabel:
            numSuccesses === 1 ? labelFor('rolls', 'success') : labelFor('rolls', 'successes'),
        success: numSuccesses > 0,
        messedUp,
        fail: numSuccesses === 0,
        canPush: false,
        item,
    };

    const html = await renderTemplate('systems/thewalkingdead/templates/roll/stat.hbs', rollData);

    let chatData = {
        user: game.user.id,
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        roll,
        rollMode: game.settings.get('core', 'rollMode'),
        content: html,
    };

    if (['gmroll', 'blindroll'].includes(chatData.rollMode)) {
        chatData.whisper = ChatMessage.getWhisperRecipients('GM');
    } else if (chatData.rollMode === 'selfroll') {
        chatData.whisper = [game.user];
    }

    ChatMessage.create(chatData);
    return null;
}
