import time
from kobi_core import kobiCore

if __name__ == "__main__":
    broker_host = "localhost"
    broker_port = 1883
    kobi = kobiCore(broker_host, broker_port)
    while True:
        # response = kobi.request_stream(frequnce=30, time=10)
        # print("Stream response:", response)
        time.sleep(1)