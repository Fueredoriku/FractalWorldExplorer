# Fractal World Explorer
An interactive TDT4230 project where one can explore fractal worlds.

This application implemnts a kaleidoscope IFS, meaning that the fractal forms are very editable.
The application provides a way to look at these fractals by tweaking various parameters.
One can as an example look at a fractal that shifts over time, or look at various landscapes created by a combination noise and repeated fractals.

## Input Parameters
    Parameters can be set when starting the epplication in the form of:
	"./glowbox --example-input" or "./glowbox -e"

	- "--help" or "-h", Shows help message.
    - "--demo" or "-d", Toggles between example inputs and camera angles to showcase functionality
    - "--enable-music" or "-m", Plays background music while the game is playing
    - "--still" or "-s", Disables travel along terrain, and instead focuses on a single object
    - "--fractal-mirror" or "-f", Increases the amount of times fractal is folded, which increases the detail/complexity of the fractal
    - "--fractal-rotate-x" or "-x", Folds fractals in the x-axis with float degrees while generating
    - "--fractal-rotate-y" or "-y", Folds fractals in the y-axis with float degrees while generating
    - "--fractal-rotate-z" or "-z", Folds fractals in the z-axis with float degrees while generating
    - "--fractal-animate" or "-t", Apply rotational offset over time, animating the fractals
    - "--period" or "-p", The frequency and thus distance objects repeat, a period of 2 is completly even
    - "--noise-disable" or "-n", Disables both height and fractal rotation noise

### Examples of inputs
Varied box terrain:

-p=2.65

![Varied box terrain image](/res/Images/variedBoxTerrain.png "Varied box terrain")

Tesseract-like folding in an even plane:

-y=2. -t -p=2.2 -n

![Tesseract terrain image](/res/Images/tesseractFolding.png "Tesseract-like terrain")

Forest roof:

-p=2.9 -x=39.5 z=-38.9 -y=8.9 -f=5

![Forest terrain image](/res/Images/forest.png "Forest-roof terrain")

Close up, standing still looking at animated fractal:

-z=2. -f=4 -p=47 -n -t -s

![Single z-rotated fractal image](/res/Images/SingleZRotationFractal.png "Single z-rotated fractal")

Same fractal as above, double the resolution:

-z=2. -f=8 -p=47 -n -t -s

![Z-rotated fractal extra folds image](/res/Images/SingleZRotationFractalExtraFolds.png "Single z-rotated fractal folded extra")


Very varied animated fractal:

-p=49 -f=5 -z=1 -y=6 -x=-1 -t -n -s

Animated fractal tunnel:

-y=5 -t -p=4.2 -n -s -f=6

![Fractal tunnel image](/res/Images/tunnel.png "Fractal tunnel")

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

This flag could also be very useful for utilizing the GPU:
__NV_PRIME_RENDER_OFFLOAD=1 __GLX_VENDOR_LIBRARY_NAME=nvidia 
