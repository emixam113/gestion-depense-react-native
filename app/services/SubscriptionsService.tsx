
export const SubscriptionProvider = ({ children }) => {
  const [isPremium, setIsPremium] = useState(false);

  // Charge le statut au démarrage
  useEffect(() => {
    SubscriptionService.checkSubscription().then(setIsPremium);
  }, []);

  return (
    <SubscriptionContext.Provider value={{ isPremium, setIsPremium }}>
      {children}
    </SubscriptionContext.Provider>
  );
};