const CONFIG = {
    apiUrl: 'https://raw.githubusercontent.com/CesarMCuellarCha/apis/refs/heads/main/SENA-CTPI.matriculados.json',
    credentials: {
        username: "Juan Jose",
        password: "adso2993013"
    }
};

const STATE = {
    aprendices: [],
    programas: []
};

const DOM = {
    loginContainer: document.getElementById('login-container'),
    appContainer: document.getElementById('app-container'),
    loginBtn: document.getElementById('login-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    usernameInput: document.getElementById('username'),
    passwordInput: document.getElementById('password'),
    loginError: document.getElementById('login-error'),
    currentUserSpan: document.getElementById('current-user'),
    fichaSelect: document.getElementById('ficha-select'),
    nombreProgramaSpan: document.getElementById('nombre-programa'),
    aprendicesTable: document.getElementById('aprendices-table').querySelector('tbody'),
    authorNameSpan: document.getElementById('author-name'),
    fichaFooter: document.getElementById('ficha-footer')
};

document.addEventListener('DOMContentLoaded', function() {
    DOM.authorNameSpan.textContent = CONFIG.credentials.username;
    
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        showApp(storedUser);
        loadData();
    }

    DOM.loginBtn.addEventListener('click', handleLogin);
    DOM.logoutBtn.addEventListener('click', handleLogout);
    DOM.fichaSelect.addEventListener('change', handleFichaChange);
});

function handleLogin() {
    const username = DOM.usernameInput.value.trim();
    const password = DOM.passwordInput.value.trim();

    if (username === CONFIG.credentials.username && password === CONFIG.credentials.password) {
        localStorage.setItem('currentUser', username);
        showApp(username);
        loadData();
        DOM.loginError.textContent = '';
    } else {
        DOM.loginError.textContent = 'Usuario o contraseña incorrectos';
    }
}

function handleLogout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('selectedFicha');
    localStorage.removeItem('nombrePrograma');
    DOM.loginContainer.style.display = 'block';
    DOM.appContainer.style.display = 'none';
    DOM.usernameInput.value = '';
    DOM.passwordInput.value = '';
}

function showApp(username) {
    DOM.loginContainer.style.display = 'none';
    DOM.appContainer.style.display = 'block';
    DOM.currentUserSpan.textContent = `Usuario: ${username}`;
}

async function loadData() {
    DOM.aprendicesTable.innerHTML = '<tr><td colspan="6">Cargando datos...</td></tr>';
    
    try {
        const response = await fetch(CONFIG.apiUrl);
        const data = await response.json();
        
        if (!Array.isArray(data)) throw new Error('Formato de datos incorrecto');

        STATE.aprendices = data.map(aprendiz => ({
            tipo_documento: aprendiz.TIPO_DOCUMENTO,
            documento: aprendiz.NUMERO_DOCUMENTO.toString(),
            nombre: aprendiz.NOMBRE,
            primer_apellido: aprendiz.PRIMER_APELLIDO,
            segundo_apellido: aprendiz.SEGUNDO_APELLIDO,
            estado: aprendiz.ESTADO_APRENDIZ,
            ficha: aprendiz.FICHA.toString(),
            programa: aprendiz.PROGRAMA
        }));

        const fichasUnicas = [...new Set(data.map(a => a.FICHA.toString()))];
        STATE.programas = fichasUnicas.map(ficha => {
            const programaData = data.find(a => a.FICHA.toString() === ficha);
            return {
                codigo_ficha: ficha,
                nombre_programa: programaData.PROGRAMA,
                nivel_formacion: programaData.NIVEL_DE_FORMACION,
                estado: programaData.ESTADO_FICHA
            };
        }).sort((a, b) => parseInt(a.codigo_ficha) - parseInt(b.codigo_ficha));

        populateFichasSelect();
        loadSavedSelection();

    } catch (error) {
        console.error('Error:', error);
        loadSampleData();
    }
}

function populateFichasSelect() {
    DOM.fichaSelect.innerHTML = '<option value="">-- Seleccione --</option>';
    
    STATE.programas.forEach(programa => {
        const option = document.createElement('option');
        option.value = programa.codigo_ficha;
        option.textContent = programa.codigo_ficha;
        DOM.fichaSelect.appendChild(option);
    });
}

function loadSavedSelection() {
    const savedFicha = localStorage.getItem('selectedFicha');
    if (savedFicha) {
        DOM.fichaSelect.value = savedFicha;
        DOM.nombreProgramaSpan.textContent = localStorage.getItem('nombrePrograma');
        DOM.fichaFooter.textContent = `Ficha ${savedFicha}`;
        updateAprendicesTable(savedFicha);
    }
}

function handleFichaChange() {
    const fichaSeleccionada = DOM.fichaSelect.value;
    
    if (!fichaSeleccionada) {
        clearFichaSelection();
        return;
    }
    
    const programa = STATE.programas.find(p => p.codigo_ficha === fichaSeleccionada);
    
    if (programa) {
        saveFichaSelection(fichaSeleccionada, programa);
        updateAprendicesTable(fichaSeleccionada);
    }
}

function clearFichaSelection() {
    DOM.nombreProgramaSpan.textContent = '';
    DOM.aprendicesTable.innerHTML = '';
    DOM.fichaFooter.textContent = '';
    localStorage.removeItem('selectedFicha');
    localStorage.removeItem('nombrePrograma');
}

function saveFichaSelection(ficha, programa) {
    DOM.nombreProgramaSpan.textContent = programa.nombre_programa;
    DOM.fichaFooter.textContent = `Ficha ${ficha}`;
    localStorage.setItem('selectedFicha', ficha);
    localStorage.setItem('nombrePrograma', programa.nombre_programa);
}

function updateAprendicesTable(ficha) {
    DOM.aprendicesTable.innerHTML = '';
    
    const aprendicesFicha = STATE.aprendices.filter(a => a.ficha === ficha);
    
    if (aprendicesFicha.length === 0) {
        DOM.aprendicesTable.innerHTML = '<tr><td colspan="6">No hay aprendices en esta ficha</td></tr>';
        return;
    }
    
    aprendicesFicha.forEach(aprendiz => {
        const row = document.createElement('tr');
        if (aprendiz.estado.includes('Retiro')) {
            row.classList.add('retiro-voluntario');
        }
        
        row.innerHTML = `
            <td>${aprendiz.tipo_documento || 'N/D'}</td>
            <td>${aprendiz.documento || 'N/D'}</td>
            <td>${aprendiz.nombre || 'N/D'}</td>
            <td>${aprendiz.primer_apellido || 'N/D'}</td>
            <td>${aprendiz.segundo_apellido || 'N/D'}</td>
            <td>${aprendiz.estado || 'N/D'}</td>
        `;
        
        DOM.aprendicesTable.appendChild(row);
    });
}

function loadSampleData() {
    STATE.aprendices = [
        {
            tipo_documento: "CC",
            documento: "1002955648",
            nombre: "ALEXIS ALBERTO",
            primer_apellido: "OJEDA",
            segundo_apellido: "NARVAEZ",
            estado: "Formacion",
            ficha: "2770198",
            programa: "CONSTRUCCION EN EDIFICACIONES."
        },
        {
            tipo_documento: "CC",
            documento: "14652600",
            nombre: "DIEGO ARMANDO",
            primer_apellido: "HURTADO",
            segundo_apellido: "MOSQUERA",
            estado: "Retiro Voluntario",
            ficha: "2770198",
            programa: "CONSTRUCCION EN EDIFICACIONES."
        }
    ];
    
    STATE.programas = [
        {
            codigo_ficha: "2770198",
            nombre_programa: "CONSTRUCCION EN EDIFICACIONES.",
            nivel_formacion: "TECNÓLOGO",
            estado: "En ejecucion"
        }
    ].sort((a, b) => parseInt(a.codigo_ficha) - parseInt(b.codigo_ficha));
    
    populateFichasSelect();
    updateAprendicesTable("2770198");
}