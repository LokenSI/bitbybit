import "./style.css";
import { BitByBitBase, Inputs, initBitByBit, initPlayCanvas, type InitBitByBitOptions } from "@bitbybit-dev/playcanvas";

start();

/**
 * Initializes a PlayCanvas scene and uses BitByBit's drawing API to render a simple 3D polyline.
 *
 * @remarks
 * **Creating points**
 * A polyline is defined by an ordered list of points:
 *
 * ```ts
 * const polyline = {
 *   points: [
 *     [x1, y1, z1],
 *     [x2, y2, z2],
 *     // ...
 *   ],
 * };
 * ```
 *
 * Each point is represented as a 3-element numeric tuple: `[x, y, z]`, in world-space units.
 * You can create points by:
 * - Writing literals directly: `[10, 0, -5]`
 * - Computing them: `[Math.cos(t) * r, 0, Math.sin(t) * r]`
 * - Reusing constants or variables: `const p: [number, number, number] = [0, 1, 0];`
 *
 * **What is the `[0, 0, 0]` point object?**
 * `[0, 0, 0]` is the origin point of the 3D coordinate system:
 * - `x = 0` (no horizontal offset)
 * - `y = 0` (no vertical offset)
 * - `z = 0` (no depth offset)
 *
 * It is not a special class instance—just a plain array/tuple used as a point coordinate.
 * In TypeScript terms it is typically treated as a `Vec3`-like tuple (e.g. `[number, number, number]`)
 * expected by `Inputs.Base.Polyline3.points`.
 */
async function start() {
    const sceneOptions = new Inputs.PlayCanvasScene.InitPlayCanvasDto();
    sceneOptions.canvasId = "playcanvas-canvas";
    sceneOptions.sceneSize = 200;
    sceneOptions.enableShadows = false;
    sceneOptions.enableGround = true;
    sceneOptions.groundColor = "#333333";
    sceneOptions.groundCenter = [0, -75, 0];
    sceneOptions.orbitCameraOptions = new Inputs.PlayCanvasCamera.OrbitCameraDto();
    sceneOptions.orbitCameraOptions.yaw = 45; // Angled view to see inside
    sceneOptions.orbitCameraOptions.pitch = 20; // Tilt down slightly
    sceneOptions.orbitCameraOptions.distance = 40;
    sceneOptions.orbitCameraOptions.inertiaFactor = 0.2;

    const { scene, app } = initPlayCanvas(sceneOptions);
    const bitbybit = new BitByBitBase();

    const options: InitBitByBitOptions = {
        enableOCCT: true,
        enableJSCAD: false,
        enableManifold: false,
    };

    await initBitByBit(app, scene, bitbybit, options);

    // Create a single rectangular profile offset from the Y-axis
    const offsetFromAxis = 5; // Distance from the Y-axis (creates the ring radius)
    const profileWidth = 5;
    const profileHeight = 3;
    
    const profilePoints = [
        [offsetFromAxis, 0, 0],
        [offsetFromAxis, profileHeight, 0],
        [offsetFromAxis + profileWidth, profileHeight, 0],
        [offsetFromAxis + profileWidth, 0, 0],
        [offsetFromAxis, 0, 0], // Close the loop
    ] as Inputs.Base.Point3[];

    // Create wire from the profile points
    const profileWire = await bitbybit.occt.shapes.wire.createPolylineWire({
        points: profilePoints,
    });

    // Draw the profile wire (thick and bright to stand out)
    const wireDrawOptions = new Inputs.Draw.DrawOcctShapeOptions();
    wireDrawOptions.edgeColour = "#ff0000";
    wireDrawOptions.edgeWidth = 8; // Thick to be visible
    wireDrawOptions.drawEdges = true;
    wireDrawOptions.drawFaces = false;
    await bitbybit.draw.drawAnyAsync({
        entity: profileWire,
        options: wireDrawOptions,
    });
    console.log("Profile wire drawn.");

    // Create face from the wire
    const profileFace = await bitbybit.occt.shapes.face.createFaceFromWire({
        shape: profileWire,
        planar: true,
    });

    // Revolve the face 360 degrees around the Y-axis
    // The profile is offset from the axis, creating a torus/ring shape
    const revolveOptions = new Inputs.OCCT.RevolveDto<Inputs.OCCT.TopoDSShapePointer>();
    revolveOptions.shape = profileFace;
    revolveOptions.direction = [0, 1, 0]; // Y-axis direction
    revolveOptions.angle = 360; // Full revolution

    const revolvedSolid = await bitbybit.occt.operations.revolve(revolveOptions);

    // Draw the revolved solid with transparency
    const solidDrawOptions = new Inputs.Draw.DrawOcctShapeOptions();
    solidDrawOptions.faceColour = "#4488ff";
    solidDrawOptions.edgeColour = "#444444"; // Darker edges to not compete with profile wire
    solidDrawOptions.edgeWidth = 0.5;
    solidDrawOptions.drawEdges = true;
    solidDrawOptions.drawFaces = false;
    solidDrawOptions.faceOpacity = 0.3; // Semi-transparent
    solidDrawOptions.drawTwoSided = true;
    solidDrawOptions.backFaceOpacity = 0.3;
    solidDrawOptions.backFaceColour = "#4488ff";
    await bitbybit.draw.drawAnyAsync({
        entity: revolvedSolid,
        options: solidDrawOptions,
    });
    console.log("Revolved solid created and drawn.");
}
