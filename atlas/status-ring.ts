// Atlas status ring: a node drawn as a fill, a thin gap and an outer ring whose color and
// dash carry a status. A solid ring is a reviewed status; a dashed ring (ringDashes > 0)
// is one nobody has verified yet. One program, one draw call, antialiased in the shader.
//
// Node attributes: color (fill), ringColor (empty or transparent for no ring), ringDashes
// (0 for solid, otherwise the number of dashes around the circle).
import { NodeProgram, ProgramInfo } from "sigma/rendering";
import { NodeDisplayData, RenderParams } from "sigma/types";
import { floatColor } from "sigma/utils";

const { UNSIGNED_BYTE, FLOAT } = WebGLRenderingContext;
const UNIFORMS = ["u_sizeRatio", "u_correctionRatio", "u_matrix", "u_gapColor"] as const;

const VERTEX = /*glsl*/ `
attribute vec2 a_position;
attribute float a_size;
attribute float a_angle;
attribute vec4 a_id;
attribute vec4 a_color;
attribute vec4 a_ringColor;
attribute float a_ringDashes;

uniform mat3 u_matrix;
uniform float u_sizeRatio;
uniform float u_correctionRatio;

varying vec2 v_diffVector;
varying float v_radius;
varying vec4 v_color;
varying vec4 v_ringColor;
varying float v_dashes;

void main() {
  float size = a_size * u_correctionRatio / u_sizeRatio * 4.0;
  vec2 diffVector = size * vec2(cos(a_angle), sin(a_angle));
  gl_Position = vec4((u_matrix * vec3(a_position + diffVector, 1)).xy, 0, 1);
  v_radius = size / 2.0;
  v_diffVector = diffVector;
  #ifdef PICKING_MODE
  v_color = a_id;
  #else
  v_color = a_color;
  v_ringColor = a_ringColor;
  v_dashes = a_ringDashes;
  #endif
}
`;

const FRAGMENT = /*glsl*/ `
precision highp float;

varying vec2 v_diffVector;
varying float v_radius;
varying vec4 v_color;
varying vec4 v_ringColor;
varying float v_dashes;

uniform float u_correctionRatio;
uniform vec4 u_gapColor;

const float bias = 255.0 / 254.0;
const float TAU = 6.28318530718;
const vec4 transparent = vec4(0.0);

void main(void) {
  float dist = length(v_diffVector);
  #ifdef PICKING_MODE
  gl_FragColor = dist > v_radius ? transparent : v_color;
  gl_FragColor.a *= bias;
  #else
  float px = u_correctionRatio;
  float aa = 1.5 * px;
  vec4 fill = v_color;
  vec4 color = fill;

  // Rings need room: below about 5 pixels of radius the node is drawn as a plain disc.
  if (v_ringColor.a > 0.0 && v_radius > 5.0 * px) {
    float ring = max(0.2 * v_radius, 1.5 * px);
    float gap = max(0.1 * v_radius, 1.0 * px);
    vec4 ringColor = v_ringColor;
    if (v_dashes > 0.5) {
      float t = fract((atan(v_diffVector.y, v_diffVector.x) / TAU + 0.25) * v_dashes);
      ringColor.a *= smoothstep(0.0, 0.06, t) * (1.0 - smoothstep(0.52, 0.58, t));
    }
    float inRing = 1.0 - smoothstep(v_radius - ring - aa, v_radius - ring, dist);
    float inFill = 1.0 - smoothstep(v_radius - ring - gap - aa, v_radius - ring - gap, dist);
    vec4 inner = mix(u_gapColor, fill, inFill);
    color = mix(ringColor, inner, inRing);
  }
  color.a *= 1.0 - smoothstep(v_radius - aa, v_radius, dist);
  color.a *= bias;
  gl_FragColor = color;
  #endif
}
`;

export default class NodeStatusRingProgram extends NodeProgram<(typeof UNIFORMS)[number]> {
  static readonly ANGLE_1 = 0;
  static readonly ANGLE_2 = (2 * Math.PI) / 3;
  static readonly ANGLE_3 = (4 * Math.PI) / 3;
  // The gap between fill and ring; set it to the page background.
  static gapColor: [number, number, number, number] = [1, 1, 1, 1];

  getDefinition() {
    return {
      VERTICES: 3,
      VERTEX_SHADER_SOURCE: VERTEX,
      FRAGMENT_SHADER_SOURCE: FRAGMENT,
      METHOD: WebGLRenderingContext.TRIANGLES,
      UNIFORMS,
      ATTRIBUTES: [
        { name: "a_position", size: 2, type: FLOAT },
        { name: "a_id", size: 4, type: UNSIGNED_BYTE, normalized: true },
        { name: "a_size", size: 1, type: FLOAT },
        { name: "a_color", size: 4, type: UNSIGNED_BYTE, normalized: true },
        { name: "a_ringColor", size: 4, type: UNSIGNED_BYTE, normalized: true },
        { name: "a_ringDashes", size: 1, type: FLOAT },
      ],
      CONSTANT_ATTRIBUTES: [{ name: "a_angle", size: 1, type: FLOAT }],
      CONSTANT_DATA: [[NodeStatusRingProgram.ANGLE_1], [NodeStatusRingProgram.ANGLE_2], [NodeStatusRingProgram.ANGLE_3]],
    };
  }

  processVisibleItem(nodeIndex: number, startIndex: number, data: NodeDisplayData & { ringColor?: string; ringDashes?: number }) {
    const array = this.array;
    array[startIndex++] = data.x;
    array[startIndex++] = data.y;
    array[startIndex++] = nodeIndex;
    array[startIndex++] = data.size;
    array[startIndex++] = floatColor(data.color);
    array[startIndex++] = floatColor(data.ringColor || "rgba(0,0,0,0)");
    array[startIndex++] = data.ringDashes || 0;
  }

  setUniforms(params: RenderParams, { gl, uniformLocations }: ProgramInfo): void {
    gl.uniform1f(uniformLocations.u_correctionRatio, params.correctionRatio);
    gl.uniform1f(uniformLocations.u_sizeRatio, params.sizeRatio);
    gl.uniformMatrix3fv(uniformLocations.u_matrix, false, params.matrix);
    gl.uniform4f(uniformLocations.u_gapColor, ...NodeStatusRingProgram.gapColor);
  }
}
