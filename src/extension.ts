import * as vscode from 'vscode';
const _path = require('path');
const _spawn = require('child_process').spawn;
const _rp = require("request-promise");
const _vlcjs = require('vlc.js');
//
let _sbBtnOpen: vscode.StatusBarItem;
let _sbBtnPlay: vscode.StatusBarItem;
let _sbBtnStop: vscode.StatusBarItem;
let _sbBtnPrev: vscode.StatusBarItem;
let _sbBtnNext: vscode.StatusBarItem;
let _sbBtnRadio: vscode.StatusBarItem;
let _sbPlayer: vscode.StatusBarItem;


export function activate(context: vscode.ExtensionContext) {

	const player = new Player();

	let loadMusic = vscode.commands.registerCommand('extension.loadmusic', () => {
		player.playerLoad();
	});

	let startMusic = vscode.commands.registerCommand('extension.startmusic', () => {
		player.playerStart();
	});

	let stopMusic = vscode.commands.registerCommand('extension.stopmusic', () => {
		player.playerStop();
	});

	let pauseMusic = vscode.commands.registerCommand('extension.pausemusic', () => {
		player.playerPause();
	});

	let prevMusic = vscode.commands.registerCommand('extension.prevmusic', () => {
		player.playerPrev();
	});

	let nextMusic = vscode.commands.registerCommand('extension.nextmusic', () => {
		player.playerNext();
	});

	let loadRario = vscode.commands.registerCommand('extension.loadradio', () => {
		player.radioLoad();
	});

	let stopRadio = vscode.commands.registerCommand('extension.stopradio', () => {
		player.radioStop();
	});

	_sbBtnOpen = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 7);
	_sbBtnPlay = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 6);
	_sbBtnPrev = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 5);
	_sbBtnStop = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 4);
	_sbBtnNext = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 3);
	_sbBtnRadio = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 2);
	_sbPlayer = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);

	context.subscriptions.push(loadMusic, startMusic, stopMusic, pauseMusic, prevMusic, nextMusic, loadRario, stopRadio);
}


class Player {
	_vlcPath: string = '';
	_vlc: string = '';
	_playList: string = '';
	_address: string = '';
	_password: string = '';
	_port: number = 0;
	_client: any;

	constructor() {
		this.getSettings();
		this._vlc = _path.join(this._vlcPath, 'vlc.exe');

		_spawn(this._vlc, ['-I', 'dummy']);

		this._client = new _vlcjs.Client({
			address: this._address,
			password: this._password,
			port: this._port,
		});
	}

	getSettings() {
		const config = vscode.workspace.getConfiguration('vlc');
		this._vlcPath = config.path;
		this._address = config.address;
		this._port = config.port;
		this._password = config.pass;
	}

	playerLoad(): void {
		this.setStatusBar();

		const options: vscode.OpenDialogOptions = {
			canSelectFolders: true,
		};

		vscode.window.showOpenDialog(options).then(fileUri => {
			if (fileUri && fileUri[0]) {
				this._playList = fileUri[0].fsPath;
				this._client.command(`pl_empty`);
				this._client.command(`in_play&input=${this._playList}`);
				this.filenamePlay();
			}
		});
	}

	playerStart() {
		this._client.command('pl_play').then(() => {
			this.setStatusBar();
			this.filenamePlay();
		}).catch((err: any) => {
			vscode.window.showErrorMessage('Error', err);
		});
	}

	playerStop() {
		this._client.command('pl_stop').then(() => {
			console.log('stop');
		}).catch((err: any) => {
			vscode.window.showErrorMessage('Error', err);
		});
	}

	playerPause() {
		this._client.command('pl_pause').then(() => {
			console.log('pause');
		}).catch((err: any) => {
			vscode.window.showErrorMessage('Error', err);
		});
	}

	playerPrev() {
		this._client.command('pl_previous').then(() => {
			console.log('prev');
			this.filenamePlay();
		}).catch((err: any) => {
			vscode.window.showErrorMessage('Error', err);
		});
	}

	playerNext() {
		this._client.command('pl_next').then(() => {
			console.log('next');
			this.filenamePlay();
		}).catch((err: any) => {
			vscode.window.showErrorMessage('Error', err);
		});
	}

	async radioLoad() {
		this.setStatusBar();

		let radio = await vscode.window.showInputBox({
			placeHolder: 'Ingrgese la url de la radio',
		});

		if (radio !== null) {
			this._client.command(`pl_empty`);
			this._client.command(`in_play&input=${radio}`);
			this.filenamePlay();
		}
	}

	radioStop() {
		this.playerStop();
	}

	filenamePlay() {
		let jsonResult: any = '';

		const credentials = Buffer.from(`:${this._password}`, 'utf8').toString('base64');

		const options = {
			method: 'GET',
			url: `http://${this._address}:${this._port}/requests/status.json`,
			headers: {
				authorization: `Basic ${credentials}`
			}
		};

		setTimeout(() => {
			_rp(options)
				.then(function (repos: any) {
					jsonResult = JSON.parse(repos);
					if (jsonResult.state === 'playing') {
						_sbPlayer.text = jsonResult.information.category.meta.filename;
						_sbPlayer.show();
					}
				})
				.catch(function (err: any) {
					console.log(err);
				});
		}, 1500);

	}

	setStatusBar() {
		_sbBtnOpen.text = '$(folder)';
		_sbBtnOpen.command = 'extension.loadmusic';
		_sbBtnOpen.show();

		_sbBtnPlay.text = '$(debug-start)';
		_sbBtnPlay.command = 'extension.startmusic';
		_sbBtnPlay.show();

		_sbBtnPrev.text = '$(triangle-left)';
		_sbBtnPrev.command = 'extension.prevmusic';
		_sbBtnPrev.show();

		_sbBtnStop.text = '$(debug-pause)';
		_sbBtnStop.command = 'extension.stopmusic';
		_sbBtnStop.show();

		_sbBtnNext.text = '$(triangle-right)';
		_sbBtnNext.command = 'extension.nextmusic';
		_sbBtnNext.show();

		_sbBtnRadio.text = '$(radio-tower)';
		_sbBtnRadio.command = 'extension.loadradio';
		_sbBtnRadio.show();
	}
}

export function deactivate() {}