document.addEventListener('DOMContentLoaded', () => {
    // --- View Mode Toggle (Academic vs Simple) ---
    const globalToggle = document.getElementById('global-explain-toggle');
    const academicViews = document.querySelectorAll('.academic-text');
    const simpleViews = document.querySelectorAll('.simple-text');

    globalToggle.addEventListener('change', (e) => {
        const isSimple = e.target.checked;
        if (isSimple) {
            academicViews.forEach(el => el.classList.remove('active-view'));
            simpleViews.forEach(el => el.classList.add('active-view'));
        } else {
            simpleViews.forEach(el => el.classList.remove('active-view'));
            academicViews.forEach(el => el.classList.add('active-view'));
        }
    });

    // --- Navigation ---
    const navLinks = document.querySelectorAll('nav a');
    const sections = document.querySelectorAll('.section-container');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${entry.target.id}`) link.classList.add('active');
                });
                sections.forEach(s => s.classList.remove('active-section'));
                entry.target.classList.add('active-section');
            }
        });
    }, { threshold: 0.3 });
    sections.forEach(s => observer.observe(s));
    
    navLinks.forEach(link => link.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById(this.getAttribute('href').substring(1)).scrollIntoView({ behavior: 'smooth' });
    }));

    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', sans-serif";

    // --- 1. Data Cleaning ---
    const dontKnowSlider = document.getElementById('dont-know-slider');
    const dontKnowVal = document.getElementById('dont-know-val');
    const dataInsight = document.getElementById('data-cleaning-insight');
    const ctxData = document.getElementById('dataCleaningChart').getContext('2d');
    
    let dataChart = new Chart(ctxData, {
        type: 'doughnut',
        data: {
            labels: ['Valid Responses', "Don't Know (Friction)"],
            datasets: [{ data: [85, 15], backgroundColor: ['#3b82f6', '#f59e0b'], borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });

    dontKnowSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        dontKnowVal.textContent = val + '%';
        dataChart.data.datasets[0].data = [100 - val, val];
        dataChart.update();
        
        if(val === 0) dataInsight.innerHTML = "0% missing. This implies perfect policy clarity (unlikely).";
        else if (val < 10) dataInsight.innerHTML = `${val}% missing. Low infrastructural friction.`;
        else if (val < 30) dataInsight.innerHTML = `${val}% missing. Moderate infrastructural friction.`;
        else dataInsight.innerHTML = `${val}% missing! <strong>Warning: High infrastructural friction.</strong> Communication is failing.`;
    });

    // --- 2. Composite Scores ---
    const itemSelects = document.querySelectorAll('.item-val');
    const sumResult = document.getElementById('sum-result');
    const meanResult = document.getElementById('mean-result');

    function updateComposites() {
        let sum = 0, count = 0;
        itemSelects.forEach(s => {
            if (s.value !== "") { sum += parseInt(s.value); count++; }
        });
        if (count === 0) {
            sumResult.textContent = "-"; meanResult.textContent = "-";
        } else {
            sumResult.textContent = sum; meanResult.textContent = (sum / count).toFixed(2);
        }
    }
    itemSelects.forEach(s => s.addEventListener('change', updateComposites));
    updateComposites();

    // --- 3. Internal Consistency (Alpha vs Omega) ---
    const kSlider = document.getElementById('k-slider'), rSlider = document.getElementById('r-slider'), tauSlider = document.getElementById('tau-slider');
    const kVal = document.getElementById('k-val'), rVal = document.getElementById('r-val'), tauVal = document.getElementById('tau-val');
    const alphaPath = document.getElementById('alpha-path'), alphaDisplay = document.getElementById('alpha-display');
    const omegaPath = document.getElementById('omega-path'), omegaDisplay = document.getElementById('omega-display');
    const insightText = document.getElementById('consistency-insight');

    function calcRel() {
        const k = parseInt(kSlider.value), r = parseFloat(rSlider.value), tau = parseInt(tauSlider.value);
        kVal.textContent = k; rVal.textContent = r.toFixed(2);
        tauVal.textContent = ["None (Equal)", "Low", "Moderate", "High"][tau];

        let alpha = (k * r) / (1 + (k - 1) * r);
        let omega = alpha;

        alpha = Math.max(0, alpha - (tau * 0.12));
        omega = Math.max(0, omega - (tau * 0.02));
        alpha = Math.min(0.99, alpha); omega = Math.min(0.99, omega);

        updateDial(alphaPath, alphaDisplay, alpha);
        updateDial(omegaPath, omegaDisplay, omega);

        if (tau === 0) {
            insightText.innerHTML = "<strong>Scenario:</strong> Everyone in the choir is singing at the exact same volume (Tau-Equivalence).<br><br><strong>Outcome:</strong> Alpha and Omega agree perfectly.";
        } else if (tau === 1 || tau === 2) {
            insightText.innerHTML = "<strong>Scenario:</strong> Some singers are getting louder than others.<br><br><strong>Outcome:</strong> Alpha starts getting confused and drops its score. Omega stays relatively stable because it expects this natural variation.";
        } else {
            insightText.innerHTML = "<strong>Scenario:</strong> The sopranos are screaming, the altos are whispering. (Major violation of tau-equivalence).<br><br><strong>Outcome:</strong> Alpha falsely claims the choir is terrible. <strong>McDonald's Omega is the true score</strong>, accurately reflecting that they are still singing the same song.";
        }
    }

    function updateDial(path, display, val) {
        display.textContent = val.toFixed(2);
        path.setAttribute('stroke-dasharray', `${val * 100}, 100`);
    }

    [kSlider, rSlider, tauSlider].forEach(s => s.addEventListener('input', calcRel));
    calcRel();

    // --- 4. Factor Analysis ---
    const nSlider = document.getElementById('n-slider'), nVal = document.getElementById('n-val');
    const efaVis = document.getElementById('efa-visualization'), efaInsight = document.getElementById('efa-insight-text');

    nSlider.addEventListener('input', (e) => {
        const n = parseInt(e.target.value);
        nVal.textContent = n;
        if (n >= 80) {
            efaVis.classList.remove('locked'); efaVis.classList.add('unlocked');
            efaInsight.textContent = "N ≥ 80. The machine has enough power to sort the factors empirically!";
            efaInsight.style.color = "#10b981";
        } else {
            efaVis.classList.remove('unlocked'); efaVis.classList.add('locked');
            efaInsight.textContent = `N = ${n} is too low. The sorting machine is offline. Relying on theory.`;
            efaInsight.style.color = "#ef4444";
        }
    });

    // --- 5. Inferential Stats ---
    const ctxInf = document.getElementById('inferentialChart').getContext('2d');
    new Chart(ctxInf, {
        type: 'bar',
        data: {
            labels: ['Written Policy', 'No Policy'],
            datasets: [{ label: 'Mean Existential Friction', data: [2.8, 3.4], backgroundColor: ['#10b981', '#ef4444'], borderRadius: 4 }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 5 } }, plugins: { legend: { display: false } } }
    });
});
