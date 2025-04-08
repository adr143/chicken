from ultralytics import YOLO

model = YOLO("Chicken_Dis.pt")

print(model.names)