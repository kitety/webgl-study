import { useMount, useSize } from 'ahooks';
import { useRef } from 'react';
import './style.less';



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
      void main(){
        // gl_FragColor是一个片元着色器主要设置的变量
        // 返回“瑞迪施紫色”
        gl_FragColor = vec4(1.0, 0.0, 0.5, 1.0);
      }`
      var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)!;
      var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)!;
      // 着色程序
      var program = createProgram(gl, vertexShader, fragmentShader)!;
      console.log('program: ', program);
      // 找到属性
      var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
      var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
      // 属性值从缓冲中获取数据，所以我们创建一个缓冲
      var positionBuffer = gl.createBuffer()!;
      // WebGL可以通过绑定点操控全局范围内的许多数据，你可以把绑定点想象成一个WebGL内部的全局变量。 首先绑定一个数据源到绑定点，然后可以引用绑定点指向该数据源。 所以让我们来绑定位置信息缓冲（下面的绑定点就是ARRAY_BUFFER）。
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      // 三个二维点坐标
      var positions = [
        10, 20,
        80, 20,
        10, 30,
        10, 30,
        80, 20,
        80, 30,
      ];
      // STATIC_DRAW 不会经常改变
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
      // 上面部分是初始化代码
      // 这样就告诉WebGL裁剪空间的 -1 -> +1 分别对应到x轴的 0 -> gl.canvas.width 和y轴的 0 -> gl.canvas.height。
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

      // 清空画布
      // 我们用0, 0, 0, 0清空画布，分别对应 r, g, b, alpha （红，绿，蓝，阿尔法）值， 所以在这个例子中我们让画布变透明了。
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)

      // 执行哪个着色程序  告诉它用我们之前写好的着色程序（一个着色器对）
      gl.useProgram(program)
      // 接下来我们需要告诉WebGL怎么从我们之前准备的缓冲中获取数据给着色器中的属性
      gl.enableVertexAttribArray(positionAttributeLocation)

      // 指定缓冲区读取数据的方式
      // 将绑定点绑定到缓冲数据
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      // 告诉WebGL如何解析缓冲中的数据
      // 每个迭代运行提取两个单位数据
      var size = 2;
      // 每个单位的数据类型是32位浮点型
      var type = gl.FLOAT;
      // 不需要归一化数据
      var normalize = false;
      //  0=移动单位数量*每个单位占用内存（sizeof(type)）
      // 每次迭代运行运动多少内存到下一个数据点
      var stride = 0
      // 从缓冲起始位置开始读取
      var offset = 0

      gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset)
      // 设置全局变量 分辨率
      gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

      // 运行着色程序
      var primitiveType = gl.TRIANGLES
      var offset = 0;
      var count = 6;
      gl.drawArrays(primitiveType, offset, count)


    }

  })



  return (
    <div className="con">
      <canvas id="canvas" ref={ref} width="400" height="300"></canvas>

    </div>
  );
};

export default Index;
