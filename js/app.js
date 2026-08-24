/**
 * CFA Level II Mock Exam Platform - Application Logic
 * 88 Questions (22 Vignettes x 4 Questions)
 * Responsive Mobile UI/UX & Desktop Experience
 */

(function () {
  'use strict';

  // --- STATE ---
  const state = {
    examData: window.EXAM_DATA || [],
    currentSectionIndex: 0,
    mode: 'exam', // 'exam' | 'practice'
    userAnswers: {}, // { [qId]: 'A' | 'B' | 'C' }
    flaggedQuestions: new Set(),
    activeFilter: 'incorrect', // 'incorrect' | 'all' | 'correct' | 'flagged'
    activeMobileTab: 'vignette', // 'vignette' | 'questions'
    
    // Timer
    timerSeconds: 132 * 60, // 2 hours 12 mins
    timerElapsed: 0,
    timerInterval: null,
    isTimerRunning: true,
    
    // Subset mode
    isSubsetRetake: false,
    retakeQuestionIds: null
  };

  // --- DOM ELEMENTS ---
  const el = {
    // Views
    viewExam: document.getElementById('viewExam'),
    viewResults: document.getElementById('viewResults'),
    viewQuiz: document.getElementById('viewQuiz'),
    
    // Header controls
    btnModeExam: document.getElementById('btnModeExam'),
    btnModePractice: document.getElementById('btnModePractice'),
    btnModeQuiz: document.getElementById('btnModeQuiz'),
    timerDisplay: document.getElementById('timerDisplay'),
    btnToggleTimer: document.getElementById('btnToggleTimer'),
    timerIconPause: document.getElementById('timerIconPause'),
    btnToggleDrawer: document.getElementById('btnToggleDrawer'),
    answeredCountBadge: document.getElementById('answeredCountBadge'),
    btnSubmitExam: document.getElementById('btnSubmitExam'),
    btnToggleTheme: document.getElementById('btnToggleTheme'),
    progressBarFill: document.getElementById('progressBarFill'),
    
    // Section Switcher
    btnPrevSection: document.getElementById('btnPrevSection'),
    btnNextSection: document.getElementById('btnNextSection'),
    sectionSelectDropdown: document.getElementById('sectionSelectDropdown'),
    sessionTagBadge: document.getElementById('sessionTagBadge'),
    sectionProgressTag: document.getElementById('sectionProgressTag'),
    
    // Mobile Tabs & Split Panes
    mobileTabSwitcher: document.getElementById('mobileTabSwitcher'),
    tabBtnVignette: document.getElementById('tabBtnVignette'),
    tabBtnQuestions: document.getElementById('tabBtnQuestions'),
    mobileSecAnsweredCount: document.getElementById('mobileSecAnsweredCount'),
    vignettePane: document.getElementById('vignettePane'),
    questionsPane: document.getElementById('questionsPane'),
    btnMobileGoToQuestions: document.getElementById('btnMobileGoToQuestions'),
    btnMobileBackToVignette: document.getElementById('btnMobileBackToVignette'),

    // Mobile Bottom Nav
    mobileBottomNav: document.getElementById('mobileBottomNav'),
    mbBtnPrevSec: document.getElementById('mbBtnPrevSec'),
    mbBtnNextSec: document.getElementById('mbBtnNextSec'),
    mbBtnToggleView: document.getElementById('mbBtnToggleView'),
    mbViewIcon: document.getElementById('mbViewIcon'),
    mbViewLabel: document.getElementById('mbViewLabel'),
    mbBtnGrid: document.getElementById('mbBtnGrid'),
    mbAnsweredBadge: document.getElementById('mbAnsweredBadge'),

    // Vignette & Questions Content
    vignetteChip: document.getElementById('vignetteChip'),
    vignetteTitle: document.getElementById('vignetteTitle'),
    vignetteContent: document.getElementById('vignetteContent'),
    vignetteQRange: document.getElementById('vignetteQRange'),
    questionsContainer: document.getElementById('questionsContainer'),
    btnBottomPrevSec: document.getElementById('btnBottomPrevSec'),
    btnBottomNextSec: document.getElementById('btnBottomNextSec'),
    
    // Drawer
    navDrawer: document.getElementById('navDrawer'),
    drawerBackdrop: document.getElementById('drawerBackdrop'),
    btnCloseDrawer: document.getElementById('btnCloseDrawer'),
    drawerSectionsList: document.getElementById('drawerSectionsList'),
    
    // Lightbox
    lightboxModal: document.getElementById('lightboxModal'),
    lightboxImg: document.getElementById('lightboxImg'),
    lightboxCaption: document.getElementById('lightboxCaption'),
    btnCloseLightbox: document.getElementById('btnCloseLightbox'),
    
    // Submit Modal
    confirmSubmitModal: document.getElementById('confirmSubmitModal'),
    confirmModalText: document.getElementById('confirmModalText'),
    msAnswered: document.getElementById('msAnswered'),
    msUnanswered: document.getElementById('msUnanswered'),
    msFlagged: document.getElementById('msFlagged'),
    btnCancelSubmit: document.getElementById('btnCancelSubmit'),
    btnConfirmSubmit: document.getElementById('btnConfirmSubmit'),
    
    // Results
    scoreRingProgress: document.getElementById('scoreRingProgress'),
    scorePctValue: document.getElementById('scorePctValue'),
    scoreFractionLabel: document.getElementById('scoreFractionLabel'),
    scoreStatusBadge: document.getElementById('scoreStatusBadge'),
    scoreHeadline: document.getElementById('scoreHeadline'),
    scoreSummaryDesc: document.getElementById('scoreSummaryDesc'),
    statCorrectCount: document.getElementById('statCorrectCount'),
    statIncorrectCount: document.getElementById('statIncorrectCount'),
    statUnansweredCount: document.getElementById('statUnansweredCount'),
    statTimeSpent: document.getElementById('statTimeSpent'),
    btnRetakeIncorrect: document.getElementById('btnRetakeIncorrect'),
    retakeCountLabel: document.getElementById('retakeCountLabel'),
    btnRetakeAll: document.getElementById('btnRetakeAll'),
    btnPrintReport: document.getElementById('btnPrintReport'),
    topicGridContainer: document.getElementById('topicGridContainer'),
    
    // Review Section
    reviewQuestionsList: document.getElementById('reviewQuestionsList'),
    filterBtnIncorrect: document.getElementById('filterBtnIncorrect'),
    filterBtnAll: document.getElementById('filterBtnAll'),
    filterBtnCorrect: document.getElementById('filterBtnCorrect'),
    filterBtnFlagged: document.getElementById('filterBtnFlagged'),
    filterCountIncorrect: document.getElementById('filterCountIncorrect'),
    filterCountCorrect: document.getElementById('filterCountCorrect'),
    filterCountFlagged: document.getElementById('filterCountFlagged')
  };

  // --- INITIALIZATION ---
  function init() {
    loadThemePreference();
    loadPersistedState();
    setupDropdown();
    bindEvents();
    renderCurrentSection();
    renderDrawer();
    updateProgressUI();
    startTimer();
    setMobileTab(state.activeMobileTab);
  }

  // --- MOBILE TAB TOGGLING ---
  function setMobileTab(tabName) {
    state.activeMobileTab = tabName;
    if (tabName === 'vignette') {
      if (el.vignettePane) el.vignettePane.classList.add('active-mobile');
      if (el.questionsPane) el.questionsPane.classList.remove('active-mobile');
      if (el.tabBtnVignette) el.tabBtnVignette.classList.add('active');
      if (el.tabBtnQuestions) el.tabBtnQuestions.classList.remove('active');
      
      if (el.mbViewLabel) el.mbViewLabel.textContent = 'Асуулт';
      if (el.mbViewIcon) el.mbViewIcon.innerHTML = '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>';
    } else {
      if (el.questionsPane) el.questionsPane.classList.add('active-mobile');
      if (el.vignettePane) el.vignettePane.classList.remove('active-mobile');
      if (el.tabBtnQuestions) el.tabBtnQuestions.classList.add('active');
      if (el.tabBtnVignette) el.tabBtnVignette.classList.remove('active');
      
      if (el.mbViewLabel) el.mbViewLabel.textContent = 'Кейс';
      if (el.mbViewIcon) el.mbViewIcon.innerHTML = '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>';
    }
  }

  function toggleMobileView() {
    if (state.activeMobileTab === 'vignette') {
      setMobileTab('questions');
    } else {
      setMobileTab('vignette');
    }
  }

  // --- THEME MANAGEMENT ---
  function loadThemePreference() {
    const saved = localStorage.getItem('cfa_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('cfa_theme', next);
  }

  // --- STORAGE PERSISTENCE ---
  function saveState() {
    try {
      const dataToSave = {
        userAnswers: state.userAnswers,
        flaggedQuestions: Array.from(state.flaggedQuestions),
        currentSectionIndex: state.currentSectionIndex,
        timerElapsed: state.timerElapsed,
        mode: state.mode
      };
      localStorage.setItem('cfa_l2_exam_save', JSON.stringify(dataToSave));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }

  function loadPersistedState() {
    try {
      const saved = localStorage.getItem('cfa_l2_exam_save');
      if (saved) {
        const parsed = JSON.parse(saved);
        state.userAnswers = parsed.userAnswers || {};
        state.flaggedQuestions = new Set(parsed.flaggedQuestions || []);
        if (parsed.currentSectionIndex !== undefined && parsed.currentSectionIndex < state.examData.length) {
          state.currentSectionIndex = parsed.currentSectionIndex;
        }
        if (parsed.timerElapsed) {
          state.timerElapsed = parsed.timerElapsed;
        }
        if (parsed.mode) {
          state.mode = parsed.mode;
        }
      }
    } catch (e) {
      console.warn('Storage load failed:', e);
    }
  }

  function clearSavedState() {
    localStorage.removeItem('cfa_l2_exam_save');
    state.userAnswers = {};
    state.flaggedQuestions.clear();
    state.timerElapsed = 0;
    state.currentSectionIndex = 0;
    state.isSubsetRetake = false;
    state.retakeQuestionIds = null;
  }

  // --- TIMER ---
  function startTimer() {
    if (state.timerInterval) clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
      if (state.isTimerRunning) {
        state.timerElapsed++;
        updateTimerDisplay();
        if (state.timerElapsed % 10 === 0) saveState();
      }
    }, 1000);
    updateTimerDisplay();
  }

  function toggleTimer() {
    state.isTimerRunning = !state.isTimerRunning;
    if (state.isTimerRunning) {
      el.timerIconPause.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
      el.btnToggleTimer.title = "Түр зогсоох";
    } else {
      el.timerIconPause.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
      el.btnToggleTimer.title = "Үргэлжлүүлэх";
    }
  }

  function updateTimerDisplay() {
    if (state.mode === 'exam') {
      const remaining = Math.max(0, state.timerSeconds - state.timerElapsed);
      el.timerDisplay.textContent = formatTime(remaining);
      if (remaining <= 300) {
        el.timerDisplay.style.color = 'var(--danger)';
      } else {
        el.timerDisplay.style.color = '';
      }
    } else {
      el.timerDisplay.textContent = formatTime(state.timerElapsed);
      el.timerDisplay.style.color = '';
    }
  }

  function formatTime(totalSecs) {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  // --- DROPDOWN SETUP ---
  function setupDropdown() {
    el.sectionSelectDropdown.innerHTML = '';
    state.examData.forEach((sec, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = `Case ${idx + 1}: ${sec.title} (${sec.session === 'Morning Session' ? 'Morn' : 'Aft'})`;
      el.sectionSelectDropdown.appendChild(opt);
    });
  }

  // --- RENDER CURRENT SECTION ---
  function renderCurrentSection() {
    const sec = state.examData[state.currentSectionIndex];
    if (!sec) return;

    // Header & Badges
    el.sectionSelectDropdown.value = state.currentSectionIndex;
    el.sessionTagBadge.textContent = sec.session === 'Morning Session' ? 'Morn' : 'Aft';
    el.sectionProgressTag.textContent = `${state.currentSectionIndex + 1}/22`;
    el.vignetteChip.textContent = `Case Scenario ${state.currentSectionIndex + 1}`;
    el.vignetteTitle.textContent = sec.title;

    // Prev / Next button states
    const isFirst = state.currentSectionIndex === 0;
    const isLast = state.currentSectionIndex === state.examData.length - 1;

    el.btnPrevSection.disabled = isFirst;
    el.btnBottomPrevSec.disabled = isFirst;
    if (el.mbBtnPrevSec) el.mbBtnPrevSec.disabled = isFirst;

    el.btnNextSection.disabled = isLast;
    el.btnBottomNextSec.disabled = isLast;
    if (el.mbBtnNextSec) el.mbBtnNextSec.disabled = isLast;

    // Questions Range
    const firstQ = sec.questions[0];
    const lastQ = sec.questions[sec.questions.length - 1];
    el.vignetteQRange.textContent = `Q#${firstQ.id} – #${lastQ.id}`;

    // Update section answered count in mobile tab
    const secAnswered = sec.questions.filter(q => !!state.userAnswers[q.id]).length;
    if (el.mobileSecAnsweredCount) el.mobileSecAnsweredCount.textContent = `${secAnswered}/4`;

    // Vignette Content
    renderVignetteContent(sec.vignette);

    // Questions List
    renderQuestionsList(sec.questions);

    // Update Drawer Highlighting
    updateDrawerActiveStates();
  }

  function renderVignetteContent(vignetteItems) {
    el.vignetteContent.innerHTML = '';
    
    vignetteItems.forEach(item => {
      if (item.type === 'text') {
        const p = document.createElement('p');
        p.textContent = item.text;
        el.vignetteContent.appendChild(p);
      } else if (item.type === 'image') {
        const wrap = document.createElement('div');
        wrap.className = 'exhibit-img-wrap';
        wrap.title = 'Зургийг томоор харах бол дарна уу';
        
        const img = document.createElement('img');
        img.src = item.src;
        img.alt = 'Case Exhibit';
        img.loading = 'lazy';
        
        const caption = document.createElement('div');
        caption.className = 'img-caption';
        caption.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg> Зургийг томруулах';
        
        wrap.appendChild(img);
        wrap.appendChild(caption);
        wrap.addEventListener('click', () => openLightbox(item.src, 'Case Exhibit'));
        el.vignetteContent.appendChild(wrap);
      } else if (item.type === 'table') {
        const tableWrap = document.createElement('div');
        tableWrap.className = 'data-table-wrap';
        
        const tbl = document.createElement('table');
        tbl.className = 'vignette-table';
        
        item.rows.forEach((row, rIdx) => {
          const tr = document.createElement('tr');
          row.forEach(cell => {
            const elTag = (rIdx === 0) ? 'th' : 'td';
            const tc = document.createElement(elTag);
            tc.textContent = cell;
            tr.appendChild(tc);
          });
          tbl.appendChild(tr);
        });
        
        tableWrap.appendChild(tbl);
        el.vignetteContent.appendChild(tableWrap);
      }
    });
  }

  function renderQuestionsList(questions) {
    el.questionsContainer.innerHTML = '';

    questions.forEach((q) => {
      const isFlagged = state.flaggedQuestions.has(q.id);
      const selectedChoice = state.userAnswers[q.id];

      const qCard = document.createElement('div');
      qCard.className = `q-card ${isFlagged ? 'flagged' : ''}`;
      qCard.id = `qcard-${q.id}`;

      // Top Row
      const topRow = document.createElement('div');
      topRow.className = 'q-card-top';

      const leftTop = document.createElement('div');
      leftTop.style.display = 'flex';
      leftTop.style.alignItems = 'center';
      leftTop.style.gap = '0.4rem';

      const numPill = document.createElement('span');
      numPill.className = 'q-num-pill';
      numPill.textContent = `Q#${q.id} (Item ${q.section_question_number}/4)`;
      leftTop.appendChild(numPill);

      if (q.topic) {
        const topicBadge = document.createElement('span');
        topicBadge.className = 'q-topic-badge';
        topicBadge.textContent = q.topic;
        topicBadge.title = q.topic;
        leftTop.appendChild(topicBadge);
      }

      const flagBtn = document.createElement('button');
      flagBtn.className = `btn-flag-q ${isFlagged ? 'active' : ''}`;
      flagBtn.title = isFlagged ? 'Тэмдэглэгээ арилгах' : 'Эргэж харахын тулд тэмдэглэх';
      flagBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="${isFlagged ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
          <line x1="4" y1="22" x2="4" y2="15"/>
        </svg>
        <span>${isFlagged ? 'Flagged' : 'Flag'}</span>
      `;
      flagBtn.addEventListener('click', () => toggleFlag(q.id));

      topRow.appendChild(leftTop);
      topRow.appendChild(flagBtn);
      qCard.appendChild(topRow);

      // Question Stem
      const stemEl = document.createElement('div');
      stemEl.className = 'q-stem';
      stemEl.textContent = q.stem;
      qCard.appendChild(stemEl);

      // Choices
      const choicesList = document.createElement('div');
      choicesList.className = 'choices-list';

      q.choices.forEach(ch => {
        const isSelected = selectedChoice === ch.label;
        const choiceLabel = document.createElement('label');
        choiceLabel.className = `choice-label-item ${isSelected ? 'selected' : ''}`;
        
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `q_${q.id}`;
        radio.value = ch.label;
        radio.checked = isSelected;
        radio.className = 'choice-radio';

        radio.addEventListener('change', () => {
          handleSelectAnswer(q.id, ch.label);
        });

        const badge = document.createElement('span');
        badge.className = 'choice-badge';
        badge.textContent = `${ch.label}.`;

        const txt = document.createElement('span');
        txt.className = 'choice-text';
        txt.textContent = ch.text;

        choiceLabel.appendChild(radio);
        choiceLabel.appendChild(badge);
        choiceLabel.appendChild(txt);
        choicesList.appendChild(choiceLabel);
      });

      qCard.appendChild(choicesList);

      // In Practice Mode: if answered, show instant solution explanation
      if (state.mode === 'practice' && selectedChoice) {
        const isCorrect = selectedChoice === q.correct_answer;
        const solCard = document.createElement('div');
        solCard.className = `practice-solution-card ${isCorrect ? 'correct-ans' : 'incorrect-ans'}`;
        
        const solHeader = document.createElement('div');
        solHeader.className = 'sol-header';
        solHeader.innerHTML = isCorrect 
          ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Зөв хариулт: ${q.correct_answer}`
          : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Буруу! (Таны сонголт: ${selectedChoice}, Зөв: ${q.correct_answer})`;
        solCard.appendChild(solHeader);

        const solDetails = document.createElement('div');
        solDetails.className = 'sol-details';
        
        const expItems = q.explanations[q.correct_answer] || [];
        expItems.forEach(item => {
          if (item.type === 'text') {
            const p = document.createElement('p');
            p.textContent = item.text;
            solDetails.appendChild(p);
          } else if (item.type === 'image') {
            const img = document.createElement('img');
            img.src = item.src;
            img.style.maxWidth = '100%';
            img.style.borderRadius = '4px';
            img.style.margin = '6px 0';
            img.style.cursor = 'zoom-in';
            img.addEventListener('click', () => openLightbox(item.src, 'Solution Formula'));
            solDetails.appendChild(img);
          }
        });

        solCard.appendChild(solDetails);
        qCard.appendChild(solCard);
      }

      el.questionsContainer.appendChild(qCard);
    });
  }

  // --- USER INTERACTION ---
  function handleSelectAnswer(questionId, choiceLetter) {
    state.userAnswers[questionId] = choiceLetter;
    saveState();
    updateProgressUI();
    renderDrawer();

    // Update mobile section badge
    const sec = state.examData[state.currentSectionIndex];
    if (sec && el.mobileSecAnsweredCount) {
      const secAnswered = sec.questions.filter(q => !!state.userAnswers[q.id]).length;
      el.mobileSecAnsweredCount.textContent = `${secAnswered}/4`;
    }
    
    // If practice mode, re-render the question to show explanation
    if (state.mode === 'practice') {
      renderCurrentSection();
    } else {
      const card = document.getElementById(`qcard-${questionId}`);
      if (card) {
        card.querySelectorAll('.choice-label-item').forEach(lbl => {
          const radio = lbl.querySelector('input');
          if (radio && radio.value === choiceLetter) {
            lbl.classList.add('selected');
          } else {
            lbl.classList.remove('selected');
          }
        });
      }
    }
  }

  function toggleFlag(questionId) {
    if (state.flaggedQuestions.has(questionId)) {
      state.flaggedQuestions.delete(questionId);
    } else {
      state.flaggedQuestions.add(questionId);
    }
    saveState();
    renderCurrentSection();
    renderDrawer();
  }

  function updateProgressUI() {
    const totalQ = 88;
    const answeredCount = Object.keys(state.userAnswers).length;
    const pct = Math.round((answeredCount / totalQ) * 100);
    
    el.answeredCountBadge.textContent = answeredCount;
    if (el.mbAnsweredBadge) el.mbAnsweredBadge.textContent = answeredCount;
    el.progressBarFill.style.width = `${pct}%`;
  }

  // --- DRAWER (QUESTION GRID) ---
  function renderDrawer() {
    el.drawerSectionsList.innerHTML = '';

    state.examData.forEach((sec, sIdx) => {
      const secItem = document.createElement('div');
      secItem.className = 'drawer-section-item';

      const secHead = document.createElement('div');
      secHead.className = 'drawer-sec-header';
      secHead.innerHTML = `
        <span class="drawer-sec-title">Case ${sIdx + 1}: ${sec.title}</span>
        <span style="font-size:0.72rem; color:var(--text-muted);">${sec.session === 'Morning Session' ? 'Morn' : 'Aft'}</span>
      `;
      secHead.addEventListener('click', () => {
        state.currentSectionIndex = sIdx;
        renderCurrentSection();
        closeDrawer();
      });

      const qRow = document.createElement('div');
      qRow.className = 'drawer-q-row';

      sec.questions.forEach(q => {
        const isAnswered = !!state.userAnswers[q.id];
        const isFlagged = state.flaggedQuestions.has(q.id);
        const isCurrent = (sIdx === state.currentSectionIndex);

        const qBtn = document.createElement('button');
        qBtn.className = `drawer-q-btn ${isAnswered ? 'answered' : ''} ${isFlagged ? 'flagged' : ''} ${isCurrent ? 'current' : ''}`;
        qBtn.textContent = q.id;
        qBtn.title = `Question ${q.id} (${q.topic || 'General'})`;

        qBtn.addEventListener('click', () => {
          state.currentSectionIndex = sIdx;
          renderCurrentSection();
          setMobileTab('questions'); // Switch to questions tab on mobile
          closeDrawer();
          setTimeout(() => {
            const target = document.getElementById(`qcard-${q.id}`);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 150);
        });

        qRow.appendChild(qBtn);
      });

      secItem.appendChild(secHead);
      secItem.appendChild(qRow);
      el.drawerSectionsList.appendChild(secItem);
    });
  }

  function updateDrawerActiveStates() {
    const allBtns = el.drawerSectionsList.querySelectorAll('.drawer-q-btn');
    allBtns.forEach(btn => btn.classList.remove('current'));
    
    const currentSecContainer = el.drawerSectionsList.children[state.currentSectionIndex];
    if (currentSecContainer) {
      currentSecContainer.querySelectorAll('.drawer-q-btn').forEach(btn => btn.classList.add('current'));
    }
  }

  function openDrawer() {
    el.navDrawer.classList.add('open');
    el.drawerBackdrop.classList.add('open');
  }

  function closeDrawer() {
    el.navDrawer.classList.remove('open');
    el.drawerBackdrop.classList.remove('open');
  }

  // --- LIGHTBOX ---
  function openLightbox(imgSrc, captionText) {
    el.lightboxImg.src = imgSrc;
    el.lightboxCaption.textContent = captionText || 'Exhibit Image';
    el.lightboxModal.classList.add('open');
  }

  function closeLightbox() {
    el.lightboxModal.classList.remove('open');
    el.lightboxImg.src = '';
  }

  // --- SUBMIT CONFIRMATION & SCORING ---
  function promptSubmitExam() {
    const totalQ = 88;
    const answered = Object.keys(state.userAnswers).length;
    const unanswered = totalQ - answered;
    const flagged = state.flaggedQuestions.size;

    el.confirmModalText.textContent = `Та нийт 88 асуултаас ${answered}-д нь хариулсан байна.`;
    el.msAnswered.textContent = answered;
    el.msUnanswered.textContent = unanswered;
    el.msFlagged.textContent = flagged;

    el.confirmSubmitModal.classList.add('open');
  }

  function closeSubmitModal() {
    el.confirmSubmitModal.classList.remove('open');
  }

  function finishAndScoreExam() {
    closeSubmitModal();
    state.isTimerRunning = false;
    
    // Switch View
    el.viewExam.classList.remove('active');
    el.viewResults.classList.add('active');
    if (el.mobileBottomNav) el.mobileBottomNav.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Compute Scores
    computeAndRenderResults();
  }

  function computeAndRenderResults() {
    let totalCorrect = 0;
    let totalAnswered = 0;
    const totalQ = 88;
    
    const topicStats = {};
    const sessionStats = {
      'Morning Session': { total: 44, correct: 0 },
      'Afternoon Session': { total: 44, correct: 0 }
    };

    const wrongQuestionIds = [];

    state.examData.forEach(sec => {
      sec.questions.forEach(q => {
        const userChoice = state.userAnswers[q.id];
        const isCorrect = userChoice === q.correct_answer;
        
        if (userChoice) totalAnswered++;
        if (isCorrect) {
          totalCorrect++;
          if (sessionStats[sec.session]) sessionStats[sec.session].correct++;
        } else {
          wrongQuestionIds.push(q.id);
        }

        const topicArea = q.topic_area || 'General Finance';
        if (!topicStats[topicArea]) {
          topicStats[topicArea] = { total: 0, correct: 0, name: topicArea };
        }
        topicStats[topicArea].total++;
        if (isCorrect) topicStats[topicArea].correct++;
      });
    });

    const incorrectCount = totalQ - totalCorrect;
    const unansweredCount = totalQ - totalAnswered;
    const pct = Math.round((totalCorrect / totalQ) * 100);

    // Hero Card Render
    el.scorePctValue.textContent = `${pct}%`;
    el.scoreFractionLabel.textContent = `${totalCorrect} / ${totalQ}`;
    
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (pct / 100) * circumference;
    el.scoreRingProgress.style.strokeDashoffset = offset;

    // Status Badge & Headline
    if (pct >= 70) {
      el.scoreStatusBadge.textContent = "Passing Score (70%+)";
      el.scoreStatusBadge.style.backgroundColor = "var(--success-bg)";
      el.scoreStatusBadge.style.color = "var(--success-text)";
      el.scoreStatusBadge.style.borderColor = "var(--success-border)";
      el.scoreRingProgress.style.stroke = "var(--success)";
      el.scoreHeadline.textContent = "Баяр хүргэе! Та тэнцлээ";
      el.scoreSummaryDesc.textContent = `Та CFA Level II жишиг шалгалтад ${pct}% авч тэнцэх түвшинд хүрлээ. Алдсан ${incorrectCount} асуултын нарийн тайлбарыг доороос нягтална уу.`;
    } else if (pct >= 60) {
      el.scoreStatusBadge.textContent = "Borderline (60–69%)";
      el.scoreStatusBadge.style.backgroundColor = "var(--warning-bg)";
      el.scoreStatusBadge.style.color = "var(--warning-text)";
      el.scoreStatusBadge.style.borderColor = "var(--warning-border)";
      el.scoreRingProgress.style.stroke = "var(--warning)";
      el.scoreHeadline.textContent = "Хангалттай ойрхон байна";
      el.scoreSummaryDesc.textContent = `Та нийт ${pct}% авсан байна. Тэнцэх босго (70%+) руу хүрэхийн тулд алдсан сэдвүүдээ доорх тайлбаруудаас давтана уу.`;
    } else {
      el.scoreStatusBadge.textContent = "Needs Revision (<60%)";
      el.scoreStatusBadge.style.backgroundColor = "var(--danger-bg)";
      el.scoreStatusBadge.style.color = "var(--danger-text)";
      el.scoreStatusBadge.style.borderColor = "var(--danger-border)";
      el.scoreRingProgress.style.stroke = "var(--danger)";
      el.scoreHeadline.textContent = "Дахин давтах шаардлагатай";
      el.scoreSummaryDesc.textContent = `Та нийт ${pct}% авсан байна. Доорх "Зөвхөн алдсан асуултууд" хэсгээс бодолт, томьёоны алдааг судалж дахин дадлага хийнэ үү.`;
    }

    el.statCorrectCount.textContent = totalCorrect;
    el.statIncorrectCount.textContent = incorrectCount;
    el.statUnansweredCount.textContent = unansweredCount;
    el.statTimeSpent.textContent = formatTime(state.timerElapsed);
    
    el.retakeCountLabel.textContent = incorrectCount;
    el.btnRetakeIncorrect.style.display = incorrectCount > 0 ? 'inline-flex' : 'none';

    renderTopicBreakdown(topicStats);

    el.filterCountIncorrect.textContent = incorrectCount;
    el.filterCountCorrect.textContent = totalCorrect;
    el.filterCountFlagged.textContent = state.flaggedQuestions.size;

    setReviewFilter(incorrectCount > 0 ? 'incorrect' : 'all');
  }

  function renderTopicBreakdown(topicStats) {
    el.topicGridContainer.innerHTML = '';
    
    const sortedTopics = Object.values(topicStats).sort((a, b) => (b.correct / b.total) - (a.correct / a.total));

    sortedTopics.forEach(t => {
      const pct = Math.round((t.correct / t.total) * 100);
      const card = document.createElement('div');
      card.className = 'topic-card';

      let barClass = 'high';
      if (pct < 50) barClass = 'low';
      else if (pct < 70) barClass = 'med';

      card.innerHTML = `
        <div class="topic-card-header">
          <span>${t.name}</span>
          <span class="topic-score-fraction">${t.correct}/${t.total} (${pct}%)</span>
        </div>
        <div class="topic-bar-bg">
          <div class="topic-bar-fill ${barClass}" style="width: ${pct}%"></div>
        </div>
        <div class="topic-card-footer">
          <span>Амжилт: ${pct}%</span>
          <span>${t.total - t.correct} алдсан</span>
        </div>
      `;
      el.topicGridContainer.appendChild(card);
    });
  }

  // --- MISTAKE REVIEW RENDERING ---
  function setReviewFilter(filterName) {
    state.activeFilter = filterName;

    [el.filterBtnIncorrect, el.filterBtnAll, el.filterBtnCorrect, el.filterBtnFlagged].forEach(btn => {
      if (btn.getAttribute('data-filter') === filterName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    renderReviewQuestionsList();
  }

  function renderReviewQuestionsList() {
    el.reviewQuestionsList.innerHTML = '';

    const allQuestionsWithSection = [];
    state.examData.forEach(sec => {
      sec.questions.forEach(q => {
        allQuestionsWithSection.push({ sec, q });
      });
    });

    const filtered = allQuestionsWithSection.filter(({ q }) => {
      const userChoice = state.userAnswers[q.id];
      const isCorrect = userChoice === q.correct_answer;
      const isFlagged = state.flaggedQuestions.has(q.id);

      if (state.activeFilter === 'incorrect') return !isCorrect;
      if (state.activeFilter === 'correct') return isCorrect;
      if (state.activeFilter === 'flagged') return isFlagged;
      return true;
    });

    if (filtered.length === 0) {
      el.reviewQuestionsList.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1.5rem; background-color: var(--bg-subtle); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--success); margin-bottom: 0.5rem;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <h4 style="font-weight: 700; margin-bottom: 0.25rem;">Энэ шүүлтүүрт тохирох асуулт олдсонгүй</h4>
          <p style="font-size: 0.85rem; color: var(--text-secondary);">Та бүх асуултаа зөв хариулсан байна эсвэл өөр шүүлтүүр сонгоно уу.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(({ sec, q }) => {
      const userChoice = state.userAnswers[q.id];
      const isCorrect = userChoice === q.correct_answer;

      const rCard = document.createElement('div');
      rCard.className = `review-card ${isCorrect ? 'status-correct' : 'status-wrong'}`;

      // Top bar
      const topBar = document.createElement('div');
      topBar.className = 'review-card-top';

      const leftTop = document.createElement('div');
      leftTop.className = 'rc-left';

      const qNum = document.createElement('span');
      qNum.className = 'rc-qnum';
      qNum.textContent = `Q#${q.id} (${q.section_question_number}/4)`;
      leftTop.appendChild(qNum);

      const vTitle = document.createElement('span');
      vTitle.className = 'rc-vignette-title';
      vTitle.textContent = `${sec.title}`;
      leftTop.appendChild(vTitle);

      const statusPill = document.createElement('span');
      statusPill.className = `rc-status-pill ${isCorrect ? 'correct' : 'wrong'}`;
      statusPill.innerHTML = isCorrect
        ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Зөв`
        : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Алдсан`;

      topBar.appendChild(leftTop);
      topBar.appendChild(statusPill);
      rCard.appendChild(topBar);

      // Question Stem
      const stem = document.createElement('div');
      stem.className = 'review-stem';
      stem.textContent = q.stem;
      rCard.appendChild(stem);

      // User Answer comparison badge
      const ansRow = document.createElement('div');
      ansRow.className = 'review-user-ans-row';
      
      const userChoiceBadge = document.createElement('div');
      userChoiceBadge.className = `ans-badge-item user-choice ${isCorrect ? 'is-correct' : 'is-wrong'}`;
      userChoiceBadge.innerHTML = `<span>Таны сонголт:</span> <strong>${userChoice ? userChoice : 'Хариулаагүй'}</strong> ${isCorrect ? '✅' : '❌'}`;
      
      const correctChoiceBadge = document.createElement('div');
      correctChoiceBadge.className = 'ans-badge-item correct-choice';
      correctChoiceBadge.innerHTML = `<span>Зөв хариулт:</span> <strong>${q.correct_answer}</strong> ✅`;

      ansRow.appendChild(userChoiceBadge);
      ansRow.appendChild(correctChoiceBadge);
      rCard.appendChild(ansRow);

      // Detailed Choices Breakdown
      const choicesBreakdown = document.createElement('div');
      choicesBreakdown.className = 'review-choices-breakdown';

      q.choices.forEach(ch => {
        const isChoiceCorrect = (ch.label === q.correct_answer);
        const isUserChoice = (userChoice === ch.label);

        const chItem = document.createElement('div');
        chItem.className = `rc-choice-item ${isChoiceCorrect ? 'is-correct-option' : (isUserChoice ? 'is-user-selected-wrong' : '')}`;

        const chHead = document.createElement('div');
        chHead.className = 'rc-choice-head';

        const textWrap = document.createElement('div');
        textWrap.className = 'rc-choice-text-wrap';
        textWrap.innerHTML = `<span>[${ch.label}]</span> <span>${ch.text}</span>`;

        const badgeTag = document.createElement('div');
        if (isChoiceCorrect) {
          badgeTag.innerHTML = `<span style="font-size:0.75rem; font-weight:700; color:var(--success); background:var(--success-bg); border:1px solid var(--success-border); padding:2px 7px; border-radius:10px;">Зөв</span>`;
        } else if (isUserChoice) {
          badgeTag.innerHTML = `<span style="font-size:0.75rem; font-weight:700; color:var(--danger); background:var(--danger-bg); border:1px solid var(--danger-border); padding:2px 7px; border-radius:10px;">Таны сонголт</span>`;
        }

        chHead.appendChild(textWrap);
        chHead.appendChild(badgeTag);
        chItem.appendChild(chHead);

        // Explanation body
        const expItems = q.explanations[ch.label] || [];
        if (expItems.length > 0) {
          const expBody = document.createElement('div');
          expBody.className = 'rc-choice-exp-body';
          
          expItems.forEach(item => {
            if (item.type === 'text') {
              const p = document.createElement('p');
              p.textContent = item.text;
              expBody.appendChild(p);
            } else if (item.type === 'image') {
              const img = document.createElement('img');
              img.src = item.src;
              img.loading = 'lazy';
              img.title = 'Томруулж харах';
              img.addEventListener('click', () => openLightbox(item.src, `Formula / Table for Option ${ch.label}`));
              expBody.appendChild(img);
            }
          });
          
          chItem.appendChild(expBody);
        }

        choicesBreakdown.appendChild(chItem);
      });

      rCard.appendChild(choicesBreakdown);

      // Toggleable Vignette Context
      const toggleVignetteBtn = document.createElement('button');
      toggleVignetteBtn.className = 'btn-toggle-vignette-ctx';
      toggleVignetteBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <span>Кейсийн эх текстийг харах</span>
      `;
      
      const vCollapse = document.createElement('div');
      vCollapse.className = 'vignette-ctx-collapse';
      
      sec.vignette.forEach(vItem => {
        if (vItem.type === 'text') {
          const vp = document.createElement('p');
          vp.textContent = vItem.text;
          vp.style.marginBottom = '0.4rem';
          vCollapse.appendChild(vp);
        } else if (vItem.type === 'image') {
          const vImg = document.createElement('img');
          vImg.src = vItem.src;
          vImg.style.maxWidth = '100%';
          vImg.style.borderRadius = '4px';
          vImg.style.margin = '0.4rem 0';
          vImg.style.cursor = 'zoom-in';
          vImg.addEventListener('click', () => openLightbox(vItem.src, 'Vignette Exhibit'));
          vCollapse.appendChild(vImg);
        }
      });

      toggleVignetteBtn.addEventListener('click', () => {
        const isOpen = vCollapse.classList.contains('open');
        if (isOpen) {
          vCollapse.classList.remove('open');
          toggleVignetteBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> <span>Кейсийн эх текстийг харах</span>`;
        } else {
          vCollapse.classList.add('open');
          toggleVignetteBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg> <span>Кейсийг хураах</span>`;
        }
      });

      rCard.appendChild(toggleVignetteBtn);
      rCard.appendChild(vCollapse);

      el.reviewQuestionsList.appendChild(rCard);
    });
  }

  // --- RETAKE ACTIONS ---
  function retakeIncorrectQuestions() {
    state.examData.forEach(sec => {
      sec.questions.forEach(q => {
        if (state.userAnswers[q.id] !== q.correct_answer) {
          delete state.userAnswers[q.id];
        }
      });
    });

    saveState();
    state.mode = 'practice';
    el.btnModePractice.classList.add('active');
    el.btnModeExam.classList.remove('active');

    el.viewResults.classList.remove('active');
    el.viewExam.classList.add('active');
    if (el.mobileBottomNav) el.mobileBottomNav.style.display = 'flex';
    state.currentSectionIndex = 0;
    renderCurrentSection();
    renderDrawer();
    updateProgressUI();
    setMobileTab('questions');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function retakeAllExam() {
    if (confirm('Та бүх хариултаа шинэчилж, шалгалтыг эхнээс нь эхлүүлэх үү?')) {
      clearSavedState();
      el.viewResults.classList.remove('active');
      el.viewExam.classList.add('active');
      if (el.mobileBottomNav) el.mobileBottomNav.style.display = 'flex';
      state.mode = 'exam';
      el.btnModeExam.classList.add('active');
      el.btnModePractice.classList.remove('active');
      state.timerElapsed = 0;
      state.isTimerRunning = true;
      renderCurrentSection();
      renderDrawer();
      updateProgressUI();
      setMobileTab('vignette');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // --- EVENT BINDINGS ---
  function bindEvents() {
    // Mode toggles
    el.btnModeExam.addEventListener('click', () => {
      state.mode = 'exam';
      el.btnModeExam.classList.add('active');
      el.btnModePractice.classList.remove('active');
      if (el.btnModeQuiz) el.btnModeQuiz.classList.remove('active');
      if (el.viewQuiz) el.viewQuiz.classList.remove('active');
      el.viewResults.classList.remove('active');
      el.viewExam.classList.add('active');
      if (el.mobileBottomNav) el.mobileBottomNav.style.display = 'flex';
      renderCurrentSection();
      saveState();
    });

    el.btnModePractice.addEventListener('click', () => {
      state.mode = 'practice';
      el.btnModePractice.classList.add('active');
      el.btnModeExam.classList.remove('active');
      if (el.btnModeQuiz) el.btnModeQuiz.classList.remove('active');
      if (el.viewQuiz) el.viewQuiz.classList.remove('active');
      el.viewResults.classList.remove('active');
      el.viewExam.classList.add('active');
      if (el.mobileBottomNav) el.mobileBottomNav.style.display = 'flex';
      renderCurrentSection();
      saveState();
    });

    if (el.btnModeQuiz) {
      el.btnModeQuiz.addEventListener('click', () => {
        el.btnModeExam.classList.remove('active');
        el.btnModePractice.classList.remove('active');
        el.btnModeQuiz.classList.add('active');
        el.viewExam.classList.remove('active');
        el.viewResults.classList.remove('active');
        if (el.viewQuiz) el.viewQuiz.classList.add('active');
        if (el.mobileBottomNav) el.mobileBottomNav.style.display = 'none';
        if (window.QuizApp && typeof window.QuizApp.init === 'function') {
          window.QuizApp.init();
        }
      });
    }

    // Mobile Tabs
    if (el.tabBtnVignette) {
      el.tabBtnVignette.addEventListener('click', () => setMobileTab('vignette'));
    }
    if (el.tabBtnQuestions) {
      el.tabBtnQuestions.addEventListener('click', () => setMobileTab('questions'));
    }
    if (el.btnMobileGoToQuestions) {
      el.btnMobileGoToQuestions.addEventListener('click', () => {
        setMobileTab('questions');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
    if (el.btnMobileBackToVignette) {
      el.btnMobileBackToVignette.addEventListener('click', () => {
        setMobileTab('vignette');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Mobile Bottom Nav
    if (el.mbBtnPrevSec) el.mbBtnPrevSec.addEventListener('click', () => el.btnPrevSection.click());
    if (el.mbBtnNextSec) el.mbBtnNextSec.addEventListener('click', () => el.btnNextSection.click());
    if (el.mbBtnToggleView) el.mbBtnToggleView.addEventListener('click', toggleMobileView);
    if (el.mbBtnGrid) el.mbBtnGrid.addEventListener('click', openDrawer);

    // Theme & Timer
    el.btnToggleTheme.addEventListener('click', toggleTheme);
    el.btnToggleTimer.addEventListener('click', toggleTimer);

    // Section Navigation
    el.btnPrevSection.addEventListener('click', () => {
      if (state.currentSectionIndex > 0) {
        state.currentSectionIndex--;
        renderCurrentSection();
        saveState();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    el.btnNextSection.addEventListener('click', () => {
      if (state.currentSectionIndex < state.examData.length - 1) {
        state.currentSectionIndex++;
        renderCurrentSection();
        saveState();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    el.btnBottomPrevSec.addEventListener('click', () => el.btnPrevSection.click());
    el.btnBottomNextSec.addEventListener('click', () => el.btnNextSection.click());

    el.sectionSelectDropdown.addEventListener('change', (e) => {
      state.currentSectionIndex = parseInt(e.target.value, 10);
      renderCurrentSection();
      saveState();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Drawer
    el.btnToggleDrawer.addEventListener('click', openDrawer);
    el.btnCloseDrawer.addEventListener('click', closeDrawer);
    el.drawerBackdrop.addEventListener('click', closeDrawer);

    // Lightbox
    el.btnCloseLightbox.addEventListener('click', closeLightbox);
    el.lightboxModal.addEventListener('click', (e) => {
      if (e.target === el.lightboxModal) closeLightbox();
    });

    // Submit Modal
    el.btnSubmitExam.addEventListener('click', promptSubmitExam);
    el.btnCancelSubmit.addEventListener('click', closeSubmitModal);
    el.btnConfirmSubmit.addEventListener('click', finishAndScoreExam);

    // Results Actions
    el.btnRetakeIncorrect.addEventListener('click', retakeIncorrectQuestions);
    el.btnRetakeAll.addEventListener('click', retakeAllExam);
    el.btnPrintReport.addEventListener('click', () => window.print());

    // Review Filters
    el.filterBtnIncorrect.addEventListener('click', () => setReviewFilter('incorrect'));
    el.filterBtnAll.addEventListener('click', () => setReviewFilter('all'));
    el.filterBtnCorrect.addEventListener('click', () => setReviewFilter('correct'));
    el.filterBtnFlagged.addEventListener('click', () => setReviewFilter('flagged'));

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeDrawer();
        closeLightbox();
        closeSubmitModal();
      }
    });
  }

  // Run on page load
  document.addEventListener('DOMContentLoaded', init);

})();
