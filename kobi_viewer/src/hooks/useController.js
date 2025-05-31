import { useEffect, useRef } from "react";
import Controller from "../lib/Controller";

function useController(mqttUrl) {
  const controller = useRef(null);

  useEffect(() => {
    controller.current = new Controller(mqttUrl);
    return () => {
      controller.current?.disconnect();
    };
  }, [mqttUrl]);

  return controller;
}

export default useController;
