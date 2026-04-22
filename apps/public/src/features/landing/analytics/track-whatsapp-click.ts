import { getAnalyticsInstance } from '@/lib/firebase/analytics';

type WhatsappLocation = 'header' | 'hero' | 'about' | 'faq' | 'final_cta' | 'floating_button';

type TrackWhatsappClickParams = {
  location: WhatsappLocation;
  label?: string;
};

export function trackWhatsappClick({ location, label }: TrackWhatsappClickParams) {
  void getAnalyticsInstance()
    .then(async (analytics) => {
      if (!analytics) {
        return;
      }

      const { logEvent } = await import('firebase/analytics');

      logEvent(analytics, 'whatsapp_click', {
        location,
        ...(label ? { label } : {}),
      });
    })
    .catch(() => {
      // no-op: tracking should never block navigation
    });
}
