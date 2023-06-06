import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { client } from "../api/client";
import { BASE_URL } from "../config";
import { CustomizableUITextEnum } from "../const";
import { useNotification } from "../utils/notification";
import { useAppSelector } from "./useRedux";

export const useCheckSystemHealth = () => {
  const [systemOk, setSystemOk] = useState(true);
  const { notify, closeNotification } = useNotification();
  let requestIsLoading = useRef(false);
  const systemUnavailable = useAppSelector(state => state.customizableUIText.texts[CustomizableUITextEnum.SYSTEM_UNAVAILABLE])
  
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
          systemUnavailable,
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
  }, [notify, closeNotification, systemUnavailable]);

  return { systemOk };
};
