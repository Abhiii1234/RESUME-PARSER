document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const matchBtn = document.getElementById('match-btn');
    const resumeText = document.getElementById('resume-text');
    const resumeFile = document.getElementById('resume-file');

    const loading = document.getElementById('loading');
    const emptyState = document.getElementById('empty-state');
    const resultsContent = document.getElementById('results-content');

    // Tabs Navigation
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(`${tab.dataset.target}-tab`).classList.add('active');
        });
    });

    // File Upload Handling
    resumeFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.name.endsWith('.txt')) {
                const reader = new FileReader();
                reader.onload = function (evt) {
                    resumeText.value = evt.target.result;
                    tabs[0].click(); // Switch to paste tab to show content
                };
                reader.readAsText(file);
            } else {
                alert("Currently only .txt files are supported through the web UI. PDF extraction happens server side in CLI.");
            }
        }
    });

    // Match Button Click
    matchBtn.addEventListener('click', async () => {
        const text = resumeText.value.trim();
        if (!text) {
            alert('Please paste or upload resume text first.');
            return;
        }

        // UI state
        emptyState.classList.add('hidden');
        resultsContent.classList.add('hidden');
        loading.classList.remove('hidden');

        try {
            const response = await fetch('/api/match', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text })
            });

            if (!response.ok) throw new Error('Failed to fetch matches');

            const data = await response.json();
            renderResults(data);
        } catch (error) {
            console.error(error);
            alert('An error occurred while matching the resume. Check console for details.');
            loading.classList.add('hidden');
            emptyState.classList.remove('hidden');
        }
    });

    function renderResults(data) {
        loading.classList.add('hidden');
        resultsContent.classList.remove('hidden');

        // Render Profile Summary
        const name = data.name || 'Anonymous';
        document.getElementById('res-name').textContent = name;
        document.getElementById('res-initials').textContent = name.substring(0, 2).toUpperCase();

        document.getElementById('res-exp').textContent = data.yearOfExperience != null ? `${data.yearOfExperience} Years Exp` : 'Exp N/A';
        document.getElementById('res-sal').textContent = data.salary ? data.salary : 'Salary N/A';

        // Render Skills
        const skillsContainer = document.getElementById('res-skills');
        skillsContainer.innerHTML = '';

        if (data.resumeSkills && data.resumeSkills.length > 0) {
            data.resumeSkills.forEach(skill => {
                const span = document.createElement('span');
                span.className = 'skill-tag';
                span.textContent = skill;
                skillsContainer.appendChild(span);
            });
        } else {
            skillsContainer.innerHTML = '<span style="color:var(--text-secondary);font-size:0.9rem;">No tech skills identified</span>';
        }

        // Render Jobs
        const jobsList = document.getElementById('jobs-list');
        jobsList.innerHTML = '';

        if (data.matchingJobs && data.matchingJobs.length > 0) {
            data.matchingJobs.forEach((job, index) => {
                const card = document.createElement('div');
                card.className = 'job-card';
                card.style.animationDelay = `${index * 0.1}s`;

                // Skill analysis tags
                let skillsHtml = '';
                if (job.skillsAnalysis) {
                    skillsHtml = job.skillsAnalysis.map(s => {
                        const statusClass = s.presentInResume ? 'match' : 'miss';
                        const icon = s.presentInResume ? '✓' : '×';
                        return `<span class="jd-skill ${statusClass}">${icon} ${s.skill}</span>`;
                    }).join('');
                }

                const scoreColor = job.matchingScore > 75 ? 'var(--success-color)' : (job.matchingScore > 50 ? 'var(--warning-color)' : 'var(--danger-color)');

                card.innerHTML = `
          <div class="job-header">
            <div>
              <div class="job-title">${job.role}</div>
              <div class="job-salary">${job.salary || 'Salary not specified'}</div>
            </div>
            <div class="job-score" style="color: ${scoreColor}">${job.matchingScore.toFixed(0)}%</div>
          </div>
          <div class="score-progress">
            <div class="score-bar" style="width: 0%; background: ${scoreColor}"></div>
          </div>
          <p class="job-meta">${job.summary || ''}</p>
          <div class="job-skills">
            ${skillsHtml}
          </div>
        `;

                jobsList.appendChild(card);

                // Trigger animation
                setTimeout(() => {
                    const bar = card.querySelector('.score-bar');
                    if (bar) bar.style.width = `${job.matchingScore}%`;
                }, 100);
            });
        } else {
            jobsList.innerHTML = '<p>No jobs found.</p>';
        }
    }

    // Set default theme (dark)
    document.documentElement.setAttribute('data-theme', 'dark');
});
