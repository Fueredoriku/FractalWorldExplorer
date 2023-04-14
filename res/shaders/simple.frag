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
    float scale = 1.;
    vec3 size =  vec3(1.,1.,1.);
    position += vec3(-1., 1.,-1.);
    
    // How many times to fold the sponge
    int folds = 4;
    

    position /= 4.;
    
    // Repeat pattern along z axis
    position.z = 1.-mod(position.z, 2.);
    
    
    for(int i=0; i<folds; i++) {
        scale *= 3.8;
        position *= 4.0;
        
        //position *= rotateX(1.);
        //position *= rotateY(1.5);
        //position *= rotateZ(1.);
        
        
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
        
        position *= rotateY(iTime);
        //position *= rotateX(iTime);
   
    }
    
    float d = length(max(abs(position) - size, 0.));
    
    return d/scale;
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
    float shinyness = 16.;
    vec3 lightDir = normalize(position - lightPosition);
    
    return pow(max(dot(normalize(lightDir), normal)*shadow(position, lightDir), 0.5), shinyness);
}

vec3 phong(vec3 position, vec3 normal, vec3 ambientColor, vec3 lightPosition)
{
    return ambientColor*(diffuseIntensity(position, normal, lightPosition)+specularIntensity(position, normal, lightPosition));
}

// VFX

// Ambient Occlusion sampler
vec3 ambientOcclusion(vec3 position, vec3 normalDirection)
{
    vec4 ambience = vec4(0.);
    float scale = 1.;
    float intensity = 0.5;
    
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
    ambience.w = 1. - clamp(intensity*ambience.w, 0.0, 0.1);
    
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

    } while (steps < 200 && d > 0.001 && distance(camPos, currentPos) < 50.);

    
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
    // Background
    if (distance(position, camPos) > 50.)
    {
        color = vec4(0.6,0.2,0.75+uv.y, 1.);
        return;
    }
    
    vec3 normalOut = normal(position);
    
    vec3 lightPosition = vec3(2.0, .0, 5.0+2.*iTime);

    // Black/white gradiant as distance
    //vec3 col = vec3(distance(camPos, position)/10.);
    
    // Colored after normals
    //vec3 col = normalOut;
    
    // Phong: ambient + diffuse + specular      
    vec3 col = phong(position, normalOut, vec3(clamp(0.4+cos(iTime), 0.31, 1.),0.4,clamp(0.4+sin(iTime),0.4,0.7)), lightPosition); 
    // Add VFX
    col -= ambientOcclusion(position, normalOut);
    // Output to screen
    color = vec4(col,1.0);
}
