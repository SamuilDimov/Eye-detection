# Animatronic Eyes: Smile, Age & Gender Detection

This project uses **Three.js** and **face-api.js** to animate a pair of floating animatronic eyes that react to human presence, facial expressions, and estimated demographics.

When a person smiles:

* The eyes open wider 👁️
* The irises glow red 🔴
* Age and gender are estimated and displayed 🧠

## 🧰 Technologies Used

* [Three.js](https://threejs.org/) – 3D rendering
* [face-api.js](https://github.com/justadudewhohacks/face-api.js) – real-time face detection and analysis
* [Vite](https://vitejs.dev/) – fast modern web dev environment

## 📁 Folder Structure

```
project-root/
├── index.html
├── public/
│   └── models/           # Face-api model files go here
│       ├── tiny_face_detector_model-*
│       ├── face_landmark_68_model-*
│       ├── face_expression_model-*
│       └── age_gender_model-*
├── src/
│   └── main.js           # Core logic and animation
├── package.json
└── vite.config.js
```

## 📦 Installation & Setup

1. **Install dependencies**

```bash
npm install
```

2. **Download models**
   Manually download these model files from the [face-api.js weights repo](https://github.com/justadudewhohacks/face-api.js/tree/master/weights) and place them in `public/models/`:

* `tiny_face_detector_model-weights_manifest.json` & `-shard1`
* `face_landmark_68_model-weights_manifest.json` & `-shard1`
* `face_expression_model-weights_manifest.json` & `-shard1`
* `age_gender_model-weights_manifest.json` & `-shard1`

3. **Run the project**

```bash
npm run dev
```

Then open the URL (typically `http://localhost:5173`) in your browser.

> Make sure to allow webcam access when prompted.

## 🤖 Features

* Animatronic eyes float and blink periodically
* Smile detection triggers red iris glow and wider eyelids
* Real-time age and gender estimation
* Webcam preview box
* Display of detection results in a corner UI

## 🧪 Expressions Detected

* `neutral`
* `happy`
* `sad`
* `angry`
* `fearful`
* `disgusted`
* `surprised`

You can use these for future logic (e.g., custom eye reactions).

## 🛠 Future Ideas

* Make eyes follow detected face
* Trigger sound or light animation on emotion change
* Expand to multi-person detection

## 📸 Credits

* 3D model: Custom `Animatronic_Eyes.glb`
* Facial analysis powered by [face-api.js](https://github.com/justadudewhohacks/face-api.js)

---

Built with ❤️ by Samuil Dimov
