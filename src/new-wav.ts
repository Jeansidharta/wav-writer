import fs from 'fs';
import { Transform, Writable } from 'stream';

type WavWritableOptions = {
	channels: number,
	sampleRate: number,
	bytesPerSample: number,
};

function applyDefaultOptions (options?: Partial<WavWritableOptions>): WavWritableOptions {
	return {
		channels: 2,
		sampleRate: 44100,
		bytesPerSample: 2,
		...options,
	};
}

// export default class WavWritable {
// 	options: WavWritableOptions;
// 	stream: Transform;

// 	constructor (options?: Partial<WavWritableOptions>) {
// 		this.stream = new Transform();
// 		this.options = applyDefaultOptions(options);
// 	}

// 	async write(chunk: ArrayBuffer) {
// 		super.write(chunk);
// 	}
// }

// function writeNumberToBuffer (buffer: Uint8Array, data: number, byteLength: number, offset: number = 0) {
// 	for (let byteIndex = 0; byteIndex < byteLength; byteIndex ++) {
// 		buffer[offset + byteLength] = data;
// 		data = data >>> 8;
// 	}
// 	return buffer;
// }

// function writeStringToBuffer (buffer: Uint8Array, data: string, offset: number = 0) {
// 	for (const char of data) {
// 		buffer[offset++] = char.charCodeAt(0);
// 	}
// 	return buffer;
// }

function writeNumberToStream (stream: Transform, data: number, bytesLength: number) {
	const buffer = Buffer.alloc(bytesLength);
	for (let i = 0; i < bytesLength; i ++) {
		buffer[i] = data >>> (8 * i);
	}
	stream.write(buffer);
}

function writeHeader(stream: Transform, fileSize: number) {
	stream.write('RIFF');
	writeNumberToStream(stream, fileSize - 8, 4);
	stream.write('WAVE');
}

function writeFMT (stream: Transform, options: WavWritableOptions) {
	const FMT_SIZE = 24;
	stream.write('fmt ');
	writeNumberToStream(stream, FMT_SIZE - 8, 4);
	writeNumberToStream(stream, 1, 2);
	writeNumberToStream(stream, options.channels, 2);
	writeNumberToStream(stream, options.sampleRate, 4);
	writeNumberToStream(stream, options.sampleRate * options.channels * options.bytesPerSample, 4);
	writeNumberToStream(stream, options.channels * options.bytesPerSample, 2);
	writeNumberToStream(stream, options.bytesPerSample * 8, 2);
}

type DataFrameSource = number[];

type DataFrame = DataFrameSource[];

class WAVWritable {
	options: WavWritableOptions;
	dataFrames: (DataFrame | undefined)[];

	constructor (options?: Partial<WavWritableOptions>) {
		this.options = applyDefaultOptions(options);

		this.dataFrames = [];
	}

	addDataFrame (data: number, frameIndex: number, channel: number) {
		const dataFrame = this.dataFrames[frameIndex];
		if (dataFrame) {
			dataFrame[] = data;
		}
	}

	writeChunk (stream: Transport, chunkType: 'data' | 'fmt ', chunkData: Buffer) {
		this.fileStream.write(chunkType);
	}
}

function addTune(time: number, frequencies: number | number[], channel: number, options: WavWritableOptions){
	const data: number[] = [];
	if(typeof(frequencies) == 'number') frequencies = [frequencies];
	if(channel === undefined && options.channels != 1)
		throw('You must specify a channel');
	//else if(typeof(channel) == 'number') channel = [channel];
	let x = 0;
	let y;
	let addFactor = 1 / options.sampleRate;
	let amplitude = 1 << (options.bytesPerSample * 8 - 1) - 1;
	let verticalShift = 0;

	if(options.bytesPerSample == 1){
		verticalShift = amplitude;
	}

	for(let aux = 0; aux <= time * options.sampleRate; aux ++){
		y = 0;
		for(let aux1 = 0; aux1 < frequencies.length; aux1 ++){
			y += Math.sin(Math.PI * 2 * frequencies[aux1] * x) / (aux1 + 1);
		}
		x += addFactor;
		data.push(Math.floor(y * amplitude/frequencies.length) + verticalShift);
	}
	return data;
}

function writeData(data: number[], stream: Transform, options: WavWritableOptions){
	stream.write('data');
	const frameSize = options.channels * options.bytesPerSample;
	writeNumberToStream(stream, frameSize * data.length, 4);
	for(let aux = 0; aux < data.length; aux ++){
		writeNumberToStream(stream, data[aux], frameSize);
	}
}

export function createWavWriter (options?: Partial<WavWritableOptions>) {
	const stream = new Transform({
		transform (chunk, encoding, callback) {
			callback(null, chunk);
		},
	});
	const HEADER_SIZE = 12;
	const FMT_SIZE = 24;
	const DATA_SIZE = 8;

	const filledOptions = applyDefaultOptions(options);
	const data = addTune(1, 440, 2, filledOptions);
	let fileSize = filledOptions.bytesPerSample * filledOptions.channels * data.length + HEADER_SIZE + FMT_SIZE + DATA_SIZE;

	writeHeader(stream, fileSize);
	writeFMT(stream, filledOptions);
	writeData(data, stream, filledOptions);

	return stream;
}