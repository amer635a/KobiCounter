import React, { useState, useEffect } from 'react';
import mqtt from 'mqtt';

function VideoStream() {
  const [client, setClient] = useState(null);
  const [image, setImage] = useState(null);
  const [connectStatus, setConnectStatus] = useState('Disconnected');

  const mqttConnect = (host, mqttOptions) => {
    setConnectStatus('Connecting');
    const mqttClient = mqtt.connect(host, mqttOptions);
    setClient(mqttClient);
  };

  useEffect(() => {
    if (client) {
      client.on('connect', () => {
        setConnectStatus('Connected');
        // Subscribe to the topic when connected
        client.subscribe('video/stream', { qos: 0 }, (err) => {
          if (err) {
            console.error('Failed to subscribe: ', err);
          }
        });
      });

      client.on('error', (err) => {
        console.error('Connection error: ', err);
        client.end();
      });

      client.on('reconnect', () => {
        setConnectStatus('Reconnecting');
      });

      client.on('message', (topic, message) => {
        // Decode the base64 message and set it as an image source
        if (topic === 'video/stream') {
          const base64Data = message.toString();
          setImage(`data:image/jpeg;base64,${base64Data}`);
        }
      });
    }
  }, [client]);

  useEffect(() => {
    mqttConnect('ws://localhost:9001', {}); // Connect to the broker
  }, []);

  return (
    <div>
      <p>Connection Status: {connectStatus}</p>
      <div>
        {image ? (
          <img src={image} alt="Video Stream" width="640" height="480" />
        ) : (
          <p>Waiting for video stream...</p>
        )}
      </div>
    </div>
  );
}

export default VideoStream;
