const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const modalBackdrop = $("#modalBackdrop");
const modalContent = $("#modalContent");
const toast = $("#toast");
let toastTimer;
let selectedFile = null;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

function openModal(html) {
  modalContent.innerHTML = html;
  modalBackdrop.hidden = false;
  document.body.style.overflow = "hidden";
}
function closeModal() {
  modalBackdrop.hidden = true;
  document.body.style.overflow = "";
}
$("#modalClose").addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", e => { if (e.target === modalBackdrop) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

const viewTitles = {
  overview: "Overview", ticket: "Ticket scanner",
  voice: "Voice assistant", notices: "Notice translator"
};
function setView(view) {
  $$(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.view === view));
  $("#breadcrumbTitle").textContent = viewTitles[view] || "Overview";
  if (view === "overview") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    $("#sidebar").classList.remove("open");
    return;
  }
  if (view === "ticket") showTicketModal();
  if (view === "voice") showVoiceModal();
  if (view === "notices") showNoticeModal();
  $("#sidebar").classList.remove("open");
}
$$("[data-view]").forEach(button => button.addEventListener("click", () => setView(button.dataset.view)));
$("#mobileMenu").addEventListener("click", () => $("#sidebar").classList.toggle("open"));

function showTicketModal() {
  selectedFile = null;
  openModal(`
    <h2 id="modalTitle">Scan your travel ticket</h2>
    <p class="modal-subtitle">Upload a ticket image or PDF to prepare a clear journey summary.</p>
    <div class="upload-zone">
      <div class="upload-icon">⇧</div>
      <strong>Drop your ticket here</strong>
      <p>PNG, JPG or PDF · Demo frontend only</p>
      <input id="ticketFile" type="file" accept="image/*,.pdf">
    </div>
    <div id="ticketFilePreview"></div>
    <button class="modal-primary" id="analyzeTicketBtn">Preview extracted details</button>
    <div id="ticketAnalysis"></div>
    <p style="font-size:10px;margin:12px 0 0">This frontend preview does not send files to an AI service. Connect Sarvam Vision to enable real extraction. Avoid uploading real tickets with personal or booking information to this demo.</p>
  `);
  $("#ticketFile").addEventListener("change", e => {
    selectedFile = e.target.files[0] || null;
    $("#ticketFilePreview").innerHTML = selectedFile ? `
      <div class="file-preview"><span>▤</span><div><strong>${escapeHtml(selectedFile.name)}</strong><small>${formatBytes(selectedFile.size)} · Ready for preview</small></div></div>` : "";
  });
  $("#analyzeTicketBtn").addEventListener("click", () => {
    if (!selectedFile) { showToast("Choose a ticket image or PDF first."); return; }
    $("#ticketAnalysis").innerHTML = `
      <div class="modal-result"><strong>Upload received ✓</strong><br>
      File: ${escapeHtml(selectedFile.name)}<br>
      Status: Waiting for Sarvam Vision integration.<br><br>
      <strong>Fields to extract</strong><br>Train number · Boarding station · Destination · Date · Coach · Berth<br><br>
      <span style="color:#9a7742">No real OCR was run. This is a UI interaction preview.</span></div>`;
  });
}
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024*1024) return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/(1024*1024)).toFixed(1)} MB`;
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[ch]));
}

function showVoiceModal() {
  openModal(`
    <h2 id="modalTitle">Talk to SafarSaathi</h2>
    <p class="modal-subtitle">Ask naturally in your preferred language. Voice recognition depends on browser support.</p>
    <div class="voice-orb" id="voiceOrb">◖</div>
    <div class="voice-status" id="voiceStatus">Tap the microphone to try browser speech recognition.</div>
    <div class="voice-actions"><button class="primary" id="startListening">🎙 Start speaking</button><button id="stopListening">Stop</button></div>
    <div class="form-field full" style="margin-top:18px"><label for="voiceTranscript">Recognised words / your question</label><textarea id="voiceTranscript" rows="3" placeholder="Your question will appear here, or type it..."></textarea></div>
    <button class="modal-primary" id="answerVoice">Prepare sample answer</button>
    <div id="voiceAnswer"></div>
    <p style="font-size:10px;margin:12px 0 0">This preview uses your browser's speech recognition if available. The answer is a local demo response, not an AI-generated or live railway answer.</p>
  `);
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.lang = ({en:"en-IN",bn:"bn-IN",hi:"hi-IN"})[$("#languageSelect").value] || "en-IN";
    recognition.onstart = () => {
      $("#voiceOrb").classList.add("listening");
      $("#voiceStatus").textContent = "Listening… speak now.";
    };
    recognition.onresult = event => {
      const transcript = [...event.results].map(result => result[0].transcript).join(" ");
      $("#voiceTranscript").value = transcript;
    };
    recognition.onerror = () => $("#voiceStatus").textContent = "Couldn't hear clearly. Try again or type your question.";
    recognition.onend = () => {
      $("#voiceOrb").classList.remove("listening");
      $("#voiceStatus").textContent = "Listening stopped. Review the text before continuing.";
    };
  } else {
    $("#voiceStatus").textContent = "Speech recognition isn't supported in this browser. You can type below.";
  }
  $("#startListening").addEventListener("click", () => {
    if (!recognition) { showToast("Browser voice recognition isn't available. Type your question instead."); return; }
    try { recognition.start(); } catch { showToast("Microphone is already active."); }
  });
  $("#stopListening").addEventListener("click", () => recognition?.stop());
  $("#answerVoice").addEventListener("click", () => {
    const q = $("#voiceTranscript").value.trim();
    if (!q) { showToast("Speak or type a question first."); return; }
    const lang = $("#languageSelect").value;
    const answers = {
      en: "Here’s a simple next step: keep your ticket and valid ID ready, then confirm your platform and coach using official railway information at the station. This demo cannot verify live platform or train status.",
      bn: "সহজভাবে বললে: টিকিট ও বৈধ পরিচয়পত্র সঙ্গে রাখুন। স্টেশনে পৌঁছে সরকারি রেলওয়ে তথ্য থেকে প্ল্যাটফর্ম ও কোচ নিশ্চিত করুন। এই ডেমো লাইভ প্ল্যাটফর্ম বা ট্রেনের অবস্থা যাচাই করতে পারে না।",
      hi: "आसान शब्दों में: अपना टिकट और वैध पहचान पत्र तैयार रखें। स्टेशन पर आधिकारिक रेलवे जानकारी से प्लेटफ़ॉर्म और कोच की पुष्टि करें। यह डेमो लाइव प्लेटफ़ॉर्म या ट्रेन की स्थिति सत्यापित नहीं कर सकता।"
    };
    $("#voiceAnswer").innerHTML = `<div class="modal-result"><strong>Sample response</strong><br>${answers[lang]}<br><button id="speakSample" class="outline-button" style="margin-top:10px">▶ Read aloud (browser)</button></div>`;
    $("#speakSample").addEventListener("click", () => speak(answers[lang], lang));
  });
}

async function showNoticeModal() {
  openModal(`
    <h2 id="modalTitle">Make a notice easier to understand</h2>
    <p class="modal-subtitle">Paste notice text and translate it into your chosen language.</p>

    <div class="form-field full">
      <label for="noticeText">Paste notice text</label>
      <textarea id="noticeText" rows="5" placeholder="Paste a station notice, travel instruction, or announcement here..."></textarea>
    </div>

    <button class="modal-primary" id="explainNoticeBtn">Translate notice</button>
    <div id="noticeResult"></div>
  `);

  $("#explainNoticeBtn").addEventListener("click", async () => {
    const text = $("#noticeText").value.trim();
    const lang = $("#languageSelect").value;
    const result = $("#noticeResult");
    const button = $("#explainNoticeBtn");

    if (!text) {
      showToast("Please paste the notice text first.");
      return;
    }

    const languages = {
      en: "en-IN",
      bn: "bn-IN",
      hi: "hi-IN"
    };

    const targetLanguage = languages[lang] || "hi-IN";

    button.disabled = true;
    button.textContent = "Translating...";
    result.textContent = "Please wait while Sarvam translates your notice.";

    try {
      const response = await fetch("http://127.0.0.1:8003/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: text,
          source_language: "auto",
          target_language: targetLanguage
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Translation failed.");
      }

      result.innerHTML = `
        <div class="modal-result">
          <strong>Translated notice</strong>
          <p>${escapeHtml(data.translated_text)}</p>
        </div>
      `;
    } catch (error) {
      result.textContent = "Translation failed: " + error.message;
    } finally {
      button.disabled = false;
      button.textContent = "Translate notice";
    }
  });
}

$("#chatForm").addEventListener("submit", e => {
  e.preventDefault();
  const q = $("#chatInput").value.trim();
  if (!q) { showToast("Type a question to get started."); return; }
  const lang = $("#languageSelect").value;
  const answers = {
    en: "For this sample journey, keep your ticket and valid ID ready. Check your boarding station and travel date carefully. Confirm live platform and train information using official railway sources. This is a frontend demo, so I haven't verified your actual booking.",
    bn: "এই নমুনা যাত্রার জন্য টিকিট ও বৈধ পরিচয়পত্র সঙ্গে রাখুন। যাত্রার তারিখ এবং ওঠার স্টেশন ভালো করে দেখুন। প্ল্যাটফর্ম ও ট্রেনের লাইভ তথ্য সরকারি রেলওয়ে সূত্র থেকে নিশ্চিত করুন। এটি একটি ফ্রন্টএন্ড ডেমো, তাই আপনার আসল বুকিং যাচাই করা হয়নি।",
    hi: "इस नमूना यात्रा के लिए टिकट और वैध पहचान पत्र तैयार रखें। यात्रा की तारीख और चढ़ने वाले स्टेशन को ध्यान से देखें। प्लेटफ़ॉर्म और ट्रेन की लाइव जानकारी आधिकारिक रेलवे स्रोतों से जाँचें। यह फ्रंटएंड डेमो है, इसलिए आपकी वास्तविक बुकिंग सत्यापित नहीं हुई है।"
  };
  const response = $("#chatResponse");
  response.hidden = false;
  response.textContent = answers[lang];
  $("#chatInput").value = "";
  response.scrollIntoView({ behavior: "smooth", block: "nearest" });
});
$$(".suggestion").forEach(button => button.addEventListener("click", () => {
  $("#chatInput").value = button.dataset.prompt;
  $("#chatInput").focus();
}));

function updateChecklist() {
  const checks = $$("#checklist input[type=checkbox]");
  const completed = checks.filter(input => input.checked).length;
  $("#checkProgress").textContent = `${completed}/${checks.length}`;
  $("#progressBar").style.width = `${completed / checks.length * 100}%`;
}
$$("#checklist input").forEach(input => input.addEventListener("change", updateChecklist));
$("#resetChecklist").addEventListener("click", () => {
  $$("#checklist input").forEach(input => input.checked = false);
  updateChecklist();
  showToast("Checklist reset.");
});

function showEditJourney() {
  openModal(`
    <h2 id="modalTitle">Edit demo journey</h2>
    <p class="modal-subtitle">Change the sample details shown on the dashboard. These are local demo values only.</p>
    <form id="editJourneyForm" class="modal-form">
      <div class="form-field full"><label for="editTrain">Train name</label><input id="editTrain" value="${escapeHtml($("#trainName").textContent)}" required></div>
      <div class="form-field"><label for="editFromCode">From code</label><input id="editFromCode" value="${escapeHtml($("#fromCode").textContent)}" required maxlength="6"></div>
      <div class="form-field"><label for="editFromName">From station</label><input id="editFromName" value="${escapeHtml($("#fromName").textContent)}" required></div>
      <div class="form-field"><label for="editToCode">To code</label><input id="editToCode" value="${escapeHtml($("#toCode").textContent)}" required maxlength="6"></div>
      <div class="form-field"><label for="editToName">To station</label><input id="editToName" value="${escapeHtml($("#toName").textContent)}" required></div>
      <div class="form-field"><label for="editCoach">Coach</label><input id="editCoach" value="${escapeHtml($("#coach").textContent)}"></div>
      <div class="form-field"><label for="editBerth">Berth</label><input id="editBerth" value="${escapeHtml($("#berth").textContent)}"></div>
      <div class="form-field full"><label for="editDate">Journey date</label><input id="editDate" value="${escapeHtml($("#journeyDate").textContent)}"></div>
      <button class="modal-primary form-field full" type="submit">Save demo details</button>
    </form>
  `);
  $("#editJourneyForm").addEventListener("submit", e => {
    e.preventDefault();
    const map = {
      trainName: "editTrain", fromCode: "editFromCode", fromName: "editFromName",
      toCode: "editToCode", toName: "editToName", coach: "editCoach", berth: "editBerth",
      journeyDate: "editDate", dateFact: "editDate"
    };
    Object.entries(map).forEach(([target, source]) => $("#" + target).textContent = $("#" + source).value.trim());
    closeModal();
    showToast("Demo journey updated.");
  });
}
$("#editJourneyBtn").addEventListener("click", showEditJourney);
$("#viewTicketBtn").addEventListener("click", showTicketModal);
$("#addJourneyBtn").addEventListener("click", () => showToast("Journey saving will be added with a backend."));
$("#tipsBtn").addEventListener("click", () => openModal(`
  <h2 id="modalTitle">Travel with confidence</h2>
  <p class="modal-subtitle">A few useful reminders for your next journey.</p>
  <div class="notice-result">
    <div class="notice-step"><b>01</b><div><strong>Keep essentials close</strong><span>Ticket, ID, phone, charger, and necessary medication.</span></div></div>
    <div class="notice-step"><b>02</b><div><strong>Verify before you move</strong><span>Use official station displays or railway staff for platform and coach information.</span></div></div>
    <div class="notice-step"><b>03</b><div><strong>Ask when unsure</strong><span>Confirm unfamiliar instructions with authorised railway staff.</span></div></div>
  </div>
`));
$("#aboutBtn").addEventListener("click", () => openModal(`
  <h2 id="modalTitle">About SafarSaathi</h2>
  <p>SafarSaathi is a frontend prototype for a multilingual travel companion. It previews ticket upload, voice interaction, notice explanation, journey details, and a travel checklist.</p>
  <div class="modal-result"><strong>Important demo notice</strong><br>This version uses sample content and local interactions. It does not perform real ticket OCR, call Sarvam APIs, validate bookings, or access live train and platform information. Those capabilities must be connected and tested in the backend.</div>
`));
$("#notificationBtn").addEventListener("click", () => showToast("You're all caught up — demo workspace has no live alerts."));

function speak(text, lang) {
  if (!("speechSynthesis" in window)) { showToast("Text-to-speech isn't supported by this browser."); return; }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = ({en:"en-IN",bn:"bn-IN",hi:"hi-IN"})[lang] || "en-IN";
  window.speechSynthesis.speak(utterance);
}
$("#languageSelect").addEventListener("change", e => {
  const lang = e.target.value;
  const copy = {
    en: { title: "Every journey starts<br class=\"desktop-break\"> with <span>clarity.</span>", subtitle: "Tickets, notices, and travel questions — made easy in your language." },
    bn: { title: "প্রতিটি যাত্রা শুরু হোক<br class=\"desktop-break\"> <span>নিশ্চয়তা</span> দিয়ে।", subtitle: "টিকিট, নোটিস ও ভ্রমণের প্রশ্ন—আপনার ভাষায় সহজভাবে।" },
    hi: { title: "हर सफ़र शुरू हो<br class=\"desktop-break\"> <span>आसानी</span> से।", subtitle: "टिकट, नोटिस और यात्रा के सवाल — आपकी भाषा में आसान।" }
  };
  $("#welcomeTitle").innerHTML = copy[lang].title;
  $("#welcomeCopy").textContent = copy[lang].subtitle;
  showToast(`Language selected: ${{en:"English",bn:"বাংলা",hi:"हिन्दी"}[lang]}. Demo responses support these languages.`);
});

updateChecklist();
