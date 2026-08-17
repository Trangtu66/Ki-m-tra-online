// script.js - xử lý tạo đề, làm bài, chấm điểm và hiển thị đáp án chi tiết
(() => {
  // Element refs
  const bankInput = document.getElementById('bankInput');
  const loadSample = document.getElementById('loadSample');
  const generateBtn = document.getElementById('generate');
  const topicInput = document.getElementById('topicInput');
  const timeInput = document.getElementById('timeInput');

  const examTitle = document.getElementById('examTitle');
  const countG1 = document.getElementById('countG1');
  const countG2 = document.getElementById('countG2');
  const countG3 = document.getElementById('countG3');
  const timerEl = document.getElementById('timer');

  const examForm = document.getElementById('examForm');
  const submitBtn = document.getElementById('submitBtn');
  const resetAnswers = document.getElementById('resetAnswers');

  const resultSection = document.getElementById('result');
  const scoreSummary = document.getElementById('scoreSummary');
  const detailedAnswers = document.getElementById('detailedAnswers');
  const studentNameEl = document.getElementById('studentName');
  const downloadReportBtn = document.getElementById('downloadReport');

  let bank = null;
  let exam = null;
  let timer = null;
  let endTime = null;

  // Load sample bank
  loadSample.addEventListener('click', () => {
    fetch('sample_bank.json').then(r => r.ok ? r.text() : Promise.reject('Không tìm sample_bank.json')).then(txt => {
      bankInput.value = txt;
    }).catch(err => {
      // fallback sample
      bankInput.value = JSON.stringify({
        title: "Mẫu: Toán 12 - Đại số",
        group1: [
          { id: "G1-1", q: "Số nào là nghiệm của phương trình x^2-5x+6=0?", opts: {"A":"1","B":"2","C":"3","D":"6"}, answer: "C", explain: "x^2-5x+6=(x-2)(x-3) => x=2 hoặc 3" },
          { id: "G1-2", q: "Tập nghiệm của bất phương trình x-3>0 là?", opts: {"A":"x<3","B":"x>3","C":"x≤3","D":"x≥3"}, answer: "B" }
        ],
        group2: [
          { id: "G2-1", q: "Cho hình vuông ABCD. Hãy cho biết các phát biểu sau:", items: {"a":"Các cạnh bằng nhau","b":"Hai đường chéo bằng nhau","c":"Tổng 2 góc đối bằng 180°","d":"Tất cả góc vuông"}, key: {"a":true,"b":true,"c":true,"d":true}, explain: "Hình vuông có tất cả các tính chất của hình chữ nhật và hình thoi." }
        ],
        group3: [
          { id: "G3-1", q: "Viết chữ số hàng chục của 2026 (4 ký tự nếu cần):", answer: "2", explain: "2026 -> hàng chục là 2" }
        ]
      }, null, 2);
    });
  });

  // Generate exam from bank JSON
  generateBtn.addEventListener('click', () => {
    try {
      bank = JSON.parse(bankInput.value);
    } catch (e) {
      alert('JSON không hợp lệ: ' + e.message);
      return;
    }
    prepareExamFromBank(bank);
  });

  function prepareExamFromBank(bankObj) {
    // Validate and set defaults
    bankObj.title = bankObj.title || 'Đề trắc nghiệm';
    bankObj.group1 = bankObj.group1 || [];
    bankObj.group2 = bankObj.group2 || [];
    bankObj.group3 = bankObj.group3 || [];

    // Build exam object (can randomize order if needed)
    exam = {
      title: topicInput.value.trim() || bankObj.title,
      timeMinutes: Math.max(1, parseInt(timeInput.value) || 15),
      group1: bankObj.group1.slice(),
      group2: bankObj.group2.slice(),
      group3: bankObj.group3.slice()
    };

    // Update UI meta
    examTitle.textContent = exam.title;
    countG1.textContent = exam.group1.length;
    countG2.textContent = exam.group2.length;
    countG3.textContent = exam.group3.length;

    renderExamForm();
    startTimerCountdown(exam.timeMinutes);
    resultSection.hidden = true;
    scoreSummary.innerHTML = '';
    detailedAnswers.innerHTML = '';
  }

  function renderExamForm() {
    examForm.innerHTML = '';
    // Group 1
    if (exam.group1.length) {
      const h = document.createElement('h3'); h.textContent = 'Nhóm 1: Trắc nghiệm 4 lựa chọn';
      examForm.appendChild(h);
      exam.group1.forEach((q, idx) => {
        const div = document.createElement('div'); div.className = 'q';
        const qNo = idx + 1;
        const h4 = document.createElement('h4'); h4.textContent = `${qNo}. ${q.q}`;
        div.appendChild(h4);
        const optsDiv = document.createElement('div'); optsDiv.className = 'options';
        ['A','B','C','D'].forEach(letter => {
          const lab = document.createElement('label'); lab.className = 'option';
          const inp = document.createElement('input');
          inp.type = 'radio';
          inp.name = `g1-${idx}`;
          inp.value = letter;
          inp.dataset.qid = q.id || `g1-${idx}`;
          const span = document.createElement('span');
          span.innerHTML = `<strong>${letter}.</strong> ${q.opts && q.opts[letter] ? q.opts[letter] : ''}`;
          lab.appendChild(inp); lab.appendChild(span);
          optsDiv.appendChild(lab);
        });
        div.appendChild(optsDiv);
        examForm.appendChild(div);
      });
    }

    // Group 2
    if (exam.group2.length) {
      const h = document.createElement('h3'); h.textContent = 'Nhóm 2: Đúng / Sai (mỗi câu có 4 ý a)-d)';
      examForm.appendChild(h);
      exam.group2.forEach((q, idx) => {
        const div = document.createElement('div'); div.className = 'q';
        const qNo = exam.group1.length + idx + 1;
        const h4 = document.createElement('h4'); h4.textContent = `${qNo}. ${q.q}`;
        div.appendChild(h4);
        const optsDiv = document.createElement('div'); optsDiv.className = 'options';
        ['a','b','c','d'].forEach(letter => {
          const lab = document.createElement('label'); lab.className = 'option';
          const selT = document.createElement('select');
          selT.name = `g2-${idx}-${letter}`;
          selT.dataset.qid = q.id || `g2-${idx}`;
          const op1 = document.createElement('option'); op1.value = 'true'; op1.textContent = 'Đúng';
          const op2 = document.createElement('option'); op2.value = 'false'; op2.textContent = 'Sai';
          selT.appendChild(op1); selT.appendChild(op2);
          const span = document.createElement('span');
          span.innerHTML = `<strong>${letter})</strong> ${q.items && q.items[letter] ? q.items[letter] : ''}`;
          lab.appendChild(span);
          lab.appendChild(selT);
          optsDiv.appendChild(lab);
        });
        div.appendChild(optsDiv);
        examForm.appendChild(div);
      });
    }

    // Group 3
    if (exam.group3.length) {
      const h = document.createElement('h3'); h.textContent = 'Nhóm 3: Trả lời ngắn';
      examForm.appendChild(h);
      exam.group3.forEach((q, idx) => {
        const div = document.createElement('div'); div.className = 'q';
        const qNo = exam.group1.length + exam.group2.length + idx + 1;
        const h4 = document.createElement('h4'); h4.textContent = `${qNo}. ${q.q}`;
        div.appendChild(h4);
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.name = `g3-${idx}`;
        inp.placeholder = 'Nhập câu trả lời...';
        inp.style.width = '100%';
        div.appendChild(inp);
        examForm.appendChild(div);
      });
    }
  }

  // Timer
  function startTimerCountdown(minutes) {
    if (timer) clearInterval(timer);
    const now = Date.now();
    endTime = now + minutes * 60 * 1000;
    updateTimer();
    timer = setInterval(updateTimer, 1000);
  }

  function updateTimer() {
    const rem = Math.max(0, Math.round((endTime - Date.now()) / 1000));
    const mm = String(Math.floor(rem / 60)).padStart(2, '0');
    const ss = String(rem % 60).padStart(2, '0');
    timerEl.textContent = `${mm}:${ss}`;
    if (rem <= 0) {
      clearInterval(timer);
      alert('Hết thời gian! Bài sẽ được tự động nộp.');
      submitExam();
    }
  }

  // Reset answers
  resetAnswers.addEventListener('click', () => {
    if (!confirm('Bạn có chắc muốn xoá tất cả đáp án đã chọn?')) return;
    examForm.reset();
  });

  // Submit
  submitBtn.addEventListener('click', (e) => {
    e.preventDefault();
    submitExam();
  });

  function submitExam() {
    if (!exam) { alert('Chưa có đề thi.'); return; }
    const studentName = (studentNameEl.value || '').trim();
    if (!studentName) {
      if (!confirm('Bạn chưa nhập tên học sinh. Tiếp tục?')) return;
    }
    // Grade
    const gradeResult = gradeExam();
    // Show results
    displayResults(gradeResult);
    // stop timer
    if (timer) clearInterval(timer);
  }

  function gradeExam() {
    let total = 0;
    let maxTotal = 0;
    const details = { group1: [], group2: [], group3: [] };

    // G1
    exam.group1.forEach((q, idx) => {
      maxTotal += 1;
      const sel = examForm.querySelector(`input[name="g1-${idx}"]:checked`);
      const chosen = sel ? sel.value : null;
      const correct = (q.answer || '').toString().toUpperCase();
      const ok = chosen && chosen.toString().toUpperCase() === correct;
      if (ok) total += 1;
      details.group1.push({
        id: q.id, q: q.q, chosen, correct, ok, explain: q.explain || ''
      });
    });

    // G2 - scoring adjusted per request:
    // Số ý đúng = 1 -> 0.1; 2 -> 0.25; 3 -> 0.5; 4 -> 1.0; 0 -> 0
    exam.group2.forEach((q, idx) => {
      maxTotal += 1; // mỗi câu tối đa 1 điểm
      const items = {};
      let correctCount = 0;
      ['a','b','c','d'].forEach(letter => {
        const sel = examForm.querySelector(`select[name="g2-${idx}-${letter}"]`);
        const val = sel ? (sel.value === 'true') : null;
        const expect = !!(q.key && (q.key[letter] === true));
        const ok = val === expect;
        if (ok) correctCount += 1;
        items[letter] = { text: q.items ? q.items[letter] : '', chosen: val, expect, ok };
      });
      let score = 0;
      if (correctCount === 1) score = 0.1;
      else if (correctCount === 2) score = 0.25;
      else if (correctCount === 3) score = 0.5;
      else if (correctCount === 4) score = 1.0;
      else score = 0;
      total += score;
      details.group2.push({ id: q.id, q: q.q, items, correctCount, score, explain: q.explain || '' });
    });

    // G3
    exam.group3.forEach((q, idx) => {
      maxTotal += 1;
      const inp = examForm.querySelector(`input[name="g3-${idx}"]`);
      const val = inp ? (inp.value || '').toString().trim() : '';
      const expect = (q.answer || '').toString().trim();
      // comparison: case-insensitive, trim
      const ok = expect.length > 0 && (val.toLowerCase() === expect.toLowerCase());
      if (ok) total += 1;
      details.group3.push({ id: q.id, q: q.q, chosen: val, correct: expect, ok, explain: q.explain || '' });
    });

    // Round total to 2 decimals for stability
    total = Math.round(total * 100) / 100;

    return { total, maxTotal, details };
  }

  function displayResults(res) {
    resultSection.hidden = false;
    scoreSummary.innerHTML = `<strong>Tên:</strong> ${studentNameEl.value || '[Chưa nhập]'}<br>
      <strong>Điểm:</strong> ${Number(res.total).toFixed(2)} / ${res.maxTotal}<br>
      <small class="small">Điểm nhóm 1: mỗi câu 1 điểm. Nhóm 2: quy định (1 đúng = 0.1; 2 đúng = 0.25; 3 đúng = 0.5; 4 đúng = 1.0). Nhóm 3: 1 điểm/câu.</small>`;

    // Detailed answers
    detailedAnswers.innerHTML = '';
    // group1
    if (res.details.group1.length) {
      const h = document.createElement('h4'); h.textContent = 'Chi tiết Nhóm 1';
      detailedAnswers.appendChild(h);
      res.details.group1.forEach((d, idx) => {
        const div = document.createElement('div');
        div.innerHTML = `<strong>${idx+1}.</strong> ${d.q}<br>
          Đáp án của học sinh: <strong>${d.chosen || '(không chọn)'}</strong> — Đúng: <strong>${d.correct}</strong> — ${d.ok ? '<span style="color:green">ĐÚNG</span>' : '<span style="color:red">SAI</span>'}
          ${d.explain ? `<div class="small">Giải thích: ${d.explain}</div>` : ''}`;
        detailedAnswers.appendChild(div);
      });
    }

    if (res.details.group2.length) {
      const h = document.createElement('h4'); h.textContent = 'Chi tiết Nhóm 2';
      detailedAnswers.appendChild(h);
      res.details.group2.forEach((d, idx) => {
        const div = document.createElement('div');
        const parts = ['a','b','c','d'].map(letter => {
          const it = d.items[letter];
          const state = it.ok ? 'ĐÚNG' : 'SAI';
          return `<div><strong>${letter})</strong> ${it.text} — Học sinh: <em>${it.chosen === null ? '(không chọn)' : (it.chosen ? 'Đúng' : 'Sai')}</em> — Kết quả: <strong style="color:${it.ok ? 'green' : 'red'}">${state}</strong></div>`;
        }).join('');
        div.innerHTML = `<strong>${idx+1}.</strong> ${d.q}<br>${parts}
          <div class="small">Số ý đúng: ${d.correctCount} — Điểm câu này: ${Number(d.score).toFixed(2)}</div>
          ${d.explain ? `<div class="small">Ghi chú: ${d.explain}</div>` : ''}`;
        detailedAnswers.appendChild(div);
      });
    }

    if (res.details.group3.length) {
      const h = document.createElement('h4'); h.textContent = 'Chi tiết Nhóm 3';
      detailedAnswers.appendChild(h);
      res.details.group3.forEach((d, idx) => {
        const div = document.createElement('div');
        div.innerHTML = `<strong>${idx+1}.</strong> ${d.q}<br>
          Học sinh: <em>${d.chosen || '(không nhập)'}</em> — Đáp án chuẩn: <strong>${d.correct}</strong> — ${d.ok ? '<span style="color:green">ĐÚNG</span>' : '<span style="color:red">SAI</span>'}
          ${d.explain ? `<div class="small">Ghi chú: ${d.explain}</div>` : ''}`;
        detailedAnswers.appendChild(div);
      });
    }
  }

  // Download result as text
  downloadReportBtn.addEventListener('click', () => {
    if (resultSection.hidden) { alert('Chưa có kết quả để tải.'); return; }
    let txt = `BÁO CÁO KẾT QUẢ\n`;
    txt += `Tên: ${studentNameEl.value || '[Chưa nhập]'}\n`;
    txt += `Đề: ${exam.title}\n`;
    txt += `Thời gian quy định: ${exam.timeMinutes} phút\n\n`;
    const res = gradeExam();
    txt += `Điểm: ${Number(res.total).toFixed(2)} / ${res.maxTotal}\n\n`;
    txt += `--- Chi tiết ---\n`;
    res.details.group1.forEach((d, i) => {
      txt += `G1-${i+1}: ${d.q}\n  Học sinh: ${d.chosen || '(không chọn)'}  |  Đáp án: ${d.correct}  |  ${d.ok ? 'Đúng' : 'Sai'}\n`;
    });
    res.details.group2.forEach((d, i) => {
      txt += `G2-${i+1}: ${d.q}\n`;
      ['a','b','c','d'].forEach(letter => {
        const it = d.items[letter];
        txt += `  ${letter}) ${it.text} | Học sinh: ${it.chosen === null ? '(không chọn)' : (it.chosen ? 'Đúng' : 'Sai')} | ${it.ok ? 'OK' : 'X'}\n`;
      });
      txt += `  Số ý đúng: ${d.correctCount} | Điểm: ${Number(d.score).toFixed(2)}\n`;
    });
    res.details.group3.forEach((d, i) => {
      txt += `G3-${i+1}: ${d.q}\n  Học sinh: ${d.chosen || '(không nhập)'}  |  Đáp án: ${d.correct}  |  ${d.ok ? 'Đúng' : 'Sai'}\n`;
    });

    const blob = new Blob([txt], {type: 'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ketqua-${(studentNameEl.value || 'hs').replace(/\s+/g,'_')}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  // If there is a sample_bank.json file, load it into bankInput on first load gracefully
  window.addEventListener('load', () => {
    // try to fetch sample file silently
    fetch('sample_bank.json').then(r => r.ok ? r.text() : Promise.reject()).then(txt => {
      // leave it alone; only put sample if teacher clicks "Tải mẫu"
    }).catch(()=>{ /* ignore */ });
  });

})();
