import { NormalizedLandmark } from '@mediapipe/tasks-vision';

export interface Point {
  x: number;
  y: number;
}

export function calculateAngle(a: Point, b: Point, c: Point): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360 - angle;
  }
  return angle;
}

export interface JumpState {
  isJumping: boolean;
  minKneeAngle: number;
  maxAnkleDiff: number;
  armsBalanced: boolean;
  suspendedFootKeptUp: boolean;
  landingKneeBent: boolean;
  singleFootLanded: boolean;
  framesCount: number;
  // For single leg tracking
  jumpingLeg: 'left' | 'right' | null;
}

export const initialJumpState: JumpState = {
  isJumping: false,
  minKneeAngle: 180,
  maxAnkleDiff: 0,
  armsBalanced: false,
  suspendedFootKeptUp: true,
  landingKneeBent: false,
  singleFootLanded: true,
  framesCount: 0,
  jumpingLeg: null,
};

export function processFrame(landmarks: NormalizedLandmark[], state: JumpState, mode: 'double' | 'single'): JumpState {
  if (!landmarks || landmarks.length === 0) return state;

  const newState = { ...state, framesCount: state.framesCount + 1 };

  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];

  // Calculate knee angles
  const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
  const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
  const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

  if (avgKneeAngle < newState.minKneeAngle) {
    newState.minKneeAngle = avgKneeAngle;
  }

  // Arm balance (wrists further out than shoulders)
  const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
  const leftArmOut = leftWrist.x > leftShoulder.x + shoulderWidth * 0.2 || leftWrist.x < leftShoulder.x - shoulderWidth * 0.2;
  const rightArmOut = rightWrist.x > rightShoulder.x + shoulderWidth * 0.2 || rightWrist.x < rightShoulder.x - shoulderWidth * 0.2;
  if (leftArmOut && rightArmOut) {
    newState.armsBalanced = true;
  }

  // Ankle difference
  const ankleDiff = Math.abs(leftAnkle.y - rightAnkle.y);
  if (ankleDiff > newState.maxAnkleDiff) {
    newState.maxAnkleDiff = ankleDiff;
  }

  if (mode === 'single') {
    // Determine jumping leg if not set (the one lower to the ground, i.e., higher Y)
    if (!newState.jumpingLeg && newState.framesCount > 10) {
      newState.jumpingLeg = leftAnkle.y > rightAnkle.y ? 'left' : 'right';
    }

    if (newState.jumpingLeg) {
      const jumpingAnkle = newState.jumpingLeg === 'left' ? leftAnkle : rightAnkle;
      const suspendedAnkle = newState.jumpingLeg === 'left' ? rightAnkle : leftAnkle;
      const jumpingKneeAngle = newState.jumpingLeg === 'left' ? leftKneeAngle : rightKneeAngle;

      // Check if suspended foot is kept up (Y should be smaller than jumping foot Y by a margin)
      if (suspendedAnkle.y > jumpingAnkle.y - 0.05) {
        newState.suspendedFootKeptUp = false;
      }

      // Check landing knee bend (if knee angle dips below 160 during the movement)
      if (jumpingKneeAngle < 160) {
        newState.landingKneeBent = true;
      }

      // Check single foot landed (ankle diff should be significant)
      if (Math.abs(leftAnkle.y - rightAnkle.y) < 0.05) {
        newState.singleFootLanded = false;
      }
    }
  }

  return newState;
}

export function evaluateJump(state: JumpState, mode: 'double' | 'single') {
  let score = 0;
  let pointsAchieved = 0;
  const suggestions: string[] = [];
  const status = {
    point1: false,
    point2: false,
    point3: false,
  };

  if (mode === 'double') {
    // Point 1: Knee bend 90-140
    if (state.minKneeAngle >= 90 && state.minKneeAngle <= 140) {
      pointsAchieved++;
      status.point1 = true;
    } else {
      suggestions.push(state.minKneeAngle > 140 ? "屈膝幅度不够，请下蹲更深一些。" : "屈膝幅度过大，注意控制下蹲深度。");
    }

    // Point 2: Arms balanced
    if (state.armsBalanced) {
      pointsAchieved++;
      status.point2 = true;
    } else {
      suggestions.push("双手没有在身体两侧打开，注意保持身体平衡。");
    }

    // Point 3: Simultaneous landing
    if (state.maxAnkleDiff < 0.1) {
      pointsAchieved++;
      status.point3 = true;
    } else {
      suggestions.push("双脚没有同时起落，注意双脚的协调性。");
    }
  } else {
    // Point 1: Suspended foot kept up
    if (state.suspendedFootKeptUp) {
      pointsAchieved++;
      status.point1 = true;
    } else {
      suggestions.push("悬空脚没有保持悬空，注意控制非起跳脚。");
    }

    // Point 2: Landing knee bent
    if (state.landingKneeBent) {
      pointsAchieved++;
      status.point2 = true;
    } else {
      suggestions.push("落地时没有屈膝缓冲，注意保护膝关节。");
    }

    // Point 3: Single foot landed
    if (state.singleFootLanded) {
      pointsAchieved++;
      status.point3 = true;
    } else {
      suggestions.push("落地时双脚接触了地面，请确保单脚落地。");
    }
  }

  if (suggestions.length === 0) {
    suggestions.push("动作非常标准，继续保持！");
  }

  return { stars: pointsAchieved, suggestions, status };
}
