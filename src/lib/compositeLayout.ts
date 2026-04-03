export interface RenderRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface StyledRenderRect extends RenderRect {
	borderRadius: number;
}

export interface Size {
	width: number;
	height: number;
}

export type WebcamLayoutPreset =
	| "picture-in-picture"
	| "camera-bubble"
	| "vertical-stack"
	| "custom-shape";

export type WebcamClipShape =
	| "rounded-rect"
	| "circle"
	| "triangle"
	| "triangle-down"
	| "diamond"
	| "hexagon"
	| "octagon"
	| "star"
	| "shield";

export const WEBCAM_CLIP_SHAPES: WebcamClipShape[] = [
	"rounded-rect",
	"circle",
	"triangle",
	"triangle-down",
	"diamond",
	"hexagon",
	"octagon",
	"star",
	"shield",
];

/**
 * Returns polygon points as fractions (0-1) of width/height for a given shape.
 * "rounded-rect" and "circle" return null — they use borderRadius instead.
 */
export function getClipPolygonPoints(shape: WebcamClipShape): [number, number][] | null {
	switch (shape) {
		case "rounded-rect":
		case "circle":
			return null;
		case "triangle":
			return [
				[0.5, 0],
				[1, 1],
				[0, 1],
			];
		case "triangle-down":
			return [
				[0, 0],
				[1, 0],
				[0.5, 1],
			];
		case "diamond":
			return [
				[0.5, 0],
				[1, 0.5],
				[0.5, 1],
				[0, 0.5],
			];
		case "hexagon":
			return [
				[0.25, 0],
				[0.75, 0],
				[1, 0.5],
				[0.75, 1],
				[0.25, 1],
				[0, 0.5],
			];
		case "octagon":
			return [
				[0.29, 0],
				[0.71, 0],
				[1, 0.29],
				[1, 0.71],
				[0.71, 1],
				[0.29, 1],
				[0, 0.71],
				[0, 0.29],
			];
		case "star": {
			const points: [number, number][] = [];
			for (let i = 0; i < 10; i++) {
				const angle = (Math.PI / 2) * -1 + (i * Math.PI) / 5;
				const r = i % 2 === 0 ? 0.5 : 0.2;
				points.push([0.5 + r * Math.cos(angle), 0.5 + r * Math.sin(angle)]);
			}
			return points;
		}
		case "shield":
			return [
				[0, 0],
				[1, 0],
				[1, 0.6],
				[0.5, 1],
				[0, 0.6],
			];
	}
}

/** CSS clip-path polygon string for a given shape. Returns null for shapes using borderRadius. */
export function getCssClipPath(shape: WebcamClipShape): string | null {
	const points = getClipPolygonPoints(shape);
	if (!points) return null;
	return `polygon(${points.map(([x, y]) => `${(x * 100).toFixed(1)}% ${(y * 100).toFixed(1)}%`).join(", ")})`;
}

/** Draws the clip path onto a canvas 2D context for a given rect. Returns true if a polygon was drawn. */
export function drawClipShapePath(
	ctx: CanvasRenderingContext2D,
	shape: WebcamClipShape,
	x: number,
	y: number,
	width: number,
	height: number,
	borderRadius: number,
): boolean {
	const points = getClipPolygonPoints(shape);
	if (!points) {
		// Use rounded rect
		ctx.roundRect(x, y, width, height, borderRadius);
		return false;
	}
	ctx.moveTo(x + points[0][0] * width, y + points[0][1] * height);
	for (let i = 1; i < points.length; i++) {
		ctx.lineTo(x + points[i][0] * width, y + points[i][1] * height);
	}
	ctx.closePath();
	return true;
}

export interface WebcamLayoutShadow {
	color: string;
	blur: number;
	offsetX: number;
	offsetY: number;
}

interface BorderRadiusRule {
	max: number;
	min: number;
	fraction: number;
}

interface OverlayTransform {
	type: "overlay";
	maxStageFraction: number;
	marginFraction: number;
	minMargin: number;
	minSize: number;
	anchor?: "bottom-right" | "bottom-left";
	shape?: "rect" | "circle";
}

interface StackTransform {
	type: "stack";
	gap: number;
}

export interface WebcamLayoutPresetDefinition {
	label: string;
	transform: OverlayTransform | StackTransform;
	borderRadius: BorderRadiusRule;
	shadow: WebcamLayoutShadow | null;
}

export interface WebcamCompositeLayout {
	screenRect: RenderRect;
	webcamRect: StyledRenderRect | null;
	/** When true, the video should be scaled to cover screenRect (cropping overflow). */
	screenCover?: boolean;
}

const MAX_STAGE_FRACTION = 0.18;
const MARGIN_FRACTION = 0.02;
const MAX_BORDER_RADIUS = 24;
const WEBCAM_LAYOUT_PRESET_MAP: Record<WebcamLayoutPreset, WebcamLayoutPresetDefinition> = {
	"picture-in-picture": {
		label: "Picture in Picture",
		transform: {
			type: "overlay",
			maxStageFraction: MAX_STAGE_FRACTION,
			marginFraction: MARGIN_FRACTION,
			minMargin: 0,
			minSize: 0,
			anchor: "bottom-right",
			shape: "rect",
		},
		borderRadius: {
			max: MAX_BORDER_RADIUS,
			min: 12,
			fraction: 0.12,
		},
		shadow: {
			color: "rgba(0,0,0,0.35)",
			blur: 24,
			offsetX: 0,
			offsetY: 10,
		},
	},
	"camera-bubble": {
		label: "Camera Bubble",
		transform: {
			type: "overlay",
			maxStageFraction: MAX_STAGE_FRACTION,
			marginFraction: MARGIN_FRACTION,
			minMargin: 0,
			minSize: 0,
			anchor: "bottom-left",
			shape: "circle",
		},
		borderRadius: {
			max: MAX_BORDER_RADIUS,
			min: 12,
			fraction: 0.12,
		},
		shadow: {
			color: "rgba(0,0,0,0.35)",
			blur: 24,
			offsetX: 0,
			offsetY: 10,
		},
	},
	"vertical-stack": {
		label: "Vertical Stack",
		transform: {
			type: "stack",
			gap: 0,
		},
		borderRadius: {
			max: 0,
			min: 0,
			fraction: 0,
		},
		shadow: null,
	},
	"custom-shape": {
		label: "Custom Shape",
		transform: {
			type: "overlay",
			maxStageFraction: MAX_STAGE_FRACTION,
			marginFraction: MARGIN_FRACTION,
			minMargin: 0,
			minSize: 0,
			anchor: "bottom-right",
			shape: "rect",
		},
		borderRadius: {
			max: 999,
			min: 0,
			fraction: 0,
		},
		shadow: {
			color: "rgba(0,0,0,0.35)",
			blur: 24,
			offsetX: 0,
			offsetY: 10,
		},
	},
};

export const WEBCAM_LAYOUT_PRESETS = Object.entries(WEBCAM_LAYOUT_PRESET_MAP).map(
	([value, preset]) => ({
		value: value as WebcamLayoutPreset,
		label: preset.label,
	}),
);

export function getWebcamLayoutPresetDefinition(
	preset: WebcamLayoutPreset = "camera-bubble",
): WebcamLayoutPresetDefinition {
	return WEBCAM_LAYOUT_PRESET_MAP[preset];
}

export function getWebcamLayoutCssBoxShadow(preset: WebcamLayoutPreset = "camera-bubble"): string {
	const shadow = getWebcamLayoutPresetDefinition(preset).shadow;
	return shadow
		? `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.color}`
		: "none";
}

export function computeCompositeLayout(params: {
	canvasSize: Size;
	maxContentSize?: Size;
	screenSize: Size;
	webcamSize?: Size | null;
	layoutPreset?: WebcamLayoutPreset;
	webcamPosition?: { cx: number; cy: number } | null;
	customWebcamCornerRadius?: number;
}): WebcamCompositeLayout | null {
	const {
		canvasSize,
		maxContentSize = canvasSize,
		screenSize,
		webcamSize,
		layoutPreset = "camera-bubble",
		webcamPosition,
		customWebcamCornerRadius,
	} = params;
	const { width: canvasWidth, height: canvasHeight } = canvasSize;
	const { width: screenWidth, height: screenHeight } = screenSize;
	const webcamWidth = webcamSize?.width;
	const webcamHeight = webcamSize?.height;
	const preset = getWebcamLayoutPresetDefinition(layoutPreset);

	if (canvasWidth <= 0 || canvasHeight <= 0 || screenWidth <= 0 || screenHeight <= 0) {
		return null;
	}

	if (preset.transform.type === "stack") {
		if (!webcamWidth || !webcamHeight || webcamWidth <= 0 || webcamHeight <= 0) {
			// No webcam — screen fills the entire canvas (cover mode)
			return {
				screenRect: { x: 0, y: 0, width: canvasWidth, height: canvasHeight },
				webcamRect: null,
				screenCover: true,
			};
		}

		// Webcam: full width at the bottom, maintaining its aspect ratio
		const webcamAspect = webcamWidth / webcamHeight;
		const resolvedWebcamWidth = canvasWidth;
		const resolvedWebcamHeight = Math.round(canvasWidth / webcamAspect);

		// Screen: fills remaining space at the top (cover mode — may crop sides)
		const screenRectHeight = canvasHeight - resolvedWebcamHeight;

		return {
			screenRect: {
				x: 0,
				y: 0,
				width: canvasWidth,
				height: Math.max(0, screenRectHeight),
			},
			webcamRect: {
				x: 0,
				y: Math.max(0, screenRectHeight),
				width: resolvedWebcamWidth,
				height: resolvedWebcamHeight,
				borderRadius: 0,
			},
			screenCover: true,
		};
	}

	const transform = preset.transform;
	const screenRect = centerRect({
		canvasSize,
		size: screenSize,
		maxSize: maxContentSize,
	});

	if (!webcamWidth || !webcamHeight || webcamWidth <= 0 || webcamHeight <= 0) {
		return { screenRect, webcamRect: null };
	}

	const margin = Math.max(
		transform.minMargin,
		Math.round(Math.min(canvasWidth, canvasHeight) * transform.marginFraction),
	);
	const maxWidth = Math.max(transform.minSize, canvasWidth * transform.maxStageFraction);
	const maxHeight = Math.max(transform.minSize, canvasHeight * transform.maxStageFraction);
	const isCircle = transform.shape === "circle";
	const scale = Math.min(maxWidth / webcamWidth, maxHeight / webcamHeight);
	const width = isCircle
		? Math.round(Math.max(transform.minSize, Math.min(maxWidth, maxHeight)))
		: Math.round(webcamWidth * scale);
	const height = isCircle ? width : Math.round(webcamHeight * scale);

	let webcamX: number;
	let webcamY: number;

	if (webcamPosition) {
		// Custom position: cx/cy represent the center of the webcam as a fraction of the canvas
		webcamX = Math.round(webcamPosition.cx * canvasWidth - width / 2);
		webcamY = Math.round(webcamPosition.cy * canvasHeight - height / 2);
		// Clamp to stay within canvas bounds
		webcamX = Math.max(0, Math.min(canvasWidth - width, webcamX));
		webcamY = Math.max(0, Math.min(canvasHeight - height, webcamY));
	} else {
		const anchor = transform.anchor ?? "bottom-right";
		webcamX =
			anchor === "bottom-left"
				? Math.max(0, margin)
				: Math.max(0, Math.round(canvasWidth - margin - width));
		webcamY = Math.max(0, Math.round(canvasHeight - margin - height));
	}

	return {
		screenRect,
		webcamRect: {
			x: webcamX,
			y: webcamY,
			width,
			height,
			borderRadius:
				layoutPreset === "custom-shape" && customWebcamCornerRadius !== undefined
					? Math.min(
							Math.round(Math.min(width, height) / 2),
							Math.round((customWebcamCornerRadius * Math.min(width, height)) / 100),
						)
					: isCircle
						? Math.round(Math.min(width, height) / 2)
						: Math.min(
								preset.borderRadius.max,
								Math.max(
									preset.borderRadius.min,
									Math.round(Math.min(width, height) * preset.borderRadius.fraction),
								),
							),
		},
	};
}

function centerRect(params: { canvasSize: Size; size: Size; maxSize: Size }): RenderRect {
	const { canvasSize, size, maxSize } = params;
	const { width: canvasWidth, height: canvasHeight } = canvasSize;
	const { width, height } = size;
	const { width: maxWidth, height: maxHeight } = maxSize;
	const scale = Math.min(maxWidth / width, maxHeight / height, 1);
	const resolvedWidth = Math.round(width * scale);
	const resolvedHeight = Math.round(height * scale);

	return {
		x: Math.max(0, Math.floor((canvasWidth - resolvedWidth) / 2)),
		y: Math.max(0, Math.floor((canvasHeight - resolvedHeight) / 2)),
		width: resolvedWidth,
		height: resolvedHeight,
	};
}
