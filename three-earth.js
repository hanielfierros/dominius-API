/**
 * three-earth.js - Web V8
 * Photorealistic Earth with space background
 * Fixed textures to stable GitHub raw URLs (r134) to avoid 404
 * Large Earth, slow rotation, space with stars/nebulae
 * Mouse zoom/drag for interaction (limited)
 * Black deep space background
 */

let scene, camera, renderer;
let earth, clouds, atmosphere;
let satellites = [];
let isDragging = false;
let prevMouseX = 0;
let prevMouseY = 0;
let targetZoom = 140;
let currentZoom = 140;

function initEarth() {
  const canvas = document.createElement('canvas');
  canvas.id = 'earth-bg';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '-1';
  canvas.style.pointerEvents = 'auto';
  document.body.appendChild(canvas);

  renderer = new THREE.WebGLRenderer({ 
    canvas: canvas, 
    antialias: true, 
    alpha: false,
    powerPreference: "high-performance"
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 1); // Deep black space - no white ever

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    5000
  );
  camera.position.set(0, 30, targetZoom);

  // Lighting
  const ambient = new THREE.AmbientLight(0x333355, 0.5);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffffff, 2.0);
  sun.position.set(250, 80, 120);
  scene.add(sun);

  // Space environment
  createSpaceEnvironment();

  const loader = new THREE.TextureLoader();

  // Stable pinned textures from three.js r134 (reliable, no 404)
  const earthMap = loader.load('https://raw.githubusercontent.com/mrdoob/three.js/r134/examples/textures/planets/earth_atmos_2048.jpg');
  const bumpMap = loader.load('https://raw.githubusercontent.com/mrdoob/three.js/r134/examples/textures/planets/earth_bump_2048.jpg');
  const specMap = loader.load('https://raw.githubusercontent.com/mrdoob/three.js/r134/examples/textures/planets/earth_specular_2048.jpg');
  const cloudsMap = loader.load('https://raw.githubusercontent.com/mrdoob/three.js/r134/examples/textures/planets/earth_clouds_1024.png');

  // Large Earth
  const earthGeo = new THREE.SphereGeometry(55, 128, 128);
  earth = new THREE.Mesh(
    earthGeo,
    new THREE.MeshPhongMaterial({
      map: earthMap,
      bumpMap: bumpMap,
      bumpScale: 1.1,
      specularMap: specMap,
      specular: new THREE.Color('grey'),
      shininess: 16
    })
  );
  scene.add(earth);

  // Clouds
  const cloudsGeo = new THREE.SphereGeometry(55.5, 128, 128);
  clouds = new THREE.Mesh(
    cloudsGeo,
    new THREE.MeshLambertMaterial({
      map: cloudsMap,
      transparent: true,
      opacity: 0.75
    })
  );
  scene.add(clouds);

  // Atmosphere
  const atmGeo = new THREE.SphereGeometry(57, 128, 128);
  atmosphere = new THREE.Mesh(
    atmGeo,
    new THREE.MeshBasicMaterial({
      color: 0x66ccff,
      transparent: true,
      opacity: 0.07,
      side: THREE.BackSide
    })
  );
  scene.add(atmosphere);

  // Slow rotation
  earth.userData.rotationSpeed = 0.00011;
  clouds.userData.rotationSpeed = 0.00016;
  atmosphere.userData.rotationSpeed = 0.00007;

  // Satellites
  createSatellites();

  // Mouse controls
  setupMouseInteraction();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  camera.lookAt(0, 25, 0);

  animateEarth();
}

function createSpaceEnvironment() {
  // Stars
  const starCount = 22000;
  const starsGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    const i3 = i * 3;
    const r = 1200 + Math.random() * 3800;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = r * Math.cos(phi);

    const intensity = 0.7 + Math.random() * 0.3;
    colors[i3] = intensity;
    colors[i3 + 1] = intensity * (0.9 + Math.random() * 0.1);
    colors[i3 + 2] = intensity * (0.95 + Math.random() * 0.05);
  }

  starsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starsGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const starsMat = new THREE.PointsMaterial({
    size: 1.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.92,
    depthWrite: false
  });

  scene.add(new THREE.Points(starsGeo, starsMat));

  // Nebulae clusters
  const nebulaCount = 6500;
  const nebGeo = new THREE.BufferGeometry();
  const nPos = new Float32Array(nebulaCount * 3);
  const nCol = new Float32Array(nebulaCount * 3);

  for (let i = 0; i < nebulaCount; i++) {
    const i3 = i * 3;
    const cx = (Math.random() - 0.5) * 4500;
    const cy = (Math.random() - 0.5) * 4500;
    const cz = (Math.random() - 0.5) * 4500;

    nPos[i3] = cx + (Math.random() - 0.5) * 650;
    nPos[i3 + 1] = cy + (Math.random() - 0.5) * 650;
    nPos[i3 + 2] = cz + (Math.random() - 0.5) * 650;

    const hue = Math.random();
    nCol[i3] = hue > 0.6 ? 0.5 : 0.2;
    nCol[i3 + 1] = hue > 0.4 ? 0.6 : 0.3;
    nCol[i3 + 2] = hue > 0.2 ? 0.9 : 0.5;
  }

  nebGeo.setAttribute('position', new THREE.BufferAttribute(nPos, 3));
  nebGeo.setAttribute('color', new THREE.BufferAttribute(nCol, 3));

  const nebMat = new THREE.PointsMaterial({
    size: 3.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.22,
    depthWrite: false
  });

  scene.add(new THREE.Points(nebGeo, nebMat));
}

function createSatellites() {
  const bodyMat = new THREE.MeshPhongMaterial({ color: 0xcccccc, shininess: 25 });
  const panelMat = new THREE.MeshPhongMaterial({ color: 0x336699, shininess: 15 });

  for (let i = 0; i < 5; i++) {
    const group = new THREE.Group();

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1, 1.5), bodyMat);
    group.add(body);

    const panelL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3.5, 2), panelMat);
    panelL.position.x = -2.5;
    group.add(panelL);

    const panelR = panelL.clone();
    panelR.position.x = 2.5;
    group.add(panelR);

    const radius = 78 + i * 8;
    const angle = (i * 1.1) % (Math.PI * 2);
    group.position.x = Math.cos(angle) * radius;
    group.position.z = Math.sin(angle) * radius * 0.55;
    group.position.y = (i - 2.5) * 12;

    group.userData = {
      radius,
      angle,
      speed: 0.00009 + (i * 0.000012),
      yPhase: i * 0.9
    };

    scene.add(group);
    satellites.push(group);
  }
}

function setupMouseInteraction() {
  const canvas = renderer.domElement;

  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
  });

  window.addEventListener('mouseup', () => { isDragging = false; });

  canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - prevMouseX;
    const deltaY = e.clientY - prevMouseY;

    const spherical = new THREE.Spherical();
    spherical.setFromVector3(camera.position);

    spherical.theta -= deltaX * 0.0035;
    spherical.phi -= deltaY * 0.0035;
    spherical.phi = Math.max(0.15, Math.min(Math.PI * 0.82, spherical.phi));

    camera.position.setFromSpherical(spherical);
    camera.lookAt(0, 25, 0);

    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 12 : -12;
    targetZoom = Math.max(55, Math.min(210, targetZoom + delta));
  }, { passive: false });
}

function animateEarth() {
  requestAnimationFrame(animateEarth);

  const t = Date.now() * 0.001;

  if (earth) earth.rotation.y += earth.userData.rotationSpeed;
  if (clouds) clouds.rotation.y += clouds.userData.rotationSpeed;
  if (atmosphere) atmosphere.rotation.y += atmosphere.userData.rotationSpeed;

  satellites.forEach(sat => {
    const u = sat.userData;
    u.angle += u.speed;
    sat.position.x = Math.cos(u.angle) * u.radius;
    sat.position.z = Math.sin(u.angle) * u.radius * 0.55;
    sat.position.y = Math.sin(t * 0.6 + u.yPhase) * 5 + (u.yPhase * 4);
    sat.rotation.y = u.angle * 1.2;
  });

  currentZoom += (targetZoom - currentZoom) * 0.1;
  const dir = camera.position.clone().normalize();
  camera.position.copy(dir.multiplyScalar(currentZoom));
  camera.lookAt(0, 25, 0);

  renderer.render(scene, camera);
}

if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    initEarth();
  });
}