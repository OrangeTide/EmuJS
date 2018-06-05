/* emujs - fantasy console emulator written in JavaScript
 *
 * Written in 2018 by Jon Mayo <jon.mayo@gmail.com>
 *
 * To the extent possible under law, the author(s) have dedicated all
 * copyright and related and neighboring rights to this software to the
 * public domain worldwide. This software is distributed without any
 * warranty.
 *
 * You should have received a copy of the CC0 Public Domain Dedication
 * along with this software.
 * If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 *
 */

function onLoad(canvasname, width, height)
{
  var c = document.getElementById(canvasname);

  if (!c) {
    alert("Missing tag");
    return;
  }

  gamepadInit(); /* requires gamepad.js */

  c.clientWidth = width;
  c.clientHeight = height;
  gl = c.getContext("webgl");
  if (!gl) {
    alert("WebGL not supported");
    return;
  }

  var sheet = document.getElementById("gameSheet");
  if (!sheet) {
    alert("Missing assets");
    return;
  }

  var gameinfo = initGl(gl, c, width, height, sheet);

  window.addEventListener("resize", function() {
		onResize(gl, gameinfo);
		paint(gl, gameinfo);
	  },
	  false);
  window.addEventListener("orientationchange", function() {
		onResize(gl, gameinfo);
		paint(gl, gameinfo);
	  },
	  false);

  onResize(gl, gameinfo);

  paint(gl, gameinfo);
}

function onResize(gl, gameinfo)
{
  var a = document.getElementById("gameArea");
  var c = gameinfo.canvas;

  if (!a) {
    throw "Missing gameArea element";
  }

  if (!c) {
    throw "Missing gameCanvas element";
  }

  var newWidth = window.innerWidth;
  var newHeight = window.innerHeight;

  /* if upscaling, resize as integer multiplies */
  if (gameinfo.width <= newWidth && gameinfo.height <= newHeight) {
	  var i;

	  for (i = 1; gameinfo.width * (i + 1) < newWidth && gameinfo.height * (i + 1) < newHeight; i++) ;

	  newWidth = gameinfo.width * i;
	  newHeight = gameinfo.height * i;
  } else { /* fallback */


	  if (newWidth <= 0 || newHeight <= 0) {
		throw "bad window aspect ratio - Width and Height cannot be zero";
	  }

	  var currentAspect = newWidth / newHeight;
	  var targetAspect = gameinfo.width / gameinfo.height;

	  if (currentAspect > targetAspect) {
		newWidth = newHeight * targetAspect;
	  } else {
		newHeight = newWidth / targetAspect;
	  }
  }

  a.style.width = newWidth + "px";
  a.style.height = newHeight + "px";
  a.style.marginTop = (-newHeight / 2) + "px";
  a.style.marginLeft = (-newWidth / 2) + "px";

  c.width = newWidth;
  c.height = newHeight;

// TODO: zoom in/out is a broken right now
//  gl.viewport(0, 0, c.width, c.height);
  gl.viewport(0, 0, gameinfo.width, gameinfo.height);

}

function paint(gl, gameinfo)
{
  if (!gl || !gameinfo) {
    throw "missing parameters to paint()";
  }

  console.log("paint: game=%dx%d canvas=%dx%d or %dx%d",
	gameinfo.width, gameinfo.height,
	gameinfo.canvas.clientWidth, gameinfo.canvas.clientHeight,
	gameinfo.canvas.width, gameinfo.canvas.height);
  gl.useProgram(gameinfo.program);

  gl.uniform2f(gameinfo.resolutionLoc, gameinfo.width, gameinfo.height);

  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, gameinfo.sheet);

  gl.clearColor(0.75, 0.75, 0.75, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    20, 10, 0.0, 0.0,
    148, 266, 1.0, 1.0,
    20, 266, 0.0, 1.0,
    148, 10, 1.0, 0.0,
    148, 266, 1.0, 1.0,
    20, 10, 0.0, 0.0,
  ]), gl.STATIC_DRAW);

  var positionLen = 4 * 2;
  var texuvLen = 4 * 2;
  var stride = (positionLen + texuvLen);

  gl.enableVertexAttribArray(gameinfo.positionLoc);
  gl.vertexAttribPointer(gameinfo.positionLoc, 2, gl.FLOAT, false, stride, 0);

  gl.enableVertexAttribArray(gameinfo.texuvLoc);
  gl.vertexAttribPointer(gameinfo.texuvLoc, 2, gl.FLOAT, false, stride, positionLen);

  gl.drawArrays(gl.TRIANGLES, 0, 6);

  var e = gl.getError();
  if (e != gl.NO_ERROR) {
    throw "error in GL. code:" + e;
  }
}

function compileShader(shaderSource, shaderType)
{
  var shader = gl.createShader(shaderType);
  if (!shader) {
    throw "Unable to allocate shader";
  }
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);

  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
    throw "could not compile shader:" + gl.getShaderInfoLog(shader);
  }

  return shader;
}

function initGl(gl, canvas, width, height, sheet)
{
  var program = loadShaders();

  gl.useProgram(program);

  var positionLoc = gl.getAttribLocation(program, "a_position");
  var texuvLoc = gl.getAttribLocation(program, "a_texuv");
  var imageLoc = gl.getUniformLocation(program, "u_image");
  var resolutionLoc = gl.getUniformLocation(program, "u_resolution");

  return {
    sheet: sheet,
    program: program,
	gl: gl,
    positionLoc: positionLoc,
	resolutionLoc: resolutionLoc,
    texuvLoc: texuvLoc,
    imageLoc: imageLoc,
	width: width,
	height: height,
	canvas: canvas,
  };
}

function loadShaders()
{
  var vertShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_texuv;

  uniform vec2 u_resolution;

  varying vec2 v_texuv;

  /* mat4(
   *  (2/(r-l)), 0, 0, (-(r+l)/(r-l)),
   *  0, (2/(t-b)), 0, (-(t+b)/(t-b)),
   *  0, 0, (-2/(f-n)), (-(f+n)/(f-n)),
   *  0, 0, 0, 1
   * )
   */

  void main() {
    mat3 proj = mat3(
        2.0 / u_resolution.x, 0, -1,
        0, -2.0 / u_resolution.y, 1,
        0, 0, 1
      );
    gl_Position = vec4(vec3(a_position, 1) * proj, 1);
    v_texuv = a_texuv;
  }
  `;
  var fragShaderSource = `
  precision mediump float;

  uniform sampler2D u_image;

  varying vec2 v_texuv;

  void main() {
    gl_FragColor = texture2D(u_image, v_texuv);
  }
`;

  if (!vertShaderSource) {
    throw "missing vertex shader";
  }
  if (!fragShaderSource) {
    throw "missing fragment shader";
  }

  var vertShader = compileShader(vertShaderSource, gl.VERTEX_SHADER);
  var fragShader = compileShader(fragShaderSource, gl.FRAGMENT_SHADER);

  var program = gl.createProgram();

  gl.attachShader(program, vertShader);
  gl.attachShader(program, fragShader);

  gl.linkProgram(program);

  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!success) {
    throw "could not link program:" + gl.getProgramInfoLog(program);
  }

  return program;
}
