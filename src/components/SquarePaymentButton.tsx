import { useState, useEffect } from "react";
import axios from "axios";

// Add types for props and window.Square
interface SquarePaymentButtonProps {
  amount: number;
  onSuccess?: (payment: any) => void;
  onError?: (error: string) => void;
}

// Extend window type for Square
declare global {
  interface Window {
    Square?: any;
  }
}

const SquarePaymentButton = ({
  amount,
  onSuccess,
  onError,
}: SquarePaymentButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [, setPayments] = useState<any>(null);
  const [card, setCard] = useState<any>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  useEffect(() => {
    // Only load if not already present
    if (window.Square) {
      setSdkLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sandbox.web.squarecdn.com/v1/square.js";
    script.async = true;
    script.onload = () => setSdkLoaded(true);
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!sdkLoaded) return;

    let isMounted = true;

    const initializeSquare = async () => {
      try {
        const response = await axios.get("/api/payments/square-config");
        const squarePayments = window.Square.payments(
          response.data.applicationId,
          response.data.locationId
        );
        const squareCard = await squarePayments.card();
        await squareCard.attach("#card-container");

        if (isMounted) {
          setPayments(squarePayments);
          setCard(squareCard);
        }
      } catch (error: any) {
        onError && onError("Failed to initialize payment processor");
      }
    };

    initializeSquare();

    return () => {
      isMounted = false;
    };
  }, [sdkLoaded, onError]);

  const handlePayment = async () => {
    if (!card || loading) return;

    setLoading(true);

    try {
      const tokenResult = await card.tokenize();
      if (tokenResult.status === "OK") {
        const response = await axios.post("/api/payments/process-payment", {
          sourceId: tokenResult.token,
          amount: amount,
          currency: "USD",
        });

        if (response.data.success) {
          onSuccess && onSuccess(response.data.payment);
        } else {
          throw new Error(response.data.error || "Payment failed");
        }
      } else {
        throw new Error(
          tokenResult.errors?.[0]?.message || "Card tokenization failed"
        );
      }
    } catch (error: any) {
      onError && onError(error.message || "Payment processing failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto" }}>
      <button onClick={handlePayment} disabled={loading || !card}>
        {loading ? "Processing..." : `Pay $${(amount / 100).toFixed(2)}`}
      </button>
    </div>
  );
};

export default SquarePaymentButton;
