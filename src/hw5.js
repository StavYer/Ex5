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

// Basketball tracking variables
let basketball = null;
let basketballPosition = new THREE.Vector3(0, 0.22, 0); // Initial position (0.12 radius + 0.1 court half thickness)
const moveSpeed = 0.1;
const courtBounds = {
    xMin: -14.5,
    xMax: 14.5,
    zMin: -7,
    zMax: 7
};

// Physics variables
let basketballVelocity = new THREE.Vector3(0, 0, 0);
let isShot = false;
const gravity = -9.8; // m/s^2
const ballRadius = 0.12;

// Bouncing mechanics
const coefficientOfRestitution = 0.75; // Energy retained after bounce (0-1)
const minBounceVelocity = 0.5; // Minimum velocity to keep bouncing
const rimRadius = 0.45; // From your hoop creation
const rimTubeRadius = 0.02; // Rim thickness

// Hoop positions for targeting
const leftHoopPosition = new THREE.Vector3(-14.55, 4.05, 0); // -14 + 0.55 offset
const rightHoopPosition = new THREE.Vector3(14.55, 4.05, 0); // 14 + 0.55 offset

// Shot power system
let shotPower = 50; // Default 50%
const powerChangeSpeed = 2; // How fast power changes per frame

// Key state tracking
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
    w: false,
    s: false,
    r: false,
    ' ': false
};

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

function createBasketball() {
    // Core parameters
    const R = 0.12;    // ball radius ≈0.12 m
    const courtHalfTh = 0.1;     // your court is 0.2 m thick
    const centerY = R + courtHalfTh;
    const seamThick = 0.005;   // tube radius for seams
    const radialSegs = 16;
    const tubularSegs = 100;

    // 1) Orange sphere
    const sphereGeo = new THREE.SphereGeometry(R, 64, 64);
    const sphereMat = new THREE.MeshPhongMaterial({
        color: 0xff6600,
        shininess: 50,
        specular: 0x222222
    });
    const ball = new THREE.Mesh(sphereGeo, sphereMat);
    ball.position.copy(basketballPosition); // Use our position vector
    ball.castShadow = true;
    scene.add(ball);

    // 2) Seam material
    const seamMat = new THREE.MeshPhongMaterial({
        color: 0x3f1c02,
        shininess: 10,
        specular: 0x111111
    });

    // 3) Create a group for the seams that will be children of the ball
    const seamsGroup = new THREE.Group();
    ball.add(seamsGroup);

    // 4) Draw the equator as a torus
    const eqGeo = new THREE.TorusGeometry(R, seamThick, radialSegs, tubularSegs);
    const eq = new THREE.Mesh(eqGeo, seamMat);
    eq.rotation.x = Math.PI/2;
    eq.castShadow = true;
    seamsGroup.add(eq);

    // 5) Helper to draw a meridian
    function addMeridian(phi) {
        class MeridianCurve extends THREE.Curve {
            constructor() { super(); this.phi = phi; }
            getPoint(t) {
                const θ = t * Math.PI * 2;
                return new THREE.Vector3(
                    Math.cos(this.phi) * R * Math.cos(θ),
                    R * Math.sin(θ),
                    Math.sin(this.phi) * R * Math.cos(θ)
                );
            }
        }
        const curve = new MeridianCurve();
        const tubeGeo = new THREE.TubeGeometry(curve, 200, seamThick, radialSegs, true);
        const tubeMesh = new THREE.Mesh(tubeGeo, seamMat);
        tubeMesh.castShadow = true;
        seamsGroup.add(tubeMesh);
    }

    // 6) Four meridians
    [0, Math.PI/4, Math.PI/2, 3*Math.PI/4].forEach(phi => addMeridian(phi));

    return ball;
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
    
    // Store the basketball globally
    basketball = createBasketball();
}

// Update movement function
function updateMovement() {
    if (!basketball || isShot) return;
    
    // Calculate movement based on keys pressed
    let deltaX = 0;
    let deltaZ = 0;
    
    if (keys.ArrowLeft) deltaX -= moveSpeed;
    if (keys.ArrowRight) deltaX += moveSpeed;
    if (keys.ArrowUp) deltaZ -= moveSpeed;
    if (keys.ArrowDown) deltaZ += moveSpeed;
    
    // Update position with boundary checking
    const newX = basketballPosition.x + deltaX;
    const newZ = basketballPosition.z + deltaZ;
    
    // Check boundaries
    if (newX >= courtBounds.xMin && newX <= courtBounds.xMax) {
        basketballPosition.x = newX;
    }
    if (newZ >= courtBounds.zMin && newZ <= courtBounds.zMax) {
        basketballPosition.z = newZ;
    }
    
    // Update basketball position
    basketball.position.copy(basketballPosition);
}

// Reset ball function
function resetBall() {
    basketballPosition.set(0, 0.22, 0); // Original position
    basketballVelocity.set(0, 0, 0);
    isShot = false;
    
    if (basketball) {
        basketball.position.copy(basketballPosition);
    }
}

// UPDATED shootBasketball function with proper physics implementation
function shootBasketball() {
  isShot = true;

  // 1) Choose target hoop
  const distToLeft  = basketballPosition.distanceTo(leftHoopPosition);
  const distToRight = basketballPosition.distanceTo(rightHoopPosition);
  const targetHoop  = distToLeft < distToRight ? leftHoopPosition : rightHoopPosition;

  // 2) Direction and distances
  const direction = new THREE.Vector3().subVectors(targetHoop, basketballPosition).normalize();
  const R  = Math.hypot(targetHoop.x - basketballPosition.x, targetHoop.z - basketballPosition.z);
  const Δy = targetHoop.y - basketballPosition.y;

  // 3) Compute launch angle based on distance (you already have this)
  const distanceFactor = Math.min(R/20, 1);
  const minA = 35 * Math.PI/180, maxA = 65 * Math.PI/180;
  const θ = maxA - distanceFactor*(maxA - minA);

  // 4) The exact speed v₀ to hit (R, Δy) at angle θ:
  const g    = Math.abs(gravity);
  const cosA = Math.cos(θ), sinA = Math.sin(θ);
  const num  = g * R*R;
  const den  = 2 * cosA*cosA * (R*Math.tan(θ) - Δy);
  let v;
  if (den > 0) {
    v = Math.sqrt(num/den);
  } else {
    // angle too shallow or too high—fallback to a minimal shot
    v = 2;
  }

  // 5) Scale by shot power (0–100%)
  //    At 100% you get the full v₀; at 0% a very weak shot.
  const powerFrac = shotPower / 100;        // 0 … 1
  const vLaunch   = v * powerFrac;

  // 6) Split into components
  const vHoriz = vLaunch * cosA;
  const vVert  = vLaunch * sinA;

  // 7) (Optional) Enforce a minimum arc height to clear the rim
  const apexY = basketballPosition.y + (vVert*vVert)/(2*g);
  const minClear = targetHoop.y + 0.5; // 0.5 m above rim
  let finalVVert = vVert;
  if (apexY < minClear) {
    // boost vertical component so that apexY == minClear
    finalVVert = Math.sqrt(2 * g * (minClear - basketballPosition.y));
  }

  // 8) Apply to your velocity vector
  basketballVelocity.set(
    direction.x * vHoriz,
    finalVVert,
    direction.z * vHoriz
  );
}

function updatePhysics(deltaTime) {
    if (!isShot || !basketball) return;
    
    // Apply gravity to velocity
    basketballVelocity.y += gravity * deltaTime;
    
    // Update position based on velocity
    basketballPosition.x += basketballVelocity.x * deltaTime;
    basketballPosition.y += basketballVelocity.y * deltaTime;
    basketballPosition.z += basketballVelocity.z * deltaTime;
    
    // Ground collision with bouncing
    if (basketballPosition.y <= ballRadius + 0.1) {
        basketballPosition.y = ballRadius + 0.1;
        
        // Only bounce if velocity is significant
        if (Math.abs(basketballVelocity.y) > minBounceVelocity) {
            // Reverse and reduce vertical velocity
            basketballVelocity.y = -basketballVelocity.y * coefficientOfRestitution;
            
            // Apply friction to horizontal movement on bounce
            basketballVelocity.x *= 0.95;
            basketballVelocity.z *= 0.95;
        } else {
            // Stop bouncing if velocity is too low
            basketballVelocity.y = 0;
            
            // Apply rolling friction
            basketballVelocity.x *= 0.9;
            basketballVelocity.z *= 0.9;
            
            // Stop completely if moving very slowly
            const horizontalSpeed = Math.sqrt(basketballVelocity.x**2 + basketballVelocity.z**2);
            if (horizontalSpeed < 0.1) {
                basketballVelocity.set(0, 0, 0);
                isShot = false;
            }
        }
    }
    
    // Rim collision detection
    checkRimCollision();
    // Backboard collision detection
    checkBackboardCollision();
    
    // Update basketball position
    basketball.position.copy(basketballPosition);
}

function checkRimCollision() {
    // Check both hoops
    const hoops = [
        { position: leftHoopPosition, offset: 0.55 },
        { position: rightHoopPosition, offset: -0.55 }
    ];
    
    for (const hoop of hoops) {
        // Calculate actual rim center
        const rimCenter = new THREE.Vector3(
            hoop.position.x + hoop.offset,
            hoop.position.y,
            hoop.position.z
        );
        
        // Distance from ball center to rim center in XZ plane
        const distXZ = Math.sqrt(
            Math.pow(basketballPosition.x - rimCenter.x, 2) +
            Math.pow(basketballPosition.z - rimCenter.z, 2)
        );
        
        // Check if ball is at rim height and near the rim
        const heightDiff = Math.abs(basketballPosition.y - rimCenter.y);
        
        if (heightDiff < ballRadius + rimTubeRadius) {
            // Check if ball hits the rim edge
            const rimInnerRadius = rimRadius - rimTubeRadius;
            const rimOuterRadius = rimRadius + rimTubeRadius;
            
            if (distXZ > rimInnerRadius - ballRadius && 
                distXZ < rimOuterRadius + ballRadius) {
                
                // Ball hit the rim! Calculate bounce direction
                const normal = new THREE.Vector3(
                    basketballPosition.x - rimCenter.x,
                    0,
                    basketballPosition.z - rimCenter.z
                ).normalize();
                
                // Reflect velocity off the rim
                const dot = basketballVelocity.x * normal.x + basketballVelocity.z * normal.z;
                basketballVelocity.x -= 2 * dot * normal.x * coefficientOfRestitution;
                basketballVelocity.z -= 2 * dot * normal.z * coefficientOfRestitution;
                
                // Reduce vertical velocity slightly
                basketballVelocity.y *= coefficientOfRestitution;
                
                // Push ball away from rim to prevent sticking
                const pushDistance = (rimOuterRadius + ballRadius) - distXZ + 0.01;
                basketballPosition.x += normal.x * pushDistance;
                basketballPosition.z += normal.z * pushDistance;
            }
        }
    }
}

function checkBackboardCollision() {
    // Backboard dimensions and positions
    const backboards = [
        { x: -14, width: 0.1, height: 1.2, zWidth: 1.8, yCenter: 4.5 },
        { x: 14, width: 0.1, height: 1.2, zWidth: 1.8, yCenter: 4.5 }
    ];
    
    for (const board of backboards) {
        // Check if ball is within backboard bounds
        const halfWidth = board.width / 2;
        const halfHeight = board.height / 2;
        const halfZWidth = board.zWidth / 2;
        
        if (basketballPosition.x > board.x - halfWidth - ballRadius &&
            basketballPosition.x < board.x + halfWidth + ballRadius &&
            basketballPosition.y > board.yCenter - halfHeight - ballRadius &&
            basketballPosition.y < board.yCenter + halfHeight + ballRadius &&
            basketballPosition.z > -halfZWidth - ballRadius &&
            basketballPosition.z < halfZWidth + ballRadius) {
            
            // Determine which side of backboard was hit
            const distFromCenter = basketballPosition.x - board.x;
            
            if (Math.abs(distFromCenter) < halfWidth + ballRadius) {
                // Hit front or back of backboard
                basketballPosition.x = board.x + Math.sign(distFromCenter) * (halfWidth + ballRadius);
                basketballVelocity.x = -basketballVelocity.x * coefficientOfRestitution;
            }
        }
    }
}

// Update shot power function
function updatePower() {
    let powerChanged = false;
    
    if (keys.w && shotPower < 100) {
        shotPower = Math.min(100, shotPower + powerChangeSpeed);
        powerChanged = true;
    }
    if (keys.s && shotPower > 0) {
        shotPower = Math.max(0, shotPower - powerChangeSpeed);
        powerChanged = true;
    }
    
    if (powerChanged) {
        // Update UI
        document.getElementById('power-value').textContent = Math.round(shotPower) + '%';
        document.getElementById('power-fill').style.width = shotPower + '%';
    }
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
const uiStyle = document.createElement('style');
uiStyle.textContent = `
  .ui-panel {
    position: absolute;
    background: rgba(0,0,0,0.6);
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-family: Arial, sans-serif;
    z-index: 10;
  }
  #score-board {
    top: 20px;
    left: 20px;
  }
  #controls-panel {
    bottom: 20px;
    left: 20px;
  }
  #power-indicator {
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(0,0,0,0.6);
    color: white;
    padding: 10px 15px;
    border-radius: 4px;
    font-family: Arial, sans-serif;
    z-index: 10;
    min-width: 150px;
  }
  #power-bar {
    width: 100%;
    height: 20px;
    background: #333;
    border: 2px solid #555;
    border-radius: 10px;
    margin-top: 5px;
    overflow: hidden;
  }
  #power-fill {
    height: 100%;
    background: linear-gradient(to right, #00ff00, #ffff00, #ff0000);
    width: 50%;
    transition: width 0.1s;
  }
`;
document.head.appendChild(uiStyle);

// 2) Create your score display panel
const scoreBoard = document.createElement('div');
scoreBoard.id = 'score-board';
scoreBoard.className = 'ui-panel';
scoreBoard.innerHTML = `Score: <span id="score-value">0</span>`;
document.body.appendChild(scoreBoard);

// 3) Create power indicator
const powerIndicator = document.createElement('div');
powerIndicator.id = 'power-indicator';
powerIndicator.innerHTML = `
  <div>Shot Power: <span id="power-value">50%</span></div>
  <div id="power-bar">
    <div id="power-fill"></div>
  </div>
`;
document.body.appendChild(powerIndicator);

// 4) Re-use your existing instructions element as the controls panel
const controlsPanel = document.createElement('div');
controlsPanel.id = 'controls-panel';
controlsPanel.className = 'ui-panel';
controlsPanel.innerHTML = `
  <h3>Controls</h3>
  <p>Arrow Keys — Move Basketball</p>
  <p>W/S — Adjust Shot Power</p>
  <p>Spacebar — Shoot Basketball</p>
  <p>R — Reset Basketball & Power</p>
  <p>O — Toggle Orbit Camera</p>
`;
document.body.appendChild(controlsPanel);

// Handle key events
function handleKeyDown(e) {
    // Handle movement keys
    if (e.key in keys) {
        keys[e.key] = true;
        e.preventDefault(); // Prevent arrow keys from scrolling the page
    }
    // Handle space key for shooting
    if (e.key === ' ') {
        e.preventDefault(); // Prevent page scroll
        shootBasketball();
    }

    // Handle R key for reset
    if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        resetBall();
        // Also reset shot power to default
        shotPower = 50;
        document.getElementById('power-value').textContent = '50%';
        document.getElementById('power-fill').style.width = '50%';
    }

    // Handle other controls
    if (e.key.toLowerCase() === "o") {
        isOrbitEnabled = !isOrbitEnabled;
    }
}

// Add keyup handler
function handleKeyUp(e) {
    if (e.key in keys) {
        keys[e.key] = false;
        e.preventDefault();
    }
}

// Update event listeners
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

// Animation function
let lastTime = 0;
function animate(currentTime) {
    requestAnimationFrame(animate);
    
    // Calculate delta time in seconds
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    // Prevent huge delta times on first frame or after tab switch
    if (deltaTime > 0 && deltaTime < 0.1) {
        // Update basketball movement
        updateMovement();
        
        // Update shot power
        updatePower();
        
        // Update physics
        updatePhysics(deltaTime);
    }
    
    // Update controls
    controls.enabled = isOrbitEnabled;
    controls.update();
    
    renderer.render(scene, camera);
}

animate(0); // Start with 0 for initial time