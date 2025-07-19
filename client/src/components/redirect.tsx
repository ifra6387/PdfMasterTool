import { useEffect } from "react";

interface RedirectProps {
  to: string;
}

export function Redirect({ to }: RedirectProps) {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);

  return null;
}