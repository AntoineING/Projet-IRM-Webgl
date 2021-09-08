
// =====================================================
var gl;
var zPos;
var shadersLoaded = 0;
var vertShaderTxt;
var fragShaderTxt;
var shaderProgram = null;
var vertexBuffer;
var colorBuffer;
var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var objMatrix = mat4.create();
var nbQuad = 24;
var pas = 0.5/(nbQuad-1);
var listImage = ['','IRM1.png','IRM2.png','IRM3.png','IRM4.png','IRM5.png','IRM6.png','IRM7.png','IRM8.png','IRM9.png','IRM10.png','IRM11.png','IRM12.png','IRM13.png','IRM14.png','IRM15.png','IRM16.png','IRM17.png','IRM18.png','IRM19.png','IRM20.png','IRM21.png','IRM22.png','IRM23.png','IRM24.png'];
var listTexture = [];
var alpha = 0.1;
var indexImg = 0; 
var affichage = true;

var tab1 = [0.9,0.1,0.1];
var tab2 = [0.1,0.9,0.1];
var tab3 = [0.1,0.1,0.9];
var tab4 = [0.9,0.1,0.9];
var tab5 = [0.9,0.9,0.1];

var seuil = 0.1;




mat4.identity(objMatrix);



// =====================================================
function webGLStart() {
	var canvas = document.getElementById("WebGL-test");
	canvas.onmousedown = handleMouseDown; //associe au element du canvas, mes fonctions
	document.onmouseup = handleMouseUp;
	document.onmousemove = handleMouseMove;

	initGL(canvas); //initialisation du contexte openGL. 
	initBuffers(); //initialisation des buffers. 
	
	//boucle d'initialisation des textures
	for (i = 0; i < listImage.length; i++){
		listTexture.push(gl.createTexture());
		initTexture(listImage[i], listTexture[i]);
	}	
	
	loadShaders('shader'); //vertex shader: utilise les listes de sommets (vertex buffer) sur le GPU, va les traiter pour les positionner sur l'écran. Coordonnées entre -1 et 1. 
	//Affiche de trois sommets par ligne de balaiyage. Appelle du fragment shader pour la couleur du pixel. 
	
	gl.clearColor(0.7, 0.7, 0.7, 1.0); //initialise la couleur de remplissage. 
	gl.enable(gl.DEPTH_TEST); //initialise la gestion de la profondeur. 

	//drawScene();
	tick();
}

// =====================================================
function initGL(canvas) //permet de lier la carte graphique au canvas
{
	try {
		gl = canvas.getContext("experimental-webgl");
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
		gl.viewport(0, 0, canvas.width, canvas.height); //endroit ou la carte graphique doit dessiner. 
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	} catch (e) {}
	if (!gl) {
		console.log("Could not initialise WebGL");
	}
}

// =====================================================
function initBuffers() { 

	vertices = [ //coordonées du monde virtuel indépendant du canvas
		-0.3, -0.3, 0.0,
		-0.3,  0.3, 0.0,
		0.3,  0.3, 0.0,
		0.3,  -0.3, 0.0
		];
	vertexBuffer = gl.createBuffer(); //création du buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); //activation du buffer
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW); //envoie du tableau sur le buffer principal
	vertexBuffer.itemSize = 3;
	vertexBuffer.numItems = 4; 

	// Texture coords (array)
	texcoords = [ //définie les coordonées de texture. 
		1.0, 0.0, 
		1.0, 1.0,
		0.0, 1.0,
		0.0, 0.0
		   ];
	texCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);
	texCoordBuffer.itemSize = 2;
	texCoordBuffer.numItems = 4;
	
	// Index buffer (array)
	var indices = [0, 1, 2, 2, 3, 0]; //ordre de traitement des pixels. 
	indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
	indexBuffer.itemSize = 1;
	indexBuffer.numItems = indices.length;

}


// =====================================================
function initTexture(img, texture) 
{
	var texImage = new Image(); //création de l'image
	
	texImage.src = img; //on donne la source

	texture.image = texImage;

	texImage.onload = function () { //gestion des textures avec la carte graphique.
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image); //envoie de l'image à la carte graphique
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.uniform1i(shaderProgram.samplerUniform, 0);
		gl.activeTexture(gl.TEXTURE0);
	}
}


// =====================================================
function loadShaders(shader) { //chargement des deux shaders
	loadShaderText(shader,'.vs');
	loadShaderText(shader,'.fs');
}

// =====================================================
function loadShaderText(filename,ext) {   // technique car lecture asynchrone... si les deux
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (xhttp.readyState == 4 && xhttp.status == 200) {
			if(ext=='.vs') { vertShaderTxt = xhttp.responseText; shadersLoaded ++; }
			if(ext=='.fs') { fragShaderTxt = xhttp.responseText; shadersLoaded ++; }
			if(shadersLoaded==2) {
				initShaders(vertShaderTxt,fragShaderTxt);
				shadersLoaded=0;
			}
    }
  }
  xhttp.open("GET", filename+ext, true);
  xhttp.send();
}

// =====================================================
function initShaders(vShaderTxt,fShaderTxt) { //lit les deux fichier sur le disque dur. 

	vshader = gl.createShader(gl.VERTEX_SHADER); //création d'indentifiant pour le vertex shader
	gl.shaderSource(vshader, vShaderTxt); //la source
	gl.compileShader(vshader); //compilation
	if (!gl.getShaderParameter(vshader, gl.COMPILE_STATUS)) {
		console.log(gl.getShaderInfoLog(vshader));
		return null;
	}

	fshader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fshader, fShaderTxt);
	gl.compileShader(fshader);
	if (!gl.getShaderParameter(fshader, gl.COMPILE_STATUS)) {
		console.log(gl.getShaderInfoLog(fshader));
		return null;
	}

	shaderProgram = gl.createProgram(); //attachement des deux shaders. 
	gl.attachShader(shaderProgram, vshader);
	gl.attachShader(shaderProgram, fshader);

	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		console.log("Could not initialise shaders");
	}

	gl.useProgram(shaderProgram); //on utilise le shaderprogramm

	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition"); //On envoie les positions
	gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

	shaderProgram.texCoordsAttribute = gl.getAttribLocation(shaderProgram, "texCoords"); //coordonées de textures
	gl.enableVertexAttribArray(shaderProgram.texCoordsAttribute);
	
	shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler"); //variables qui permet d'accéder aux pixels de la texture. 
	
	shaderProgram.zPos = gl.getUniformLocation(shaderProgram, "zPos");
	shaderProgram.alpha = gl.getUniformLocation(shaderProgram, "uAlpha");
	shaderProgram.tab1 = gl.getUniformLocation(shaderProgram, "utab1");
	shaderProgram.tab2 = gl.getUniformLocation(shaderProgram, "utab2");
	shaderProgram.tab3 = gl.getUniformLocation(shaderProgram, "utab3");
	shaderProgram.tab4 = gl.getUniformLocation(shaderProgram, "utab4");
	shaderProgram.tab5 = gl.getUniformLocation(shaderProgram, "utab5");
	shaderProgram.seuil = gl.getUniformLocation(shaderProgram, "useuil");

	shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
     	vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
	gl.vertexAttribPointer(shaderProgram.texCoordsAttribute,
      	texCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

}


// =====================================================
function setMatrixUniforms(zPos) {
	if(shaderProgram != null) {
		gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
		gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
		gl.uniform1f(shaderProgram.zPos,zPos);
		gl.uniform1f(shaderProgram.alpha,alpha);
		gl.uniform3fv(shaderProgram.tab1, tab1);
		gl.uniform3fv(shaderProgram.tab2, tab2);
		gl.uniform3fv(shaderProgram.tab3, tab3);
		gl.uniform3fv(shaderProgram.tab4, tab4);
		gl.uniform3fv(shaderProgram.tab5, tab5);
		gl.uniform1f(shaderProgram.seuil,seuil);

	}
}
function setUSeuil(a){
	
	seuil = a;
}
function setUAlpha(a){
	alpha = a;
}

function setIndexImg(num){
	indexImg = num;
}

function setAffiche(choixaffiche){
	affichage = choixaffiche;
}

function convertHex(hex){
    hex = hex.replace('#','');
    r = parseInt(hex.substring(0,2), 16)/255;
    v = parseInt(hex.substring(2,4), 16)/255;
    b = parseInt(hex.substring(4,6), 16)/255;

    var rvb = [r,v,b];

    return rvb;
}

function setCol1(){
    var C1 = document.getElementById("col1");
    tab1 = convertHex(C1.value);
}
function setCol2(){
    var C2 = document.getElementById("col2");
    tab2 = convertHex(C2.value);
}
function setCol3(){
    var C3 = document.getElementById("col3");
    tab3 = convertHex(C3.value);
}
function setCol4(){
    var C4 = document.getElementById("col4");
    tab4 = convertHex(C4.value);
}
function setCol5(){
    var C5 = document.getElementById("col5");
    tab5 = convertHex(C5.value);
}



// =====================================================
function drawScene() {
	gl.clear(gl.COLOR_BUFFER_BIT);

	if(shaderProgram != null) {

		if (affichage == false){

			gl.bindTexture(gl.TEXTURE_2D, listTexture[indexImg]);

			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer); 

			mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
			mat4.identity(mvMatrix);
			mat4.translate(mvMatrix, [0.0, 0.0, -2.0]);
			mat4.multiply(mvMatrix, objMatrix);

			setMatrixUniforms(0.0);
			
			gl.drawElements(gl.TRIANGLES, indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

		}
		else {
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer); 

			mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
			mat4.identity(mvMatrix);
			mat4.translate(mvMatrix, [0.0, 0.0, -2.0]);
			mat4.multiply(mvMatrix, objMatrix);

		
			for (var i = 0; i < nbQuad; i++) {


				setMatrixUniforms(-0.3+(pas*i));
		
				gl.bindTexture(gl.TEXTURE_2D, listTexture[i]);

				gl.drawElements(gl.TRIANGLES, indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

			}
		}
	}
}
