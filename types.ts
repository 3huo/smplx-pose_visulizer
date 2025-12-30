
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface SMPLXParameters {
  betas: number[]; 
  body_pose: number[]; 
  jaw_pose: number[];
  leye_pose: number[];
  reye_pose: number[];
  left_hand_pose: number[]; 
  right_hand_pose: number[]; 
  expression: number[]; 
  transl: Vector3;
}

export interface CameraConfig {
  position: Vector3;
  target: Vector3;
  fov: number;
}

export const INITIAL_SMPLX: SMPLXParameters = {
  betas: Array(10).fill(0),
  body_pose: Array(66).fill(0),
  jaw_pose: [0, 0, 0],
  leye_pose: [0, 0, 0],
  reye_pose: [0, 0, 0],
  left_hand_pose: Array(45).fill(0),
  right_hand_pose: Array(45).fill(0),
  expression: Array(10).fill(0),
  transl: { x: 0, y: 0, z: 0 }
};

export const JOINTS_LABELS = [
  "Pelvis", "L_Hip", "R_Hip", "Spine1", "L_Knee", "R_Knee", "Spine2", "L_Ankle", 
  "R_Ankle", "Spine3", "L_Foot", "R_Foot", "Neck", "L_Collar", "R_Collar", 
  "Head", "L_Shoulder", "R_Shoulder", "L_Elbow", "R_Elbow", "L_Wrist", "R_Wrist"
];

export const SKELETON_PARENTS = [
  -1, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 12, 13, 14, 16, 17, 18, 19
];

// 定义每个关节点相对于父节点的初始偏移 (T-Pose)
export const JOINT_OFFSETS: [number, number, number][] = [
  [0, 1.0, 0],     // 0: Pelvis (Root)
  [0.08, -0.05, 0], // 1: L_Hip
  [-0.08, -0.05, 0],// 2: R_Hip
  [0, 0.1, 0],      // 3: Spine1
  [0, -0.4, 0],     // 4: L_Knee
  [0, -0.4, 0],     // 5: R_Knee
  [0, 0.12, 0],     // 6: Spine2
  [0, -0.4, 0],     // 7: L_Ankle
  [0, -0.4, 0],     // 8: R_Ankle
  [0, 0.12, 0],     // 9: Spine3
  [0, -0.05, 0.1],  // 10: L_Foot
  [0, -0.05, 0.1],  // 11: R_Foot
  [0, 0.15, 0],     // 12: Neck
  [0.05, 0.12, 0],  // 13: L_Collar
  [-0.05, 0.12, 0], // 14: R_Collar
  [0, 0.1, 0],      // 15: Head
  [0.12, 0, 0],     // 16: L_Shoulder
  [-0.12, 0, 0],    // 17: R_Shoulder
  [0.25, 0, 0],     // 18: L_Elbow
  [-0.25, 0, 0],    // 19: R_Elbow
  [0.22, 0, 0],     // 20: L_Wrist
  [-0.22, 0, 0]     // 21: R_Wrist
];

export const getRandomValue = (min: number, max: number) => Math.random() * (max - min) + min;

export const generateRandomSMPLX = (): SMPLXParameters => ({
  betas: Array(10).fill(0).map(() => getRandomValue(-2.0, 2.0)),
  body_pose: Array(66).fill(0).map(() => getRandomValue(-0.3, 0.3)),
  jaw_pose: [getRandomValue(0, 0.2), 0, 0],
  leye_pose: [0, 0, 0],
  reye_pose: [0, 0, 0],
  left_hand_pose: Array(45).fill(0).map(() => getRandomValue(-0.4, 0.4)),
  right_hand_pose: Array(45).fill(0).map(() => getRandomValue(-0.4, 0.4)),
  expression: Array(10).fill(0).map(() => getRandomValue(-1, 1)),
  transl: { x: 0, y: 0, z: 0 }
});
