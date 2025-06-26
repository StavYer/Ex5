import {OrbitControls} from './OrbitControls.js'

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
// Set background color
scene.background = new THREE.Color(0x000000);

// Add lights to the scene
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 15);
scene.add(directionalLight);

// Enable shadows
renderer.shadowMap.enabled = true;
directionalLight.castShadow = true;

function degrees_to_radians(degrees) {
  var pi = Math.PI;
  return degrees * (pi/180);
}

// Helper function to create three-point arc
function createThreePointArc(xOffset, isLeft) {
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    const arcRadius = 7.25;
    const arcPoints = [];
    
    // Determine the angle range based on which side
    let startAngle, endAngle;
    if (isLeft) {
        startAngle = degrees_to_radians(-67);
        endAngle = degrees_to_radians(67);
    } else {
        startAngle = degrees_to_radians(113);
        endAngle = degrees_to_radians(247);
    }
    
    const segments = 50;
    for (let i = 0; i <= segments; i++) {
        const angle = startAngle + (endAngle - startAngle) * (i / segments);
        arcPoints.push(new THREE.Vector3(
            xOffset + Math.cos(angle) * arcRadius,
            0.11,
            Math.sin(angle) * arcRadius
        ));
    }
    
    const arcGeometry = new THREE.BufferGeometry().setFromPoints(arcPoints);
    const arc = new THREE.Line(arcGeometry, lineMaterial);
    scene.add(arc);
}

function createCourtMrkings() {
  // Court markings material - white lines
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });

    // Center line (divides court in half)
    const centerLineGeometry = new THREE.BufferGeometry();
    const centerLinePoints = [
        new THREE.Vector3(0, 0.11, -7.5),
        new THREE.Vector3(0, 0.11, 7.5)
    ];
    centerLineGeometry.setFromPoints(centerLinePoints);
    const centerLine = new THREE.Line(centerLineGeometry, lineMaterial);
    scene.add(centerLine);

    // Center circle
    const centerCircleRadius = 1.8;
    const centerCirclePoints = [];
    const circleSegments = 64;
    for (let i = 0; i <= circleSegments; i++) {
        const angle = (i / circleSegments) * Math.PI * 2;
        centerCirclePoints.push(new THREE.Vector3(
            Math.cos(angle) * centerCircleRadius,
            0.11,
            Math.sin(angle) * centerCircleRadius
        ));
    }
    const centerCircleGeometry = new THREE.BufferGeometry().setFromPoints(centerCirclePoints);
    const centerCircle = new THREE.Line(centerCircleGeometry, lineMaterial);
    scene.add(centerCircle);

    // Three-point lines (arcs at both ends)
    // Left three-point arc
    createThreePointArc(-15, true);
    // Right three-point arc
    createThreePointArc(15, false);

    // Three-point line sides (connecting the arc endpoints to the court ends)
    // These lines run parallel to the baseline (along x-axis)
    // Left side
    const leftThreePointSide1 = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-15 + 7.25 * Math.cos(degrees_to_radians(67)), 0.11, 7.25 * Math.sin(degrees_to_radians(67))),
        new THREE.Vector3(-15, 0.11, 7.25 * Math.sin(degrees_to_radians(67)))
    ]);
    scene.add(new THREE.Line(leftThreePointSide1, lineMaterial));
    
    const leftThreePointSide2 = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-15 + 7.25 * Math.cos(degrees_to_radians(-67)), 0.11, 7.25 * Math.sin(degrees_to_radians(-67))),
        new THREE.Vector3(-15, 0.11, 7.25 * Math.sin(degrees_to_radians(-67)))
    ]);
    scene.add(new THREE.Line(leftThreePointSide2, lineMaterial));

    // Right side
    const rightThreePointSide1 = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(15 + 7.25 * Math.cos(degrees_to_radians(113)), 0.11, 7.25 * Math.sin(degrees_to_radians(113))),
        new THREE.Vector3(15, 0.11, 7.25 * Math.sin(degrees_to_radians(113)))
    ]);
    scene.add(new THREE.Line(rightThreePointSide1, lineMaterial));
    
    const rightThreePointSide2 = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(15 + 7.25 * Math.cos(degrees_to_radians(247)), 0.11, 7.25 * Math.sin(degrees_to_radians(247))),
        new THREE.Vector3(15, 0.11, 7.25 * Math.sin(degrees_to_radians(247)))
    ]);
    scene.add(new THREE.Line(rightThreePointSide2, lineMaterial));
}

// Helper function to create basketball hoop
function createBasketballHoop(xPosition, facingRight) {
    // Backboard - white, partially transparent (rotated to face the court)
    const backboardGeometry = new THREE.BoxGeometry(0.1, 1.2, 1.8); // Swapped dimensions
    const backboardMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 0.8
    });
    const backboard = new THREE.Mesh(backboardGeometry, backboardMaterial);
    backboard.position.set(xPosition, 4.5, 0); // Increased height
    backboard.castShadow = true;
    backboard.receiveShadow = true;
    scene.add(backboard);

    // Rim - orange, at regulation height (10 feet = ~3.05 meters)
    const rimRadius = 0.45;
    const rimTube = 0.02;
    const rimGeometry = new THREE.TorusGeometry(rimRadius, rimTube, 8, 32);
    const rimMaterial = new THREE.MeshPhongMaterial({ color: 0xff6600 });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.rotation.x = Math.PI / 2;
    
    // Position rim in front of backboard, facing center court
    const rimOffset = facingRight ? 0.55 : -0.55;
    rim.position.set(xPosition + rimOffset, 4.05, 0); // Increased height
    rim.castShadow = true;
    scene.add(rim);

    // Net - using line segments
    const netMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 1 });
    const netSegments = 12; // More than required 8 for better appearance
    const netHeight = 0.4;
    const netBottomRadius = 0.3; // Net narrows at bottom
    
    // Create vertical net lines and connect them
    for (let i = 0; i < netSegments; i++) {
        const angle = (i / netSegments) * Math.PI * 2;
        const nextAngle = ((i + 1) % netSegments / netSegments) * Math.PI * 2;
        
        // Top points (on rim)
        const topX = xPosition + rimOffset + Math.cos(angle) * rimRadius;
        const topZ = Math.sin(angle) * rimRadius;
        
        // Bottom points (narrower)
        const bottomX = xPosition + rimOffset + Math.cos(angle) * netBottomRadius;
        const bottomZ = Math.sin(angle) * netBottomRadius;
        
        // Create vertical net line
        const verticalGeometry = new THREE.BufferGeometry();
        const verticalPoints = [
            new THREE.Vector3(topX, 4.05, topZ), // Updated height
            new THREE.Vector3(bottomX, 4.05 - netHeight, bottomZ)
        ];
        verticalGeometry.setFromPoints(verticalPoints);
        const verticalLine = new THREE.Line(verticalGeometry, netMaterial);
        scene.add(verticalLine);
        
        // Create diagonal cross pattern for more realistic net
        const nextTopX = xPosition + rimOffset + Math.cos(nextAngle) * rimRadius;
        const nextTopZ = Math.sin(nextAngle) * rimRadius;
        const nextBottomX = xPosition + rimOffset + Math.cos(nextAngle) * netBottomRadius;
        const nextBottomZ = Math.sin(nextAngle) * netBottomRadius;
        
        // Diagonal line 1
        const diagonal1Geometry = new THREE.BufferGeometry();
        const diagonal1Points = [
            new THREE.Vector3(topX, 4.05, topZ), // Updated height
            new THREE.Vector3(nextBottomX, 4.05 - netHeight, nextBottomZ)
        ];
        diagonal1Geometry.setFromPoints(diagonal1Points);
        const diagonal1Line = new THREE.Line(diagonal1Geometry, netMaterial);
        scene.add(diagonal1Line);
    }

    // Support structure - pole and arm
    // Pole extends from bottom of court to above backboard, positioned behind court
    const courtBottom = -0.1; // Bottom of the court
    const poleTop = 5.1; // Above the backboard
    const poleHeight = poleTop - courtBottom; // Total height
    const poleRadius = 0.15;
    const poleGeometry = new THREE.CylinderGeometry(poleRadius, poleRadius, poleHeight);
    const poleMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    
    // Position pole behind court with front face tangent to court edge
    const poleX = facingRight ? -15 - poleRadius : 15 + poleRadius;
    pole.position.set(poleX, (courtBottom + poleTop) / 2, 0); // Center the pole vertically
    pole.castShadow = true;
    scene.add(pole);

    // Support arm connecting pole to backboard
    const armLength = Math.abs(poleX - xPosition);
    const armGeometry = new THREE.BoxGeometry(armLength, 0.1, 0.1);
    const armMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const arm = new THREE.Mesh(armGeometry, armMaterial);
    // Position arm to connect pole center to backboard
    arm.position.set((poleX + xPosition) / 2, 4.5, 0); // Centered between pole and backboard
    arm.castShadow = true;
    scene.add(arm);
}

// Create basketball court
function createBasketballCourt() {
  // Court floor - just a simple brown surface
  const courtGeometry = new THREE.BoxGeometry(30, 0.2, 15);
  const courtMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xc68642,  // Brown wood color
    shininess: 50
  });
  const court = new THREE.Mesh(courtGeometry, courtMaterial);
  court.receiveShadow = true;
  scene.add(court);
  createCourtMrkings();
  createBasketballHoop(-14, true);  // Left hoop (facing right toward center)
  createBasketballHoop(14, false);  // Right hoop (facing left toward center)

  
  // Note: All court lines, hoops, and other elements have been removed
  // Students will need to implement these features
}

// Create all elements
createBasketballCourt();

// Set camera position for better view
const cameraTranslate = new THREE.Matrix4();
cameraTranslate.makeTranslation(0, 15, 30);
camera.applyMatrix4(cameraTranslate);

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
let isOrbitEnabled = true;

// Instructions display
const instructionsElement = document.createElement('div');
instructionsElement.style.position = 'absolute';
instructionsElement.style.bottom = '20px';
instructionsElement.style.left = '20px';
instructionsElement.style.color = 'white';
instructionsElement.style.fontSize = '16px';
instructionsElement.style.fontFamily = 'Arial, sans-serif';
instructionsElement.style.textAlign = 'left';
instructionsElement.innerHTML = `
  <h3>Controls:</h3>
  <p>O - Toggle orbit camera</p>
`;
document.body.appendChild(instructionsElement);

// Handle key events
function handleKeyDown(e) {
  if (e.key === "o") {
    isOrbitEnabled = !isOrbitEnabled;
  }
}

document.addEventListener('keydown', handleKeyDown);

// Animation function
function animate() {
  requestAnimationFrame(animate);
  
  // Update controls
  controls.enabled = isOrbitEnabled;
  controls.update();
  
  renderer.render(scene, camera);
}

animate();