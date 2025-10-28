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

  const API_KEY = "AIzaSyCCBdwqcz_blqJgY8mcHrC8IWmf35QIh8Q";
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

  let selectedLang = "en"; // Default English
  let synth = window.speechSynthesis;
  let isSpeaking = false;
  let recognition;

  // ✅ Speak text in selected language
  function speakText(text) {
    if (synth.speaking) synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = selectedLang;
    synth.speak(utter);
    isSpeaking = true;
    utter.onend = () => (isSpeaking = false);
  }

  // ✅ Stop any ongoing voice
  function stopVoice() {
    if (synth.speaking || isSpeaking) {
      synth.cancel();
      isSpeaking = false;
    }
  }

  // ✅ Append message to chat window
  function appendMessage(role, text) {
    const msg = document.createElement("div");
    msg.className = `message ${role}`;
    msg.textContent = text;
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // ✅ Fetch AI response from Gemini API (health-related only)
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
                  text: `You are HealMate, an AI health assistant. Only answer questions related to health, wellness, medicine, or fitness. Question: ${userMessage}`,
                },
              ],
            },
          ],
        }),
      });

      const data = await res.json();

      const bots = messagesEl.querySelectorAll(".message.bot");
      const lastBot = bots[bots.length - 1];
      if (lastBot && lastBot.textContent === "🤖 Thinking...") lastBot.remove();

      const botMessage =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "⚠️ Sorry, I couldn’t get that.";

      appendMessage("bot", botMessage);
      speakText(botMessage);
    } catch (err) {
      console.error(err);
      appendMessage("bot", "⚠️ Error connecting to Gemini API.");
    }
  }

  // ✅ Send message function
  function sendMessage() {
    const userText = chatInput.value.trim();
    if (!userText) return;
    appendMessage("user", userText);
    chatInput.value = "";
    getBotResponse(userText);
  }

  // ✅ Start Chat Button (popup open)
  startBtn.addEventListener("click", () => {
    chatContainer.classList.add("open");
    startBtn.style.display = "none";
    stopVoice();
    messagesEl.innerHTML = "";
    appendMessage("bot", "👋 Hello! I’m HealMate AI. How can I help with your health today?");
  });

  // ✅ Close Chat Button (popup close + stop voice)
  closeBtn.addEventListener("click", () => {
    chatContainer.classList.remove("open");
    startBtn.style.display = "inline-block";
    stopVoice(); // stop voice immediately
  });

  // ✅ Send message (button / Enter key)
  sendBtn.addEventListener("click", sendMessage);
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  // ✅ Mic Button (Speech-to-Text input)
  micBtn.addEventListener("click", () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser.");
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

  // ✅ Reset Chat
  resetBtn.addEventListener("click", () => {
    messagesEl.innerHTML = "";
    stopVoice();
    appendMessage("bot", "🔄 Chat has been reset. You can start again!");
    speakText("Chat has been reset. You can start again.");
  });

  // ✅ Change Language (for voice + mic)
  languageSelect.addEventListener("change", (e) => {
    selectedLang = e.target.value;
    stopVoice();
    messagesEl.innerHTML = "";
    const langName = languageSelect.options[languageSelect.selectedIndex].text;
    appendMessage("bot", `🌐 Language changed to ${langName}.`);
    speakText(`Language changed to ${langName}`);
  });
});
