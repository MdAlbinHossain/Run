const { dirname } = require('path');
const { window, commands, workspace } = require('vscode');
const treekill = require('tree-kill');
const { spawn } = require('child_process');

var outputChannel = window.createOutputChannel('Run++');
var isRunning, working_dir, work_folder, runnerProcess, compilerProcess, runArgs;
var srcFile, work_folder, programFile, configs, compiler, args, timelimit, ofnstcf, programArgs, inputFile, outputFile, compiler_dir;

function replacePlaceholder(cmd) {
	cmd = cmd.replace(/\${workspaceFolder}/g, work_folder);
	return cmd;
}

function stopRun() {
	treekill(compilerProcess.pid);
	treekill(runnerProcess.pid);
	isRunning = false;
}

function Run(executor) {
	outputChannel.show(true);
	outputChannel.appendLine('🟦 Running.....');
	const sTime = Date.now();

	runnerProcess = spawn("\"" + executor + "\"", [programArgs, runArgs, srcFile], { cwd: working_dir, shell: true });

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
		else outputChannel.append('🟥 Exited with code ' + exitcode + '!');

		outputChannel.append(' Taken ' + rTime + ' seconds.');

		if (signal) outputChannel.append('. Signal: ' + signal);

		outputChannel.appendLine('');
		clearTimeout(killer);
		isRunning = false;
	});

	runnerProcess.stdout.on("data", (data) => { outputChannel.appendLine(data.toString()); });
	runnerProcess.stderr.on("data", (data) => {
		outputChannel.appendLine('Execute: ' + [executor, programArgs, runArgs].join(' '), srcFile);
		outputChannel.appendLine(data.toString());
	});
}

function buildAndRun() {
	activeEditor = window.activeTextEditor;
	if (isRunning) { window.showErrorMessage('Already running a program! Press Alt+N to stop.'); return; }
	if (activeEditor == undefined) { window.showErrorMessage('No active file found! Open a file and try again.'); return; }

	srcFile = activeEditor.document.fileName;
	work_folder = workspace.workspaceFolders ? workspace.workspaceFolders[0].uri.fsPath : dirname(srcFile);
	programFile = work_folder + '\\Program';
	configs = workspace.getConfiguration('run');
	compiler = replacePlaceholder(configs.get('compiler'));
	args = replacePlaceholder(configs.get('compilerArgs'));
	timelimit = configs.get('timelimit');
	ofnstcf = Boolean(configs.get('outputFileNameSimilarToCodeFile'));
	programArgs = replacePlaceholder(configs.get('programArgs'));
	inputFile = replacePlaceholder(configs.get('inputFile'));
	outputFile = ofnstcf ? srcFile + '.output' : replacePlaceholder(configs.get('outputFile'));
	compiler_dir = replacePlaceholder(configs.get('compilerDirectory'));

	workspace.saveAll().then(() => {
		isRunning = true;

		if (compiler_dir == '') working_dir = work_folder;
		else working_dir = compiler_dir;

		runArgs = '';

		if (inputFile != '' && programArgs.indexOf("<") == -1) runArgs = runArgs + '< \"' + inputFile + '\"';
		if (outputFile != '' && programArgs.indexOf(">") == -1) runArgs = runArgs + '> \"' + outputFile + '\"';

		outputChannel.clear();
		outputChannel.show(true);

		if (activeEditor.document.languageId == 'java') { Run('java'); return; }

		if (activeEditor.document.languageId == 'python') { Run('python'); return; }

		outputChannel.appendLine(['🟪 Compiling...', compiler, "\"" + srcFile + "\"", args, '-o', "\"" + programFile + "\""].join(' '));

		compilerProcess = spawn(compiler, ["\"" + srcFile + "\"", args, '-o', "\"" + programFile + "\""], { cwd: working_dir, shell: true });

		compilerProcess.on("error", (data) => outputChannel.append(data.toString()));
		compilerProcess.stdout.on("data", (data) => outputChannel.append(data.toString()));
		compilerProcess.stderr.on("data", (data) => outputChannel.append(data.toString()));

		compilerProcess.on("close", (code) => {
			if (code != 0) {
				outputChannel.appendLine('🟥 Compilation Exited! Try again!'), isRunning = false;
				return;
			}
			Run(programFile);
		});
	});
}

function activate(context) {
	context.subscriptions.push(commands.registerCommand('run.stop', () => stopRun()));
	context.subscriptions.push(commands.registerCommand('run.start', () => buildAndRun()));
}

function deactivate() { }

module.exports = { activate, deactivate }
