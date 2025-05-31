import React, { createContext, useContext, useRef, useEffect, useState } from "react";
import Controller from "../lib/Controller";

const ControllerContext = createContext(null);

export const ControllerProvider = ({ mqttUrl, children }) => {
  const controllerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const setupController = async () => {
      const controller = new Controller(mqttUrl);
      await controller.init(); // ✅ This ensures JSON is loaded during setup
      controllerRef.current = controller;
      setIsReady(true);
    };

    setupController();

    return () => {
      controllerRef.current?.disconnect();
    };
  }, [mqttUrl]);

  if (!isReady) return null;

  return (
    <ControllerContext.Provider value={controllerRef.current}>
      {children}
    </ControllerContext.Provider>
  );
};

export const useController = () => useContext(ControllerContext);
