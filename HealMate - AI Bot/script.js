document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("start-chat-btn");
  const chatContainer = document.getElementById("chatbot-container");
  const closeBtn = document.getElementById("close-btn");
  const sendBtn = document.getElementById("send-btn");
  const chatInput = document.getElementById("chatbot-input");
  const messagesEl = document.getElementById("chatbot-messages");
  const resetBtn = document.getElementById("reset-btn");
  const micBtn = document.getElementById("mic-btn");
  const languageSelect = document.getElementById("language-select");

  // ✅ Gemini API Setup
  const API_KEY = "YOUR_API_KEY";
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

  // ✅ Voice and Language
  let selectedLang = "en-IN"; // Default: English (India)
  let synth = window.speechSynthesis;
  let recognition;
  let isSpeaking = false;

  // ✅ Function: Speak AI reply
  function speakText(text) {
    if (!text) return;
    if (synth.speaking) synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = selectedLang;
    synth.speak(utter);
    isSpeaking = true;
    utter.onend = () => (isSpeaking = false);
  }

  // ✅ Function: Stop voice
  function stopVoice() {
    if (synth.speaking || isSpeaking) {
      synth.cancel();
      isSpeaking = false;
    }
  }

  // ✅ Function: Add message
  function appendMessage(role, text) {
    const msg = document.createElement("div");
    msg.className = `message ${role}`;
    msg.textContent = text;
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // ✅ Function: Get AI Response (Health Focused)
  async function getBotResponse(userMessage) {
    appendMessage("bot", "🤖 Thinking...");

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are HealMate AI, a helpful chatbot that ONLY answers health, fitness, wellness, and medicine-related questions. If asked anything else, politely redirect back to health. User: ${userMessage}`,
                },
              ],
            },
          ],
        }),
      });

      const data = await res.json();

      // Remove the "Thinking..." message
      const bots = messagesEl.querySelectorAll(".message.bot");
      const lastBot = bots[bots.length - 1];
      if (lastBot && lastBot.textContent === "🤖 Thinking...") lastBot.remove();

      const botMessage =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "⚠️ Sorry, I couldn’t get that.";

      appendMessage("bot", botMessage);
      speakText(botMessage);
    } catch (err) {
      console.error("Gemini API Error:", err);
      appendMessage("bot", "⚠️ Error connecting to AI service.");
    }
  }

  // ✅ Send Message
  function sendMessage() {
    const userText = chatInput.value.trim();
    if (!userText) return;
    appendMessage("user", userText);
    chatInput.value = "";
    getBotResponse(userText);
  }

  // ✅ Start Chat Popup
  startBtn.addEventListener("click", () => {
    chatContainer.classList.add("open");
    startBtn.style.display = "none";
    messagesEl.innerHTML = "";
    stopVoice();
    appendMessage("bot", "👋 Hello! I’m HealMate AI. How can I help with your health today?");
  });

  // ✅ Close Chat Popup + Stop Voice
  closeBtn.addEventListener("click", () => {
    chatContainer.classList.remove("open");
    startBtn.style.display = "inline-block";
    stopVoice(); // stop any ongoing speech
  });

  // ✅ Send Message on Button or Enter Key
  sendBtn.addEventListener("click", sendMessage);
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  // ✅ Mic (Speech-to-Text)
  micBtn.addEventListener("click", () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("❌ Speech recognition not supported in this browser.");
      return;
    }

    recognition = new webkitSpeechRecognition();
    recognition.lang = selectedLang;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      chatInput.value = transcript;
      sendMessage();
    };
    recognition.start();
  });

  // ✅ Reset Button
  resetBtn.addEventListener("click", () => {
    messagesEl.innerHTML = "";
    stopVoice();
    appendMessage("bot", "🔄 Chat has been reset. You can start again!");
    speakText("Chat has been reset. You can start again!");
  });

  // ✅ Language Selector
  languageSelect.addEventListener("change", (e) => {
    selectedLang = e.target.value;
    stopVoice();
    messagesEl.innerHTML = "";
    const langName = languageSelect.options[languageSelect.selectedIndex].text;
    appendMessage("bot", `🌐 Language changed to ${langName}.`);
    speakText(`Language changed to ${langName}`);
  });
});
