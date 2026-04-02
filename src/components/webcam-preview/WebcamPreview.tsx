import { useEffect, useRef } from "react";

export function WebcamPreview() {
	const videoRef = useRef<HTMLVideoElement>(null);
	const streamRef = useRef<MediaStream | null>(null);

	useEffect(() => {
		let cancelled = false;

		navigator.mediaDevices
			.getUserMedia({
				audio: false,
				video: {
					width: { ideal: 640 },
					height: { ideal: 480 },
				},
			})
			.then((stream) => {
				if (cancelled) {
					stream.getTracks().forEach((t) => t.stop());
					return;
				}
				streamRef.current = stream;
				if (videoRef.current) {
					videoRef.current.srcObject = stream;
				}
			})
			.catch((err) => {
				console.error("Webcam preview: failed to get camera", err);
			});

		return () => {
			cancelled = true;
			if (streamRef.current) {
				streamRef.current.getTracks().forEach((t) => t.stop());
				streamRef.current = null;
			}
		};
	}, []);

	return (
		<div
			style={{
				width: "100vw",
				height: "100vh",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "transparent",
				// @ts-expect-error Electron-specific CSS property for window dragging
				WebkitAppRegion: "drag",
			}}
		>
			<div
				style={{
					width: 160,
					height: 160,
					borderRadius: "50%",
					overflow: "hidden",
					border: "2px solid rgba(255, 255, 255, 0.3)",
					boxShadow: "0 2px 12px rgba(0, 0, 0, 0.5)",
					background: "#111",
				}}
			>
				<video
					ref={videoRef}
					autoPlay
					muted
					playsInline
					style={{
						width: "100%",
						height: "100%",
						objectFit: "cover",
						transform: "scaleX(-1)",
					}}
				/>
			</div>
		</div>
	);
}
