import{m as p,G as h,s as m,S as f,a as d,n as g}from"./graphology.BwGEgIxD.js";import{g as R}from"./small-graph.D6DIB7I0.js";import{e as b}from"./arrow.BEykAiMF.js";import{p as v}from"./curved.CciR-gGH.js";import{l as y}from"./layer.CzMdmixX.js";import"./schema.DPqDLh61.js";function x(a){const{aspectRatio:t={attribute:"aspectRatio"},cornerRadius:e,rotation:o}=a??{},s=`
${h}
float sdf_rectangle(vec2 uv, float size, float cornerRadius, float rotation, float aspectRatio) {
  // Apply rotation if needed
  vec2 p = uv;
  if (rotation != 0.0) {
    p = rotate2D(rotation) * p;
  }

  vec2 halfExtent = aspectRatio >= 1.0 ? vec2(size, size / aspectRatio) : vec2(size * aspectRatio, size);
  // Keeps thin rectangles from growing past their half extent
  float radius = min(cornerRadius, min(halfExtent.x, halfExtent.y));

  // Based on Inigo Quilez's box SDF: https://iquilezles.org/articles/distfunctions2d/
  vec2 d = abs(p) - (halfExtent - radius);
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - radius;
}
`,r=[{name:"u_cornerRadius",type:"float",value:typeof e=="number"?e:0},{name:"u_rotation",type:"float",value:typeof o=="number"?o:0}],n=c=>`0.70710678 / max(${c}, 1.0 / ${c})`;if(!p(t))return{name:"rectangle",glsl:s,uniforms:[...r,{name:"u_aspectRatio",type:"float",value:t}],inradiusFactor:Math.SQRT1_2,inradiusFactorGLSL:n(m(t))};const{attribute:l,default:u=1}=t;return{name:"rectangle",glsl:s,uniforms:r,attributes:[{name:"aspectRatio",size:1,type:WebGL2RenderingContext.FLOAT,source:l}],variables:{[l]:{type:"number",default:u}},inradiusFactor:Math.SQRT1_2,inradiusFactorGLSL:n("v_aspectRatio")}}const S=document.getElementById("sigma-container"),L={a:{width:600,height:400},b:{width:400,height:600},c:{width:600,height:600},d:{width:800,height:300},e:{width:300,height:800},f:{width:500,height:350}},i=R();i.forEachNode(a=>{const{width:t,height:e}=L[a];i.mergeNodeAttributes(a,{image:`https://picsum.photos/${t}/${e}`,aspectRatio:t/e,label:`${t} x ${e}`})});new f(i,S,{primitives:{nodes:{shapes:[x({cornerRadius:.2})],variables:{image:{type:"string",default:""}},layers:[g({color:"#eee"}),y({textureManagerOptions:{objectFit:"contain"}})]},edges:{paths:[v({})],extremities:[b({lengthRatio:4,widthRatio:4})]}},styles:{nodes:[d.nodes,{backdropArea:"label",labelPosition:"below",size:40}],edges:[d.edges,{path:"curved",head:"arrow",size:8}]},settings:{autoRescaleContent:"nodes"}});
