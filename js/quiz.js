/**
 * CFA Level II - Flash Card Quiz Application Logic
 * Supports 1,288+ questions across all topics from UWorld & Mock sources
 */

(function () {
  'use strict';

  // --- STATE ---
  const state = {
    bankData: window.QUESTION_BANK || null,
    selectedTopics: new Set(['all']),
    selectedCount: 20,
    
    // Active session
    activeQuestions: [], // List of { vignette, question, correct, sourceLabel, topic, caseNo, qIndex, totalInCase }
    currentIndex: 0,
    userResults: {}, // { [index]: true | false } (true = correct, false = wrong)
    isRevealed: false
  };

  // --- DOM ELEMENTS ---
  const dom = {
    // Screens
    screenSetup: document.getElementById('quizSetupScreen'),
    screenActive: document.getElementById('quizActiveScreen'),
    screenResults: document.getElementById('quizResultsScreen'),

    // Setup elements
    topicGrid: document.getElementById('quizTopicGrid'),
    countBtns: document.querySelectorAll('.quiz-count-btn'),
    btnStart: document.getElementById('btnStartQuiz'),

    // Active screen elements
    btnBack: document.getElementById('btnQuizBack'),
    progressBar: document.getElementById('quizProgressBar'),
    counter: document.getElementById('quizCounter'),
    card: document.getElementById('quizCard'),
    cardSource: document.getElementById('quizCardSource'),
    vignetteBlock: document.getElementById('quizVignette'),
    qIndicator: document.getElementById('quizQIndicator'),
    qNumSpan: document.getElementById('quizQNum'),
    answerHidden: document.getElementById('quizAnswerHidden'),
    answerRevealed: document.getElementById('quizAnswerRevealed'),
    btnReveal: document.getElementById('btnReveal'),
    correctLetter: document.getElementById('quizCorrectLetter'),
    btnRateCorrect: document.getElementById('btnRateCorrect'),
    btnRateWrong: document.getElementById('btnRateWrong'),
    btnPrev: document.getElementById('btnQuizPrev'),
    btnNext: document.getElementById('btnQuizNext'),

    // Result elements
    resCorrect: document.getElementById('quizResCorrect'),
    resWrong: document.getElementById('quizResWrong'),
    resTotal: document.getElementById('quizResTotal'),
    btnRestart: document.getElementById('btnQuizRestart'),
    btnSetup: document.getElementById('btnQuizSetup')
  };

  // --- INITIALIZATION ---
  function init() {
    if (!state.bankData && window.QUESTION_BANK) {
      state.bankData = window.QUESTION_BANK;
    }
    renderTopicOptions();
    bindEvents();
  }

  // --- TOPIC FILTER RENDERING ---
  function renderTopicOptions() {
    if (!dom.topicGrid || !state.bankData) return;

    // Calculate topic counts
    const topicStats = {};
    let totalQuestions = 0;

    (state.bankData.vignettes || []).forEach(v => {
      const t = v.topic || 'General';
      const qCount = (v.questions || []).length;
      topicStats[t] = (topicStats[t] || 0) + qCount;
      totalQuestions += qCount;
    });

    let html = `
      <label class="quiz-topic-card active" data-topic="all">
        <input type="checkbox" checked value="all" style="display:none">
        <span class="quiz-topic-name">🌐 Бүх сэдвүүд (All Topics)</span>
        <span class="quiz-topic-badge">${totalQuestions} асуулт</span>
      </label>
    `;

    Object.keys(topicStats).sort().forEach(topic => {
      html += `
        <label class="quiz-topic-card" data-topic="${topic}">
          <input type="checkbox" value="${topic}" style="display:none">
          <span class="quiz-topic-name">${topic}</span>
          <span class="quiz-topic-badge">${topicStats[topic]}</span>
        </label>
      `;
    });

    dom.topicGrid.innerHTML = html;

    // Add click listeners to topic cards
    dom.topicGrid.querySelectorAll('.quiz-topic-card').forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        const topic = card.getAttribute('data-topic');
        handleTopicToggle(topic);
      });
    });
  }

  function handleTopicToggle(topic) {
    if (topic === 'all') {
      state.selectedTopics.clear();
      state.selectedTopics.add('all');
    } else {
      state.selectedTopics.delete('all');
      if (state.selectedTopics.has(topic)) {
        state.selectedTopics.delete(topic);
        if (state.selectedTopics.size === 0) {
          state.selectedTopics.add('all');
        }
      } else {
        state.selectedTopics.add(topic);
      }
    }

    // Update UI active classes
    dom.topicGrid.querySelectorAll('.quiz-topic-card').forEach(c => {
      const t = c.getAttribute('data-topic');
      if (state.selectedTopics.has(t)) {
        c.classList.add('active');
      } else {
        c.classList.remove('active');
      }
    });
  }

  // --- START QUIZ SESSION ---
  function startQuiz() {
    if (!state.bankData || !state.bankData.vignettes) {
      alert('Асуултын өгөгдөл олдсонгүй.');
      return;
    }

    // Filter vignettes by selected topics
    const matchingVignettes = state.bankData.vignettes.filter(v => {
      if (state.selectedTopics.has('all')) return true;
      return state.selectedTopics.has(v.topic);
    });

    if (matchingVignettes.length === 0) {
      alert('Сонгосон сэдвээр асуулт олдсонгүй.');
      return;
    }

    // Flatten all questions with their vignette context
    const pool = [];
    matchingVignettes.forEach(v => {
      const qList = v.questions || [];
      qList.forEach((q, idx) => {
        pool.push({
          vignette: v.vignette,
          sourceLabel: v.source_label,
          topic: v.topic,
          caseNo: v.case_no,
          qIndex: idx + 1,
          totalInCase: qList.length,
          correct: q.correct || 'A',
          qId: q.q_id
        });
      });
    });

    // Shuffle pool (Fisher-Yates)
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // Slice according to selected count
    const limit = state.selectedCount === 0 ? pool.length : Math.min(state.selectedCount, pool.length);
    state.activeQuestions = pool.slice(0, limit);
    state.currentIndex = 0;
    state.userResults = {};
    state.isRevealed = false;

    // Show active screen
    dom.screenSetup.style.display = 'none';
    dom.screenResults.style.display = 'none';
    dom.screenActive.style.display = 'block';

    renderCurrentCard();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- RENDER FLASH CARD ---
  function renderCurrentCard() {
    const total = state.activeQuestions.length;
    if (total === 0) return;

    const item = state.activeQuestions[state.currentIndex];
    state.isRevealed = false;

    // Counter & Progress
    dom.counter.textContent = `${state.currentIndex + 1} / ${total}`;
    const pct = ((state.currentIndex + 1) / total) * 100;
    dom.progressBar.style.width = `${pct}%`;

    // Header info
    dom.cardSource.textContent = `${item.topic} • ${item.sourceLabel} • Case #${item.caseNo}`;
    dom.qNumSpan.textContent = `${item.qIndex}`;

    // Vignette body formatting (split paragraphs)
    const paragraphs = item.vignette.split('\n\n').filter(p => p.trim());
    let vignetteHtml = paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('');
    dom.vignetteBlock.innerHTML = vignetteHtml;

    // Question indicators (dots for items in this case)
    let dotsHtml = '';
    for (let i = 1; i <= item.totalInCase; i++) {
      const isCurrent = (i === item.qIndex);
      dotsHtml += `<span class="quiz-q-dot ${isCurrent ? 'active' : ''}" title="Question ${i}">Q${i}</span>`;
    }
    dom.qIndicator.innerHTML = dotsHtml;

    // Answer hidden state
    dom.answerHidden.style.display = 'block';
    dom.answerRevealed.style.display = 'none';
    dom.correctLetter.textContent = item.correct;

    // Button states
    dom.btnPrev.disabled = (state.currentIndex === 0);
    dom.btnNext.textContent = (state.currentIndex === total - 1) ? 'Дүн харах' : 'Дараах';

    // Reset rate buttons state
    dom.btnRateCorrect.classList.remove('selected');
    dom.btnRateWrong.classList.remove('selected');
    if (state.userResults[state.currentIndex] === true) {
      dom.btnRateCorrect.classList.add('selected');
    } else if (state.userResults[state.currentIndex] === false) {
      dom.btnRateWrong.classList.add('selected');
    }

    // Scroll card to top
    if (dom.vignetteBlock) {
      dom.vignetteBlock.scrollTop = 0;
    }
  }

  // --- REVEAL ANSWER ---
  function revealAnswer() {
    state.isRevealed = true;
    dom.answerHidden.style.display = 'none';
    dom.answerRevealed.style.display = 'block';
  }

  // --- RATE ANSWER ---
  function rateAnswer(isCorrect) {
    state.userResults[state.currentIndex] = isCorrect;
    if (isCorrect) {
      dom.btnRateCorrect.classList.add('selected');
      dom.btnRateWrong.classList.remove('selected');
    } else {
      dom.btnRateWrong.classList.add('selected');
      dom.btnRateCorrect.classList.remove('selected');
    }

    // Auto advance after small delay
    setTimeout(() => {
      goToNext();
    }, 400);
  }

  // --- NAVIGATION ---
  function goToPrev() {
    if (state.currentIndex > 0) {
      state.currentIndex--;
      renderCurrentCard();
    }
  }

  function goToNext() {
    const total = state.activeQuestions.length;
    if (state.currentIndex < total - 1) {
      state.currentIndex++;
      renderCurrentCard();
    } else {
      finishQuiz();
    }
  }

  // --- FINISH & RESULTS ---
  function finishQuiz() {
    const total = state.activeQuestions.length;
    let correctCount = 0;
    let wrongCount = 0;

    for (let i = 0; i < total; i++) {
      if (state.userResults[i] === true) correctCount++;
      else if (state.userResults[i] === false) wrongCount++;
    }

    dom.resCorrect.textContent = correctCount;
    dom.resWrong.textContent = wrongCount;
    dom.resTotal.textContent = total;

    dom.screenActive.style.display = 'none';
    dom.screenSetup.style.display = 'none';
    dom.screenResults.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showSetup() {
    dom.screenActive.style.display = 'none';
    dom.screenResults.style.display = 'none';
    dom.screenSetup.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- EVENT BINDINGS ---
  function bindEvents() {
    // Count buttons
    dom.countBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        dom.countBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.selectedCount = parseInt(btn.getAttribute('data-count'), 10);
      });
    });

    // Start button
    if (dom.btnStart) {
      dom.btnStart.addEventListener('click', startQuiz);
    }

    // Back to setup
    if (dom.btnBack) {
      dom.btnBack.addEventListener('click', () => {
        if (confirm('Та одоогийн Quiz-ээс гарч тохиргоо руу буцах уу?')) {
          showSetup();
        }
      });
    }

    // Reveal button
    if (dom.btnReveal) {
      dom.btnReveal.addEventListener('click', revealAnswer);
    }

    // Rate buttons
    if (dom.btnRateCorrect) {
      dom.btnRateCorrect.addEventListener('click', () => rateAnswer(true));
    }
    if (dom.btnRateWrong) {
      dom.btnRateWrong.addEventListener('click', () => rateAnswer(false));
    }

    // Prev / Next buttons
    if (dom.btnPrev) {
      dom.btnPrev.addEventListener('click', goToPrev);
    }
    if (dom.btnNext) {
      dom.btnNext.addEventListener('click', goToNext);
    }

    // Result screen actions
    if (dom.btnRestart) {
      dom.btnRestart.addEventListener('click', startQuiz);
    }
    if (dom.btnSetup) {
      dom.btnSetup.addEventListener('click', showSetup);
    }

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      // Only active when quiz view is visible and on active screen
      const viewQuiz = document.getElementById('viewQuiz');
      if (!viewQuiz || !viewQuiz.classList.contains('active')) return;
      if (dom.screenActive.style.display === 'none') return;

      if (e.code === 'Space' || e.code === 'Enter') {
        if (!state.isRevealed) {
          e.preventDefault();
          revealAnswer();
        }
      } else if (e.key === '1') {
        if (state.isRevealed) {
          rateAnswer(true);
        }
      } else if (e.key === '2') {
        if (state.isRevealed) {
          rateAnswer(false);
        }
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        goToPrev();
      }
    });
  }

  // --- UTILITY ---
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Expose global API
  window.QuizApp = {
    init: function () {
      if (!state.bankData && window.QUESTION_BANK) {
        state.bankData = window.QUESTION_BANK;
      }
      renderTopicOptions();
      showSetup();
    }
  };

  // Auto init on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
