const { dirname } = require('path');
const { window, commands, workspace } = require('vscode');
const treekill = require('tree-kill');
const { spawn } = require('child_process');

var outputChannel = window.createOutputChannel('Run++');
var isRunning, working_dir, work_folder, runnerProcess, compilerProcess, Args;

function replacePlaceholder(cmd) {
	cmd = cmd.replace(/\${workspaceFolder}/g, work_folder);
	return cmd;
}

function stopRun() {
	treekill(compilerProcess.pid);
	treekill(runnerProcess.pid);
	isRunning = false;
}

function buildAndRun() {
	const activeEditor = window.activeTextEditor;
	if (isRunning) { window.showErrorMessage('Already running a program! Press Alt+N to stop.'); return; }
	if (activeEditor == undefined) { window.showErrorMessage('No active file found! Open a file and try again.'); return; }

	const srcFile = activeEditor.document.fileName;
	work_folder = workspace.workspaceFolders ? workspace.workspaceFolders[0].uri.fsPath : dirname(srcFile);
	const programFile = work_folder + '\\Program';
	const configs = workspace.getConfiguration('run');
	const compiler = replacePlaceholder(configs.get('compiler'));
	const args = replacePlaceholder(configs.get('compilerArgs'));
	const timelimit = configs.get('timelimit');
	const ofnstcf = Boolean(configs.get('outputFileNameSimilarToCodeFile'));
	const programArgs = replacePlaceholder(configs.get('programArgs'));
	const inputFile = replacePlaceholder(configs.get('inputFile'));
	const outputFile = (ofnstcf || (configs.get('outputFile')=="")) ? srcFile + '.output' : replacePlaceholder(configs.get('outputFile'));
	const compiler_dir = replacePlaceholder(configs.get('compilerDirectory'));

	workspace.saveAll().then(() => {
		isRunning = true;
		outputChannel.clear();
		outputChannel.show(true);
		outputChannel.appendLine(['🟪 Compiling...', compiler, "\"" + srcFile + "\"", args, '-o', "\"" + programFile + "\""].join(' '));

		if (compiler_dir == '') working_dir = work_folder;
		else working_dir = compiler_dir;

		compilerProcess = spawn(compiler, ["\"" + srcFile + "\"", args, '-o', "\"" + programFile + "\""], { cwd: working_dir, shell: true });

		compilerProcess.on("error", (data) => outputChannel.append(data.toString()));
		compilerProcess.stdout.on("data", (data) => outputChannel.append(data.toString()));
		compilerProcess.stderr.on("data", (data) => outputChannel.append(data.toString()));

		compilerProcess.on("close", (code) => {
			if (code != 0) {
				outputChannel.appendLine('🟥 Compilation Exited! Try again!'), isRunning = false;
				return;
			}

			Args = '';

			if (inputFile != '' && programArgs.indexOf("<") == -1) Args = Args + '< \"' + inputFile + '\"';
			if (outputFile != '' && programArgs.indexOf(">") == -1) Args = Args + '> \"' + outputFile + '\"';

			outputChannel.show(true);
			outputChannel.appendLine('🟦 Running.....');
			const sTime = Date.now();

			runnerProcess = spawn("\"" + programFile + "\"", [programArgs, Args], { cwd: working_dir, shell: true });

			const killer = setTimeout(() => {
				outputChannel.append('🛑 Timeout! Try again! Or check input file path in settings.');
				treekill(runnerProcess.pid);
				isRunning = false;
			}, timelimit);

			runnerProcess.on("error", (data) => {
				outputChannel.append(data.message);
				outputChannel.appendLine('🟥 ' + data.name.toString());
				clearTimeout(killer);
				isRunning = false;
			});

			runnerProcess.on('close', (exitcode, signal) => {
				const rTime = ((Date.now() - sTime) / 1000);

				if (exitcode == 0) outputChannel.append('🟩 Finished!');
				else outputChannel.append('🟥 Exited with code '+exitcode+'!');

				outputChannel.append(' Taken ' + rTime + ' seconds.');

				if (signal) outputChannel.append('. Signal: ' + signal);

				outputChannel.appendLine('');
				clearTimeout(killer);
				isRunning = false;
			});

			runnerProcess.stdout.on("data", (data) => { outputChannel.appendLine(data.toString()); });
			runnerProcess.stderr.on("data", (data) => {
				outputChannel.appendLine('Execute: ' + [programFile, programArgs, Args].join(' '));
				outputChannel.appendLine(data.toString());
			});
		});
	});
}

function activate(context) {
	context.subscriptions.push(commands.registerCommand('run.stop', () => stopRun()));
	context.subscriptions.push(commands.registerCommand('run.start', () => buildAndRun()));
}

function deactivate() { }

module.exports = { activate, deactivate }
