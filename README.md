# Computer Graphics - Exercise 6 - Interactive Basketball Shooting Game with Physics

## Getting Started
1. Clone this repository to your local machine
2. Make sure you have Node.js installed
3. Start the local web server: `node index.js`
4. Open your browser and go to http://localhost:8000

## Group Members
**MANDATORY: Full names of all group members:**
- Stav Yermiyahu
- Itay Cohen

## How to Run
1. If Node.js isn't installed, install it and run `npm init -y` in terminal
2. Also run in terminal `npm install vite`
3. Run the server with: `node index.js`
4. Access at http://localhost:8000 in your web browser

## Complete List of Implemented Controls
- **Arrow Keys (↑↓←→)**: Move basketball horizontally around the court
- **W Key**: Increase shot power (up to 100%)
- **S Key**: Decrease shot power (down to 0%)
- **Spacebar**: Shoot basketball toward nearest hoop
- **R Key**: Reset basketball to center court and power to 50%
- **O Key**: Toggle orbit camera controls (inherited from HW05)

## Physics System Implementation
Our physics system implements realistic basketball mechanics:

### Gravity and Trajectory
- Gravity constant: -9.8 m/s²
- Parabolic trajectory calculation for shots
- Launch angle dynamically calculated based on distance (35° to 65°)
- Initial velocity computed using exact physics formula for projectile motion
- Shot power scales velocity with exponential curve for better control

### Collision Detection
- **Ground Collision**: Ball bounces with coefficient of restitution 0.75
- **Rim Collision**: Detects ball hitting rim edge with realistic bounce response
- **Score Detection**: Ball must pass through hoop center while moving downward
- Energy loss on each bounce with friction applied

### Shot Mechanics
- Automatic targeting to nearest hoop
- Power indicator with visual feedback (0-100%)
- Minimum arc height enforcement for realistic shots
- Ball stops bouncing when velocity below threshold

### Rotation Animation
- Ball rotates realistically based on movement direction
- Rotation speed proportional to velocity
- Smooth quaternion-based rotation for natural appearance
- Rotation continues during movement, flight and bouncing

## Scoring System
- **Score**: 2 points per successful shot
- **Shot Detection**: Ball must pass through hoop area while moving downward
- **Statistics Tracked**:
  - Total Score
  - Shot Attempts
  - Shots Made
  - Shooting Percentage (automatically calculated)
- **Visual Feedback**: 
  - "SHOT MADE!" in green for successful shots
  - "MISSED SHOT" in red for unsuccessful attempts

## Additional Features Implemented
- Enhanced UI with gradient panels and modern styling
- Real-time power bar with color gradient
- Shot feedback messages with 2-second display duration
- Smooth camera controls with orbit functionality
- Basketball with realistic seam design
- Energy loss and friction for realistic ball physics

## Known Issues or Limitations
- None

## Sources of External Assets
- OrbitControls.js from Three.js examples
- All other assets created from scratch using Three.js primitives