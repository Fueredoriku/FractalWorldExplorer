#version 430 core

in vec2 uv;
uniform layout(location = 1) vec2 iResolution;
uniform layout(location = 2) float iTime;

struct LightSource {
    vec3 position;
    vec3 color;
};

uniform layout(location = 3) vec3 camera;
//uniform layout(location = 10) int numLights;
//uniform LightSource lights[4];


out vec4 color;

// *Constants*
const float maxDist = 50.;

// *Shading*
// Ambient
vec3 materialColor = vec3(clamp(0.4+cos(iTime), 0.31, 1.),0.4,clamp(0.4+sin(iTime),0.4,0.7));
// Specular
float shinyness = 16.;

// *VFX*
// Ambient Occlusion
float ambientOcclusionIntensity = 0.5;

// Fog
vec3 fogColor = vec3(0.55, 0.7, 0.82);
float fogDistance = 40.; 


//* Fractal tweakables*
// How many times to fold the sponge (mirrors geometry, improves fractal "resolution")
int mirrors = 4;
// Rotates the entire object
vec3 rotationOffsetDegrees = vec3(0., 0., 0.);
// Rotates the fractal itself in each fold around the given axis
vec3 fractalFoldingRotationOffset = vec3(0., iTime, 0.);

// TODO: noise for heigth

// TODO: noise for rotations

//////////////////////////////////////////////
// *Region* 
// Util Functions
//////////////////////////////////////////////

// Rotation functions

mat3 rotateX(float rotationDegrees)
{
    return mat3(
        vec3(1, 0, 0),
        vec3(0, cos(rotationDegrees), -sin(rotationDegrees)),
        vec3(0, sin(rotationDegrees), cos(rotationDegrees))
    );
}

mat3 rotateY(float rotationDegrees)
{
    return mat3(
        vec3(cos(rotationDegrees), 0, sin(rotationDegrees)),
        vec3(0, 1, 0),
        vec3(-sin(rotationDegrees), 0, cos(rotationDegrees))
    );
}

mat3 rotateZ(float rotationDegrees)
{
    return mat3(
        vec3(cos(rotationDegrees), -sin(rotationDegrees), 0),
        vec3(sin(rotationDegrees), cos(rotationDegrees), 0),
        vec3(0, 0, 1)
    );
}

//////////////////////////////////////////////
// *Region* 
// Signed Distance Functions
//////////////////////////////////////////////

float signedDistanceSponge(vec3 position) {
    float scaleAccumulated = 1.;
    vec3 size =  vec3(1.,1.,1.);
    position += vec3(-1., 1.,-1.);
    
    position /= 4.;
    
    // Repeat pattern along z axis
    position.x = 1.-mod(position.x, 4.);
    position.z = 1.-mod(position.z, 4.);
    
    
    for(int i=0; i<mirrors; i++) {
        scaleAccumulated *= 3.8;
        position *= 4.0;
        
        // Rotate the entire object
        position *= rotateX(rotationOffsetDegrees.x) * rotateY(rotationOffsetDegrees.y) * rotateZ(rotationOffsetDegrees.z);
        
        // Makes a cube and mirrors it
        float dist = dot(position+1., normalize(vec3(1., 0., 0)));
        position -= 2.*normalize(vec3(1.,0.05,0.))*min(0., dist);

        dist = dot(position+1., normalize(vec3(0.05, -1., 0))) + 2.;
        position -= 2.*normalize(vec3(0.,-1.,0.))*min(0., dist);

        //dist = dot(position+1., normalize(vec3(0., 0.2+sin(iTime/2.)*0.2, 1.))) + 0.;
        //position -= 2.*normalize(vec3(0.1+cos(iTime)*0.1, 0.2+sin(iTime/2.)*0.2,1.))*min(0., dist);
        //dist = dot(position+1., normalize(vec3(0., 0.2+sin(iTime)*0.2, 1.))) + 0.;
        //position -= 2.*normalize(vec3(0.1+cos(iTime)*+.2, 0.,1.))*min(0., dist);
        dist = dot(position+1., normalize(vec3(0., 0., 1.))) + 0.;
        position -= 2.*normalize(vec3(0., 0.,1.))*min(0., dist);
        
        
        dist = dot(position, normalize(vec3(1, 1, 0)));
        position -= 2.*normalize(vec3(1.,1.,0.))*min(0., dist);

        dist = dot(position, normalize(vec3(0, 1, 1)));
        position -= 2.*normalize(vec3(0.,1.1,1.))*min(0., dist);

        dist = dot(position, normalize(vec3(0.15, -1., 0))) + 0.5;
        position -= 2.*normalize(vec3(0.,-1.,0.))*min(0., dist);
        
        // Gives the fractal a rotational offset for each folding, achieving a "Kaleidoscopic IFS" effect
        position *= rotateX(fractalFoldingRotationOffset.x) * rotateY(fractalFoldingRotationOffset.y) * rotateY(fractalFoldingRotationOffset.z);
   
    }
    
    float d = length(max(abs(position) - size, 0.));
    
    return d/scaleAccumulated;
}

//////////////////////////////////////////////
// *Region* 
// Geometry
//////////////////////////////////////////////
float map(vec3 pos)
{
    // Make copies?
    //vec3 period = vec3(4.,0,0);
    //pos = mod(pos+period/2., period)-period/2.;
    
    // Mirroring
    //vec3 normalius = normalize(vec3(0,0.4,0.4));
    //pos -= 2.*min(0., dot(pos, normalius))*normalius;
    //normalius = normalize(vec3(0.5,0,0.5));
    //pos -= 2.*min(0., dot(pos, normalius))*normalius;
    
    //Return a sphere at origo
    //return length(pos)-1.0;
    
    //return signedDistanceSponge(vec3(mod(pos.x,7.)-2., pos.y, mod(pos.z,2.)-2.));
    return signedDistanceSponge(pos);
}

vec3 normal(vec3 position)
{
    // Estimates gradient of distance function at position
    float delta = 0.0001;
    
    return normalize(vec3(
        map(position+vec3(delta,0,0))-map(position-vec3(delta,0,0)),
        map(position+vec3(0,delta,0))-map(position-vec3(0,delta,0)),
        map(position+vec3(0,0,delta))-map(position-vec3(0,0,delta))
    ));
}

//////////////////////////////////////////////
// *Region* 
// Shading
//////////////////////////////////////////////
// Shadow
//////////////////////////////////////////////
// Phong
//////////////////////////////////////////////
// VFX
//////////////////////////////////////////////

// Shadow 

float shadow(vec3 position, vec3 lightDirection)
{
    float shadow = 1.;
    float dist = 10.;
    float maxDist = 1.;
    
    // Samples 6 points in the lightDirection
    for (int rays = 0; rays < 6; rays++)
    {
        if (dist < 1.)
        {
            vec3 p = position - (dist * lightDirection);
			dist = map(p);
			shadow = min( shadow, max(50.*dist/maxDist,0.0) );
			dist += max(.01,dist);
        }
    }
    // Shadow coefficient to be baked into specular and diffuse intensities 
    return clamp(shadow, 0.1, 1.0);
}

// Phong

float diffuseIntensity(vec3 position, vec3 normal, vec3 lightPosition)
{
    vec3 lightDir = normalize(position - lightPosition);

    //Return the diffuseIntensity for the given position, normal and lightsource:
    return max(0.0, dot(normal, lightDir)*shadow(position, lightDir));
}

float specularIntensity(vec3 position, vec3 normal, vec3 lightPosition)
{
    vec3 lightDir = normalize(position - lightPosition);
    
    return pow(max(dot(normalize(lightDir), normal)*shadow(position, lightDir), 0.5), shinyness);
}

vec3 phong(vec3 position, vec3 normal, vec3 ambientColor, vec3 lightPosition)
{
    return ambientColor*(diffuseIntensity(position, normal, lightPosition)+specularIntensity(position, normal, lightPosition));
}

// VFX

// Fog (Applies fog to given caler based on distance from camera)
vec3 applyFog(vec3 color, vec3 position, vec3 cameraPosition)
{
    float dist = distance(position, cameraPosition);
    if (dist > fogDistance)
    {
        color = mix(color, fogColor, (dist-fogDistance)/(maxDist-max(fogDistance,0.001)));
    }
    return color; 
}

// Ambient Occlusion sampler
vec3 ambientOcclusion(vec3 position, vec3 normalDirection)
{
    vec4 ambience = vec4(0.);
    float scale = 1.;
    
    // Sample 5 rays, rays travel along normalDirection.
    for (int rays = 0; rays < 5; rays++)
    {
        float rayRadius = 0.01 + 0.02 * float(rays*rays);
        vec3 rayPosition = position + normalDirection * rayRadius;
        float dist = map(rayPosition);
        float rayAmbience = clamp(-(dist - rayRadius), 0., 1.);
        ambience += rayAmbience*scale*vec4(1.);
        //Reduce scale for next ray
        scale *= 0.75;
    }
    ambience.w = 1. - clamp(ambientOcclusionIntensity*ambience.w, 0.0, 0.1);
    
    //Bake intensity into ambience:
    ambience.xyz * ambience.w;
    
    return ambience.xyz; 
}


//////////////////////////////////////////////
// *Region* 
// Marcher
//////////////////////////////////////////////

//Distance estimator (tm)
vec3 march(vec3 camPos, vec3 camDir)
{
    float d = 0.;
    vec3 currentPos = camPos;
    int steps = 0;
    
    do 
    {
        d = map(currentPos);
        currentPos += d*camDir;
        steps++;

    } while (steps < 200 && d > 0.001 && distance(camPos, currentPos) < maxDist);

    
    return currentPos;
}

//////////////////////////////////////////////
// *Region* 
// Main
//////////////////////////////////////////////

void main()
{
    // Normalized pixel coordinates (from 0 to 1) with correct aspect ratio
    vec2 uv = (gl_FragCoord.xy-.5*iResolution.xy)/iResolution.y;

    // Time varying pixel color
    //vec3 col = 0.5 + 0.5*cos(iTime+uv.xyx+vec3(0,2,4));

    vec3 camPos = camera;
    vec3 camDir = vec3(uv, 1.);
    vec3 position = march(camPos, camDir);
    
    // TODO: pass this value from marcher instead?
    // TODO: move to marcher as color draw and make marcher return color for fragment instead of pos.
    // Background
    if (distance(position, camPos) > 50.)
    {
        color = vec4(fogColor, 1.);
        if (uv.y > 0.7)
        {
            //lerp to sky?
        }
        //color = vec4(0.6,0.2,0.75+uv.y, 1.);
        return;
    }
    
    vec3 normalOut = normal(position);
    
    vec3 lightPosition = vec3(2.0, .0, 5.0+2.*iTime);

    // Black/white gradiant as distance
    //vec3 col = vec3(distance(camPos, position)/10.);
    
    // Colored after normals
    //vec3 col = normalOut;
    
    // Phong: ambient + diffuse + specular      
    vec3 col = phong(position, normalOut, materialColor, lightPosition); 
    // Add VFX
    col -= ambientOcclusion(position, normalOut);
    col = applyFog(col, position, camPos);
    // Output to screen
    color = vec4(col,1.0);
}
