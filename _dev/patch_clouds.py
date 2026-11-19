p='/home/claude/portfolio/v5/js/gl.js'; s=open(p).read()
def rep(a,b):
    global s
    assert s.count(a)==1, a[:70]; s=s.replace(a,b)
rep("let gl, canvas, progMain, progShadow, progSky, progTex,","let progCloud; let gl, canvas, progMain, progShadow, progSky, progTex,")
rep("progMain = compile(VS, FS); progShadow = compile(SVS, SFS); progSky = compile(KVS, KFS);","progMain = compile(VS, FS); progShadow = compile(SVS, SFS); progSky = compile(KVS, KFS); progCloud = compile(CVS, CFS);")
rep("  function init(c, opts = {}) {","""  /* v5 : nuages volumétriques doux (sprites face caméra, bruit fractal, mélange alpha) */
  const CVS = `#version 300 es
  layout(location=0) in vec3 aC; layout(location=1) in vec2 aO; layout(location=2) in vec2 aS;
  uniform mat4 uVP; uniform vec3 uR, uU, uCam; out vec2 vO; out float vSeed, vD; out vec3 vW;
  void main(){ vec3 w = aC + uR * aO.x * aS.x + uU * aO.y * aS.x * .62; vO = aO; vSeed = aS.y; vW = w; vD = distance(uCam, aC); gl_Position = uVP * vec4(w, 1.); }`;
  const CFS = `#version 300 es
  precision highp float; in vec2 vO; in float vSeed, vD; in vec3 vW; out vec4 o;
  uniform vec3 uSun, uSunC, uFog, uLow; uniform float uFogN, uFogF, uOp;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
  float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++) { s += a * n(p); p = p * 2.1 + 1.7; a *= .5; } return s; }
  void main(){
    vec2 q = vO; float r = length(q * vec2(1., 1.25));
    float f = fbm(q * 2.2 + vSeed * 13.);
    float a = smoothstep(1., .25, r + (f - .5) * .9) * uOp;
    a *= smoothstep(8., 60., vD);
    if (a < .01) discard;
    float lit = clamp(.45 + .55 * vO.y + (f - .5) * .5 + uSun.y * .2, 0., 1.);
    vec3 c = mix(uLow, vec3(1.), lit) * mix(vec3(1.), uSunC, .25);
    float fog = smoothstep(uFogN, uFogF, vD); c = mix(c, uFog, fog * .85);
    o = vec4(c, a * (1. - fog * .6));
  }`;
  function cloudLayer(puffs) { // puffs : [x, y, z, taille, graine]
    const v = [], idx = []; puffs.forEach((p, k) => { [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([ox, oy]) => v.push(p[0], p[1], p[2], ox, oy, p[3], p[4])); const b = k * 4; idx.push(b, b + 1, b + 2, b, b + 2, b + 3); });
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao); const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 28, 0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 28, 12); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 28, 20);
    const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(idx), gl.STATIC_DRAW); gl.bindVertexArray(null);
    return { vao, count: idx.length };
  }
  function drawClouds(cam, env, layer, op = 1) {
    const u = progCloud.u, V = M4.inv(M4.lookAt(cam.eye, cam.tgt, [0, 1, 0]));
    gl.useProgram(progCloud.p); gl.uniformMatrix4fv(u.uVP, false, cam.vp); gl.uniform3fv(u.uR, [V[0], V[1], V[2]]); gl.uniform3fv(u.uU, [V[4], V[5], V[6]]); gl.uniform3fv(u.uCam, cam.eye);
    gl.uniform3fv(u.uSun, env.sunDir); gl.uniform3fv(u.uSunC, env.sunCol.map((x) => Math.min(1, x / 3))); gl.uniform3fv(u.uFog, env.fog); gl.uniform3fv(u.uLow, env.cloudLow || [.68, .72, .8]);
    gl.uniform1f(u.uFogN, env.fogN); gl.uniform1f(u.uFogF, env.fogF); gl.uniform1f(u.uOp, op);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    gl.bindVertexArray(layer.vao); gl.drawElements(gl.TRIANGLES, layer.count, gl.UNSIGNED_INT, 0);
    gl.depthMask(true); gl.disable(gl.BLEND); gl.bindVertexArray(null);
  }
  function init(c, opts = {}) {""")
rep("return { init, mesh, texQuad, texture, delTex, render, get gl() { return gl; } };","return { init, mesh, texQuad, texture, delTex, render, cloudLayer, drawClouds, get gl() { return gl; } };")
open(p,'w').write(s)
