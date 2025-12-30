
# QR Particle Magic - Functional Requirements & Specifications (v1.0)

## 1. Core Functionality

### 1.1 Image Processing (`imageProcessor.ts`)
*   **Input**: Standard QR Code images (PNG/JPG).
*   **Logic**:
    *   The image is drawn onto an off-screen canvas.
    *   Pixel data is sampled at a density factor of `3` (every 3rd pixel) to optimize performance.
    *   **Filtering**: Only "dark" pixels (Alpha > 128 && Brightness < 100) are converted into coordinate points (`Point[]`).
    *   The background/white pixels are discarded to create the particle shape.

### 1.2 Rendering Engine (`CanvasRenderer.tsx`)
*   **Canvas Size**: Fixed at `600x600`.
*   **Particle System**:
    *   Each point from the QR code becomes a `Particle` object.
    *   Properties: `x`, `y`, `targetX` (QR position), `targetY`, `vx`, `vy`, `color`, `size`, `delay`.
*   **Animation Loop**:
    *   Uses `requestAnimationFrame`.
    *   Uses a `progress` based timer multiplied by `speed` factor.
    *   **States**: Idle, Playing, Recording, Finished.
    *   **Trail Effect**: Achieved by drawing a semi-transparent black rectangle (`rgba(0,0,0,0.25)`) over the previous frame.

### 1.3 Color Consistency Strategy
*   **Issue**: Inverted QR codes (white on black) must retain the user-selected color theme in the final frame.
*   **Solution**:
    *   A helper function `generateColoredImage` creates an off-screen canvas.
    *   It inverts the original image.
    *   It applies a `multiply` blend mode with the selected gradient/solid color.
    *   This pre-rendered colored image is drawn as the "ghost" background and the final fade-in result.

## 2. Animation Effects Specifications

| Effect Name | Start Position Logic | Behavior | Ease Factor |
| :--- | :--- | :--- | :--- |
| **Converge** | Random X/Y on canvas | Particles fly directly to target. | 0.05 |
| **Spiral** | Center + small radius | Particles spiral out based on distance. | 0.05 |
| **Matrix** | Correct X, Random Y (Top) | "Digital rain" effect falling into place. | 0.10 |
| **Explosion** | Center (300, 300) | Explodes outward to target. | 0.08 |
| **Vortex** | Far outside canvas (Circle) | Swirls inward to edges. | 0.04 |
| **Raindrop** | Correct X, Y = -10 | Falls vertically, delay based on Y pos. | 0.15 |
| **Scanwave** | Correct X/Y (jittered) | Invisible until "scan line" (delay) hits. | N/A (Flash) |

## 3. Customization Controls

### 3.1 Speed
*   **Range**: 0.5x to 3.0x.
*   **Implementation**: Multiplies the `progress` increment in the animation loop.

### 3.2 Particle Size
*   **Range**: 0.5x to 3.0x.
*   **Base Size**: Default 2px (Matrix uses 3px).
*   **Implementation**: Multiplies base size during rendering.

### 3.3 Color Themes
*   **White**: Standard `#ffffff`.
*   **Matrix**: Solid `#00ff00`.
*   **Neon**: Gradient Cyan (`#00ffff`) to Magenta (`#ff00ff`) based on X position.
*   **Fire**: Gradient Yellow to Red based on diagonal.
*   **Rainbow**: HSL Spectrum based on `(x+y)/5`.

## 4. Export & Recording

*   **Technology**: `MediaRecorder` API.
*   **MimeType Priority**: `video/webm;codecs=vp9` -> `video/webm`.
*   **Bitrate**: 8 Mbps (High Quality).
*   **FPS**: Canvas stream captured at 60 FPS.
*   **Flow**:
    1.  User clicks Download.
    2.  Animation resets.
    3.  Recorder starts.
    4.  Animation plays to completion.
    5.  Recorder stops -> Blob created -> Auto-download trigger.
