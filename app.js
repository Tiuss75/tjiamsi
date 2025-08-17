import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, signInAnonymously, createUserWithEmailAndPassword, updateProfile, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp, increment } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
        import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-functions.js";

        // =========================================================================
        // PENTING: Ganti konfigurasi di bawah ini dengan konfigurasi dari proyek
        // Firebase Anda (siamsi-3dd65)
        // =========================================================================
       const firebaseConfig = {
  apiKey: "AIzaSyA93UxOEya10fRfOPpbOT4PfSmA_aaQx-E",
  authDomain: "siamsi-3dd65.firebaseapp.com",
  projectId: "siamsi-3dd65",
  storageBucket: "siamsi-3dd65.firebasestorage.app",
  messagingSenderId: "675720995739",
  appId: "1:675720995739:web:1af5223781df968289373e",
  measurementId: "G-P5TVSQ6V7X"
};

        // =========================================================================

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        setPersistence(auth, browserLocalPersistence);
        const db = getFirestore(app);
        const functions = getFunctions(app);
        const createTransaction = httpsCallable(functions, 'createMidtransTransaction');

        // === DOM Elements ===
        const appContainer = document.getElementById('appContainer');
        const adminLoginSection = document.getElementById('adminLoginSection');
        const adminCmsSection = document.getElementById('adminCmsSection');
        const nameInput = document.getElementById('nameInput');
        const shakeBtn = document.getElementById('shakeBtn');
        const throwBtn = document.getElementById('throwBtn');
        const predictionResult = document.getElementById('predictionResult');
        const resultNumber = document.getElementById('resultNumber');
        const resultDewa = document.getElementById('resultDewa');
        const sinthioText = document.getElementById('sinthioText');
        const syairText = document.getElementById('syairText');
        const selayangPandangText = document.getElementById('selayangPandangText');
        const pedomanList = document.getElementById('pedomanList');
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const ramalanNumberSelect = document.getElementById('ramalanNumberSelect');
        const dewaInput = document.getElementById('dewaInput');
        const sinthioInput = document.getElementById('sinthioInput');
        const syairInput = document.getElementById('syairInput');
        const selayangPandangInput = document.getElementById('selayangPandangInput');
        const pedomanInput = document.getElementById('pedomanInput');
        const saveBtn = document.getElementById('saveBtn');
        const paymentPopup = document.getElementById('paymentPopup');
        const confirmPaymentPopup = document.getElementById('confirmPaymentPopup');
        const messagePopup = document.getElementById('messagePopup');
        const goToPaymentBtn = document.getElementById('goToPayment');
        const registrationPopup = document.getElementById('registrationPopup');
        const registerBtn = document.getElementById('registerBtn');
        const loginAndPayBtn = document.getElementById('loginAndPayBtn');
        const cancelRegistrationBtn = document.getElementById('cancelRegistrationBtn');
        const authError = document.getElementById('authError');
        const shakeResult = document.getElementById('shakeResult');
        const predictionNumber = document.getElementById('predictionNumber');
        const throwResult = document.getElementById('throwResult');
        const throwResultText = document.getElementById('throwResultText');
        const ciamsiContainer = document.getElementById('ciamsiContainer');
        const fallingStick = document.getElementById('fallingStick');
        const puakpois = [document.getElementById('puakpoi1'), document.getElementById('puakpoi2')];
        const throwCountElement = document.getElementById('throwCount');
        const closePaymentPopup = document.getElementById('closePaymentPopup');
        const confirmRealPayment = document.getElementById('confirmRealPayment');
        const cancelConfirm = document.getElementById('cancelConfirm');
        const messageTitle = document.getElementById('messageTitle');
        const messageText = document.getElementById('messageText');
        const closeMessageBtn = document.getElementById('closeMessageBtn');
        const termsPopup = document.getElementById('termsPopup');
        const privacyPopup = document.getElementById('privacyPopup');
        const termsLink = document.getElementById('termsLink');
        const privacyLink = document.getElementById('privacyLink');
        const closePopupBtns = document.querySelectorAll('.close-popup-btn');
        const priceDisplay = document.getElementById('priceDisplay');
        const attemptsDisplay = document.getElementById('attemptsDisplay');
        const whatsappShareBtn = document.getElementById('whatsappShare');
        const downloadBtn = document.getElementById('downloadBtn');

        // === App State ===
        let currentUser = null;
        let isUserAdmin = false;
        let currentPredictionNumberState = null;
        let throwCount = 0;
        const maxThrowsFree = 3;
        let isPremiumUser = false;
        let freeAttemptsLeft = 2;
        let selectedPackage = null;
        let unsubscribeUserListener = null;

        // === Functions ===
        function showMessage(title, text) {
            messageTitle.textContent = title;
            messageText.textContent = text;
            messagePopup.classList.remove('hidden');
        }

        closeMessageBtn.addEventListener('click', () => messagePopup.classList.add('hidden'));

        async function setupUserAndListener(user) {
            if (unsubscribeUserListener) unsubscribeUserListener();
            
            currentUser = user;
            const userDocRef = doc(db, "users", user.uid);
            
            unsubscribeUserListener = onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    isUserAdmin = data.role === 'admin';
                    isPremiumUser = data.isPremium === true;
                    freeAttemptsLeft = data.freeAttemptsLeft ?? 2;
                    if (data.displayName && data.displayName !== 'Anonymous User' && !nameInput.value) {
                        nameInput.value = data.displayName;
                    }
                } else {
                    isUserAdmin = false;
                    isPremiumUser = false;
                    freeAttemptsLeft = 2;
                }
                updateUIBasedOnUserState();
            });
        }
        
        function updateUIBasedOnUserState() {
            const canShake = nameInput.value.trim() !== '' && (isPremiumUser || freeAttemptsLeft > 0 || isUserAdmin);
            shakeBtn.disabled = !canShake;
        }

        onAuthStateChanged(auth, (user) => {
            if (user) {
                setupUserAndListener(user);
            } else {
                signInAnonymously(auth).catch(error => {
                    console.error("Gagal login anonim:", error);
                    showMessage('Error Kritis', 'Gagal memuat sesi Anda. Coba refresh halaman.');
                });
            }
        });

        // CMS Logic
        function checkUrlHash() {
            if (window.location.hash !== '#admin') return;
            appContainer.classList.add('hidden');
            if (isUserAdmin) {
                adminCmsSection.classList.remove('hidden');
                adminLoginSection.classList.add('hidden');
                initCms();
            } else {
                adminLoginSection.classList.remove('hidden');
                adminCmsSection.classList.add('hidden');
            }
        }
        
        window.addEventListener('hashchange', checkUrlHash);
        document.addEventListener('DOMContentLoaded', checkUrlHash);

        loginBtn.addEventListener('click', () => {
            const email = document.getElementById('adminEmail').value;
            const password = document.getElementById('adminPassword').value;
            signInWithEmailAndPassword(auth, email, password).catch(error => showMessage('Login Gagal', error.message));
        });

        logoutBtn.addEventListener('click', () => signOut(auth).then(() => { window.location.hash = ''; }));

        async function initCms() {
            if (ramalanNumberSelect.options.length > 0) return;
            for (let i = 1; i <= 100; i++) ramalanNumberSelect.add(new Option(`Nomor ${i}`, i));
            loadRamalanData(1);
        }

        ramalanNumberSelect.addEventListener('change', (e) => loadRamalanData(e.target.value));

        async function loadRamalanData(number) {
            try {
                const docRef = doc(db, "ramalan", String(number));
                const docSnap = await getDoc(docRef);
                const fields = { dewa: dewaInput, sinthio: sinthioInput, syair: syairInput, selayangPandang: selayangPandangInput };
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    for (const key in fields) fields[key].value = data[key] || '';
                    pedomanInput.value = (data.pedoman || []).join('\n');
                } else {
                    for (const key in fields) fields[key].value = '';
                    pedomanInput.value = '';
                }
            } catch (error) {
                console.error("Gagal memuat data ramalan:", error);
                showMessage('Error', 'Gagal memuat data ramalan.');
            }
        }

        saveBtn.addEventListener('click', async () => {
            const number = ramalanNumberSelect.value;
            const dataToSave = {
                nomor: parseInt(number),
                dewa: dewaInput.value.trim(),
                sinthio: sinthioInput.value.trim(),
                syair: syairInput.value.trim(),
                selayangPandang: selayangPandangInput.value.trim(),
                pedoman: pedomanInput.value.split('\n').filter(line => line.trim() !== '')
            };
            try {
                await setDoc(doc(db, "ramalan", number), dataToSave);
                showMessage('Sukses', `Data untuk nomor ${number} berhasil disimpan.`);
            } catch (error) {
                showMessage('Error', 'Gagal menyimpan data.');
            }
        });

        // Main App Logic
        function resetState() {
            throwCount = 0;
            throwCountElement.textContent = throwCount;
            throwBtn.disabled = true;
            shakeResult.classList.add('hidden');
            throwResult.classList.add('hidden');
            predictionResult.classList.add('hidden');
            puakpois.forEach(p => p.textContent = '-');
            currentPredictionNumberState = null;
            updateUIBasedOnUserState();
        }

        nameInput.addEventListener('input', () => {
            if (predictionResult.classList.contains('hidden')) updateUIBasedOnUserState();
        });

        shakeBtn.addEventListener('click', () => {
            if (!isPremiumUser && freeAttemptsLeft <= 0 && !isUserAdmin) {
                paymentPopup.classList.remove('hidden');
                return;
            }
            resetState();
            ciamsiContainer.classList.add('shake-animation');
            fallingStick.className = 'falling-stick';
            setTimeout(() => {
                ciamsiContainer.classList.remove('shake-animation');
                fallingStick.classList.add('fall-animation');
                const randomNumber = Math.floor(Math.random() * 100) + 1;
                predictionNumber.textContent = randomNumber;
                currentPredictionNumberState = randomNumber;
                shakeResult.classList.remove('hidden');
                throwBtn.disabled = false;
            }, 800);
        });

        throwBtn.addEventListener('click', async () => {
            throwBtn.disabled = true;
            throwCount++;
            throwCountElement.textContent = throwCount;
            puakpois.forEach(poi => poi.classList.add('throw-animation'));
            setTimeout(() => puakpois.forEach(p => p.classList.remove('throw-animation')), 800);

            setTimeout(async () => {
                const result1 = Math.round(Math.random());
                const result2 = Math.round(Math.random());
                puakpois[0].textContent = result1 === 0 ? '凹' : '凸';
                puakpois[1].textContent = result2 === 0 ? '凹' : '凸';
                const isConfirmed = result1 !== result2;
                throwResult.classList.remove('hidden');

                if (isConfirmed) {
                    throwResultText.textContent = 'Hasil: Direstui Dewa!';
                    await showPrediction();
                } else {
                    throwResultText.textContent = 'Hasil: Belum direstui. Coba lagi.';
                    if (isPremiumUser || throwCount < maxThrowsFree || isUserAdmin) {
                        throwBtn.disabled = false;
                    } else {
                        throwResultText.textContent = 'Batas lemparan tercapai. Silakan kocok ulang.';
                    }
                }
            }, 900);
        });

        async function showPrediction() {
            if (!currentPredictionNumberState) return;
            const docRef = doc(db, "ramalan", String(currentPredictionNumberState));
            try {
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    resultNumber.textContent = data.nomor || currentPredictionNumberState;
                    resultDewa.textContent = `Dewa: ${data.dewa || '-'}`;
                    sinthioText.textContent = data.sinthio || 'Data belum diisi.';
                    syairText.textContent = data.syair || 'Data belum diisi.';
                    selayangPandangText.textContent = data.selayangPandang || 'Data belum diisi.';
                    pedomanList.innerHTML = '';
                    (data.pedoman || []).forEach(item => {
                        const li = document.createElement('li');
                        li.textContent = item;
                        pedomanList.appendChild(li);
                    });
                    predictionResult.classList.remove('hidden');
                    shakeBtn.disabled = true;
                    if (!isPremiumUser && !isUserAdmin) {
                        await updateDoc(doc(db, "users", currentUser.uid), { freeAttemptsLeft: increment(-1) });
                    }
                } else {
                    showMessage('Data Kosong', `Data ramalan nomor ${currentPredictionNumberState} belum diisi.`);
                    resetState();
                }
            } catch (error) {
                console.error("Gagal mengambil data ramalan:", error);
                showMessage('Error', 'Gagal memuat data ramalan.');
                resetState();
}
        }
        
        // Payment and Registration Flow
        document.querySelectorAll('.package-option').forEach(pkg => {
            pkg.addEventListener('click', () => {
                selectedPackage = {
                    attempts: parseInt(pkg.getAttribute('data-attempts')),
                    price: parseInt(pkg.getAttribute('data-price'))
                };
                priceDisplay.textContent = selectedPackage.price.toLocaleString();
                attemptsDisplay.textContent = selectedPackage.attempts;
                paymentPopup.classList.add('hidden');
                if (currentUser && !currentUser.isAnonymous) {
                    confirmPaymentPopup.classList.remove('hidden');
                } else {
                    registrationPopup.classList.remove('hidden');
                }
            });
        });

        const handleAuthSuccess = async (userCredential) => {
            const user = userCredential.user;
            const userDocRef = doc(db, "users", user.uid);
            await setDoc(userDocRef, {
                displayName: user.displayName,
                email: user.email,
                isPremium: false,
                freeAttemptsLeft: maxThrowsFree,
                createdAt: serverTimestamp(),
                provider: 'email'
            }, { merge: true });
            
            registrationPopup.classList.add('hidden');
            confirmPaymentPopup.classList.remove('hidden');
            authError.style.display = 'none';
        };
        
        const handleAuthError = (error) => {
            authError.style.display = 'block';
            authError.textContent = 'Terjadi kesalahan. Coba lagi.';
        };

        registerBtn.addEventListener('click', async () => {
            const name = document.getElementById('regName').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;
            if (!name || !email || !password) return showMessage('Data Tidak Lengkap', 'Harap isi semua field.');
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(userCredential.user, { displayName: name });
                await handleAuthSuccess(userCredential);
            } catch (error) { handleAuthError(error); }
        });

        loginAndPayBtn.addEventListener('click', async () => {
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;
            if (!email || !password) return showMessage('Data Tidak Lengkap', 'Harap isi email dan password.');
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                await handleAuthSuccess(userCredential);
            } catch (error) { handleAuthError(error); }
        });
        
        cancelRegistrationBtn.addEventListener('click', () => {
            registrationPopup.classList.add('hidden');
            paymentPopup.classList.remove('hidden');
            authError.style.display = 'none';
        });

        confirmRealPayment.addEventListener('click', async () => {
            const userName = nameInput.value.trim();
            if (!userName) {
                showMessage('Peringatan', 'Harap isi "Nama Lengkap" Anda di halaman utama.');
                confirmPaymentPopup.classList.add('hidden');
                return; 
            }
            const btn = confirmRealPayment;
            btn.disabled = true;
            btn.textContent = "Memproses...";
            try {
                const result = await createTransaction({ name: userName, price: selectedPackage.price, attempts: selectedPackage.attempts });
                window.snap.pay(result.data.token, {
                    onSuccess: () => { showMessage('Sukses', 'Pembayaran berhasil!'); confirmPaymentPopup.classList.add('hidden'); resetState(); },
                    onPending: () => showMessage('Pending', 'Menunggu konfirmasi pembayaran.'),
                    onError: () => showMessage('Gagal', 'Pembayaran gagal.'),
                    onClose: () => console.log('Popup pembayaran ditutup.')
                });
            } catch (error) {
                console.error('Error memanggil Cloud Function:', error);
                showMessage('Error Server', `Gagal memproses pembayaran. (${error.message})`);
            } finally {
                btn.disabled = false;
                btn.textContent = "Lanjut ke Midtrans";
            }
        });
        
        cancelConfirm.addEventListener('click', () => { confirmPaymentPopup.classList.add('hidden'); paymentPopup.classList.remove('hidden'); });
        closePaymentPopup.addEventListener('click', () => paymentPopup.classList.add('hidden'));
        goToPaymentBtn.addEventListener('click', () => paymentPopup.classList.remove('hidden'));

        // Sharing and Download Logic
        downloadBtn.addEventListener('click', () => {
            html2canvas(document.getElementById('predictionCard'), { backgroundColor: '#f8f4e9', scale: 2 }).then(canvas => {
                const link = document.createElement('a');
                link.download = `Ramalan_CiamSi_${nameInput.value.trim().replace(/\s/g, '_') || 'user'}.jpg`;
                link.href = canvas.toDataURL('image/jpeg', 0.9);
                link.click();
            });
        });

        whatsappShareBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const pedomanText = Array.from(document.querySelectorAll('#pedomanList li')).map(li => `- ${li.textContent}`).join('\n');
            const shareText = `*Ramalan Ciam Si untuk ${nameInput.value.trim() || 'Pengguna'}*\n` +
                `*Nomor: ${currentPredictionNumberState}* (${resultDewa.textContent})\n\n` +
                `*Makna Lambang:*\n${sinthioText.textContent}\n\n` +
                `*Bunyi Syair:*\n${syairText.textContent}\n\n` +
                `*Selayang Pandang:*\n${selayangPandangText.textContent}\n\n` +
                `*Pedoman Jawaban:*\n${pedomanText}\n\n` +
                `Dapatkan ramalan Anda di: ${window.location.origin}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
        });

        // Popup Handlers
        termsLink.addEventListener('click', () => termsPopup.classList.remove('hidden'));
        privacyLink.addEventListener('click', () => privacyPopup.classList.remove('hidden'));
        closePopupBtns.forEach(btn => btn.addEventListener('click', (e) => e.target.closest('.popup-overlay').classList.add('hidden')));

        // Service Worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js').catch(err => console.error('SW registration failed:', err));
            });
        }
