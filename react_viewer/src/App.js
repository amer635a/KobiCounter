import React, { useEffect, useState } from 'react';
import mqtt from 'mqtt';

function App() {
  const [imageSrc, setImageSrc] = useState(null);

  useEffect(() => {
    const client = mqtt.connect('ws://localhost:9001');

    client.on('connect', () => {
      client.subscribe('video/stream');
    });

    client.on('message', (topic, message) => {
      const base64Image = message.toString();
      setImageSrc(`data:image/jpeg;base64,${base64Image}`);
    });

    return () => client.end();
  }, []);

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Live MQTT Video Stream</h2>
      {imageSrc && <img src={imageSrc} alt="Live Stream" style={{ maxWidth: '100%' }} />}
    </div>
  );
}

export default App;
