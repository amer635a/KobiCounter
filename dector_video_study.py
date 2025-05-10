import cv2
from ultralytics import YOLO
 
points = []

model = YOLO("my_model/my_model.pt")
labels = model.names
print(labels)

def draw_circle(event, x, y, flags, param):
    global points
    if event == cv2.EVENT_LBUTTONDOWN:
        # Draw a circle at the clicked position
        # and store the coordinates in the points list
        points.append((x, y))
        
    
    
cv2.namedWindow('Frame')
cv2.setMouseCallback('Frame', draw_circle)

bbox_colors = [(164,120,87), (68,148,228), (93,97,209), (178,182,133), (88,159,106), 
              (96,202,231), (159,124,168), (169,162,241), (98,118,150), (172,176,184)]

cap=cv2.VideoCapture(0)
while True:
    ret, frame = cap.read()
     
    
        
    #Do object detection here
    results = model(frame, verbose=False)
    
    # Extract results
    detections = results[0].boxes
    
    # Initialize variable for basic object counting example
    object_count = 0
    
    
    for i in range(len(detections)):
        # Tensor ->A 3D block of numbers
        
        # Get bounding box coordinates
        # Ultralytics returns results in Tensor format, which have to be converted to a regular Python array
        xyxy_tensor = detections[i].xyxy.cpu() # Detections in Tensor format in CPU memory
        xyxy = xyxy_tensor.numpy().squeeze() # Convert tensors to Numpy array
        xmin, ymin, xmax, ymax = xyxy.astype(int) # Extract individual coordinates and convert to int

        # Get bounding box class ID and name
        classidx = int(detections[i].cls.item())
        classname = labels[classidx]

        # Get bounding box confidence
        conf = detections[i].conf.item()

        # Draw box if confidence threshold is high enough
        if conf > 0.45:

            color = bbox_colors[classidx % 10]
            cv2.rectangle(frame, (xmin,ymin), (xmax,ymax), color, 2)
            
            cv2.circle(img=frame, center=(int((xmin+xmax)/2), int((ymin+ymax)/2)), radius=5, color=(25, 15, 255), thickness=-1)

            label = f'{classname}: {int(conf*100)}%'
            labelSize, baseLine = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1) # Get font size
            label_ymin = max(ymin, labelSize[1] + 10) # Make sure not to draw label too close to top of window
            # cv2.rectangle(frame, (xmin, label_ymin-labelSize[1]-10), (xmin+labelSize[0], label_ymin+baseLine-10), color, cv2.FILLED) # Draw white box to put label text in
            # cv2.putText(frame, label, (xmin, label_ymin-7), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1) # Draw label text

            # Basic example: count the number of objects in the image
            object_count = object_count + 1
   
    cv2.putText(frame, f'Number of objects: {object_count}', (10,40), cv2.FONT_HERSHEY_SIMPLEX, .7, (0,255,255), 2) # Draw total number of detected objects
        
    cv2.imshow('Frame', frame)
    
    key = cv2.waitKey(1)
    
    if key == 27:  # ESC key
        break
    
cap.release()