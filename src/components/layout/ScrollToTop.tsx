import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Reset window + site preview frame scroll on every route change. */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.querySelectorAll('.fc-site-viewport-frame').forEach((el) => {
      el.scrollTo({ top: 0, left: 0 });
    });
  }, [pathname]);

  return null;
}
