import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases from 'react-native-purchases';

export const SubscriptionContext = createContext({
  isPremium: false,
  loading: true,
  setIsPremium: (v: boolean) => {}
});

export const SubscriptionsProvider = ({ children, userId }: any) => {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initStatus = async () => {
      try {
        // 1. Charger le cache local
        const cached = await AsyncStorage.getItem('@premium_status');
        if (cached !== null) setIsPremium(JSON.parse(cached));

        // 2. Configurer RevenueCat avec l'ID utilisateur
        if (userId) {
          await Purchases.configure({
            apiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || "",
            appUserID: userId.toString()
          });

          const customerInfo = await Purchases.getCustomerInfo();
          const status = !!customerInfo.entitlements.active['premium'];
          setIsPremium(status);
          await AsyncStorage.setItem('@premium_status', JSON.stringify(status));
        }
      } catch (e) {
        console.error("Erreur Provider Subscriptions:", e);
      } finally {
        setLoading(false);
      }
    };
    initStatus();
  }, [userId]);

  const updatePremium = async (val: boolean) => {
    setIsPremium(val);
    await AsyncStorage.setItem('@premium_status', JSON.stringify(val));
  };

  return (
    <SubscriptionContext.Provider value={{ isPremium, loading, setIsPremium: updatePremium }}>
      {children}
    </SubscriptionContext.Provider>
  );
};