/**
 * T-038 Fix 1: the audio test hook (?uji-audio, __sfxLog, __rekamSfx) is compiled in only for the Vite dev server or a
 * build with VITE_UJI_AUDIO=on. A build-time constant (vite.config.ts define), so production bundles drop the code and
 * its strings entirely. Outside Vite (node tests) the constant is absent and the hook is off.
 */
declare const __UJI_AUDIO__: boolean | undefined;
export const UJI_AUDIO: boolean = typeof __UJI_AUDIO__ === 'boolean' ? __UJI_AUDIO__ : false;
