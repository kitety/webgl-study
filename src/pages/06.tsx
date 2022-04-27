import { useMount } from 'ahooks';
import { useRef } from 'react';
import './style.less';

// 返回 0 到 range 范围内的随机整数
function randomInt(range: number) {
  return Math.floor(Math.random() * range);
}

// 用参数生成矩形顶点并写进缓冲

function setRectangle(gl: WebGLRenderingContext, x: number, y: number, width: number, height: number) {
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;

  // 注意: gl.bufferData(gl.ARRAY_BUFFER, ...) 将会影响到
  // 当前绑定点`ARRAY_BUFFER`的绑定缓冲
  // 目前我们只有一个缓冲，如果我们有多个缓冲
  // 我们需要先将所需缓冲绑定到`ARRAY_BUFFER`

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    x1, y1,
    x2, y1,
    x1, y2,
    x1, y2,
    x2, y1,
    x2, y2]), gl.STATIC_DRAW);
}

// 在缓冲存储构成 'F' 的值
function setGeometry(gl: WebGLRenderingContext) {
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      0, -100,
      150, 125,
      -175, 100
    ]),
    gl.STATIC_DRAW);
}
const Index = () => {
  const ref = useRef<HTMLCanvasElement>(null)


  useMount(() => {
    // 初始化代码
    const canvas = document.querySelector("#canvas")! as HTMLCanvasElement;
    const gl = canvas.getContext("webgl")!;
    // 创建着色器方法 ，输入参数：渲染上下文，着色器类型，数据源
    function createShader(gl: WebGLRenderingContext, type: number, source: string) {
      // 创建着色器对象
      var shader = gl.createShader(type)!;
      // 将数据源传入着色器对象
      gl.shaderSource(shader, source);
      // 编译--生成着色器
      gl.compileShader(shader);
      var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (success) {
        return shader;
      }
      console.log(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
    }
    // 两个着色器 link（链接）到一个 program（着色程序）
    function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
      var program = gl.createProgram()!;
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      var success = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (success) {
        return program;
      }
      console.log(gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
    }

    if (gl) {
      var vertexShaderSource = `
      attribute vec2 a_position;

      uniform mat3 u_matrix;

      varying vec4 v_color;

      void main() {
        // Multiply the position by the matrix.
        gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);

        // Convert from clipspace to colorspace.
        // Clipspace goes -1.0 to +1.0
        // Colorspace goes from 0.0 to 1.0
        v_color = gl_Position * 0.5 + 0.5;
      }`
      var fragmentShaderSource = `
      precision mediump float;

      varying vec4 v_color;

      void main() {
        gl_FragColor = v_color;
      }`
      var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)!;
      console.log('vertexShader: ', vertexShader);
      var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)!;
      console.log('fragmentShader: ', fragmentShader);
      // 着色程序
      var program = createProgram(gl, vertexShader, fragmentShader)!;
      gl.useProgram(program);

      console.log('program: ', program);
      // 找到属性
      var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
      // lookup uniforms
      var matrixLocation = gl.getUniformLocation(program, "u_matrix");


      // 属性值从缓冲中获取数据，所以我们创建一个缓冲
      var positionBuffer = gl.createBuffer()!;
      // WebGL可以通过绑定点操控全局范围内的许多数据，你可以把绑定点想象成一个WebGL内部的全局变量。 首先绑定一个数据源到绑定点，然后可以引用绑定点指向该数据源。 所以让我们来绑定位置信息缓冲（下面的绑定点就是ARRAY_BUFFER）。
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      // 将几何数据存到缓冲
      setGeometry(gl);
      var translation = [200, 150,];
      var angleInRadians = 0;
      var scale = [1, 1];

      drawScene();
      // Setup a ui.
      webglLessonsUI.setupSlider("#x", { value: translation[0], slide: updatePosition(0), max: gl.canvas.width });
      webglLessonsUI.setupSlider("#y", { value: translation[1], slide: updatePosition(1), max: gl.canvas.height });
      webglLessonsUI.setupSlider("#angle", { slide: updateAngle, max: 360 });
      webglLessonsUI.setupSlider("#scaleX", { value: scale[0], slide: updateScale(0), min: -5, max: 5, step: 0.01, precision: 2 });
      webglLessonsUI.setupSlider("#scaleY", { value: scale[1], slide: updateScale(1), min: -5, max: 5, step: 0.01, precision: 2 });

      function updatePosition(index: number) {
        return function (event: any, ui: { value: number }) {
          translation[index] = ui.value;
          drawScene();
        };
      }

      function updateAngle(event: any, ui: { value: number }) {
        var angleInDegrees = 360 - ui.value;
        angleInRadians = angleInDegrees * Math.PI / 180;
        drawScene();
      }

      function updateScale(index: number) {
        return function (event: any, ui: { value: number }) {
          scale[index] = ui.value;
          drawScene();
        };
      }

      // 绘制场景
      function drawScene() {
        webglUtils.resizeCanvasToDisplaySize(gl.canvas);
        // 告诉webgl如何从裁剪空间对应到像素
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // 清空画布
        gl.clear(gl.COLOR_BUFFER_BIT);
        // 使用我们的程序
        gl.useProgram(program);
        // 启用属性
        gl.enableVertexAttribArray(positionAttributeLocation);
        // 绑定位置缓冲
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);


        //告诉属性怎么从positionBuffer中读取值（ARRAY_BUFFER）
        var size = 2;          // 每次迭代运行提取两个单位数据
        var type = gl.FLOAT;   // 每个单位的数据类型是32位浮点型
        var normalize = false; // 不需要归一化数据
        var stride = 0;        // 0 = 移动单位数量 * 每个顶点的字节数量（总字节数）
        var offset = 0;        // 从缓冲起始位置开始读取
        gl.vertexAttribPointer(
          positionAttributeLocation, size, type, normalize, stride, offset);



        // Compute the matrix
        var matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);
        matrix = m3.translate(matrix, translation[0], translation[1]);
        matrix = m3.rotate(matrix, angleInRadians);
        matrix = m3.scale(matrix, scale[0], scale[1]);

        // Set the matrix.
        gl.uniformMatrix3fv(matrixLocation, false, matrix);

        // Draw the geometry.
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 3;
        gl.drawArrays(primitiveType, offset, count);
      }

    }

  })



  return (
    <div className="con">
      <canvas id="canvas" ref={ref} width="400" height="300"></canvas>
      <div id="uiContainer">
        <div id="ui">
          <div id="x"></div>
          <div id="y"></div>
          <div id="angle"></div>
          <div id="scaleX"></div>
          <div id="scaleY"></div>
        </div>
      </div>
    </div>
  );
};

export default Index;
