#include <chrono>
#include <GLFW/glfw3.h>
#include <glad/glad.h>
#include <SFML/Audio/SoundBuffer.hpp>
#include <utilities/shader.hpp>
#include <glm/vec3.hpp>
#include <iostream>
#include <utilities/timeutils.h>
#include <SFML/Audio/Sound.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <glm/gtc/type_ptr.hpp>
#include <fmt/format.h>
#include "gamelogic.h"
#include "sceneGraph.hpp"
#define GLM_ENABLE_EXPERIMENTAL
#include <glm/gtx/transform.hpp>

#include "utilities/imageLoader.hpp"
#include "utilities/glfont.h"

enum KeyFrameAction {
    BOTTOM, TOP
};

#include <timestamps.h>

unsigned int currentKeyFrame = 0;
unsigned int previousKeyFrame = 0;

// These are heap allocated, because they should not be initialised at the start of the program
sf::SoundBuffer* buffer;
Gloom::Shader* shader;
sf::Sound* sound;

CommandLineOptions options;

bool hasStarted        = false;
bool hasLost           = false;
bool jumpedToNextFrame = false;
bool isPaused          = false;

bool mouseLeftPressed   = false;
bool mouseLeftReleased  = false;
bool mouseRightPressed  = false;
bool mouseRightReleased = false;

// Modify if you want the music to start further on in the track. Measured in seconds.
const float debug_startTime = 0;
double totalElapsedTime = debug_startTime;
double gameElapsedTime = debug_startTime;

double mouseSensitivity = 1.0;
double lastMouseX = windowWidth / 2;
double lastMouseY = windowHeight / 2;

void mouseCallback(GLFWwindow* window, double x, double y) {
    int windowWidth, windowHeight;
    glfwGetWindowSize(window, &windowWidth, &windowHeight);
    glViewport(0, 0, windowWidth, windowHeight);

    double deltaX = x - lastMouseX;
    double deltaY = y - lastMouseY;

    glfwSetCursorPos(window, windowWidth / 2, windowHeight / 2);
}

/*
struct LightSource {
    SceneNode* Node = createSceneNode();
};
LightSource lightSources[3];

LightSource* createLightNode() {
    LightSource* light = new LightSource();
    light->Node->nodeType = POINT_LIGHT;
    return light;
}

LightSource* unoNodeLight;
LightSource* dosNodeLight;
LightSource* padNodeLight;
*/


SceneNode* rootNode;

void initGame(GLFWwindow* window, CommandLineOptions gameOptions) {
    buffer = new sf::SoundBuffer();
    if (!buffer->loadFromFile("../res/Hall of the Mountain King.ogg")) {
        return;
    }

    options = gameOptions;

    glfwSetInputMode(window, GLFW_CURSOR, GLFW_CURSOR_HIDDEN);
    glfwSetCursorPosCallback(window, mouseCallback);

    shader = new Gloom::Shader();
    shader->makeBasicShader("../res/shaders/simple.vert", "../res/shaders/simple.frag");
    shader->activate();

    unsigned int emptyVAO;
	glGenVertexArrays(1, &emptyVAO);
	glBindVertexArray(emptyVAO);

    getTimeDeltaSeconds();

    std::cout << "Ready. Click to start!" << std::endl;

    glm::vec2 resolution = glm::vec2(windowWidth, windowHeight); 
    glUniform2fv(1,1, glm::value_ptr(resolution));

    glUniform1i(4,options.mirrorFractal);

    glm::vec3 rotationOffsets = glm::vec3(options.rotateX, options.rotateY, options.rotateZ);
    glUniform3fv(5,1, glm::value_ptr(rotationOffsets));
    glUniform1f(6,options.period);
    if(options.disableNoise)
    {
        glUniform1i(7,0);
    }
    else 
    {
        glUniform1i(7,1);
    }
    if (options.enableTimeOffset){
        glUniform1i(8, 1);
    }
    else 
    {
        glUniform1i(8, 0);
    }
    if (options.still)
    {
        glUniform1i(9, 1);
    }
    else 
    {
        glUniform1i(9, 0);
    }

    if (options.demo)
    {
        glUniform1i(10, 1);
    }
    else 
    {
        glUniform1i(10, 0);
    }

    rootNode = createSceneNode();
}


void renderNode(SceneNode* node) {
	switch (node->nodeType) {
	case POINT_LIGHT:
	{

	}
	break;
	}

	for (SceneNode* child : node->children) {
		renderNode(child);
	}
}

void updateFrame(GLFWwindow* window) {
    glfwSetInputMode(window, GLFW_CURSOR, GLFW_CURSOR_DISABLED);

    // Give the fragment shader at taste of time
    glUniform1f(2, (float) totalElapsedTime);

    if (glfwGetMouseButton(window, GLFW_MOUSE_BUTTON_1)) {
        mouseLeftPressed = true;
        mouseLeftReleased = false;
    } else {
        mouseLeftReleased = mouseLeftPressed;
        mouseLeftPressed = false;
    }
    if (glfwGetMouseButton(window, GLFW_MOUSE_BUTTON_2)) {
        mouseRightPressed = true;
        mouseRightReleased = false;
    } else {
        mouseRightReleased = mouseRightPressed;
        mouseRightPressed = false;
    }

    double timeDelta = getTimeDeltaSeconds();

    if(!hasStarted) {
        if (mouseLeftPressed) {
            if (options.enableMusic) {
                sound = new sf::Sound();
                sound->setBuffer(*buffer);
                sf::Time startTime = sf::seconds(debug_startTime);
                sound->setPlayingOffset(startTime);
                sound->play();
            }
            totalElapsedTime = debug_startTime;
            gameElapsedTime = debug_startTime;
            hasStarted = true;
        }
        }
        else {
            totalElapsedTime += timeDelta;
            if(hasLost) {
                if (mouseLeftReleased) {
                    hasLost = false;
                    hasStarted = false;
                    currentKeyFrame = 0;
                    previousKeyFrame = 0;
                }
            } else if (isPaused) {
                if (mouseRightReleased) {
                    isPaused = false;
                    if (options.enableMusic) {
                        sound->play();
                    }
                }
            } else {
                gameElapsedTime += timeDelta;
                    if (mouseRightReleased) {
                        isPaused = true;
                        if (options.enableMusic) {
                            sound->pause();
                        }
                    }
                // Get the timing for the beat of the song
                for (unsigned int i = currentKeyFrame; i < keyFrameTimeStamps.size(); i++) {
                    if (gameElapsedTime < keyFrameTimeStamps.at(i)) {
                        continue;
                    }
                    currentKeyFrame = i;
                }

            jumpedToNextFrame = currentKeyFrame != previousKeyFrame;
            previousKeyFrame = currentKeyFrame;

            double frameStart = keyFrameTimeStamps.at(currentKeyFrame);
            double frameEnd = keyFrameTimeStamps.at(currentKeyFrame + 1); // Assumes last keyframe at infinity

            double elapsedTimeInFrame = gameElapsedTime - frameStart;
            double frameDuration = frameEnd - frameStart;
            double fractionFrameComplete = elapsedTimeInFrame / frameDuration;

            KeyFrameAction currentOrigin = keyFrameDirections.at(currentKeyFrame);
            KeyFrameAction currentDestination = keyFrameDirections.at(currentKeyFrame + 1);
        }
    }
    glm::vec3 cameraPosition = glm::vec3(0.);
    if (options.still)
    {
        cameraPosition = glm::vec3(options.period/2., .5, options.period+18);   
    }
    else
    {
        cameraPosition = glm::vec3(options.period/2., 4., -10.f+2*gameElapsedTime);
    }
    // Send camera updates to fragment shader

    glUniform3fv(3,1, glm::value_ptr(cameraPosition));
}

void renderFrame(GLFWwindow* window) {
    int windowWidth, windowHeight;
    glfwGetWindowSize(window, &windowWidth, &windowHeight);
    glViewport(0, 0, windowWidth, windowHeight);

    renderNode(rootNode);

    // Make the screen into two polygons forming a rectangle and draw it!
	glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);
}
