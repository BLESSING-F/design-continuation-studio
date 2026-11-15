import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Color, ShaderMaterial } from 'three';
import { colors } from '../theme/tokens';

export type OrbState = 'idle' | 'listening' | 'talking';
type Props = { state: OrbState; inputLevel: number; outputLevel: number; reduced: boolean; paused: boolean; onReady: () => void };

const vertex = `varying vec3 vNormal; varying vec3 vPosition;
void main(){ vNormal=normal; vPosition=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
const fragment = `
varying vec3 vNormal; varying vec3 vPosition;
uniform float uTime; uniform float uLevel; uniform vec3 uLilac; uniform vec3 uAzure; uniform vec3 uMint;
void main(){
 vec3 n=normalize(vNormal); float rim=pow(1.-max(n.z,0.),2.);
 float flow=sin(vPosition.y*6.+sin(vPosition.x*5.+uTime*.55)*1.7+uTime*.65);
 float ribbon=pow(.5+.5*sin(vPosition.y*10.+vPosition.x*4.+flow*2.+uTime*.4),5.);
 vec3 tint=mix(uLilac,uAzure,smoothstep(-.9,.8,flow));
 tint=mix(tint,uMint,smoothstep(.15,.95,sin(vPosition.x*5.-uTime*.4))*.7);
 float light=max(dot(n,normalize(vec3(-.5,.7,1.))),0.);
 tint*=.65+.38*light; tint+=ribbon*(.12+uLevel*.18);
 tint+=pow(max(dot(n,normalize(vec3(-.4,.55,1.))),0.),38.)*.7;
 tint=mix(tint,vec3(.94,.97,1.),rim*.6);
 gl_FragColor=vec4(tint,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;

function Presence(props: Props) {
  const material = useRef<ShaderMaterial>(null);
  const elapsed = useRef(0);
  const ready = useRef(false);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uLevel: { value: 0 }, uLilac: { value: new Color(colors.orbLilac) }, uAzure: { value: new Color(colors.orbAzure) }, uMint: { value: new Color(colors.orbMint) } }), []);
  useFrame((_, delta) => {
    if (!props.reduced && !props.paused) elapsed.current += Math.min(delta, .05);
    uniforms.uTime.value = elapsed.current;
    const level = props.state === 'talking' ? props.outputLevel : props.state === 'listening' ? props.inputLevel : 0;
    uniforms.uLevel.value += (Math.max(0, Math.min(1, level)) - uniforms.uLevel.value) * .12;
    if (!ready.current) { ready.current = true; requestAnimationFrame(props.onReady); }
  });
  return <mesh><sphereGeometry args={[1, 64, 48]} /><shaderMaterial ref={material} uniforms={uniforms} onUpdate={m => { m.uniforms = uniforms; }} vertexShader={vertex} fragmentShader={fragment} /></mesh>;
}

export default function OrbScene(props: Props) {
  return <Canvas frameloop={props.paused ? 'never' : props.reduced ? 'demand' : 'always'} dpr={[1, 2]} gl={{ alpha: true, antialias: true }} camera={{ position: [0, 0, 2.64], fov: 45 }}><Presence {...props} /></Canvas>;
}