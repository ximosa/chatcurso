// Configuración de Firebase (reemplaza con tus propias credenciales)
const firebaseConfig = {
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  };

  firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const database = firebase.database();

const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const addBookmarkBtn = document.getElementById('addBookmarkBtn');
const bookmarksContainer = document.getElementById('bookmarks');
const bookmarkForm = document.getElementById('bookmarkForm');
const bookmarkFormElement = document.getElementById('bookmarkFormElement');
const cancelBookmarkBtn = document.getElementById('cancelBookmark');
const paginationContainer = document.getElementById('pagination');

let currentUser = null;
let currentPage = 1;
let bookmarksPerPage = 20;
let currentCategory = 'all';

// Autenticación
loginBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then((result) => {
        const user = result.user;
        database.ref('usernames/' + user.uid).set(user.displayName);
    });
});

logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

auth.onAuthStateChanged((user) => {
    currentUser = user;
    if (user) {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        addBookmarkBtn.style.display = 'block';
    } else {
        loginBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        addBookmarkBtn.style.display = 'none';
        bookmarkForm.style.display = 'none';
    }
    loadBookmarks();
});

// Navegación por categorías
document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        currentCategory = e.target.getAttribute('data-category');
        currentPage = 1;
        loadBookmarks();
    });
});

// Gestión de marcadores
function loadBookmarks() {
    const bookmarksRef = database.ref('bookmarks');
    bookmarksRef.once('value', (snapshot) => {
        const allBookmarks = [];
        snapshot.forEach((childSnapshot) => {
            const bookmark = childSnapshot.val();
            bookmark.id = childSnapshot.key;
            allBookmarks.push(bookmark);
        });

        const filteredBookmarks = currentCategory === 'all' 
            ? allBookmarks 
            : allBookmarks.filter(bookmark => bookmark.category === currentCategory);

        const totalPages = Math.ceil(filteredBookmarks.length / bookmarksPerPage);
        const startIndex = (currentPage - 1) * bookmarksPerPage;
        const endIndex = startIndex + bookmarksPerPage;
        const bookmarksToShow = filteredBookmarks.slice(startIndex, endIndex);

        displayBookmarks(bookmarksToShow);
        displayPagination(totalPages);
    });
}

function displayBookmarks(bookmarks) {
    bookmarksContainer.innerHTML = '';
    bookmarks.forEach((bookmark) => {
        createBookmarkElement(bookmark);
    });
}

function createBookmarkElement(bookmark) {
    const div = document.createElement('div');
    div.className = 'bookmark';
    div.innerHTML = `
        <img src="https://www.google.com/s2/favicons?domain=${bookmark.url}" alt="favicon">
        <a href="${bookmark.url}" target="_blank">${bookmark.title}</a>
        <p>${bookmark.description}</p>
        <p>Categoría: ${bookmark.category}</p>
        <p class="created-by">Creado por: ${bookmark.createdBy}</p>
    `;
    if (currentUser && bookmark.createdByUid === currentUser.uid) {
        div.innerHTML += `
            <button onclick="editBookmark('${bookmark.id}')">Editar</button>
            <button onclick="deleteBookmark('${bookmark.id}')">Borrar</button>
        `;
    }
    bookmarksContainer.appendChild(div);
}

function displayPagination(totalPages) {
    paginationContainer.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.addEventListener('click', () => {
            currentPage = i;
            loadBookmarks();
        });
        paginationContainer.appendChild(button);
    }
}

addBookmarkBtn.addEventListener('click', () => {
    showBookmarkForm();
});

cancelBookmarkBtn.addEventListener('click', () => {
    hideBookmarkForm();
});

bookmarkFormElement.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('bookmarkId').value;
    const title = document.getElementById('bookmarkTitle').value;
    const url = document.getElementById('bookmarkUrl').value;
    const description = document.getElementById('bookmarkDescription').value;
    const category = document.getElementById('bookmarkCategory').value;
    
    const bookmarkData = {
        title: title,
        url: url,
        description: description,
        category: category,
        createdBy: currentUser.displayName,
        createdByUid: currentUser.uid
    };

    if (id) {
        database.ref(`bookmarks/${id}`).update(bookmarkData);
    } else {
        database.ref('bookmarks').push(bookmarkData);
    }

    hideBookmarkForm();
    loadBookmarks();
});

function showBookmarkForm(id = null, bookmark = null) {
    document.getElementById('bookmarkId').value = id || '';
    document.getElementById('bookmarkTitle').value = bookmark ? bookmark.title : '';
    document.getElementById('bookmarkUrl').value = bookmark ? bookmark.url : '';
    document.getElementById('bookmarkDescription').value = bookmark ? bookmark.description : '';
    document.getElementById('bookmarkCategory').value = bookmark ? bookmark.category : 'trabajo';
    bookmarkForm.style.display = 'block';
}

function hideBookmarkForm() {
    bookmarkFormElement.reset();
    bookmarkForm.style.display = 'none';
}

function editBookmark(id) {
    database.ref(`bookmarks/${id}`).once('value', (snapshot) => {
        const bookmark = snapshot.val();
        bookmark.id = id;
        showBookmarkForm(id, bookmark);
    });
}

function deleteBookmark(id) {
    if (confirm('¿Estás seguro de que quieres borrar este marcador?')) {
        database.ref(`bookmarks/${id}`).remove().then(() => {
            loadBookmarks();
        });
    }
}

// Carga inicial de marcadores
loadBookmarks();
