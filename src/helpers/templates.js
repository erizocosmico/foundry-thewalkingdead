/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
    return loadTemplates([
        // Actor partials
        'systems/thewalkingdead/templates/actor/parts/actor-stats.hbs',
        'systems/thewalkingdead/templates/actor/parts/actor-talents.hbs',
        'systems/thewalkingdead/templates/actor/parts/actor-items.hbs',
        'systems/thewalkingdead/templates/actor/parts/actor-bio.hbs',

        // Rolls
        'systems/thewalkingdead/templates/roll/stat.hbs',

        // Dialogs
        'systems/thewalkingdead/templates/dialogs/roll.hbs',
    ]);
};

export function registerHelpers() {
    Handlebars.registerHelper('range', function (start, end) {
        let range = [];
        for (let i = start; i <= end; i++) {
            range.push(i);
        }
        return range;
    });

    Handlebars.registerHelper('loc', function (...args) {
        args.pop();
        return game.i18n.localize(`THEWALKINGDEAD.${args.join('.')}`);
    });

    Handlebars.registerHelper('cond', function (cond, result) {
        return cond ? result : '';
    });

    Handlebars.registerHelper({
        eq: (v1, v2) => v1 === v2,
        ne: (v1, v2) => v1 !== v2,
        lt: (v1, v2) => v1 < v2,
        gt: (v1, v2) => v1 > v2,
        lte: (v1, v2) => v1 <= v2,
        gte: (v1, v2) => v1 >= v2,
        and() {
            return Array.prototype.every.call(arguments, Boolean);
        },
        or() {
            return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
        },
        isSelected: (cond) => (cond ? 'selected' : ''),
    });
}
