import React, { useState, useEffect } from 'react';
import mqtt from 'mqtt';

function VideoStream() {
  const [client, setClient] = useState(null);
  const [image, setImage] = useState(null);
  const [imgKey, setImgKey] = useState(0);
  const [connectStatus, setConnectStatus] = useState('Disconnected');

  // Fix base64 padding
  const fixBase64Padding = (str) => {
    return str + '='.repeat((4 - str.length % 4) % 4);
  };

  useEffect(() => {
    const mqttClient = mqtt.connect('ws://localhost:9001', {}); // your broker websocket URL
    setClient(mqttClient);

    mqttClient.on('connect', () => {
      setConnectStatus('Connected');
      mqttClient.subscribe('video/stream/analayze/resp');
    });

    mqttClient.on('message', (topic, message) => {
      if (topic === 'video/stream/analayze/resp') {
        try {
          const payload = JSON.parse(message.toString());
          if (payload.image) {
            const base64img = fixBase64Padding(payload.image);
            setImage(`data:image/jpeg;base64,${base64img}`);
            setImgKey((k) => k + 1);  // change key to force reload
          }
        } catch (e) {
          console.error('Error parsing message', e);
        }
      }
    });

    mqttClient.on('error', (err) => {
      console.error('MQTT error', err);
      mqttClient.end();
      setConnectStatus('Disconnected');
    });

    mqttClient.on('close', () => {
      setConnectStatus('Disconnected');
    });

    return () => {
      mqttClient.end();
    };
  }, []);

  return (
    <div>
      <h2>Video Stream</h2>
      <p>Status: {connectStatus}</p>
      {image ? (
        <img
          key={imgKey}
          src={image}
          alt="Streamed"
          width="640"
          height="480"
          style={{ border: '1px solid black' }}
        />
      ) : (
        <p>No image received yet</p>
      )}
    </div>
  );
}

export default VideoStream;
