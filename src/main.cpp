// Local headers
#include "utilities/window.hpp"
#include "program.hpp"

// System headers
#include <glad/glad.h>
#include <GLFW/glfw3.h>

// Standard headers
#include <cstdlib>
#include <arrrgh.hpp>


// A callback which allows GLFW to report errors whenever they occur
static void glfwErrorCallback(int error, const char *description)
{
    fprintf(stderr, "GLFW returned an error:\n\t%s (%i)\n", description, error);
}


GLFWwindow* initialise()
{
    // Initialise GLFW
    if (!glfwInit())
    {
        fprintf(stderr, "Could not start GLFW\n");
        exit(EXIT_FAILURE);
    }

    // Set core window options (adjust version numbers if needed)
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 4);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

    // Enable the GLFW runtime error callback function defined previously.
    glfwSetErrorCallback(glfwErrorCallback);

    // Set additional window options
    glfwWindowHint(GLFW_RESIZABLE, windowResizable);
    glfwWindowHint(GLFW_SAMPLES, windowSamples);  // MSAA

    // Create window using GLFW
    GLFWwindow* window = glfwCreateWindow(windowWidth, windowHeight, windowTitle.c_str(), nullptr, nullptr);

    // Ensure the window is set up correctly
    if (!window)
    {
        fprintf(stderr, "Could not open GLFW window\n");
        glfwTerminate();
        exit(EXIT_FAILURE);
    }

    // Let the window be the current OpenGL context and initialise glad
    glfwMakeContextCurrent(window);
    gladLoadGL();

    // Print various OpenGL information to stdout
    printf("%s: %s\n", glGetString(GL_VENDOR), glGetString(GL_RENDERER));
    printf("GLFW\t %s\n", glfwGetVersionString());
    printf("OpenGL\t %s\n", glGetString(GL_VERSION));
    printf("GLSL\t %s\n\n", glGetString(GL_SHADING_LANGUAGE_VERSION));

    return window;
}


int main(int argc, const char* argb[])
{
    arrrgh::parser parser("fractalWorldExplorer", "A fractal explorer where you can tweak world generation");
    const auto& showHelp         = parser.add<bool>("help", "Show this help message.", 'h', arrrgh::Optional, false);
    const auto& enableMusic      = parser.add<bool>("enable-music", "Play background music while the game is playing", 'm', arrrgh::Optional, false);
    const auto& enableAutoplay   = parser.add<bool>("autoplay", "Let the game play itself automatically. Useful for testing.", 'a', arrrgh::Optional, false);
    const auto& mirrorFractal    = parser.add<int>("fractal-mirror", "Increase the amount of times fractal is mirWrored, increases LOD", 'f', arrrgh::Optional, 4);
    const auto& rotateX          = parser.add<float>("fractal-rotate-x", "Folds fractals in the x-axis with degrees while generating", 'x', arrrgh::Optional, 0.);
    const auto& rotateY          = parser.add<float>("fractal-rotate-y", "Folds fractals in the x-axis with degrees while generating", 'y', arrrgh::Optional, 0.);
    const auto& rotateZ          = parser.add<float>("fractal-rotate-z", "Folds fractals in the x-axis with degrees while generating", 'z', arrrgh::Optional, 0.);
    const auto& enableTimeOffset = parser.add<bool>("fractal-animate", "Apply rotational offset over time", 't', arrrgh::Optional, false);
    const auto& period           = parser.add<float>("period", "The frequency and thus distance structures repeat", 'p', arrrgh::Optional, 2.);

    // If you want to add more program arguments, define them here,
    // but do not request their value here (they have not been parsed yet at this point).

    try
    {
        parser.parse(argc, argb);
    }
    catch (const std::exception& e)
    {
        std::cerr << "Error parsing arguments: " << e.what() << std::endl;
        parser.show_usage(std::cerr);
        exit(1);
    }

    // Show help if desired
    if(showHelp.value())
    {
        return 0;
    }

    CommandLineOptions options;
    options.enableMusic    = enableMusic.value();
    options.enableAutoplay = enableAutoplay.value();
    options.mirrorFractal = mirrorFractal.value();
    options.rotateX = rotateX.value();
    options.rotateY = rotateX.value();
    options.rotateZ = rotateX.value();
    options.enableTimeOffset = enableTimeOffset.value();
    options.period = period.value();

    // Initialise window using GLFW
    GLFWwindow* window = initialise();

    // Run an OpenGL application using this window
    runProgram(window, options);

    // Terminate GLFW (no need to call glfwDestroyWindow)
    glfwTerminate();

    return EXIT_SUCCESS;
}
