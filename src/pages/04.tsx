import { useMount, useSize } from 'ahooks';
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

const Index = () => {
  const ref = useRef<HTMLCanvasElement>(null)
  const size = useSize(() => document.body);


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
      // {/* 一个属性变量 将会从缓冲中获取数据 */}
      attribute vec2 a_position;

      uniform vec2 u_resolution;
      // {/* 所有的着色器都有一个main方法 */}
      void main() {
        // 从像素坐标转换到 0.0 到 1.0
        vec2 zeroToOne = a_position / u_resolution;

        // 再把 0->1 转换 0->2
        vec2 zeroToTwo = zeroToOne * 2.0;

        // 把 0->2 转换到 -1->+1 (裁剪空间)
        vec2 clipSpace = zeroToTwo - 1.0;

        // gl_Position = vec4(clipSpace, 0, 1);
        // 你可能注意到矩形在区域左下角，WebGL认为左下角是 0，0 。 想要像传统二维API那样起点在左上角，我们只需翻转y轴即可。
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

      }`
      var fragmentShaderSource = `
      //  {/* 片元着色器没有默认精度，所以我们需要设置一个精度 */}、
      // {/* mediump 是一个不错的精度 代表medium precision中等精度 */}
      precision mediump float;
      uniform vec4 u_color;
      void main(){
        // gl_FragColor是一个片元着色器主要设置的变量
        // 返回“瑞迪施紫色”
        gl_FragColor = u_color;
      }`
      var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)!;
      var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)!;
      // 着色程序
      var program = createProgram(gl, vertexShader, fragmentShader)!;
      console.log('program: ', program);
      // 找到属性
      var colorUniformLocation = gl.getUniformLocation(program, "u_color");
      var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
      var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
      // 属性值从缓冲中获取数据，所以我们创建一个缓冲
      var positionBuffer = gl.createBuffer()!;
      // WebGL可以通过绑定点操控全局范围内的许多数据，你可以把绑定点想象成一个WebGL内部的全局变量。 首先绑定一个数据源到绑定点，然后可以引用绑定点指向该数据源。 所以让我们来绑定位置信息缓冲（下面的绑定点就是ARRAY_BUFFER）。
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      var translation = [0, 0];
      var width = 100;
      var height = 30;
      var color = [Math.random(), Math.random(), Math.random(), 1];
      drawScene();
      webglLessonsUI.setupSlider("#x", { slide: updatePosition(0), max: gl.canvas.width });
      webglLessonsUI.setupSlider("#y", { slide: updatePosition(1), max: gl.canvas.height });
      function updatePosition(index: number) {
        return function (_event: any, ui: { value: number }) {

          translation[index] = ui.value;
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

        // 设置矩形参数
        setRectangle(gl, translation[0], translation[1], width, height);

        //告诉属性怎么从positionBuffer中读取值（ARRAY_BUFFER）
        var size = 2;          // 每次迭代运行提取两个单位数据
        var type = gl.FLOAT;   // 每个单位的数据类型是32位浮点型
        var normalize = false; // 不需要归一化数据
        var stride = 0;        // 0 = 移动单位数量 * 每个顶点的字节数量（总字节数）
        var offset = 0;        // 从缓冲起始位置开始读取
        gl.vertexAttribPointer(
          positionAttributeLocation, size, type, normalize, stride, offset);
        // 设置分辨率
        gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
        // 设置颜色
        gl.uniform4fv(colorUniformLocation, color);
        // 绘制矩形
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 6;
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
        </div>
      </div>
    </div>
  );
};

export default Index;
