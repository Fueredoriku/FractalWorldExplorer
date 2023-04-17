# Fractal World Explorer
An interactive TDT4230 project where one can explore fractal worlds.

This application implemnts a kaleidoscope IFS, meaning that the fractal forms are very editable.
The application provides a way to look at these fractals by tweaking various parameters.
One can as an example look at a fractal that shifts over time, or look at various landscapes created by a combination noise and repeated fractals.

## Input Parameters
    Parameters can be set when starting the epplication in the form of:
	"./glowbox --example-input" or "./glowbox -e"

	- "--help" or "-h", Shows help message.
    - "--enable-music" or "-m", Plays background music while the game is playing
    - "--still" or "-s", Disables travel along terrain, and instead focuses on a single object
    - "--fractal-mirror" or "-f", Increases the amount of times fractal is folded, which increases the detail/complexity of the fractal
    - "--fractal-rotate-x" or "x", Folds fractals in the x-axis with float degrees while generating
    - "--fractal-rotate-y" or "y", Folds fractals in the y-axis with float degrees while generating
    - "--fractal-rotate-z" or "z", Folds fractals in the z-axis with float degrees while generating
    - "--fractal-animate" or "t", Apply rotational offset over time, animating the fractals
    - "--period" or "p", The frequency and thus distance objects repeat, a period of 2 is completly even
    - "--noise-disable" or "n", Disables both height and fractal rotation noise

### Examples of inputs
Varied box terrain:

no Input

Tesseract-like folding in an even plane:

-y=2. -t -p=2 -n

Forest roof:

-x=0.5 -z=0.9

Close up, standing still looking at animated high resolution fractal:

-z=2. -m=10 -p=45 -n -t -s
 



## Build the app:

I highly recommend building this with linux.

### Windows

Install Microsoft Visual Studio Express and CMake.
You may use CMake-gui or the command-line cmake to generate a Visual Studio solution.

### Linux:

Make sure you have a C/C++ compiler such as  GCC, CMake and Git.

	make run

which is equivalent to

	git submodule update --init
	cd build
	cmake ..
	make
	./glowbox
