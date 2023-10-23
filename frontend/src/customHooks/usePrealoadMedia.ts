import { useEffect } from "react";

/*
  This hook is used to preload media files.
  
  When images are fetched again the cached media files
  will be used.
*/
export const usePrealoadMedia = (media: string[]) => {
    useEffect(() => {
        media
          .forEach((_, i) => {
            new Image().src = media[i];
          });
      }, [media]);
}