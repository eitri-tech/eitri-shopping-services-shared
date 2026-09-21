function loadLamejs() {
  if (window.lamejs) {
    return Promise.resolve(window.lamejs);
  }

  return new Promise((resolve, reject) => {
    /* prevents the @breezystack/lamejs package from being added to the final build and only fetches it when requested */
    const script = document.createElement('script');
    script.src = 'https://cdn.cloud.weni.ai/npmjs/lamejs@1.2.1.min.js';

    script.onload = () => resolve(window.lamejs);
    script.onerror = () => reject(new Error('Failed to load lamejs library.'));

    document.head.appendChild(script);
  });
}

export async function audioToMp3Blob(audioChunks) {
  try {
    const lamejs = await loadLamejs();
    const mimeType =
      audioChunks.length > 0 ? audioChunks[0].type : 'audio/webm';
    const audioBlob = new Blob(audioChunks, { type: mimeType });
    const audioBufferArray = await audioBlob.arrayBuffer();

    const audioContext = new (
      window.AudioContext || window.webkitAudioContext
    )();
    const audioBuffer = await audioContext.decodeAudioData(audioBufferArray);

    const numChannels = 1;
    const sampleRate = audioBuffer.sampleRate;
    const kbps = 128;
    const mp3Encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, kbps);

    const pcmData = audioBuffer.getChannelData(0);
    const samples = new Int16Array(pcmData.length);

    for (let i = 0; i < pcmData.length; i++) {
      let s = Math.max(-1, Math.min(1, pcmData[i]));
      samples[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    const mp3Data = [];
    const bufferSize = 1152;

    for (let i = 0; i < samples.length; i += bufferSize) {
      const sampleChunk = samples.subarray(i, i + bufferSize);
      const mp3buf = mp3Encoder.encodeBuffer(sampleChunk);
      if (mp3buf.length > 0) {
        mp3Data.push(new Int8Array(mp3buf));
      }
    }

    const mp3buf = mp3Encoder.flush();
    if (mp3buf.length > 0) {
      mp3Data.push(new Int8Array(mp3buf));
    }

    return new Blob(mp3Data, { type: 'audio/mp3' });
  } catch (error) {
    throw error;
  }
}
