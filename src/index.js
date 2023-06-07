// Import document classes.
import { TWDActor } from './documents/actor.js';
import { TWDItem } from './documents/item.js';
// Import sheet classes.
import { TWDActorSheet } from './sheets/actor.js';
import { TWDBaseItemSheet } from './sheets/items/base.js';
import { TWDInjuryItemSheet } from './sheets/items/injury.js';
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates, registerHelpers } from './helpers/templates.js';
import './styles/thewalkingdead.scss';
import { TWDBaseDie, TWDStressDie, registerDice3D } from './rolls/dice.js';
import { handleRollPush } from './rolls/roll.js';
import { createItemMacro, rollItemMacro } from './macros.js';
import { THEWALKINGDEAD } from './helpers/config.js';

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function () {
    // Add utility classes to the global game object so that they're more easily
    // accessible in global contexts.
    game.thewalkingdead = {
        TWDActor,
        TWDItem,
        rollItemMacro,
    };

    CONFIG.Dice.terms['w'] = TWDBaseDie;
    CONFIG.Dice.terms['s'] = TWDStressDie;

    // Define custom Document classes
    CONFIG.Actor.documentClass = TWDActor;
    CONFIG.Item.documentClass = TWDItem;
    CONFIG.THEWALKINGDEAD = THEWALKINGDEAD;

    // Register sheet application classes
    Actors.unregisterSheet('core', ActorSheet);
    Actors.registerSheet('thewalkingdead', TWDActorSheet, { makeDefault: true });
    Items.unregisterSheet('core', ItemSheet);
    Items.registerSheet('thewalkingdead', TWDBaseItemSheet, {
        types: ['armor', 'gear', 'weapon', 'talent'],
        makeDefault: true,
    });
    Items.registerSheet('thewalkingdead', TWDInjuryItemSheet, {
        types: ['injury'],
        makeDefault: true,
    });

    // Preload Handlebars templates.
    return preloadHandlebarsTemplates();
});

registerHelpers();

Hooks.once('ready', async function () {
    Hooks.on('hotbarDrop', (bar, data, slot) => createItemMacro(data, slot));
});

Hooks.once('diceSoNiceReady', registerDice3D);

Hooks.on('renderChatMessage', handleRollPush);
