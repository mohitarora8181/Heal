import { useState, useEffect } from "react";
import axios from "axios";
import { createPortal } from "react-dom";

interface SquarePaymentModalProps {
  amount: number;
  onSuccess?: (payment: any) => void;
  onError?: (error: string) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    Square?: any;
  }
}

const SquarePaymentModal = ({
  amount,
  onSuccess,
  onError,
  onClose,
}: SquarePaymentModalProps) => {
  const [loading, setLoading] = useState(false);
  const [card, setCard] = useState<any>(null);

  useEffect(() => {
    const initializeSquare = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/payments/square-config`
        );
        const squarePayments = window.Square.payments(
          response.data.applicationId,
          response.data.locationId
        );
        const squareCard = await squarePayments.card();
        await squareCard.attach("#modal-card-container");

        setCard(squareCard);
      } catch (error) {
        console.error("Error initializing Square:", error);
        onError && onError("Failed to initialize payment processor");
      }
    };

    if (window.Square) {
      initializeSquare();
    } else {
      const script = document.createElement("script");
      script.src = "https://sandbox.web.squarecdn.com/v1/square.js";
      script.async = true;
      script.onload = initializeSquare;
      script.onerror = () => onError?.("Failed to load payment processor");
      document.body.appendChild(script);
    }
  }, [onError]);

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
          onClose();
        } else {
          throw new Error(response.data.error || "Payment failed");
        }
      } else {
        const errorMsg =
          Array.isArray(tokenResult.errors) && tokenResult.errors.length > 0
            ? tokenResult.errors.map((e: any) => e.message).join(", ")
            : "Card tokenization failed";
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      onError && onError(error.message || "Payment processing failed");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Enter Payment Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>

        <div id="modal-card-container" className="mb-4"></div>

        <button
          onClick={handlePayment}
          disabled={loading || !card}
          className={`w-full py-2 px-4 rounded-md text-white ${
            loading || !card ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Processing..." : `Pay $${(amount / 100).toFixed(2)}`}
        </button>
      </div>
    </div>,
    document.body
  );
};

const SquarePaymentButton = ({
  amount,
  onSuccess,
  onError,
}: SquarePaymentModalProps) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
      >
        Pay Now
      </button>

      {showModal && (
        <SquarePaymentModal
          amount={amount}
          onSuccess={onSuccess}
          onError={onError}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default SquarePaymentButton;
