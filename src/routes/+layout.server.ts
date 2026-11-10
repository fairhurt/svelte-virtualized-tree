import pkg from '../../package.json' with { type: 'json' };

export const load = () => ({ version: pkg.version });
