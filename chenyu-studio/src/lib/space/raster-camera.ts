/** Upload the room once. Camera frames update two uniforms, without Canvas2D resampling. */
export function createRasterCamera(output: HTMLCanvasElement, source: HTMLCanvasElement, contentScale: [number, number] = [1, 1]) {
  const gl = output.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false });
  if (!gl) return null;
  const shaders: WebGLShader[] = [];
  let program: WebGLProgram | null = null, buffer: WebGLBuffer | null = null, texture: WebGLTexture | null = null;
  const dispose = () => {
    if (texture) gl.deleteTexture(texture);
    if (buffer) gl.deleteBuffer(buffer);
    if (program) gl.deleteProgram(program);
    shaders.forEach(shader => gl.deleteShader(shader));
  };
  try {
    const shader = (kind: number, code: string) => {
      const value = gl.createShader(kind);
      if (!value) throw new Error('Camera shader unavailable');
      shaders.push(value); gl.shaderSource(value, code); gl.compileShader(value);
      if (!gl.getShaderParameter(value, gl.COMPILE_STATUS)) throw new Error('Camera shader failed');
      return value;
    };
    const vertex = shader(gl.VERTEX_SHADER, `attribute vec2 position;
      varying vec2 uv;
      void main(){ uv=position*.5+.5; gl_Position=vec4(position,0.,1.); }`);
    const fragment = shader(gl.FRAGMENT_SHADER, `precision highp float;
      varying vec2 uv;
      uniform sampler2D room;
      uniform vec2 viewportSize;
      uniform vec2 origin;
      uniform vec2 drawSize;
      uniform vec2 contentScale;
      void main(){
        vec2 pixel=vec2(uv.x,1.-uv.y)*viewportSize;
        vec2 sourceUV=(pixel-origin)/drawSize;
        if(sourceUV.x<0.||sourceUV.x>1.||sourceUV.y<0.||sourceUV.y>1.){gl_FragColor=vec4(1.);return;}
        vec4 color=texture2D(room,sourceUV*contentScale);
        gl_FragColor=vec4(mix(vec3(1.),color.rgb,color.a),1.);
      }`);
    program = gl.createProgram();
    if (!program) throw new Error('Camera program unavailable');
    gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Camera program failed');
    gl.useProgram(program);
    buffer = gl.createBuffer(); texture = gl.createTexture();
    if (!buffer || !texture) throw new Error('Camera buffer unavailable');
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    const isPowerOfTwo = (size: number) => size > 0 && (size & (size - 1)) === 0;
    const mipmapped = isPowerOfTwo(source.width) && isPowerOfTwo(source.height);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mipmapped ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    if (mipmapped) gl.generateMipmap(gl.TEXTURE_2D);
    gl.uniform2f(gl.getUniformLocation(program, 'contentScale'), contentScale[0], contentScale[1]);
    gl.uniform1i(gl.getUniformLocation(program, 'room'), 0);
    gl.uniform2f(gl.getUniformLocation(program, 'viewportSize'), output.width, output.height);
    gl.viewport(0, 0, output.width, output.height);
    const origin = gl.getUniformLocation(program, 'origin'), size = gl.getUniformLocation(program, 'drawSize');
    return {
      draw(x: number, y: number, width: number, height: number) {
        gl.uniform2f(origin, x, y); gl.uniform2f(size, width, height);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      },
      dispose,
    };
  } catch {
    dispose(); return null;
  }
}
