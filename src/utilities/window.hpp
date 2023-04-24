#pragma once

// System Headers
#include <glad/glad.h>

// Standard headers
#include <string>

// Constants
const int         windowWidth     = 1920;
const int         windowHeight    = 1080;
const std::string windowTitle     = "FractalWorldExplorer";
const GLint       windowResizable = GL_FALSE;
const int         windowSamples   = 4;

struct CommandLineOptions {
    bool enableMusic;
    bool still;
    int mirrorFractal;
    float rotateX;
    float rotateY;
    float rotateZ;
    bool enableTimeOffset;
    float period;
    bool disableNoise;
    bool demo;
};