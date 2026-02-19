import * as THREE from 'three';

const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = `
    uniform float iTime;
    uniform vec2 iResolution;
    uniform vec3 iCamPos;
    uniform vec3 iCamDir;
    uniform float iSpin;
    uniform float iMaxIterations;
    uniform float iViewportScale;
    varying vec2 vUv;

    const float SagA_rs = 4.0; 
    const float D_LAMBDA = 0.05;
    const float ESCAPE_R = 350.0;
    const float DISK_R1 = 7.0; 
    const float DISK_R2 = 40.0; 

    float hash(float n) { return fract(sin(n) * 43758.5453123); }
    
    float noise(vec3 x) {
        vec3 p = floor(x);
        vec3 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        float n = p.x + p.y * 57.0 + 113.0 * p.z;
        return mix(mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
                       mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y),
                   mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
                       mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y), f.z);
    }

    float fbm(vec3 p) {
        float f = 0.0;
        f += 0.5000 * noise(p); p = p * 2.02;
        f += 0.2500 * noise(p); p = p * 2.03;
        f += 0.1250 * noise(p); p = p * 2.01;
        f += 0.0625 * noise(p);
        return f / 0.9375;
    }

    vec3 getStarfield(vec3 dir) {
        vec3 p = normalize(dir) * 300.0;
        float h = noise(p * 0.6);
        if (h > 0.96) {
            float twinkle = 0.7 + 0.3 * sin(iTime * 0.2 + h * 500.0);
            float intensity = pow(fract(h * 10.0), 20.0) * 40.0 * twinkle;
            vec3 starColor = mix(vec3(0.6,0.7,1.0), vec3(1.0,0.9,0.7), hash(h*1000.0));
            return starColor * intensity;
        }
        return vec3(0.0);
    }

    struct Ray {
        vec3 p;
        float r, theta, phi;
        float dr, dtheta, dphi;
        float E, L;
    };

    Ray initRay(vec3 pos, vec3 dir) {
        Ray ray;
        ray.p = pos;
        ray.r = length(pos);
        ray.theta = acos(pos.y / ray.r);
        ray.phi = atan(pos.z, pos.x);

        float dx = dir.x, dy = dir.y, dz = dir.z;
        ray.dr     = (pos.x*dx + pos.y*dy + pos.z*dz) / ray.r;
        ray.dtheta = (pos.y*ray.dr - ray.r*dy) / max(0.001, ray.r * ray.r * sin(ray.theta));
        ray.dphi   = (pos.x*dz - pos.z*dx) / max(0.001, pos.x*pos.x + pos.z*pos.z);

        ray.L = ray.r * ray.r * sin(ray.theta) * sin(ray.theta) * ray.dphi;
        float f = 1.0 - SagA_rs / ray.r;
        float dt_dL = sqrt(max(0.0, (ray.dr*ray.dr)/f + ray.r*ray.r*(ray.dtheta*ray.dtheta + sin(ray.theta)*sin(ray.theta)*ray.dphi*ray.dphi)));
        ray.E = f * dt_dL;

        return ray;
    }

    void geodesicRHS(Ray ray, out vec3 d1, out vec3 d2) {
        float r = ray.r, theta = ray.theta;
        float dr = ray.dr, dtheta = ray.dtheta, dphi = ray.dphi;
        
        float a = iSpin * (SagA_rs * 0.5);
        float Sigma = r*r + a*a*cos(theta)*cos(theta);
        float f = 1.0 - SagA_rs*r / Sigma;
        float dt_dL = ray.E / f;

        d1 = vec3(dr, dtheta, dphi);
        d2.x = - (SagA_rs / (2.0 * r*r)) * f * dt_dL * dt_dL
             + (SagA_rs / (2.0 * r*r * f)) * dr * dr
             + r * (dtheta*dtheta + sin(theta)*sin(theta)*dphi*dphi);
        d2.y = -2.0*dr*dtheta/r + sin(theta)*cos(theta)*dphi*dphi;
        
        float omega = (SagA_rs * a * r) / (Sigma * (r*r + a*a) + SagA_rs * a*a * r * sin(theta)*sin(theta));
        d2.z = -2.0*dr*dphi/r - 2.0*cos(theta)/max(0.001, sin(theta)) * dtheta * dphi + omega * 0.00001;
    }

    void rk4Step(inout Ray ray, float dL) {
        vec3 k1a, k1b;
        geodesicRHS(ray, k1a, k1b);
        ray.r      += dL * k1a.x;
        ray.theta  += dL * k1a.y;
        ray.phi    += dL * k1a.z;
        ray.dr     += dL * k1b.x;
        ray.dtheta += dL * k1b.y;
        ray.dphi   += dL * k1b.z;

        ray.p.x = ray.r * sin(ray.theta) * cos(ray.phi);
        ray.p.y = ray.r * cos(ray.theta);
        ray.p.z = ray.r * sin(ray.theta) * sin(ray.phi);
    }

    vec3 dopplerShift(vec3 color, vec3 pos, vec3 dir) {
        float r = length(pos.xz);
        float v = sqrt(SagA_rs / (2.0 * r));
        vec3 vel = normalize(vec3(-pos.z, 0.0, pos.x)) * v;
        float cosAlpha = dot(normalize(dir), vel);
        float beta = v * 0.8; 
        float gamma = 1.0 / sqrt(max(0.01, 1.0 - beta*beta));
        float D = 1.0 / (gamma * (1.0 - beta * cosAlpha));
        
        vec3 shifted = color * pow(D, 8.0);
        shifted = mix(shifted, shifted * vec3(1.1, 0.95, 0.8), clamp(D-1.0, 0.0, 1.0)); 
        shifted = mix(shifted, shifted * vec3(0.9, 0.8, 1.1), clamp(1.0-D, 0.0, 1.0)); 
        return shifted;
    }

    void main() {
        vec2 pix = gl_FragCoord.xy;
        // Proper centering with device-specific scaling
        float aspect = iResolution.x / iResolution.y;
        vec2 uv = (pix - 0.5 * iResolution.xy) / min(iResolution.x, iResolution.y) * iViewportScale;
        
        vec3 forward = normalize(iCamDir);
        vec3 right = normalize(cross(forward, vec3(0,1,0)));
        vec3 up = cross(right, forward);
        vec3 dir = normalize(forward + uv.x * right + uv.y * up);
        
        Ray ray = initRay(iCamPos, dir);
        vec3 accumColor = vec3(0.0);
        float accumAlpha = 0.0;
        bool hitBH = false;

        vec3 prevP = ray.p;
        for (int i = 0; i < 300; i++) {
            if (float(i) >= iMaxIterations) break;
            if (ray.r < SagA_rs) { hitBH = true; break; }
            if (ray.r > ESCAPE_R) break;

            float dL = max(D_LAMBDA, ray.r * 0.035);
            rk4Step(ray, dL);

            float horizonProx = smoothstep(SagA_rs * 2.0, SagA_rs * 1.1, ray.r);
           accumColor = mix(accumColor, accumColor * vec3(1.1, 0.6, 0.4), horizonProx * 0.15);

            if (prevP.y * ray.p.y < 0.0) {
                float rDisk = length(ray.p.xz);
                if (rDisk > DISK_R1 && rDisk < DISK_R2) {
                    float ang = atan(ray.p.z, ray.p.x);
                    vec3 noiseCoord = vec3(rDisk * 0.3, ang * 3.5 + iTime * 0.45, ray.p.y * 10.0);
                    float n = fbm(noiseCoord);
                    
                    float density = n * n * exp(-abs(ray.p.y) * 4.0) * (1.0 - (rDisk - DISK_R1)/(DISK_R2 - DISK_R1));
                    density *= smoothstep(DISK_R1, DISK_R1 + 1.5, rDisk) * smoothstep(DISK_R2, DISK_R2 - 4.0, rDisk);
                    
                    float temp = (1.0 - (rDisk - DISK_R1)/(DISK_R2 - DISK_R1)) * 1.8;
                    vec3 fireColor = mix(vec3(0.3, 0.05, 0.0), vec3(1.0, 0.45, 0.02), temp);
                    fireColor = mix(fireColor, vec3(1.0, 0.65, 0.1), min(1.0, n * temp)); 
                    
                    float glow = exp(-abs(ray.p.y) * 2.5) * 0.15;
                    fireColor += vec3(1.0, 0.6, 0.2) * glow;

                    vec3 shifted = dopplerShift(fireColor, ray.p, dir);
                    float alpha = density * 0.85; 
                    
                    accumColor += (1.0 - accumAlpha) * shifted * alpha;
                    accumAlpha += (1.0 - accumAlpha) * alpha;
                    if (accumAlpha > 0.99) break;
                }
            }
            prevP = ray.p;
        }

        vec3 finalColor;
        if (hitBH) {
            finalColor = accumColor;
        } else {
            finalColor = accumColor + (1.0 - accumAlpha) * getStarfield(ray.p);
        }

        finalColor *= 1.5; 
        finalColor = pow(max(finalColor, vec3(0.0)), vec3(0.85));
 
        float bloom = smoothstep(1.2, 2.5, max(max(finalColor.r, finalColor.g), finalColor.b));
finalColor += bloom * 0.15;

        float flicker = 0.97 + 0.03 * sin(iTime * 1.5);
        finalColor *= flicker;

        vec2 q = gl_FragCoord.xy / iResolution.xy;
        float vignette = smoothstep(1.2, 0.4, distance(q, vec2(0.5)));
        finalColor *= vignette;

        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

export class BlackHoleBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        
        this.isLowEndDevice = this.detectLowEndDevice();
        this.pixelRatio = this.isLowEndDevice ? 0.5 : Math.min(window.devicePixelRatio, 1.5);
        
        // Device detection for viewport scaling
        this.deviceType = this.detectDeviceType();
        this.viewportScale = this.getViewportScale();
        
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            antialias: !this.isLowEndDevice,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(this.pixelRatio);

        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        this.uniforms = {
            iTime: { value: 0 },
            iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            iCamPos: { value: new THREE.Vector3(0, 1.5, 14) },
            iCamDir: { value: new THREE.Vector3(0, -1.5, -10).normalize() },
            iViewportScale: { value: this.viewportScale },
            iSpin: { value: 0.98 },
            iMaxIterations: { value: this.isLowEndDevice ? 100 : 220 }
        };

        const material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader,
            fragmentShader
        });

        this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
        this.scene.add(this.mesh);

        window.addEventListener('resize', () => {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.uniforms.iResolution.value.set(window.innerWidth, window.innerHeight);
        });

        this.lastFrameTime = 0;
        this.targetFPS = this.isLowEndDevice ? 30 : 60;
        this.frameInterval = 1000 / this.targetFPS;

        this.animate();
    }

    detectLowEndDevice() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return true;
        
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            if (renderer.includes('Adreno') || renderer.includes('Mali') || renderer.includes('PowerVR')) {
                return true;
            }
        }
        return navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
    }

    detectDeviceType() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const aspect = width / height;
        
        if (width <= 768) {
            return 'mobile';
        } else if (width <= 1024) {
            return 'tablet';
        } else {
            return 'desktop';
        }
    }

    getViewportScale() {
        switch (this.deviceType) {
            case 'mobile':
                return 2.5; // Zoom out more for mobile to see full black hole
            case 'tablet':
                return 1.8; // Medium zoom for tablet
            case 'desktop':
            default:
                return 1.2; // Slightly zoomed out for desktop too
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const now = performance.now();
        const delta = now - this.lastFrameTime;
        if (delta < this.frameInterval) return;
        this.lastFrameTime = now - (delta % this.frameInterval);
        
        const time = now * 0.001;
        this.uniforms.iTime.value = time;

        // Keep camera static and pointed at black hole center

        this.renderer.render(this.scene, this.camera);
    }
}
