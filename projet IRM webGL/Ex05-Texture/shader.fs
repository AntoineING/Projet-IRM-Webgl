
precision mediump float;

varying vec2 tCoords; 

uniform float uAlpha;

uniform float useuil;
const float seuilR = 0.2;
const float seuilG = 0.4;
const float seuilB = 0.6;
const float seuilViolet = 0.8;

uniform vec3 utab1;
uniform vec3 utab2;
uniform vec3 utab3;
uniform vec3 utab4;
uniform vec3 utab5;

uniform sampler2D uSampler;

void main(void) {

	vec3 rgbtab;



	rgbtab[0] = texture2D(uSampler, vec2(tCoords.s, tCoords.t)).r;

	if (rgbtab[0] < useuil) {

	 	gl_FragColor = vec4(rgbtab, 0);
	}
	else if (rgbtab[0] < seuilR){
		gl_FragColor = vec4(utab1, uAlpha);
		
	}
	else if (rgbtab[0] < seuilG){
		
		gl_FragColor = vec4(utab2, uAlpha);
	}
	else if (rgbtab[0] < seuilB) {
	
		gl_FragColor = vec4(utab3, uAlpha);
	}
	else if (rgbtab[0] < seuilViolet) {
		
		gl_FragColor = vec4(utab4, uAlpha);

	}
	else {
		
		gl_FragColor = vec4(utab5, uAlpha);
	}
}

