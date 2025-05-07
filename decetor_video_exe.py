from ultralytics import YOLO
import cv2

# Load the YOLO model
model = YOLO(".\\weightsv6\\best.pt")

# Open the video file
video_path = ".\\kobi2\\IMG_3361.mp4"
cap = cv2.VideoCapture(video_path)

# Get video properties
width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)-50)
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps    = cap.get(cv2.CAP_PROP_FPS)

# Optional: Save output video
out = cv2.VideoWriter("output_detected.mp4", cv2.VideoWriter_fourcc(*'mp4v'), fps, (width, height))

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    # Resize the frame for smoother display (Optional)
    frame = cv2.resize(frame, (480, 480-50))  # Resize to smaller dimensions

    # Run inference
    results = model(frame)[0]

    # Plot the results on the frame
    annotated_frame = results.plot()

    # Show the frame with detection
    cv2.imshow("YOLO Detection", annotated_frame)
    out.write(annotated_frame)

    # Optional: Add delay to smooth the video display
    if cv2.waitKey(1) & 0xFF == ord('q'):  # Wait for 'q' to quit
        break

# Release resources
cap.release()
out.release()
cv2.destroyAllWindows()
