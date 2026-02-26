import React from "react";
import axios from "axios";
import styled from "styled-components";

declare global {
  interface Window {
    INIStdPay: {
      pay: (params: any) => void;
    };
  }
}

type Props = {
  planId: "PRO" | "PROPLUS";
  title: string;
  priceText: string;
};

const PaymentButton: React.FC<Props> = ({
  planId,
  title,
  priceText,
}) => {
  const handleSubscribe = async () => {
    const { data } = await axios.post("/api/subscription/order", {
      planId,
    });

    window.INIStdPay.pay({
      mid: "YOUR_MID",
      payMethod: "Card",
      moid: data.orderId,
      price: data.price,
      buyerName: data.buyerName,
      buyerEmail: data.buyerEmail,
      acceptmethod: "BILLAUTH",
      returnUrl: "https://nonatomical-unmediaeval-sha.ngrok-free.dev/manager/payment",
      closeUrl: "https://nonatomical-unmediaeval-sha.ngrok-free.dev/manager/payment",
    });
  };

  return (
    <PaymentCard onClick={handleSubscribe}>
      <h2>{title}</h2>
      <p className="price">{priceText}</p>
      <p className="desc">결제 내용을 입력하세요</p>
    </PaymentCard>
  );
};

export default PaymentButton;

/* ================= styled-components ================= */

const PaymentCard = styled.div`
  padding: 24px;
  border-radius: 16px;
  border: 1px solid #ddd;
  background: #fff;
  cursor: pointer;
  height: 500px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 20px;
  align-items: center;       /* 가로 가운데 */
  text-align: center;        /* 글자 가운데 */

  h2 {
    font-size: 22px;
    font-weight: 600;
  }

  .price {
    font-size: 18px;
    font-weight: 500;
  }

  .desc {
    color: #666;
  }

  &:hover {
    background: #f5f5f5;
  }
`;
