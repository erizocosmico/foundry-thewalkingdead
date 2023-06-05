export function labelFor(...args) {
    return `THEWALKINGDEAD.${args.join('.')}`;
}

export function localize(...args) {
    return game.i18n.localize(labelFor(...args));
}
