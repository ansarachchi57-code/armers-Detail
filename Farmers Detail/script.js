document.addEventListener('DOMContentLoaded', () => {
    // Data Storage
    let db = JSON.parse(localStorage.getItem('farmer_db')) || {
        farmers: [],
        paddy_fields: [],
        society: {
            president: { name: '', tel: '' },
            secretary: { name: '', tel: '' },
            treasurer: { name: '', tel: '' },
            general: { area: '', officer: '', owner: '' }
        },
        notices: [],
        gallery: [],
        finance: { transactions: [] },
        logo: null
    };

    // Migration for existing data
    if (!db.finance) db.finance = { transactions: [] };
    if (!db.finance.transactions) db.finance.transactions = [];
    if (!db.society) db.society = { president: {}, secretary: {}, treasurer: {}, general: {} };
    if (!db.society.general) db.society.general = {};

    // UI Elements
    const sections = document.querySelectorAll('.section');
    const navBtns = document.querySelectorAll('.nav-btn');
    const farmerForm = document.getElementById('farmer-form');
    const farmerSelect = document.getElementById('paddy-farmer-select');
    const paddyFormBtn = document.getElementById('add-paddy-btn');
    const summaryList = document.getElementById('summary-list');
    const logoUpload = document.getElementById('logo-upload');
    const logoPreview = document.getElementById('logo-preview');
    const noticeList = document.getElementById('notice-list');
    const galleryContainer = document.getElementById('gallery-container');
    const saveAllBtn = document.getElementById('save-all-btn');

    // New Search UI Elements
    const farmerSearch = document.getElementById('farmer-search');
    const searchResults = document.getElementById('search-results');
    const farmerIdInput = document.getElementById('f-id');
    const formTitle = document.getElementById('form-title');
    const farmerSubmitBtn = document.getElementById('farmer-submit-btn');
    const clearFormBtn = document.getElementById('clear-form-btn');

    // Section Switching
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const sectionId = btn.getAttribute('data-section');
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            sections.forEach(s => {
                s.classList.remove('active');
                if (s.id === sectionId) s.classList.add('active');
            });
            renderData(); // Refresh view on switch
        });
    });

    logoUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                db.logo = event.target.result;
                logoPreview.src = db.logo;
                updateFavicon(db.logo);
                saveData();
            };
            reader.readAsDataURL(file);
        }
    });

    function updateFavicon(url) {
        let link = document.getElementById('dynamic-favicon');
        if (link) link.href = url;
    }

    // Farmer Form Submission
    farmerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const farmerId = farmerIdInput.value;
        const farmer = {
            id: farmerId ? parseInt(farmerId) : Date.now(),
            name: document.getElementById('f-name').value,
            dob: document.getElementById('f-dob').value,
            nic: document.getElementById('f-nic').value,
            address: document.getElementById('f-address').value,
            telMain: document.getElementById('f-tel-main').value,
            telAlt: [
                document.getElementById('f-tel-1').value
            ],
            membershipFee: parseFloat(document.getElementById('f-membership-fee').value) || 120,
            paidYears: document.getElementById('f-paid-years').value.split(',').map(y => y.trim()).filter(y => y),
            bank: {
                name: document.getElementById('f-bank-name').value,
                branch: document.getElementById('f-bank-branch').value,
                acc: document.getElementById('f-bank-acc').value,
                id: document.getElementById('f-bank-id').value
            }
        };

        if (farmerId) {
            const index = db.farmers.findIndex(f => f.id == farmerId);
            if (index !== -1) db.farmers[index] = farmer;
            alert('ගොවි විස්තර සාර්ථකව යාවත්කාලීන කරන ලදී!');
        } else {
            db.farmers.push(farmer);
            alert('ගොවි විස්තර සාර්ථකව ඇතුළත් කරන ලදී!');
        }

        saveData();
        clearForm();
        renderData();
    });

    function clearForm() {
        farmerForm.reset();
        farmerIdInput.value = '';
        formTitle.innerHTML = `ගොවි විස්තර පෝරමය`;
        farmerSubmitBtn.innerHTML = `<i class="fas fa-plus"></i> ගොවි ගිණුම එක් කරන්න`;
        clearFormBtn.style.display = 'none';
        
        // Reset paddy fields too
        document.getElementById('p-name').value = '';
        document.getElementById('p-size').value = '';
        document.getElementById('p-variety').value = '';
        document.getElementById('f-membership-fee').value = '120';
        document.getElementById('f-paid-years').value = '';
        farmerSelect.value = '';
    }

    clearFormBtn.addEventListener('click', clearForm);

    // Search Logic
    farmerSearch.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        if (!query) {
            searchResults.style.display = 'none';
            return;
        }

        const filtered = db.farmers.filter(f => {
            const paddy = db.paddy_fields.find(p => p.farmerId == f.id);
            return f.name.toLowerCase().includes(query) || 
                   f.nic.toLowerCase().includes(query) || 
                   (paddy && paddy.name.toLowerCase().includes(query));
        });

        if (filtered.length > 0) {
            searchResults.innerHTML = filtered.map(f => {
                const paddy = db.paddy_fields.find(p => p.farmerId == f.id);
                return `
                    <div class="search-item" onclick="loadFarmer(${f.id})">
                        <strong>${f.name}</strong>
                        <small>NIC: ${f.nic}</small>
                        ${paddy ? `<br><span class="field-info">කුඹුර: ${paddy.name}</span>` : ''}
                    </div>
                `;
            }).join('');
            searchResults.style.display = 'block';
        } else {
            searchResults.style.display = 'none';
        }
    });

    document.addEventListener('click', (e) => {
        if (!farmerSearch.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });

    window.loadFarmer = (id) => {
        const farmer = db.farmers.find(f => f.id == id);
        if (!farmer) return;

        farmerIdInput.value = farmer.id;
        document.getElementById('f-name').value = farmer.name;
        document.getElementById('f-dob').value = farmer.dob;
        document.getElementById('f-nic').value = farmer.nic;
        document.getElementById('f-address').value = farmer.address;
        document.getElementById('f-tel-main').value = farmer.telMain;
        document.getElementById('f-tel-1').value = farmer.telAlt[0] || '';
        document.getElementById('f-membership-fee').value = farmer.membershipFee || 120;
        document.getElementById('f-paid-years').value = (farmer.paidYears || []).join(', ');
        document.getElementById('f-bank-name').value = farmer.bank.name;
        document.getElementById('f-bank-branch').value = farmer.bank.branch;
        document.getElementById('f-bank-acc').value = farmer.bank.acc;
        document.getElementById('f-bank-id').value = farmer.bank.id;

        // Also load Paddy info
        farmerSelect.value = id;
        const paddy = db.paddy_fields.find(p => p.farmerId == id);
        if (paddy) {
            document.getElementById('p-name').value = paddy.name;
            document.getElementById('p-size').value = paddy.size;
            document.getElementById('p-variety').value = paddy.variety;
        } else {
            document.getElementById('p-name').value = '';
            document.getElementById('p-size').value = '';
            document.getElementById('p-variety').value = '';
        }

        formTitle.innerHTML = `<i class="fas fa-edit"></i> ගොවි විස්තර යාවත්කාලීන කිරීම`;
        farmerSubmitBtn.innerHTML = `<i class="fas fa-save"></i> විස්තර යාවත්කාලීන කරන්න`;
        clearFormBtn.style.display = 'inline-flex';
        
        searchResults.style.display = 'none';
        farmerSearch.value = '';
        
        // Switch to farmers section if not already there
        document.querySelector('[data-section="farmers"]').click();
        
        // Scroll to form
        document.getElementById('farmer-form').scrollIntoView({ behavior: 'smooth' });
    };

    // Paddy Field Logic
    paddyFormBtn.addEventListener('click', () => {
        const farmerId = farmerSelect.value;
        if (!farmerId) return alert('ප්‍රථමයෙන් ගොවියෙකු තෝරන්න');

        const paddy = {
            farmerId: farmerId,
            name: document.getElementById('p-name').value,
            size: document.getElementById('p-size').value,
            variety: document.getElementById('p-variety').value
        };

        const existingPaddyIndex = db.paddy_fields.findIndex(p => p.farmerId == farmerId);
        if (existingPaddyIndex !== -1) {
            db.paddy_fields[existingPaddyIndex] = paddy;
            alert('කුඹුරු විස්තර සාර්ථකව යාවත්කාලීන කරන ලදී');
        } else {
            db.paddy_fields.push(paddy);
            alert('කුඹුරු විස්තර සාර්ථකව සුරැකින ලදී');
        }
        
        saveData();
        renderData();
    });

    // Editable Title
    const headerTitle = document.getElementById('header-title');
    headerTitle.contentEditable = true;
    headerTitle.addEventListener('blur', () => {
        db.title = headerTitle.innerText;
        saveData();
    });

    // Society Logic - Sync inputs on change
    ['soc-pres-name', 'soc-pres-tel', 'soc-sec-name', 'soc-sec-tel', 'soc-tre-name', 'soc-tre-tel', 'area-input', 'officer-name', 'owner-name'].forEach(id => {
        document.getElementById(id).addEventListener('change', (e) => {
            updateSocietyData();
        });
    });

    function updateSocietyData() {
        db.society.president = { name: document.getElementById('soc-pres-name').value, tel: document.getElementById('soc-pres-tel').value };
        db.society.secretary = { name: document.getElementById('soc-sec-name').value, tel: document.getElementById('soc-sec-tel').value };
        db.society.treasurer = { name: document.getElementById('soc-tre-name').value, tel: document.getElementById('soc-tre-tel').value };
        db.society.general = {
            area: document.getElementById('area-input').value,
            officer: document.getElementById('officer-name').value,
            owner: document.getElementById('owner-name').value
        };
        saveData();
    }

    // Notice Board Logic
    document.getElementById('post-notice').addEventListener('click', () => {
        const msg = document.getElementById('notice-msg').value;
        if (!msg) return;
        db.notices.unshift({ id: Date.now(), text: msg, date: new Date().toLocaleString() });
        saveData();
        document.getElementById('notice-msg').value = '';
        renderData();
    });

    // WhatsApp Logic
    document.getElementById('send-all-wa').addEventListener('click', () => {
        const msg = document.getElementById('notice-msg').value;
        if (!msg) return alert('ප්‍රථමයෙන් පණිවිඩයක් ලියන්න');
        
        if (db.farmers.length === 0) return alert('පණිවිඩය යැවීමට ගොවීන් නොමැත');
        
        // Open the first farmer's WA as a start, or suggest using the list
        const firstFarmer = db.farmers[0];
        const waLink = `https://wa.me/${firstFarmer.telMain.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
        window.open(waLink, '_blank');
        
        // Also open for officers if requested
        if (confirm('සමිතියේ නිලධාරීන්ටත් මෙම පණිවිඩය යැවීමට අවශ්‍යද?')) {
            const officer = db.society.president;
            if (officer && officer.tel) {
                setTimeout(() => {
                    const offLink = `https://wa.me/${officer.tel.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
                    window.open(offLink, '_blank');
                }, 1000);
            }
        }

        alert(`පණිවිඩය යැවීම ආරම්භ විය. වගුවේ ඇති WhatsApp බොත්තම් මගින් අනෙක් අයටද යැවිය හැක.`);
    });

    document.getElementById('send-officers-wa').addEventListener('click', () => {
        const msg = document.getElementById('notice-msg').value;
        if (!msg) return alert('ප්‍රථමයෙන් පණිවිඩයක් ලියන්න');

        const officerTels = [
            db.society.president?.tel,
            db.society.secretary?.tel,
            db.society.treasurer?.tel
        ].filter(t => t);

        if (officerTels.length === 0) return alert('නිලධාරීන්ගේ WhatsApp අංක කිසිවක් හමු නොවීය');

        const waLink = `https://wa.me/${officerTels[0].replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
        window.open(waLink, '_blank');
        alert(`${db.society.president?.name || 'නිලධාරී'} සඳහා WhatsApp විවෘත විය.`);
    });

    // Photo Gallery Logic
    document.getElementById('upload-gal-btn')?.addEventListener('click', () => {
        const photoFile = document.getElementById('gal-photo').files[0];
        const eventName = document.getElementById('gal-event').value;
        const eventDate = document.getElementById('gal-date').value;

        if (!photoFile || !eventName || !eventDate) return alert('කරුණාකර සියලු විස්තර පුරවන්න');

        const reader = new FileReader();
        reader.onload = (event) => {
            db.gallery.push({
                image: event.target.result,
                name: eventName,
                date: eventDate
            });
            saveData();
            renderData();
        };
        reader.readAsDataURL(photoFile);
    });

    // Finance Logic
    document.getElementById('add-income-btn')?.addEventListener('click', () => {
        const source = document.getElementById('inc-source').value;
        const amount = parseFloat(document.getElementById('inc-amount').value);
        const date = document.getElementById('inc-date').value || new Date().toISOString().split('T')[0];

        if (!amount) return alert('කරුණාකර මුදල ඇතුළත් කරන්න');

        db.finance.transactions.unshift({
            id: Date.now(),
            type: 'income',
            category: source,
            amount: amount,
            date: date,
            desc: `ආදායම: ${source}`
        });

        saveData();
        renderData();
        document.getElementById('inc-amount').value = '';
    });

    document.getElementById('add-expense-btn')?.addEventListener('click', () => {
        const category = document.getElementById('exp-category').value;
        const amount = parseFloat(document.getElementById('exp-amount').value);
        const date = document.getElementById('exp-date').value || new Date().toISOString().split('T')[0];

        if (!amount) return alert('කරුණාකර මුදල ඇතුළත් කරන්න');

        db.finance.transactions.unshift({
            id: Date.now(),
            type: 'expense',
            category: category,
            amount: amount,
            date: date,
            desc: `වියදම: ${category}`
        });

        saveData();
        renderData();
        document.getElementById('exp-amount').value = '';
    });

    window.removeTransaction = (id) => {
        if (!confirm('මෙම ගනුදෙනුව ඉවත් කිරීමට අවශ්‍ය බව සහතිකද?')) return;
        db.finance.transactions = db.finance.transactions.filter(t => t.id !== id);
        saveData();
        renderData();
    };

    function calculateArrears(farmer) {
        const currentYear = new Date().getFullYear();
        const startYear = 2022;
        const fee = farmer.membershipFee || 120;
        const paidYears = (farmer.paidYears || []).map(y => parseInt(y));
        
        let unpaidYears = [];
        let totalArrears = 0;
        
        for (let y = startYear; y <= currentYear; y++) {
            if (!paidYears.includes(y)) {
                unpaidYears.push(y);
                totalArrears += fee;
            }
        }
        
        return {
            unpaid: unpaidYears,
            total: totalArrears
        };
    }

    // Data Management
    function saveData() {
        localStorage.setItem('farmer_db', JSON.stringify(db));
    }

    function renderData() {
        if (db.title) headerTitle.innerText = db.title;

        // Init society fields if they exist
        if (db.society) {
            document.getElementById('soc-pres-name').value = db.society.president?.name || '';
            document.getElementById('soc-pres-tel').value = db.society.president?.tel || '';
            document.getElementById('soc-sec-name').value = db.society.secretary?.name || '';
            document.getElementById('soc-sec-tel').value = db.society.secretary?.tel || '';
            document.getElementById('soc-tre-name').value = db.society.treasurer?.name || '';
            document.getElementById('soc-tre-tel').value = db.society.treasurer?.tel || '';
            document.getElementById('area-input').value = db.society.general?.area || '';
            document.getElementById('officer-name').value = db.society.general?.officer || '';
            document.getElementById('owner-name').value = db.society.general?.owner || '';
        }

        // Logo
        if (db.logo) {
            logoPreview.src = db.logo;
            updateFavicon(db.logo);
        }

        // Render Summary Table
        summaryList.innerHTML = '';
        db.farmers.forEach(f => {
            const paddy = db.paddy_fields.find(p => p.farmerId == f.id) || { name: 'නැත' };
            const arrearsInfo = calculateArrears(f);
            const arrearsText = arrearsInfo.total > 0 
                ? `<span style="color:#c62828; font-weight:bold;">Rs. ${arrearsInfo.total} (${arrearsInfo.unpaid.join(', ')})</span>`
                : `<span style="color:#2e7d32; font-weight:bold;">ගෙවා ඇත</span>`;

            const row = `
                <tr>
                    <td>
                        ${f.name}
                        ${arrearsInfo.total > 0 ? '<i class="fas fa-exclamation-circle" style="color:#f44336; margin-left:5px;" title="හිඟ මුදල් ඇත"></i>' : '<i class="fas fa-check-circle" style="color:#4caf50; margin-left:5px;"></i>'}
                    </td>
                    <td>${paddy.name}</td>
                    <td>${arrearsText}</td>
                    <td>${f.telMain}</td>
                    <td>
                        <button onclick="loadFarmer(${f.id})" style="background:none;border:none;color:var(--primary-color);cursor:pointer;margin-right:10px;"><i class="fas fa-edit"></i></button>
                        <a href="https://wa.me/${f.telMain.replace(/\D/g, '')}" class="btn-whatsapp" target="_blank" style="padding: 5px 10px;"><i class="fab fa-whatsapp"></i></a>
                        <button onclick="removeFarmer(${f.id})" style="background:none;border:none;color:red;cursor:pointer;margin-left:10px;"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
            summaryList.insertAdjacentHTML('beforeend', row);
        });

        // Render Officers Summary on Home Page
        const offSummary = document.getElementById('officers-summary');
        if (offSummary && db.society) {
            const officers = [
                { role: 'සභාපති', ...db.society.president },
                { role: 'ලේකම්', ...db.society.secretary },
                { role: 'භාණ්ඩාගාරික', ...db.society.treasurer }
            ];
            offSummary.innerHTML = officers.map(o => `
                <div class="officer-item">
                    <div class="officer-info">
                        <b>${o.role}:</b> ${o.name || '---'}<br>
                        <span><i class="fas fa-phone"></i> ${o.tel || '---'}</span>
                    </div>
                    ${o.tel ? `<a href="https://wa.me/${o.tel.replace(/\D/g, '')}" class="btn-whatsapp" target="_blank" style="padding: 8px 12px;"><i class="fab fa-whatsapp"></i></a>` : ''}
                </div>
            `).join('');
        }

        // Render Finance Section
        if (db.finance) {
            const financeList = document.getElementById('finance-list');
            if (financeList) {
                financeList.innerHTML = '';
                let totalInc = 0;
                let totalExp = 0;

                // Sync Membership Income from Farmers
                let membershipTotal = 0;
                db.farmers.forEach(f => {
                    const paidCount = (f.paidYears || []).length;
                    membershipTotal += paidCount * (f.membershipFee || 120);
                });

                db.finance.transactions.forEach(t => {
                    if (t.type === 'income') totalInc += t.amount;
                    else totalExp += t.amount;

                    const row = `
                        <tr>
                            <td>${t.date}</td>
                            <td>${t.desc}</td>
                            <td>${t.type === 'income' ? 'ආදායම' : 'වියදම'}</td>
                            <td style="color: ${t.type === 'income' ? '#2e7d32' : '#c62828'}; font-weight:bold;">
                                ${t.type === 'income' ? '+' : '-'} Rs. ${t.amount.toFixed(2)}
                            </td>
                            <td>
                                <button onclick="removeTransaction(${t.id})" style="background:none;border:none;color:red;cursor:pointer;"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    `;
                    financeList.insertAdjacentHTML('beforeend', row);
                });

                // Add Membership income to summary (not as a separate transaction for now to avoid duplicates, but can be done)
                // Actually it's better to show it in the summary totals
                const combinedIncome = totalInc + membershipTotal;
                
                document.getElementById('total-income').innerText = `Rs. ${combinedIncome.toFixed(2)}`;
                document.getElementById('total-expense').innerText = `Rs. ${totalExp.toFixed(2)}`;
                document.getElementById('current-balance').innerText = `Rs. ${(combinedIncome - totalExp).toFixed(2)}`;
            }
        }

        // Update Paddy Select
        farmerSelect.innerHTML = '<option value="">ගොවියෙකු තෝරන්න</option>';
        db.farmers.forEach(f => {
            farmerSelect.insertAdjacentHTML('beforeend', `<option value="${f.id}">${f.name}</option>`);
        });

        // Render Notices
        noticeList.innerHTML = '';
        db.notices.forEach(n => {
            const item = `
                <div class="notice-item">
                    <small>${n.date}</small>
                    <p>${n.text}</p>
                </div>
            `;
            noticeList.insertAdjacentHTML('beforeend', item);
        });

        // Render Gallery
        galleryContainer.innerHTML = '';
        db.gallery.forEach((g, index) => {
            const item = `
                <div class="gallery-item">
                    <button class="delete-gal-btn" onclick="removeGalleryItem(${index})"><i class="fas fa-trash"></i></button>
                    <img src="${g.image}" alt="Event Photo">
                    <div class="gallery-info">
                        <strong>${g.name}</strong><br>
                        <small>${g.date}</small>
                    </div>
                </div>
            `;
            galleryContainer.insertAdjacentHTML('beforeend', item);
        });
    }

    window.removeGalleryItem = (index) => {
        if (!confirm('මෙම ඡායාරූපය ඉවත් කිරීමට ඔබට අවශ්‍යද?')) return;
        db.gallery.splice(index, 1);
        saveData();
        renderData();
    };

    // Exported function for deleting (simplified for demo)
    window.removeFarmer = (id) => {
        if (!confirm('මෙම වාර්තාව ඉවත් කිරීමට ඔබට අවශ්‍ය බව සහතිකද?')) return;
        db.farmers = db.farmers.filter(f => f.id !== id);
        db.paddy_fields = db.paddy_fields.filter(p => p.farmerId != id);
        saveData();
        renderData();
    };

    saveAllBtn.addEventListener('click', () => {
        saveData();
        alert('සියලුම දත්ත සාර්ථකව සුරැකින ලදී.');
    });

    renderData();
});

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
    });
}

// Add Install Prompt Logic
let deferredPrompt;
const installBtnArea = document.getElementById('header-action-area');

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the default browser prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    
    // Create an install button
    if (!document.getElementById('install-pwa-btn')) {
        const installBtn = document.createElement('button');
        installBtn.id = 'install-pwa-btn';
        installBtn.className = 'btn-primary';
        installBtn.style.background = '#1b5e20';
        installBtn.innerHTML = '<i class="fas fa-download"></i> ඇප් එක ස්ථාපනය කරන්න';
        installBtn.style.marginLeft = '10px';
        
        installBtn.addEventListener('click', () => {
            // Show the install prompt
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                }
                deferredPrompt = null;
                installBtn.remove();
            });
        });
        
        if (installBtnArea) installBtnArea.appendChild(installBtn);
    }
});

window.addEventListener('appinstalled', (event) => {
    console.log('App was installed.');
    if (document.getElementById('install-pwa-btn')) {
        document.getElementById('install-pwa-btn').remove();
    }
});
