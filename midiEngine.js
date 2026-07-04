import { Sequencer, WorkletSynthesizer } from "spessasynth_lib";

// Lazy-initialized singleton: one AudioContext/synth/sequencer for the whole app,
// loaded with The_Ultimate_Wii_Soundfont_V1-1.sf2 so every .mid in /music plays
// through real SF2 instruments instead of a generic default soundfont.
let readyPromise = null;
let synth = null;
let sequencer = null;
let currentSrc = null;

function init() {
  if (!readyPromise) {
    readyPromise = (async () => {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      await ctx.audioWorklet.addModule(window.SPESSASYNTH_WORKLET_URL);
      synth = new WorkletSynthesizer(ctx);
      synth.connect(ctx.destination);
      await synth.isReady;
      const sfBuf = await fetch("The_Ultimate_Wii_Soundfont_V1-1.sf2").then((r) => r.arrayBuffer());
      await synth.soundBankManager.addSoundBank(sfBuf, "main");
      sequencer = new Sequencer(synth);
      sequencer.loopCount = Infinity;
      return { ctx, synth, sequencer };
    })();
  }
  return readyPromise;
}

export async function playMidi(url) {
  const { ctx } = await init();
  if (ctx.state !== "running") {
    try { await ctx.resume(); } catch (e) {}
  }
  if (currentSrc === url && !sequencer.paused) return;
  currentSrc = url;
  const midiBuf = await fetch(url).then((r) => r.arrayBuffer());
  sequencer.loadNewSongList([{ binary: midiBuf }]);
  sequencer.play();
}

export function stopMidi() {
  currentSrc = null;
  if (!sequencer) return;
  try {
    sequencer.pause();
    synth.stopAll(true);
  } catch (e) {}
}

export function setMidiVolume(v) {
  if (!synth) return;
  try { synth.setSystemParameter("gain", Math.max(0, v)); } catch (e) {}
}

export function isMidiPlaying() {
  return !!sequencer && !sequencer.paused;
}
