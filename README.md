# Professional Portfolio with Cinematic Black Hole

This project is a high-performance, visually stunning portfolio website for a Software Engineer. It features a custom-built WebGL/Three.js background that simulates a Kerr Black Hole using General Relativity physics.

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Locally**:
   ```bash
   npm run dev
   ```

3. **Build for Production**:
   ```bash
   npm run build
   ```

## 🌌 The Black Hole Background

The background is NOT a video or a simple sprite. It is a live-rendered **General Relativity Simulation**:
- **Kerr Metric**: Simulates the spacetime curvature of a rotating black hole.
- **Accretion Disk**: A volumetric gas simulation with relativistic Doppler shifting (blue-shifted forward, red-shifted away).
- **Gravitational Lensing**: Photon tracing logic calculates the bending of light from the background starfield.
- **Cinematic Look**: Optimized for a high-end "Interstellar" movie look with smooth auto-spinning and peak resolution.

## 🛠 Tech Stack
- **Three.js / WebGL / GLSL**: For the black hole simulation.
- **GSAP**: For smooth scroll-triggered animations.
- **Vite**: For fast development and bundling.
- **Vanilla CSS**: For a tailored, premium design system.

## ✨ Features
- **Responsive Design**: Works perfectly on mobile, tablet, and desktop.
- **Modern UI**: Dark mode with glassmorphic cards and vibrant amber accents.
- **SEO Optimized**: Metadata and semantic HTML structure included.
- **Performance Focused**: Efficient ray-marching shaders and adaptive resolution handling.
