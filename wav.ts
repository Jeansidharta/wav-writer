const HEADER_SIZE = 12;
const FMT_SIZE = 24;
const DATA_SIZE = 8;
const PI2 = Math.PI * 2;

class WAV{
	numChannels: number;
	sampleRate: number;
	bytesPerSample: number;
	data: number[];
	int8View: Int8Array | null;
	int8Index: number;

	constructor(numChannels: number, sampleRate: number, bytesPerSample: number){
		this.numChannels = numChannels;
		this.sampleRate = sampleRate;
		this.bytesPerSample = bytesPerSample;

		this.data = [];
		this.int8View = null;
		this.int8Index = 0;
	}

	addTune(time: number, frequencies: number | number[], channel: number){
		if(typeof(frequencies) == "number") frequencies = [frequencies];
		if(channel === undefined && this.numChannels != 1)
			throw("You must specify a channel");
		//else if(typeof(channel) == "number") channel = [channel];
		let x = 0;
		let y;
		let addFactor = 1 / this.sampleRate;
		let amplitude = 1 << (this.bytesPerSample * 8 - 1) - 1;
		let verticalShift = 0;

		if(this.bytesPerSample == 1){
			verticalShift = amplitude;
		}

		for(let aux = 0; aux <= time * this.sampleRate; aux ++){
			y = 0;
			for(let aux1 = 0; aux1 < frequencies.length; aux1 ++){
				y += Math.sin(PI2 * frequencies[aux1] * x) / (aux1 + 1);
			}
			x += addFactor;
			this.data.push(Math.floor(y * amplitude/frequencies.length) + verticalShift);
		}
	}

	writeToBuffer(data: string): void;
	writeToBuffer(data: number, numOfBytes: number): void;
	writeToBuffer(data: string | number, numOfBytes?: number) {
		let aux: number;
		if (!this.int8View) throw new Error('array must be initialized');
		if(typeof(data) == "string"){
			for(aux = 0; aux < data.length; aux ++){
				// this.int8View[aux + this.int8Index] = data[aux].asciiCode();
			}
		}
		else if(typeof(data) == "number" && numOfBytes !== undefined){
			for(aux = 0; aux < numOfBytes; aux ++){
				this.int8View[aux + this.int8Index] = data;
				data = data >>> 8;
			}
		} else throw new Error('Invalid arguments');
		this.int8Index += aux;
	}

	makeHeader(fileSize: number){
		this.writeToBuffer("RIFF");
		this.writeToBuffer(fileSize - 8, 4);
		this.writeToBuffer("WAVE");
	}

	makeFMT(){
		this.writeToBuffer("fmt ");
		this.writeToBuffer(FMT_SIZE - 8, 4);
		this.writeToBuffer(1, 2);
		this.writeToBuffer(this.numChannels, 2);
		this.writeToBuffer(this.sampleRate, 4);
		this.writeToBuffer(this.sampleRate * this.numChannels * this.bytesPerSample, 4);
		this.writeToBuffer(this.numChannels * this.bytesPerSample, 2);
		this.writeToBuffer(this.bytesPerSample * 8, 2);
	}

	makeData(){
		this.writeToBuffer("data");
		this.writeToBuffer(this.numChannels * this.bytesPerSample * this.data.length, 4);

		for(let aux = 0; aux < this.data.length; aux ++){
			this.writeToBuffer(this.data[aux], this.numChannels * this.bytesPerSample);
		}
	}

	makeFile(){
		let fileSize = this.bytesPerSample * this.numChannels * this.data.length + HEADER_SIZE + FMT_SIZE + DATA_SIZE;
		let buffer = new ArrayBuffer(fileSize);
		this.int8View = new Int8Array(buffer);
		this.int8Index = 0;

		this.makeHeader(fileSize);
		this.makeFMT();
		this.makeData();

		let blob = new Blob([buffer]);
		return URL.createObjectURL(blob);
	}
}