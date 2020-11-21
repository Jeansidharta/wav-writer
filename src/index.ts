import fs from 'fs';
import { createWavWriter } from './new-wav';
import path from 'path';

const sleep = (time: number) => new Promise(resolve => setTimeout(resolve, time));

// async function main () {
// 	while (true) {
// 		const timeFrame = Date.now();
// 		const bit = Math.sin((timeFrame - start) * 440 * Math.PI / 1000) * 255;
// 		const buffer = new Uint8Array(1);
// 		buffer.fill(bit);
// 		speaker.write(buffer);
// 		await sleep(0);
// 	}
// }
// process.stdin.pipe(speaker);
// main();

// const stream = fs.createReadStream(require.resolve('./file_example_WAV_1MG.wav'));
// stream.pipe(speaker);

const filePath = path.join(require.main!.path, 'teste.wav');
const fileStream = fs.createWriteStream(filePath, { flags: 'w' });

console.log('Initializing...');
const duplex = createWavWriter();
duplex.pipe(fileStream);

setInterval(() => {}, 999999);