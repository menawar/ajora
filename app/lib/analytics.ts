export const trackEvent = (eventName: string, properties?: Record<string, unknown>) => {
  // In a real app, this would send data to Mixpanel, Amplitude, or Google Analytics
  if (typeof window !== "undefined") {
    // console.log(`[Analytics] ${eventName}`, properties || {});
    
    // Simulate generic datalayer push if it existed
    const dataLayer = (window as unknown as { dataLayer: unknown[] }).dataLayer || [];
    dataLayer.push({ event: eventName, ...properties });
    (window as unknown as { dataLayer: unknown[] }).dataLayer = dataLayer;
  }
};

export const AnalyticsEvents = {
  WALLET_CONNECTED: 'Wallet Connected',
  WALLET_DISCONNECTED: 'Wallet Disconnected',
  SAVE_INITIATED: 'Save Initiated',
  SAVE_COMPLETED: 'Save Completed',
  WITHDRAW_INITIATED: 'Withdraw Initiated',
  WITHDRAW_COMPLETED: 'Withdraw Completed',
  NUMBER_PICKED: 'Number Picked',
  SPRAY_INITIATED: 'Spray Initiated',
  SPRAY_COMPLETED: 'Spray Completed',
  STREAK_CHECKIN: 'Streak Check-in',
};
