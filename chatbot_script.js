const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');

// Send message to bot
async function sendMessage() {
  const message = userInput.value.trim();
  if (message === '') return;

  appendMessage('user', message);
  userInput.value = '';

  // Show loading message
  appendMessage('bot', '...');

  const reply = await getBotReply(message);

  // Replace loading with actual reply
  const loading = document.querySelector('.bot:last-child');
  loading.remove();
  appendMessage('bot', reply);
}

// Append message to the chat UI
function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.className = `message ${sender}`;
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

const chatHistory = [
  {
    role: "system",
    content: "You are Auto-assist, a helpful and polite car assistant. Always start your first response with: 'Hello, this is Auto-assist. How may I assist you today?' Then answer in clear, proper English without using any symbols, markdown, bold text, bullet points, or special characters. Keep responses concise and limited to no more than 5 sentences unless the user explicitly requests more detail, and use english language only!."
  }
];


// Get bot response from OpenRouter API (DeepSeek model)
async function getBotReply(message) {
  try {
    chatHistory.push({ role: "user", content: message });
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer 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", // <- Replace with your actual API key
        "Content-Type": "application/json",
        "HTTP-Referer": "https://yourdomain.com", // optional
        "X-Title": "Auto-assist Chatbot" // optional
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1:free",
        messages: chatHistory
      })
    });

    const data = await response.json();

    if (data.choices && data.choices.length > 0) {
      const botMessage = data.choices[0].message.content;

      // Tambahkan balasan bot ke riwayat
      chatHistory.push({ role: "assistant", content: botMessage });

      return botMessage;
    } else {
      return "Sorry, I didn't understand that.";
    }

  } catch (error) {
    console.error("API error:", error);
    return "Oops! There was an error reaching the server.";
  }
};

// Close Chat Function
function closeChat() {
  const chatContainer = document.querySelector('.chat-container');
  chatContainer.style.display = 'none';
}