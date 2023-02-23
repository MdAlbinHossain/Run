# Run++

Run C/C++ programs with timelimit and input/output redirections focusing competitive programming.

No more freopen and hangups for infinite loops! Break automatically after timelimit.

This extension allows to run program in output channel. It also shows errors(if any) in output channel and how much time the program is taking to run.

## Pulished at [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=AlbinBD.run)

## Features

- Run C/C++ programs.
- Redirect input and output to files.
- Stop program automatically after `timelimit`.
- Press `Alt+B` to build and run in outputchannel with I/O redirections.
- Press `Alt+N` to stop program manually.

## Bonus Features

- Works for Python and Java 11+ too!

## Requirements

* Install mingw64 or other C/C++ compiler.
* Make sure `g++` is available in `PATH` or setup compiler dirctory in settings.
* Similar for Java/Python if you want to run Java/Python.

## Usage

* `run.compiler`: Set compiler name e.g. `g++` if already set in path. Otherwise, full path `${workspaceFolder}\\mingw\\bin\\g++.exe`
* `run.compilerArgs`: Set any optional Arguments separated by spaces for compilation. For example, `-O2 -std=c++14`
* `run.timelimit`: Set time limit, maximum amount of time your programm is allowed to run.
* `run.programArgs`: Set arguments to pass for executable program.
* `run.inputFile`: Set Full path of the input file. e.g `${workspaceFolder}\\Input.txt`
* `run.outputFile`: Set Full path of the output file. e.g `${workspaceFolder}\\Output.txt`
* `run.compilerDirectory`: Full path of the Compiler bin Directory. e.g `${workspaceFolder}\\MinGW64\\bin`. (Optional, if already added in environment varible path.)

## Variables

* `${workspaceFolder}`: substitutes with active workspace folder path.

## Feedback

### [Write a review](https://marketplace.visualstudio.com/items?itemName=AlbinBD.run&ssr=false#review-details)

## Happy Coding :)
