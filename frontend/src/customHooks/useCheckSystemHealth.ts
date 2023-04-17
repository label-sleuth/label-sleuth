import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { client } from "../api/client";
import { BASE_URL } from "../config";
import { useNotification } from "../utils/notification";

export const useCheckSystemHealth = () => {
  const [systemOk, setSystemOk] = useState(true);
  const { notify, closeNotification } = useNotification();
  let requestIsLoading = useRef(false);

  useEffect(() => {
    const systemDownNotification = "system-down-notification";

    const fetchSystemHealth = async () => {
      const url = `${BASE_URL}/health-check`;
      let systemIsOk: boolean;
      try {
        requestIsLoading.current = true;
        const response = await client.get(url);
        requestIsLoading.current = false;
        systemIsOk = response.data.ok; // ok will be always true
        closeNotification(systemDownNotification);
      } catch (e) {
        requestIsLoading.current = false;
        systemIsOk = false;
        notify(
          "The system is down. Please try to re-run or log in again (if applicable)",
          {
            toastId: systemDownNotification,
            type: toast.TYPE.INFO,
          },
          true
        );
      }
      setSystemOk(systemIsOk);
    };

    fetchSystemHealth();

    const interval = setInterval(() => {
      !requestIsLoading.current && fetchSystemHealth();
    }, 15000);

    return () => clearInterval(interval);
  }, [notify, closeNotification]);

  return { systemOk };
};
