#version 430 core

in vec2 uv;
uniform layout(location = 1) vec2 iResolution;
uniform layout(location = 2) float iTime;

struct LightSource {
    vec3 position;
    vec3 color;
};

uniform layout(location = 3) vec3 camera;

out vec4 color;

// *Constants*
const float maxDist = 50.;

// *Shading*
// Ambient
vec3 materialColor = vec3(0.6,0.2,0.1);
vec3 glowColor = vec3(0.3,0.,0.);

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
uniform layout(location = 4) int mirrorsIn;
// Rotates the entire object
vec3 rotationOffsetDegrees = vec3(0., 0., 0.);
// Rotates the fractal itself in each fold around the given axis
uniform layout(location = 5) vec3 rotationOffsets;
uniform layout(location = 6) float periodIn;
uniform layout(location = 7) int disableNoiseIn;
uniform layout(location = 8) int enableTimeOffsetIn;
uniform layout(location = 9) int stillIn;
uniform layout(location = 10) int demo;


int mirrors = mirrorsIn;
float period = periodIn;
int disableNoise = disableNoiseIn;
int enableTimeOffset = enableTimeOffsetIn;
int still = stillIn;

//Manual rotation of the entire fractal object
vec3 fractalFoldingRotationOffset = vec3(rotationOffsets.x, rotationOffsets.y, rotationOffsets.z);


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

float deterministicRandom (vec2 position) {
    return fract(sin(dot(position,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

/*
float perlinNoice(float value)
{
    float integer = floor(value);
    float fraction = fract(value);
    //y = rand(i); //rand() is described in the previous chapter
    //y = mix(rand(i), rand(i + 1.0), f);
    return mix(deterministicRandom(integer), deterministicRandom(integer + 1.0), smoothstep(0.,1.,fraction)); 
}
*/


//////////////////////////////////////////////
// *Region* 
// Signed Distance Functions
//////////////////////////////////////////////

// Modified from source: https://iquilezles.org/articles/distfunctions/
float signedDistancePlane(vec3 position)
{
	return position.y + mod(position.x,period)*mod(position.z,period);
}

// Menger sponge by mirroring an object, then folding the object inside a larger one X amount of times. 
// By rotating one or more axies while folding, one can thus achieve a Kaleidoscopic IFS structure. 
float signedDistanceSponge(vec3 position) {
    float randomFactor = deterministicRandom(floor(position.xz/period));
    randomFactor *= disableNoise;
    // Repeat points on the XY-plane
    position = vec3(mod(position.x,period)-(period/2.), position.y+randomFactor, mod(position.z,period)-(period/2.));
    // Rotate the entire object
    position *= rotateX(rotationOffsetDegrees.x) * rotateY(rotationOffsetDegrees.y) * rotateZ(rotationOffsetDegrees.z);
    float scaleAccumulated = 1.;
    vec3 size =  vec3(1.,1.,1.);
    position += vec3(-1., 1.,-1.);
    position /= 4.;
    

    
    for(int i=0; i<mirrors; i++) {
        scaleAccumulated *= 3.8;
        position *= 4.0;
        
        // Mirrors a cube!
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
        
    
        // Noise based rotational offset
        position *= rotateX(randomFactor) * rotateY(0.) * rotateY(0.);
        // Gives the fractal a rotational offset for each folding, achieving a "Kaleidoscopic IFS" effect
        if (enableTimeOffset != 0)
        {
            position *= rotateX(fractalFoldingRotationOffset.x*iTime*0.1) * rotateY(fractalFoldingRotationOffset.y*iTime*0.1) * rotateZ(fractalFoldingRotationOffset.z*iTime*0.1);
        }
        else 
        {
            position *= rotateX(fractalFoldingRotationOffset.x) * rotateY(fractalFoldingRotationOffset.y) * rotateZ(fractalFoldingRotationOffset.z);
        }
   
    }
    float colorSize = sin(position.z*3.+position.x*6.)*0.5+0.5;;
    materialColor = mix(vec3(0.,0.63,1.),vec3(0.,1.,0.56),colorSize)*0.5+0.05;

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
    return signedDistanceSponge(pos);
    //return min(signedDistanceSponge(pos), signedDistancePlane(pos));
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
// VFX
//////////////////////////////////////////////
// Phong
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

// Fog (Applies fog to given color based on distance from camera)
vec3 applyFog(vec3 color, vec3 position, vec3 cameraPosition)
{
    float dist = distance(position, cameraPosition);
    if (dist > fogDistance)
    {
        color = mix(color, fogColor, exp(-0.2*(dist-fogDistance)/(maxDist-max(fogDistance,0.001))));
    }
    return color; 
}

// Phong

float diffuseIntensity(vec3 position, vec3 normal, vec3 lightDirection)
{
    //Return the diffuseIntensity for the given position, normal and lightsource:
    return max(0.0, dot(normal, lightDirection));
}

float specularIntensity(vec3 position, vec3 normal, vec3 lightDirection)
{
    return pow(max(dot(normalize(lightDirection), normal), 0.5), shinyness);
}

vec3 phong(vec3 position, vec3 normal, vec3 ambientColor, vec3 lightPosition)
{
    vec3 lightDirection = normalize(position - lightPosition);
    vec3 color = (ambientColor + glowColor)*ambientOcclusion(position, normal)*1.2;
    color += specularIntensity(normalize(position), normalize(normal)*0.2, lightDirection)+ ambientColor*(diffuseIntensity(normalize(position), normalize(normal), lightDirection));
    
    // New lightsources can simply be added to color like the form under:
    //color += specularIntensity(position, normal, newLightDir)+ ambientColor*(diffuseIntensity(position, normal, newLightDir));
    
    return clamp(color, 0.,1.);
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
    glowColor = vec3(0.);
    do 
    {
        d = map(currentPos);
        currentPos += d*camDir;
        steps++;

        if (d < 0.01){
            //glowColor = mix(materialColor*0.1, materialColor*0.9, d*100);
        }

    } while (steps < 200 && d > 0.001 && distance(camPos, currentPos) < maxDist);
        if (d < 0.001)
        {
            glowColor = vec3(0.);
        }
    
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

    vec3 camPos = camera;

    // Demo-mode that lerps between different possible parameters
    if (demo == 1)
    {
        if (sin(iTime*0.1) > 0 && cos(iTime*0.1) > 0)
        {
            // Panorama example
            still = 0;
            period = 2.65;
            disableNoise = 1;
            enableTimeOffset = 0;
            fractalFoldingRotationOffset = vec3(0);
            mirrors = 4;
        }
        if (sin(iTime*0.1) > 0. && cos(iTime*0.1) < 0.) 
        {
            // Even Folding
            fractalFoldingRotationOffset.y = 2.;
            period = 2.2;
            disableNoise = 0;
            mirrors = 4;
            enableTimeOffset = 1;
        }
        if (sin(iTime*0.1) < 0. && cos(iTime*0.1) < 0.)
        {
            // Animated tunnel
            fractalFoldingRotationOffset.xz = vec2(0.);
            fractalFoldingRotationOffset.y = 5.;
            enableTimeOffset = 1;
            period = 4.2;
            disableNoise = 0;
            still = 1;
            mirrors = 6;
            camPos = vec3(period/2., .5, period+18);
        }
        if (sin(iTime*0.1) < 0. && cos(iTime*0.1) > 0.) 
        {
            // Animated single fractal
            // -p=49 -f=5 -z=1 -y=6 -x=-1 -t -n -s
            period = 49.;
            mirrors = 5;
            fractalFoldingRotationOffset.xz = vec2(1.);
            fractalFoldingRotationOffset.y= 6.;
            still = 1;
            disableNoise = 1;
            enableTimeOffset = 1;
            camPos = vec3(period/2., .5, period+18);
        }
    }

    // Time varying pixel color
    //vec3 col = 0.5 + 0.5*cos(iTime+uv.xyx+vec3(0,2,4));
    vec3 camDir = vec3(uv, 1.);
    camDir *= rotateX(0.1);
    vec3 lightPosition = vec3(0., -5.0, 5.0+2.*iTime);
    if (still == 1)
    {
        lightPosition.z = period*2+18;
    }

    vec3 position = march(camPos, camDir);
    
    // TODO: pass this value from marcher instead?
    // TODO: move to marcher as color draw and make marcher return color for fragment instead of pos.
    // Background
    if (distance(position, camPos) > 50.)
    {
        if (glowColor == vec3(0.))
        {
            color = vec4(fogColor, 1.);
        }
        else 
        {
            //color = vec4(glowColor, 1.);
        }
        

        //keep the fog low, lerp to sky
        if (uv.y > 0.2)
        {
            color = mix(vec4(fogColor, 1.), vec4(0.6,0.2,0.75, 1.), (uv.y-0.2)/(1.-0.2) );
        }
        //color = vec4(0.6,0.2,0.75+uv.y, 1.);
        return;
    }
    
    vec3 normalOut = normal(position);

    // Black/white gradiant as distance
    //vec3 col = vec3(distance(camPos, position)/10.);
    
    // Colored after normals
    //vec3 col = normalOut;
    
    // Phong: ambient + diffuse + specular      
    vec3 col = phong(position, normalOut, materialColor, lightPosition); 
    //col *= calcGlobalLighting(position, normalOut, camDir); 
    // Add VFX
    col = applyFog(col, position, camPos);
    // Output to screen
    color = vec4(col,1.0);
}
