const responses = {
  billing: [
    "I can help you with billing! Could you tell me your account number?",
    "Let me look into your billing concern. What exactly is the issue?",
    "Sure, I can pull up your billing details. Whats your registered email?"
  ],
  refund: [
    "I understand you'd like a refund. Could you provide your order number?",
    "I'll help you with the refund process. When did you make the purchase?",
    "Let me check your refund eligibility. Can you share the order ID?"
  ],
  technical: [
    "Let me help you with that technical issue. Can you describe whats happening?",
    "I see you're having a technical problem. Have you tried restarting the application?",
    "That sounds frustrating. Can you tell me the error message you're seeing?"
  ],
  shipping: [
    "I can check on your shipping status. Whats your tracking number?",
    "Let me look into the delivery details for you. When was it shipped?",
    "I'll check the shipping status right away. Do you have the order number?"
  ],
  general: [
    "I understand. Could you provide more details so I can assist you better?",
    "Thanks for reaching out. Let me see how I can help you with that.",
    "I appreciate your patience. Could you elaborate a bit more?",
    "I'm here to help! Can you tell me more about your concern?",
    "Got it. Let me look into this for you. Anything specific you need?"
  ]
}

function getAiResponse(message) {
  const lower = message.toLowerCase()

  if (lower.includes("bill") || lower.includes("charge") || lower.includes("payment") || lower.includes("invoice")) {
    const arr = responses.billing
    return arr[Math.floor(Math.random() * arr.length)]
  }

  if (lower.includes("refund") || lower.includes("money back") || lower.includes("return")) {
    const arr = responses.refund
    return arr[Math.floor(Math.random() * arr.length)]
  }

  if (lower.includes("error") || lower.includes("bug") || lower.includes("not working") || lower.includes("crash") || lower.includes("issue")) {
    const arr = responses.technical
    return arr[Math.floor(Math.random() * arr.length)]
  }

  if (lower.includes("shipping") || lower.includes("delivery") || lower.includes("track") || lower.includes("package")) {
    const arr = responses.shipping
    return arr[Math.floor(Math.random() * arr.length)]
  }

  const arr = responses.general
  return arr[Math.floor(Math.random() * arr.length)]
}

export { getAiResponse }
